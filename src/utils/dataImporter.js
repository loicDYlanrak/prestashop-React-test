/* eslint-disable no-unused-vars */
import { fetchPrestashop } from "../hooks/useFetchPrestashop";
import {
  addResource,
  updateResource,
  uploadProductImage,
} from "../hooks/useMutationPrestashop";

const STATE_NAME_TO_ID = {
  livré: "5",
  annulé: "6",
  "paiement accepté": "11",
};

const entityCache = {
  categories: new Map(), // nom_categorie -> id
  taxes: new Map(), // taux_taxe -> id
  taxRuleGroups: new Map(), // nom_groupe_taxe -> id
  taxRules: new Map(), // combinaison -> id
  products: new Map(), // reference -> { id, id_default_combination, combinations: Map(combinaison_key -> id) }
  productOptions: new Map(), // nom_option -> id
  productOptionValues: new Map(), // option_nom|valeur -> id
  customers: new Map(), // email -> id
  addresses: new Map(), // alias -> id
  carts: new Map(), // id_cart -> id
  orders: new Map(), // id_order -> id
  stockAvailables: new Map(), // product_combination_key -> id_stock_available
  combinationPrices: new Map(), // combinaison_key -> prix_ttc
};

const getCombinationKey = (productRef, attributeName, attributeValue) => {
  return `${productRef}|${attributeName}|${attributeValue}`;
};

/**
 * Convertit une date en format JJ/MM/YYYY en timestamp pour tri
 * Robuste aux formats mal formatés et retourne 0 en cas d'erreur
 */
const parseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return 0;

  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return 0;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  // Valider que les valeurs sont des nombres valides
  if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;

  // Créer la date au format ISO avec padding
  const monthStr = String(month).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");

  const date = new Date(`${year}-${monthStr}-${dayStr}T00:00:00Z`);
  const timestamp = date.getTime();

  // Vérifier que la date est valide (pas NaN)
  return isNaN(timestamp) ? 0 : timestamp;
};

/**
 * Extrait le timestamp d'une date (sans l'heure) au format JJ/MM/YYYY
 */
const getDateTimestamp = (dateStr) => {
  if (!dateStr) return 0;
  const [day, month, year] = dateStr.split("/");
  return new Date(`${year}-${month}-${day}`).getTime();
};

/**
 * Formate une date JJ/MM/YYYY en YYYY-MM-DD HH:MM:SS de manière consistante
 */
const formatDateWithTime = (dateStr, time = "12:00:57") => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}-${day} ${time}`;
};

/**
 * Extrait juste la partie date (YYYY-MM-DD) d'une date formatée
 */
const getDatePart = (dateStr) => {
  if (!dateStr) return null;
  return dateStr.split(" ")[0]; // Retourne YYYY-MM-DD
};

/**
 * Compare deux dates (format JJ/MM/YYYY) de manière robuste via timestamp
 */
const areDatesEqual = (date1Str, date2Str) => {
  if (!date1Str || !date2Str) return false;
  return getDateTimestamp(date1Str) === getDateTimestamp(date2Str);
};

async function parallelLimit(items, limit, asyncFn) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    let promise;
    promise = asyncFn(item).then((result) => {
      executing.delete(promise);
      return result;
    });
    executing.add(promise);
    results.push(promise);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

/**
 * Comme parallelLimit, mais garantit que les résultats respectent
 * l'ordre d'entrée ET que l'item N est traité APRÈS l'item N-1.
 * Chaque nouvelle tâche attend que la précédente soit terminée avant de démarrer.
 */
async function parallelLimitOrdered(items, limit, asyncFn) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await asyncFn(items[index]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

/**
 * Appliquer l'annulation d'une commande
 */
async function cancelOrder(orderId, orderRef, options = {}) {
  try {
    await updateResource(
      "order",
      orderId,
      {
        id: orderId,
        current_state: STATE_NAME_TO_ID["annulé"],
      },
      options,
    );

    return { success: true, message: `Commande ${orderRef} annulée` };
  } catch (error) {
    console.error(`Erreur annulation commande ${orderId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Appliquer la livraison d'une commande via l'API changeState
 */
async function deliverOrder(orderId, orderRef, orderDate = null, options = {}) {
  try {
    const API_CHANGE_STATE_URL =
      "http://localhost/prestashop2/module/orderapi/changeState";
    const response = await fetch(
      `${API_CHANGE_STATE_URL}?id_order=${orderId}&id_state=5`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );
    const result = await response.json();

    if (result.success) {
      try {
        const responseStockMouvements = await fetchPrestashop(
          "stock_movements",
          {
            urlRest: `filter[id_order]=[${orderId}]`,
          },
        );

        const stockMvtData =
          responseStockMouvements.data?.stock_mvts?.stock_mvt;
        const stockMvtArray = Array.isArray(stockMvtData)
          ? stockMvtData
          : stockMvtData
            ? [stockMvtData]
            : [];

        const idsStockMouvements = stockMvtArray.map(
          (mvt) => mvt.id?.["#cdata"] || mvt["@_id"],
        );

        // Utiliser la date de la commande si fournie, sinon la date du jour
        const currentDate =
          orderDate || new Date().toISOString().slice(0, 19).replace("T", " ");

        await parallelLimit(idsStockMouvements, 9, async (stockMvtId) => {
          try {
            await updateResource(
              "stockMovement",
              stockMvtId,
              {
                id: stockMvtId,
                date_add: currentDate,
              },
              options,
            );
            return { stockMvtId, success: true };
          } catch (error) {
            console.error(
              `Erreur mise à jour mouvement stock ${stockMvtId}:`,
              error,
            );
            return { stockMvtId, error: error.message, success: false };
          }
        });
      } catch (stockError) {
        console.error(
          `Erreur récupération mouvements stock pour order ${orderId}:`,
          stockError,
        );
      }

      return {
        success: true,
        message: result.message || `Commande ${orderRef} marquée comme livrée`,
        id_order: result.id_order,
        new_state: result.new_state,
      };
    } else {
      throw new Error(result.message || "Erreur lors de la livraison");
    }
  } catch (error) {
    console.error(`Erreur livraison commande ${orderId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Appliquer les changements d'état après l'import des commandes
 */
export async function applyOrderStateChanges(options = {}) {
  const results = {
    cancelled: [],
    delivered: [],
    errors: [],
  };

  const ordersToCancel = [];
  const ordersToDeliver = [];

  // Préparer les listes d'ordres à traiter
  for (const [orderKey, orderInfo] of entityCache.orders.entries()) {
    const orderId = orderInfo.id?.["#cdata"] || orderInfo.id;
    const etatOriginal = orderInfo.etat_original?.toLowerCase();
    const orderDate = orderInfo.order_date;

    if (!orderId || !etatOriginal) continue;

    if (etatOriginal === "annulé") {
      ordersToCancel.push({ orderId, ref: orderId });
    } else if (etatOriginal === "livré") {
      ordersToDeliver.push({ orderId, ref: orderId, orderDate });
    }
  }

  // Traitement parallèle des annulations avec limite de 5
  if (ordersToCancel.length > 0) {
    const cancelResults = await parallelLimit(
      ordersToCancel,
      7,
      async (orderData) => {
        const result = await cancelOrder(
          orderData.orderId,
          orderData.ref,
          options,
        );
        return { ...orderData, result };
      },
    );

    for (const { orderId, ref, result } of cancelResults) {
      if (result.success) {
        results.cancelled.push({ orderId, ref });
      } else {
        results.errors.push({
          orderId,
          error: result.error,
          action: "annulation",
        });
      }
    }
  }

  // Traitement parallèle des livraisons avec limite de 5
  if (ordersToDeliver.length > 0) {
    const deliverResults = await parallelLimitOrdered(
      ordersToDeliver,
      9,
      async (orderData) => {
        const result = await deliverOrder(
          orderData.orderId,
          orderData.ref,
          orderData.orderDate,
          options,
        );
        return { ...orderData, result };
      },
    );

    for (const { orderId, ref, result } of deliverResults) {
      if (result.success) {
        results.delivered.push({ orderId, ref });
      } else {
        results.errors.push({
          orderId,
          error: result.error,
          action: "livraison",
        });
      }
    }
  }

  return results;
}

// ==================== FILE 1 : PRODUITS ====================

/**
 * Import des catégories
 */
export async function importCategories(categories, options = {}) {
  const notCached = categories.filter(
    (cat) => !entityCache.categories.has(cat),
  );
  const cached = categories.filter((cat) => entityCache.categories.has(cat));

  const results = cached.map((cat) => ({
    name: cat,
    id: entityCache.categories.get(cat),
    cached: true,
  }));

  // Traitement parallèle avec limite de 7 requêtes simultanées
  const parallelResults = await parallelLimit(
    notCached,
    9,
    async (categoryName) => {
      try {
        const categoryData = {
          id_parent: 2,
          id_shop_default: 1,
          is_root_category: 0,
          name: categoryName,
          description: categoryName,
          link_rewrite: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          active: 1,
        };

        const response = await addResource("category", categoryData, options);
        const categoryId = response?.category?.id?.["#cdata"];

        if (categoryId) {
          entityCache.categories.set(categoryName, categoryId);
          return { name: categoryName, id: categoryId, success: true };
        }
        return { name: categoryName, error: "ID non récupéré", success: false };
      } catch (error) {
        return { name: categoryName, error: error.message, success: false };
      }
    },
  );

  return [...results, ...parallelResults];
}

/**
 * Import des taxes
 */
export async function importTaxes(taxes, options = {}) {
  const taxesWithRates = taxes.map((taxRate) => ({
    original: taxRate,
    rate: parseFloat(taxRate.replace(",", ".").replace("%", "")).toFixed(3),
  }));

  const cached = taxesWithRates.filter((t) => entityCache.taxes.has(t.rate));
  const notCached = taxesWithRates.filter(
    (t) => !entityCache.taxes.has(t.rate),
  );

  const results = cached.map((t) => ({
    rate: t.rate,
    id: entityCache.taxes.get(t.rate),
    cached: true,
  }));

  // Traitement parallèle avec limite de 10 requêtes simultanées
  const parallelResults = await parallelLimit(notCached, 10, async (taxObj) => {
    try {
      const taxData = {
        rate: taxObj.rate,
        active: "1",
        deleted: "0",
        name: `TVA ${taxObj.rate}%`,
      };

      const response = await addResource("tax", taxData, options);
      const taxId = response?.tax?.id?.["#cdata"];

      if (taxId) {
        entityCache.taxes.set(taxObj.rate, taxId);
        return { rate: taxObj.rate, id: taxId, success: true };
      }
      return { rate: taxObj.rate, error: "ID non récupéré", success: false };
    } catch (error) {
      return { rate: taxObj.rate, error: error.message, success: false };
    }
  });

  return [...results, ...parallelResults];
}

export async function importTaxRuleGroups(taxes, options = {}) {
  const groupNames = taxes.map((taxRate) => `Taxes de ${taxRate}`);
  const cached = groupNames.filter((name) =>
    entityCache.taxRuleGroups.has(name),
  );
  const notCached = groupNames.filter(
    (name) => !entityCache.taxRuleGroups.has(name),
  );

  const results = cached.map((name) => ({
    name,
    id: entityCache.taxRuleGroups.get(name),
    cached: true,
  }));

  // Traitement parallèle avec limite de 10 requêtes simultanées
  const parallelResults = await parallelLimit(
    notCached,
    10,
    async (groupName) => {
      try {
        const taxRuleGroupData = {
          name: groupName,
          active: "1",
          deleted: "0",
        };

        const response = await addResource(
          "taxRuleGroup",
          taxRuleGroupData,
          options,
        );

        const groupId = response?.tax_rule_group?.id?.["#cdata"];

        if (groupId) {
          entityCache.taxRuleGroups.set(groupName, groupId);
          return { name: groupName, id: groupId, success: true };
        }
        return { name: groupName, error: "ID non récupéré", success: false };
      } catch (error) {
        return { name: groupName, error: error.message, success: false };
      }
    },
  );

  return [...results, ...parallelResults];
}

/**
 * Import des règles de taxe
 */
export async function importTaxRules(taxes, taxRuleGroups, options = {}) {
  const rulesData = taxes.map((taxRate) => {
    const formattedRate = taxRate.replace(",", ".").replace("%", "");
    const mapKey = parseFloat(formattedRate).toFixed(3);
    const taxId = entityCache.taxes.get(mapKey);
    const taxRuleGroupId = entityCache.taxRuleGroups.get(`Taxes de ${taxRate}`);

    return { taxRate, taxId, taxRuleGroupId, mapKey };
  });

  const validRules = rulesData.filter((r) => r.taxId && r.taxRuleGroupId);
  const invalidRules = rulesData.filter((r) => !r.taxId || !r.taxRuleGroupId);

  const results = invalidRules.map((r) => ({
    taxRate: r.taxRate,
    error: "Taxe ou groupe de taxe non trouvé",
    success: false,
  }));

  const cached = validRules.filter((r) => {
    const ruleKey = `${r.taxRuleGroupId}|${r.taxId}`;
    return entityCache.taxRules.has(ruleKey);
  });

  const notCached = validRules.filter((r) => {
    const ruleKey = `${r.taxRuleGroupId}|${r.taxId}`;
    return !entityCache.taxRules.has(ruleKey);
  });

  const cachedResults = cached.map((r) => {
    const ruleKey = `${r.taxRuleGroupId}|${r.taxId}`;
    return {
      taxRate: r.taxRate,
      id: entityCache.taxRules.get(ruleKey),
      cached: true,
    };
  });

  // Traitement parallèle avec limite de 10 requêtes simultanées
  const parallelResults = await parallelLimit(
    notCached,
    10,
    async (ruleData) => {
      try {
        const taxRuleData = {
          id_tax_rules_group: ruleData.taxRuleGroupId,
          id_state: 0,
          id_country: 8,
          zipcode_from: 0,
          zipcode_to: 0,
          id_tax: ruleData.taxId,
          behavior: 0,
          description: "",
        };

        const response = await addResource("taxRule", taxRuleData, options);
        const ruleId = response?.tax_rule?.id?.["#cdata"];

        if (ruleId) {
          const ruleKey = `${ruleData.taxRuleGroupId}|${ruleData.taxId}`;
          entityCache.taxRules.set(ruleKey, ruleId);
          return { taxRate: ruleData.taxRate, id: ruleId, success: true };
        }
        return {
          taxRate: ruleData.taxRate,
          error: "ID non récupéré",
          success: false,
        };
      } catch (error) {
        return {
          taxRate: ruleData.taxRate,
          error: error.message,
          success: false,
        };
      }
    },
  );

  return [...results, ...cachedResults, ...parallelResults];
}

/**
 * Import des produits
 */
export async function importProducts(productsData, options = {}) {
  const cached = productsData.filter((p) =>
    entityCache.products.has(p.reference),
  );
  const notCached = productsData.filter(
    (p) => !entityCache.products.has(p.reference),
  );

  const results = cached.map((p) => ({
    reference: p.reference,
    id: entityCache.products.get(p.reference).id,
    cached: true,
  }));

  // Traitement parallèle avec limite de 10 requêtes simultanées
  const parallelResults = await parallelLimit(
    notCached,
    10,
    async (product) => {
      try {
        const categoryId = entityCache.categories.get(product.categorie_name);
        const formattedTaxe = product.taxe.toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
        });
        const originalDate = product.date_availability;
        const [day, month, year] = originalDate.split("/");
        const formattedDate = `${year}-${month}-${day}`;

        const searchKey = `Taxes de ${formattedTaxe}%`;
        const taxRuleGroupId = entityCache.taxRuleGroups.get(searchKey);
        const productData = {
          reference: product.reference,
          name: product.nom,
          description: product.nom,
          meta_description: product.nom,
          meta_keywords: "",
          meta_title: "",
          link_rewrite: product.nom.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          price: product.prix_ht.toFixed(8),
          wholesale_price: product.prix_achat.toFixed(8),
          active: 1,
          id_manufacturer: 1,
          id_supplier: 1,
          id_category_default: categoryId ? categoryId : undefined,
          new: 1,
          cache_default_attribute: 0,
          id_default_combination: 0,
          type: 1,
          id_shop_default: 1,
          available_date: formattedDate,
          product_type: "standard",
          state: 1,
          id_tax_rules_group: taxRuleGroupId ? taxRuleGroupId : undefined,
          available_for_order: 1,
          show_price: 1,
          associations: categoryId
            ? {
                categories: {
                  category: [{ id: categoryId }],
                },
              }
            : undefined,
        };

        const response = await addResource("product", productData, options);
        const productId = response?.product?.id?.["#cdata"];

        if (productId) {
          entityCache.products.set(product.reference, {
            id: productId,
            id_default_combination: null,
            combinations: new Map(),
            base_price_ht: product.prix_ht,
            tax_rate: product.taxe,
          });
          return {
            reference: product.reference,
            id: productId,
            success: true,
          };
        }
        return {
          reference: product.reference,
          error: "ID non récupéré",
          success: false,
        };
      } catch (error) {
        return {
          reference: product.reference,
          error: error.message,
          success: false,
        };
      }
    },
  );

  return [...results, ...parallelResults];
}

// ==================== FILE 2 : COMBINAISONS ====================

/**
 * Import des options de produit
 */
export async function importProductOptions(productOptions, options = {}) {
  const cached = productOptions.filter((opt) =>
    entityCache.productOptions.has(opt),
  );
  const notCached = productOptions.filter(
    (opt) => !entityCache.productOptions.has(opt),
  );

  const results = cached.map((opt) => ({
    name: opt,
    id: entityCache.productOptions.get(opt),
    cached: true,
  }));

  // Traitement parallèle avec limite de 10 requêtes simultanées
  const parallelResults = await parallelLimit(
    notCached,
    10,
    async (optionName) => {
      try {
        const optionData = {
          is_color_group: 0,
          group_type: "select",
          name: optionName,
          public_name: optionName,
        };

        const response = await addResource(
          "productOption",
          optionData,
          options,
        );
        const optionId = response?.product_option?.id?.["#cdata"];

        if (optionId) {
          entityCache.productOptions.set(optionName, optionId);
          return { name: optionName, id: optionId, success: true };
        }
        return { name: optionName, error: "ID non récupéré", success: false };
      } catch (error) {
        return { name: optionName, error: error.message, success: false };
      }
    },
  );

  return [...results, ...parallelResults];
}

/**
 * Import des valeurs d'option de produit
 */
export async function importProductOptionValues(
  productOptionValues,
  options = {},
) {
  const valuesToProcess = [];
  const results = [];

  for (const [optionName, values] of Object.entries(productOptionValues)) {
    const optionId = entityCache.productOptions.get(optionName);

    if (!optionId) {
      results.push({ optionName, error: "Option non trouvée", success: false });
      continue;
    }

    for (const value of values) {
      const cacheKey = `${optionName}|${value}`;
      if (entityCache.productOptionValues.has(cacheKey)) {
        results.push({
          optionName,
          value,
          id: entityCache.productOptionValues.get(cacheKey),
          cached: true,
        });
      } else {
        valuesToProcess.push({ optionName, value, optionId, cacheKey });
      }
    }
  }

  // Traitement parallèle avec limite de 10 requêtes simultanées
  const parallelResults = await parallelLimit(
    valuesToProcess,
    10,
    async (valueObj) => {
      try {
        const valueData = {
          id_attribute_group: valueObj.optionId.toString(),
          name: valueObj.value,
        };

        const response = await addResource(
          "productOptionValue",
          valueData,
          options,
        );
        const valueId = response?.product_option_value?.id?.["#cdata"];

        if (valueId) {
          entityCache.productOptionValues.set(valueObj.cacheKey, valueId);
          return {
            optionName: valueObj.optionName,
            value: valueObj.value,
            id: valueId,
            success: true,
          };
        }
        return {
          optionName: valueObj.optionName,
          value: valueObj.value,
          error: "ID non récupéré",
          success: false,
        };
      } catch (error) {
        return {
          optionName: valueObj.optionName,
          value: valueObj.value,
          error: error.message,
          success: false,
        };
      }
    },
  );

  return [...results, ...parallelResults];
}

/**
 * Import des combinaisons de produit
 */
export async function importCombinations(productCombinations, options = {}) {
  const results = [];
  const combinationsToProcess = [];
  const defaultCombinationIds = new Map();

  // Préparer les combinaisons à traiter
  for (const [productRef, combinations] of Object.entries(
    productCombinations,
  )) {
    const productInfo = entityCache.products.get(productRef);

    if (!productInfo) {
      results.push({ productRef, error: "Produit non trouvé", success: false });
      continue;
    }

    for (const combo of combinations) {
      const cacheKey = getCombinationKey(
        productRef,
        combo.attribute,
        combo.value,
      );

      if (productInfo.combinations.has(cacheKey)) {
        results.push({
          productRef,
          combo,
          id: productInfo.combinations.get(cacheKey),
          cached: true,
        });
      } else {
        combinationsToProcess.push({
          productRef,
          productInfo,
          combo,
          cacheKey,
        });
      }
    }
  }

  // Traitement parallèle avec limite de 7 requêtes simultanées
  const parallelResults = await parallelLimit(
    combinationsToProcess,
    9,
    async (comboObj) => {
      try {
        const optionId = entityCache.productOptions.get(
          comboObj.combo.attribute,
        );
        const optionValueId = entityCache.productOptionValues.get(
          `${comboObj.combo.attribute}|${comboObj.combo.value}`,
        );

        if (!optionId || !optionValueId) {
          return {
            productRef: comboObj.productRef,
            combo: comboObj.combo,
            error: "Option ou valeur non trouvée",
            success: false,
          };
        }

        let combinationPrice = 0;

        if (
          comboObj.combo.price_ttc &&
          comboObj.productInfo.base_price_ht &&
          comboObj.productInfo.tax_rate
        ) {
          const combinationPriceTTC = parseFloat(comboObj.combo.price_ttc);
          const combinationPriceHT =
            combinationPriceTTC / (1 + comboObj.productInfo.tax_rate / 100);

          const priceDifference =
            combinationPriceHT - comboObj.productInfo.base_price_ht;

          combinationPrice = parseFloat(priceDifference.toFixed(8));
        }

        const combinationData = {
          id_product: comboObj.productInfo.id,
          price: combinationPrice,
          minimal_quantity: "1",
          associations: {
            product_option_values: {
              product_option_value: [{ id: optionValueId }],
            },
          },
        };

        const response = await addResource(
          "combination",
          combinationData,
          options,
        );
        const combinationId = response?.combination?.id;

        if (combinationId) {
          comboObj.productInfo.combinations.set(
            comboObj.cacheKey,
            combinationId,
          );
          if (comboObj.combo.price_ttc) {
            const combinationPriceKey = `${comboObj.productInfo.id}|${combinationId?.["#cdata"] || combinationId}`;
            entityCache.combinationPrices.set(
              combinationPriceKey,
              parseFloat(comboObj.combo.price_ttc),
            );
          }

          // Tracker la première combinaison pour chaque produit
          if (!defaultCombinationIds.has(comboObj.productRef)) {
            defaultCombinationIds.set(comboObj.productRef, combinationId);
          }

          return {
            productRef: comboObj.productRef,
            combo: comboObj.combo,
            id: combinationId,
            success: true,
          };
        }
        return {
          productRef: comboObj.productRef,
          combo: comboObj.combo,
          error: "ID non récupéré",
          success: false,
        };
      } catch (error) {
        return {
          productRef: comboObj.productRef,
          combo: comboObj.combo,
          error: error.message,
          success: false,
        };
      }
    },
  );

  // Mettre à jour les combinaisons par défaut en parallèle
  if (defaultCombinationIds.size > 0) {
    const productsToUpdate = [];
    for (const [productRef, combinationId] of defaultCombinationIds.entries()) {
      const productInfo = entityCache.products.get(productRef);
      if (productInfo) {
        productsToUpdate.push({
          productRef,
          productInfo,
          combinationId,
        });
      }
    }

    await parallelLimit(productsToUpdate, 9, async (updateData) => {
      try {
        const productPatch = {
          id: updateData.productInfo.id,
          show_price: 1,
          cache_default_attribute: updateData.combinationId?.["#cdata"],
          id_default_combination: updateData.combinationId?.["#cdata"],
        };
        await updateResource(
          "product",
          updateData.productInfo.id,
          productPatch,
          options,
        );
        updateData.productInfo.id_default_combination =
          updateData.combinationId;
      } catch (error) {
        console.error(
          `Erreur mise à jour produit ${updateData.productRef}:`,
          error,
        );
      }
    });
  }

  return [...results, ...parallelResults];
}

/**
 * Récupération et mise à jour des stocks
 */
export async function updateStocks(productStocks, options = {}) {
  const results = [];
  const stocksToUpdate = [];

  // Étape 1 : Grouper les stocks par produit pour minimiser les requêtes
  const stocksByProduct = new Map();

  for (const [productRef, stocks] of Object.entries(productStocks)) {
    const productInfo = entityCache.products.get(productRef);

    if (!productInfo) {
      for (const stock of stocks) {
        results.push({
          productRef,
          stock,
          error: "Produit non trouvé",
          success: false,
        });
      }
      continue;
    }

    if (!stocksByProduct.has(productRef)) {
      stocksByProduct.set(productRef, []);
    }

    for (const stock of stocks) {
      let combinationId = null;

      if (stock.attribute && stock.value) {
        const cacheKey = getCombinationKey(
          productRef,
          stock.attribute,
          stock.value,
        );
        combinationId = productInfo.combinations.get(cacheKey);
      }

      stocksByProduct.get(productRef).push({
        stock,
        combinationId,
        productInfo,
      });
    }
  }

  // Étape 2 : Récupérer la liste des stock_availables (juste les IDs)
  const fetchTasks = [];

  for (const [productRef, stocks] of stocksByProduct.entries()) {
    const productInfo = stocks[0].productInfo;

    fetchTasks.push({
      productRef,
      productInfo,
      stocks,
    });
  }

  const fetchResults = await parallelLimit(fetchTasks, 6, async (fetchTask) => {
    try {
      const urlRest = `filter[id_product]=[${fetchTask.productInfo.id}]`;

      // Premier appel : récupérer la liste des IDs de stock_availables
      const response = await fetchPrestashop("stock_availables", { urlRest });

      if (
        !response.success ||
        !response.data?.stock_availables?.stock_available
      ) {
        return {
          productRef: fetchTask.productRef,
          stocks: fetchTask.stocks,
          stockDetails: new Map(),
          error: "Impossible de récupérer les stocks",
        };
      }

      // Récupérer la liste des IDs
      let stockList = response.data.stock_availables.stock_available;
      if (!Array.isArray(stockList)) {
        stockList = [stockList];
      }

      // Deuxième étape : Pour chaque stock, récupérer les détails complets
      const stockDetails = new Map();

      await parallelLimit(stockList, 5, async (stockItem) => {
        try {
          const stockId = stockItem["@_id"];
          if (!stockId) return;

          // Fetch les détails complets du stock
          const detailResponse = await fetchPrestashop(
            `stock_availables/${stockId}`,
          );

          if (detailResponse.success && detailResponse.data?.stock_available) {
            let stockData = detailResponse.data.stock_available;

            // Extraire les informations
            let idProduct =
              stockData.id_product?.["#cdata"] || stockData.id_product;
            let idAttribute =
              stockData.id_product_attribute?.["#cdata"] ||
              stockData.id_product_attribute ||
              "0";
            let quantity =
              stockData.quantity?.["#cdata"] || stockData.quantity || 0;

            const key = `${idProduct}|${idAttribute}`;
            stockDetails.set(key, {
              id: stockId,
              quantity: quantity,
            });
          }
        } catch (error) {
          console.error(`Erreur récupération détail stock :`, error);
        }
      });

      return {
        productRef: fetchTask.productRef,
        stocks: fetchTask.stocks,
        stockDetails,
        success: true,
      };
    } catch (error) {
      return {
        productRef: fetchTask.productRef,
        stocks: fetchTask.stocks,
        stockDetails: new Map(),
        error: error.message,
      };
    }
  });

  // Traiter les résultats et préparer les mises à jour
  for (const fetchResult of fetchResults) {
    if (!fetchResult.success) {
      for (const stockItem of fetchResult.stocks) {
        results.push({
          productRef: fetchResult.productRef,
          stock: stockItem.stock,
          error: fetchResult.error,
          success: false,
        });
      }
      continue;
    }

    for (const stockItem of fetchResult.stocks) {
      const { stock, combinationId, productInfo } = stockItem;

      // Construire la clé pour trouver le stock
      let combinationIdValue = "0";
      if (combinationId) {
        combinationIdValue = combinationId["#cdata"] || combinationId;
      }

      const stockKey = `${productInfo.id}|${combinationIdValue}`;
      const stockData = fetchResult.stockDetails.get(stockKey);

      if (stockData && stockData.id) {
        stocksToUpdate.push({
          productRef: fetchResult.productRef,
          stock,
          stockAvailableId: stockData.id,
          combinationId,
          productInfo,
        });
      } else {
        results.push({
          productRef: fetchResult.productRef,
          stock,
          error: `Stock ID non trouvé pour la clé: ${stockKey}`,
          success: false,
        });
      }
    }
  }

  // Mise à jour des stocks
  if (stocksToUpdate.length > 0) {
    const updateResults = await parallelLimit(
      stocksToUpdate,
      10,
      async (stockData) => {
        try {
          await updateResource(
            "stockAvailable",
            stockData.stockAvailableId,
            {
              quantity: stockData.stock.stock,
              out_of_stock: 2,
            },
            options,
          );

          const stockKey = stockData.combinationId
            ? `${stockData.productInfo.id}|${stockData.combinationId["#cdata"] || stockData.combinationId}`
            : `${stockData.productInfo.id}|0`;
          entityCache.stockAvailables.set(stockKey, stockData.stockAvailableId);

          return {
            productRef: stockData.productRef,
            stock: stockData.stock,
            stockAvailableId: stockData.stockAvailableId,
            success: true,
          };
        } catch (error) {
          return {
            productRef: stockData.productRef,
            stock: stockData.stock,
            error: error.message,
            success: false,
          };
        }
      },
    );

    results.push(...updateResults);
  }

  return results;
}

// ==================== ZIP : IMAGES ====================

/**
 * Upload des images produit
 * Note: Les images nécessitent un endpoint spécial dans PrestaShop
 * Cette fonction reste à adapter selon l'API d'upload d'images
 */
export async function uploadProductImages(zipImages) {
  const results = [];

  for (const [productRef, images] of Object.entries(zipImages)) {
    const productInfo = entityCache.products.get(productRef);

    if (!productInfo) {
      results.push({ productRef, error: "Produit non trouvé", success: false });
      continue;
    }

    for (const image of images) {
      try {
        const base64Data = image.data_base64.split(",")[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const imageBlob = new Blob([byteArray], { type: image.mime_type });
        const imageFile = new File([imageBlob], image.filename, {
          type: image.mime_type,
        });

        await uploadProductImage(productInfo.id, imageFile, {});

        results.push({ productRef, filename: image.filename, success: true });
      } catch (error) {
        results.push({
          productRef,
          filename: image.filename,
          error: error.message,
          success: false,
        });
      }
    }
  }

  return results;
}

// ==================== FILE 3 : CLIENTS, ADRESSES, CARTS, ORDERS ====================

/**
 * Import des clients
 */
export async function importCustomers(customersData, options = {}) {
  const cached = customersData.filter((c) =>
    entityCache.customers.has(c.email),
  );
  const notCached = customersData.filter(
    (c) => !entityCache.customers.has(c.email),
  );

  const results = cached.map((c) => ({
    email: c.email,
    id: entityCache.customers.get(c.email),
    cached: true,
  }));

  // Traitement parallèle avec limite de 7 requêtes simultanées
  const parallelResults = await parallelLimit(
    notCached,
    9,
    async (customer) => {
      try {
        const customerData = {
          firstname: customer.nom?.split(" ")[0] || "Client",
          lastname: customer.nom || "Unknown",
          email: customer.email,
          passwd: customer.mot_de_passe || "azerty123",
          active: "1",
          id_lang: "1",
          id_shop: "1",
        };

        const response = await addResource("customer", customerData, options);
        const customerId = response?.customer?.id;

        if (customerId) {
          entityCache.customers.set(customer.email, customerId);
          return { email: customer.email, id: customerId, success: true };
        }
        return {
          email: customer.email,
          error: "ID non récupéré",
          success: false,
        };
      } catch (error) {
        return {
          email: customer.email,
          error: error.message,
          success: false,
        };
      }
    },
  );

  return [...results, ...parallelResults];
}

/**
 * Import des adresses
 */
export async function importAddresses(
  addressesData,
  customersList,
  options = {},
) {
  const results = [];
  const addressesToProcess = [];

  for (const customer of customersList) {
    const customerId = entityCache.customers.get(customer.email);

    if (!customerId?.["#cdata"]) {
      results.push({
        email: customer.email,
        error: "Client non trouvé",
        success: false,
      });
      continue;
    }

    const alias = `Adresse_${customer.nom?.replace(/\s/g, "_") || customerId?.["#cdata"]}`;

    if (entityCache.addresses.has(alias)) {
      results.push({
        alias,
        id: entityCache.addresses.get(alias),
        cached: true,
      });
    } else {
      addressesToProcess.push({
        customer,
        customerId,
        alias,
      });
    }
  }

  // Traitement parallèle avec limite de 7 requêtes simultanées
  const parallelResults = await parallelLimit(
    addressesToProcess,
    9,
    async (addressObj) => {
      try {
        const addressData = {
          id_customer: addressObj.customerId?.["#cdata"],
          id_manufacturer: "0",
          id_supplier: "0",
          id_warehouse: "0",
          id_country: "8",
          id_state: "0",
          alias: " ",
          company: "",
          lastname:
            addressObj.customer.nom?.split("Client").slice(1).join(" ") || "Unknown",
          firstname: addressObj.customer.nom?.split("Client")[0] || "Client",
          vat_number: "",
          address1: addressObj.customer.adresse || "Adresse par défaut",
          address2: "",
          postcode: "10000",
          city: "Ville",
          other: "",
          phone: "",
          phone_mobile: "",
        };

        const response = await addResource("address", addressData, options);
        const addressId = response?.address?.id;

        if (addressId) {
          entityCache.addresses.set(addressObj.alias, addressId);
          return { alias: addressObj.alias, id: addressId, success: true };
        }
        return {
          alias: addressObj.alias,
          error: "ID non récupéré",
          success: false,
        };
      } catch (error) {
        return {
          alias: addressObj.alias,
          error: error.message,
          success: false,
        };
      }
    },
  );

  return [...results, ...parallelResults];
}

/**
 * Import des paniers
 */
export async function importCarts(cartsData, options = {}) {
  const results = [];
  const cartsToProcess = [];
  const cartsToUpdateDate = [];
  // console.log("Donnees des paniers à traiter :", cartsData);
  const sortedCartsData = [...cartsData].sort(
    (a, b) => parseDate(a.date) - parseDate(b.date),
  );
  // console.log("Donnees des paniers triées par date :", sortedCartsData);
  for (let i = 0; i < sortedCartsData.length; i++) {
    const cart = sortedCartsData[i];
    const customerId = entityCache.customers.get(cart.client_email);

    if (!customerId?.["#cdata"]) {
      results.push({
        email: cart.client_email,
        error: "Client non trouvé",
        success: false,
      });
      continue;
    }

    const alias = `Adresse_${cart.client_nom?.replace(/\s/g, "_") || customerId?.["#cdata"]}`;
    const addressId = entityCache.addresses.get(alias);

    if (!addressId?.["#cdata"]) {
      results.push({
        email: cart.client_email,
        error: "Adresse non trouvée",
        success: false,
      });
      continue;
    }

    cartsToProcess.push({
      cart,
      customerId,
      addressId,
    });
  }

  // Traitement parallèle avec limite de 7 requêtes simultanées (carts sont lourds)
  const cartCreateResults = await parallelLimit(
    cartsToProcess,
    9,
    async (cartObj) => {
      try {
        const cartRows = [];

        for (const item of cartObj.cart.panier) {
          const productInfo = entityCache.products.get(item.product_reference);

          if (!productInfo) continue;

          let attributeId = "0";

          if (item.attribute_name) {
            const targetValue = item.attribute_name.toLowerCase();
            const productRef = item.product_reference;

            for (let [key, value] of productInfo.combinations) {
              const keyParts = key.split("|");
              const keyRef = keyParts[0];
              const keyValue = keyParts[keyParts.length - 1];

              if (
                keyRef === productRef &&
                keyValue.toLowerCase() === targetValue
              ) {
                attributeId = value;
                break;
              }
            }
          }

          cartRows.push({
            id_product: productInfo.id.toString(),
            id_product_attribute: attributeId?.["#cdata"] || 0,
            id_address_delivery: cartObj.addressId?.["#cdata"],
            id_customization: "0",
            quantity: item.quantity.toString(),
          });
        }

        if (cartRows.length === 0) {
          return {
            email: cartObj.cart.client_email,
            error: "Aucun produit valide dans le panier",
            success: false,
          };
        }

        const cartData = {
          id_address_delivery: cartObj.addressId?.["#cdata"],
          id_address_invoice: cartObj.addressId?.["#cdata"],
          id_currency: "1",
          id_customer: cartObj.customerId?.["#cdata"],
          id_guest: 0,
          id_lang: "1",
          id_shop_group: "1",
          id_shop: "1",
          id_carrier: "1",
          recyclable: "0",
          gift: "0",
          gift_message: "",
          mobile_theme: "0",
          delivery_option: '{"8":"1,"}',
          allow_seperated_package: "0",
          associations: {
            cart_rows: { cart_row: cartRows },
          },
        };

        const response = await addResource("cart", cartData, options);
        const cartId = response?.cart?.id;

        if (cartId) {
          const originalDate = cartObj.cart.date;
          const formattedDate = formatDateWithTime(originalDate, "12:00:57");

          const cartCacheKey = `${cartId?.["#cdata"]}|${formattedDate}`;

          entityCache.carts.set(cartCacheKey, {
            id: cartId,
            customer_email: cartObj.cart.client_email,
            cart_content: JSON.stringify(cartObj.cart.panier),
            cart_date: formattedDate,
            cart_items: cartObj.cart.panier.map((item) => ({
              product_reference: item.product_reference,
              attribute_name: item.attribute_name,
              quantity: item.quantity,
            })),
          });

          return {
            email: cartObj.cart.client_email,
            cartId,
            date: formattedDate,
            cartIdValue: cartId?.["#cdata"],
            formattedDate,
            success: true,
          };
        }
        return {
          email: cartObj.cart.client_email,
          error: "ID non récupéré",
          success: false,
        };
      } catch (error) {
        return {
          email: cartObj.cart.client_email,
          error: error.message,
          success: false,
        };
      }
    },
  );

  for (const result of cartCreateResults) {
    if (result.success && result.cartIdValue && result.formattedDate) {
      cartsToUpdateDate.push({
        cartIdValue: result.cartIdValue,
        formattedDate: result.formattedDate,
        email: result.email,
      });
    } else if (!result.success) {
      results.push(result);
    }
  }

  // Mettre à jour les dates en parallèle (limite 10)
  if (cartsToUpdateDate.length > 0) {
    const updateDateResults = await parallelLimit(
      cartsToUpdateDate,
      10,
      async (updateData) => {
        try {
          const cartPatch = {
            id: updateData.cartIdValue,
            date_add: updateData.formattedDate,
            date_upd: updateData.formattedDate,
          };
          await updateResource(
            "cart",
            updateData.cartIdValue,
            cartPatch,
            options,
          );
          return {
            email: updateData.email,
            cartId: updateData.cartIdValue,
            date: updateData.formattedDate,
            success: true,
          };
        } catch (error) {
          console.error(
            `Erreur mise à jour cart ${updateData.cartIdValue}:`,
            error,
          );
          return {
            email: updateData.email,
            cartId: updateData.cartIdValue,
            error: error.message,
            success: false,
          };
        }
      },
    );
    results.push(...updateDateResults);
  }

  // Ajouter les résultats de création réussis
  results.push(...cartCreateResults.filter((r) => r.success));

  return results;
}
/**
 * Calcule le prix TTC d'un produit en fonction de sa combinaison
 */
const getProductPriceTTC = (productInfo, combinationAttributeId, quantity) => {
  if (combinationAttributeId && combinationAttributeId !== "0") {
    const combinationPriceKey = `${productInfo.id}|${combinationAttributeId}`;
    const combinationPrice =
      entityCache.combinationPrices.get(combinationPriceKey);

    if (combinationPrice !== undefined) {
      return combinationPrice * quantity;
    }
  }

  // Le produit stocké a prix_ht et tax_rate, donc on recalc le TTC
  const basePriceTTC =
    productInfo.base_price_ht * (1 + productInfo.tax_rate / 100);
  return basePriceTTC * quantity;
};
/**
 * Import des commandes
 */
export async function importOrders(ordersData, options = {}) {
  const results = [];
  const ordersToProcess = [];
  let ordersToUpdateDate = [];

  // console.log("Données brutes pour importOrders:", ordersData);
  const sortedOrdersData = [...ordersData].sort(
    (a, b) => parseDate(a.date) - parseDate(b.date),
  );

  // console.log("Donnees triees pour importOrders:", sortedOrdersData);

  for (let i = 0; i < sortedOrdersData.length; i++) {
    const order = sortedOrdersData[i];
    const customerId = entityCache.customers.get(order.client_email);

    if (!customerId?.["#cdata"]) {
      results.push({
        email: order.client_email,
        error: "Client non trouvé",
        success: false,
      });
      continue;
    }

    const alias = `Adresse_${order.client_nom?.replace(/\s/g, "_") || customerId}`;
    const addressId = entityCache.addresses.get(alias);

    if (!addressId?.["#cdata"]) {
      results.push({
        email: order.client_email,
        error: "Adresse non trouvée",
        success: false,
      });
      continue;
    }

    let cartId = null;

    // Formater la date de la commande pour comparaison
    const orderDate = order.date;
    const formattedOrderDate = formatDateWithTime(orderDate, "12:00:57");
    const orderDateOnly = getDatePart(formattedOrderDate); // YYYY-MM-DD

    // Rechercher un panier correspondant au client ET à la date
    for (const [storedCartKey, cartInfo] of entityCache.carts.entries()) {
      if (cartInfo.customer_email === order.client_email) {
        // Vérifier si la date du panier correspond à celle de la commande (comparaison par timestamp)
        const cartDateOnly = getDatePart(cartInfo.cart_date); // YYYY-MM-DD
        if (cartDateOnly !== orderDateOnly) {
          continue; // Date différente, passer au panier suivant
        }

        const orderItems = order.panier;
        const cartItems = cartInfo.cart_items;

        if (orderItems.length === cartItems.length) {
          let isMatching = true;

          const cartItemsMap = new Map();
          cartItems.forEach((item) => {
            const key = `${item.product_reference}|${item.attribute_name || "null"}`;
            cartItemsMap.set(key, item.quantity);
          });

          for (const orderItem of orderItems) {
            const key = `${orderItem.product_reference}|${orderItem.attribute_name || "null"}`;
            if (
              !cartItemsMap.has(key) ||
              cartItemsMap.get(key) !== orderItem.quantity
            ) {
              isMatching = false;
              break;
            }
          }

          if (isMatching) {
            cartId = cartInfo.id;
            break;
          }
        }
      }
    }

    if (!cartId?.["#cdata"]) {
      results.push({
        email: order.client_email,
        error: "Panier non trouvé pour cette commande",
        success: false,
      });
      continue;
    }

    ordersToProcess.push({
      order,
      customerId,
      addressId,
      cartId,
    });
  }

  // Traitement parallèle avec limite de 7 requêtes simultanées (orders sont très lourds)
  const orderCreateResults = await parallelLimitOrdered(
    ordersToProcess,
    7,
    async (orderObj) => {
      try {
        const orderRows = [];
        let totalProducts = 0;
        let totalPaidTTC = 0;

        for (const item of orderObj.order.panier) {
          const productInfo = entityCache.products.get(item.product_reference);

          if (!productInfo) continue;

          let attributeId = "0";

          if (item.attribute_name) {
            const targetValue = item.attribute_name.toLowerCase();
            const productRef = item.product_reference;

            for (let [key, value] of productInfo.combinations) {
              const keyParts = key.split("|");
              const keyRef = keyParts[0];
              const keyValue = keyParts[keyParts.length - 1];

              if (
                keyRef === productRef &&
                keyValue.toLowerCase() === targetValue
              ) {
                attributeId = value;
                break;
              }
            }
          }

          const attributeIdValue = attributeId?.["#cdata"] || attributeId;
          const itemPriceTTC = getProductPriceTTC(
            productInfo,
            attributeIdValue,
            item.quantity,
          );
          totalPaidTTC += itemPriceTTC;
          orderRows.push({
            product_id: productInfo.id.toString(),
            product_attribute_id: attributeId?.["#cdata"],
            product_quantity: item.quantity.toString(),
          });

          totalProducts += item.quantity;
        }

        if (orderRows.length === 0) {
          return {
            email: orderObj.order.client_email,
            error: "Aucun produit valide dans la commande",
            success: false,
          };
        }

        const orderData = {
          id_address_delivery: orderObj.addressId?.["#cdata"],
          id_address_invoice: orderObj.addressId?.["#cdata"],
          id_cart: orderObj.cartId?.["#cdata"],
          id_currency: "1",
          id_lang: "1",
          id_customer: orderObj.customerId?.["#cdata"],
          id_carrier: "1",
          module: "ps_cashondelivery",
          valid: "1",
          id_shop_group: "1",
          id_shop: "1",
          payment: "Paiement comptant à la livraison (Cash on delivery)",
          recyclable: "0",
          gift: "0",
          gift_message: "",
          mobile_theme: "0",
          total_paid: totalPaidTTC.toFixed(8),
          total_paid_real: "0",
          total_products: totalProducts.toFixed(8),
          total_products_wt: "0",
          round_mode: "2",
          round_type: "2",
          conversion_rate: "1",
          associations: {
            order_rows: { order_row: orderRows },
          },
        };

        const response = await addResource("order", orderData, options);
        const orderId = response?.order?.id;

        if (orderId) {
          const formattedDate = formatDateWithTime(
            orderObj.order.date,
            "12:00:57",
          );
          const orderIdValue = orderId?.["#cdata"];
          const etatOriginal = orderObj.order.etat;

          entityCache.orders.set(orderId, {
            id: orderId,
            ref: orderIdValue,
            email: orderObj.order.client_email,
            etat_original: etatOriginal,
            order_date: formattedDate,
          });
          if (!ordersToUpdateDate) {
            ordersToUpdateDate = [];
          }
          ordersToUpdateDate.push({
            orderIdValue: orderIdValue,
            formattedDate: formattedDate,
            email: orderObj.order.client_email,
          });

          let cancelResult = null;
          if (etatOriginal && etatOriginal.toLowerCase() === "annulé") {
            cancelResult = await cancelOrder(
              orderIdValue,
              orderIdValue,
              options,
            );
            if (!cancelResult.success) {
              console.error(
                `Erreur lors de l'annulation immédiate de la commande ${orderIdValue}:`,
                cancelResult.error,
              );
            }
          }

          return {
            email: orderObj.order.client_email,
            orderId,
            orderIdValue: orderIdValue,
            etat_original: etatOriginal,
            date: formattedDate,
            cancelled_immediately: cancelResult?.success || false,
            success: true,
          };
        }
        return {
          email: orderObj.order.client_email,
          error: "ID non récupéré",
          success: false,
        };
      } catch (error) {
        return {
          email: orderObj.order.client_email,
          error: error.message,
          success: false,
        };
      }
    },
  );

  if (ordersToUpdateDate && ordersToUpdateDate.length > 0) {
    const updateOrderDateResults = await parallelLimit(
      ordersToUpdateDate,
      10,
      async (updateData) => {
        try {
          const orderPatch = {
            id: updateData.orderIdValue,
            date_add: updateData.formattedDate,
            date_upd: updateData.formattedDate,
          };
          await updateResource(
            "order",
            updateData.orderIdValue,
            orderPatch,
            options,
          );
          return {
            email: updateData.email,
            orderId: updateData.orderIdValue,
            date: updateData.formattedDate,
            success: true,
          };
        } catch (error) {
          console.error(
            `Erreur mise à jour order ${updateData.orderIdValue}:`,
            error,
          );
          return {
            email: updateData.email,
            orderId: updateData.orderIdValue,
            error: error.message,
            success: false,
          };
        }
      },
    );

    results.push(...updateOrderDateResults);
  }

  return [...results, ...orderCreateResults];
}

// ==================== FONCTION PRINCIPALE D'IMPORT ====================

export async function runFullImport(
  importer,
  parsedData,
  callbacks = {},
  apiOptions = {},
) {
  const { onProgress, onStepComplete, onError } = callbacks;

  const results = {
    file1: {},
    file2: {},
    zip: {},
    file3: {},
    global_success: false,
  };

  try {
    // ==================== FILE 1 ====================
    if (onProgress) onProgress("Traitement du fichier 1 : Produits...", 10);

    // 1.1 Catégories
    if (onProgress) onProgress("Import des catégories...", 15);
    results.file1.categories_result = await importCategories(
      parsedData.file1.categories,
      apiOptions,
    );

    // 1.2 Taxes
    if (onProgress) onProgress("Import des taxes...", 20);
    results.file1.taxes_result = await importTaxes(
      parsedData.file1.taxes,
      apiOptions,
    );

    // 1.3 Tax Rule Groups
    if (onProgress) onProgress("Import des groupes de règles de taxe...", 25);
    results.file1.tax_rule_groups_result = await importTaxRuleGroups(
      parsedData.file1.taxes,
      apiOptions,
    );

    // 1.4 Tax Rules
    if (onProgress) onProgress("Import des règles de taxe...", 30);
    results.file1.tax_rules_result = await importTaxRules(
      parsedData.file1.taxes,
      null,
      apiOptions,
    );

    // // 1.5 Produits
    if (onProgress) onProgress("Import des produits...", 35);
    results.file1.products_result = await importProducts(
      parsedData.file1.products,
      apiOptions,
    );

    if (onStepComplete) onStepComplete("file1", results.file1);

    // // ==================== FILE 2 ====================
    if (onProgress) onProgress("Traitement du fichier 2 : Combinaisons...", 40);

    // 2.1 Product Options
    if (onProgress) onProgress("Import des options de produit...", 45);
    results.file2.product_options_result = await importProductOptions(
      parsedData.file2.product_options,
      apiOptions,
    );

    // 2.2 Product Option Values
    if (onProgress) onProgress("Import des valeurs d'options...", 50);
    results.file2.product_option_values_result =
      await importProductOptionValues(
        parsedData.file2.product_option_values,
        apiOptions,
      );

    // 2.3 Combinations
    if (onProgress) onProgress("Import des combinaisons...", 55);
    results.file2.combinations_result = await importCombinations(
      parsedData.file2.product_combinations,
      apiOptions,
    );

    // 2.4 Update Stocks
    if (onProgress) onProgress("Mise à jour des stocks...", 65);
    results.file2.stocks_result = await updateStocks(
      parsedData.file2.product_stocks,
      apiOptions,
    );

    if (onStepComplete) onStepComplete("file2", results.file2);

    // ==================== ZIP ====================
    if (importer == false) {
      if (onProgress) onProgress("Traitement des images...", 70);

      if (parsedData?.zip?.images) {
        results.zip.images = await uploadProductImages(parsedData.zip.images);
      }

      if (onStepComplete) onStepComplete("zip", results.zip);
    } else {
      console.log("Pas d importation d image ")
    }

    // ==================== FILE 3 ====================
    if (onProgress)
      onProgress("Traitement du fichier 3 : Clients et Commandes...", 75);

    // 3.1 Customers
    if (onProgress) onProgress("Import des clients...", 80);
    results.file3.customers_result = await importCustomers(
      parsedData.file3.customers,
      apiOptions,
    );

    // 3.2 Addresses
    if (onProgress) onProgress("Import des adresses...", 85);
    results.file3.addresses_result = await importAddresses(
      null,
      parsedData.file3.customers,
      apiOptions,
    );

    // 3.3 Carts
    if (onProgress) onProgress("Import des paniers...", 90);
    results.file3.carts_result = await importCarts(
      parsedData.file3.carts,
      apiOptions,
    );

    // 3.4 Orders
    if (onProgress) onProgress("Import des commandes...", 93);
    results.file3.orders_result = await importOrders(
      parsedData.file3.orders,
      apiOptions,
    );

    if (onProgress) onProgress("Application des changements d'état...", 96);
    results.file3.state_changes_result =
      await applyOrderStateChanges(apiOptions);

    if (onStepComplete) onStepComplete("file3", results.file3);

    results.global_success = true;
    if (onProgress) onProgress("Import terminé avec succès !", 100);
  } catch (error) {
    console.error("Erreur lors de l'import:", error);
    if (onError) onError(error);
    results.global_success = false;
    results.global_error = error.message;
  }

  return results;
}

export { entityCache };

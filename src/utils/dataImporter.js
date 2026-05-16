import { fetchPrestashop } from "../hooks/useFetchPrestashop";
import {
  addResource,
  updateResource,
  uploadProductImage,
} from "../hooks/useMutationPrestashop";

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

// ==================== FILE 1 : PRODUITS ====================

/**
 * Import des catégories
 */
export async function importCategories(categories, options = {}) {
  const results = [];

  for (const categoryName of categories) {
    if (entityCache.categories.has(categoryName)) {
      results.push({
        name: categoryName,
        id: entityCache.categories.get(categoryName),
        cached: true,
      });
      continue;
    }

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
      //   console.log("response:",response)
      const categoryId = response?.category?.id?.["#cdata"];

      if (categoryId) {
        entityCache.categories.set(categoryName, categoryId);
        results.push({ name: categoryName, id: categoryId, success: true });
      } else {
        results.push({
          name: categoryName,
          error: "ID non récupéré",
          success: false,
        });
      }
    } catch (error) {
      results.push({
        name: categoryName,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
}

/**
 * Import des taxes
 */
export async function importTaxes(taxes, options = {}) {
  const results = [];

  for (const taxRate of taxes) {
    const cleanTaxRate = taxRate.replace(",", ".").replace("%", "");

    const rate = parseFloat(cleanTaxRate).toFixed(3);
    if (entityCache.taxes.has(rate)) {
      results.push({ rate, id: entityCache.taxes.get(rate), cached: true });
      continue;
    }

    try {
      const taxData = {
        rate: rate,
        active: "1",
        deleted: "0",
        name: `TVA ${rate}%`,
      };

      const response = await addResource("tax", taxData, options);
      const taxId = response?.tax?.id?.["#cdata"];

      if (taxId) {
        entityCache.taxes.set(rate, taxId);
        results.push({ rate, id: taxId, success: true });
      } else {
        results.push({ rate, error: "ID non récupéré", success: false });
      }
    } catch (error) {
      results.push({ rate, error: error.message, success: false });
    }
  }

  return results;
}

export async function importTaxRuleGroups(taxes, options = {}) {
  const results = [];

  for (const taxRate of taxes) {
    const groupName = `Taxes de ${taxRate}`;
    if (entityCache.taxRuleGroups.has(groupName)) {
      results.push({
        name: groupName,
        id: entityCache.taxRuleGroups.get(groupName),
        cached: true,
      });
      continue;
    }

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
      //   console.log("response: ",response);

      const groupId = response?.tax_rule_group?.id?.["#cdata"];

      if (groupId) {
        entityCache.taxRuleGroups.set(groupName, groupId);
        results.push({ name: groupName, id: groupId, success: true });
      } else {
        results.push({
          name: groupName,
          error: "ID non récupéré",
          success: false,
        });
      }
    } catch (error) {
      results.push({ name: groupName, error: error.message, success: false });
    }
  }

  return results;
}

/**
 * Import des règles de taxe
 */
export async function importTaxRules(taxes, taxRuleGroups, options = {}) {
  const results = [];

  for (let i = 0; i < taxes.length; i++) {
    const taxRate = taxes[i];
    // console.log("taxRate:", taxRate);
    // console.log("entityCache:", entityCache);

    const formattedRate = taxRate.replace(",", ".").replace("%", "");

    const mapKey = parseFloat(formattedRate).toFixed(3);

    let taxId = entityCache.taxes.get(mapKey);
    let taxRuleGroupId = entityCache.taxRuleGroups.get(`Taxes de ${taxRate}`);

    if (!taxId || !taxRuleGroupId) {
      results.push({
        taxRate,
        error: "Taxe ou groupe de taxe non trouvé",
        success: false,
      });

      continue;
    }

    const ruleKey = `${taxRuleGroupId}|${taxId}`;
    if (entityCache.taxRules.has(ruleKey)) {
      results.push({
        taxRate,
        id: entityCache.taxRules.get(ruleKey),
        cached: true,
      });
      continue;
    }

    try {
      const taxRuleData = {
        id_tax_rules_group: taxRuleGroupId,
        id_state: 0,
        id_country: 8,
        zipcode_from: 0,
        zipcode_to: 0,
        id_tax: taxId,
        behavior: 0,
        description: "",
      };

      const response = await addResource("taxRule", taxRuleData, options);
      const ruleId = response?.tax_rule?.id?.["#cdata"];

      if (ruleId) {
        entityCache.taxRules.set(ruleKey, ruleId);
        results.push({ taxRate, id: ruleId, success: true });
      } else {
        results.push({ taxRate, error: "ID non récupéré", success: false });
      }
    } catch (error) {
      results.push({ taxRate, error: error.message, success: false });
    }
  }

  return results;
}

/**
 * Import des produits
 */
export async function importProducts(productsData, options = {}) {
  const results = [];
  //   console.log("productsData:", productsData);
  for (const product of productsData) {
    if (entityCache.products.has(product.reference)) {
      results.push({
        reference: product.reference,
        id: entityCache.products.get(product.reference).id,
        cached: true,
      });
      continue;
    }

    try {
      const categoryId = entityCache.categories.get(product.categorie_name);
      //   console.log("product.taxe:", product.taxe);
      //   console.log("entityCache.taxRuleGroups:", entityCache.taxRuleGroups);
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
        results.push({
          reference: product.reference,
          id: productId,
          success: true,
        });
      } else {
        results.push({
          reference: product.reference,
          error: "ID non récupéré",
          success: false,
        });
      }
    } catch (error) {
      results.push({
        reference: product.reference,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
}

// ==================== FILE 2 : COMBINAISONS ====================

/**
 * Import des options de produit
 */
export async function importProductOptions(productOptions, options = {}) {
  const results = [];

  for (const optionName of productOptions) {
    if (entityCache.productOptions.has(optionName)) {
      results.push({
        name: optionName,
        id: entityCache.productOptions.get(optionName),
        cached: true,
      });
      continue;
    }

    try {
      const optionData = {
        is_color_group: 0,
        group_type: "select",
        name: optionName,
        public_name: optionName,
      };

      const response = await addResource("productOption", optionData, options);
      const optionId = response?.product_option?.id?.["#cdata"];

      if (optionId) {
        entityCache.productOptions.set(optionName, optionId);
        results.push({ name: optionName, id: optionId, success: true });
      } else {
        results.push({
          name: optionName,
          error: "ID non récupéré",
          success: false,
        });
      }
    } catch (error) {
      results.push({ name: optionName, error: error.message, success: false });
    }
  }

  return results;
}

/**
 * Import des valeurs d'option de produit
 */
export async function importProductOptionValues(
  productOptionValues,
  options = {},
) {
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
        continue;
      }

      try {
        const valueData = {
          id_attribute_group: optionId.toString(),
          name: value,
        };

        const response = await addResource(
          "productOptionValue",
          valueData,
          options,
        );
        const valueId = response?.product_option_value?.id?.["#cdata"];

        if (valueId) {
          entityCache.productOptionValues.set(cacheKey, valueId);
          results.push({ optionName, value, id: valueId, success: true });
        } else {
          results.push({
            optionName,
            value,
            error: "ID non récupéré",
            success: false,
          });
        }
      } catch (error) {
        results.push({
          optionName,
          value,
          error: error.message,
          success: false,
        });
      }
    }
  }

  return results;
}

/**
 * Import des combinaisons de produit
 */
export async function importCombinations(productCombinations, options = {}) {
  const results = [];

  for (const [productRef, combinations] of Object.entries(
    productCombinations,
  )) {
    const productInfo = entityCache.products.get(productRef);

    if (!productInfo) {
      results.push({ productRef, error: "Produit non trouvé", success: false });
      continue;
    }

    let defaultCombinationId = null;

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
        continue;
      }

      try {
        const optionId = entityCache.productOptions.get(combo.attribute);
        const optionValueId = entityCache.productOptionValues.get(
          `${combo.attribute}|${combo.value}`,
        );

        if (!optionId || !optionValueId) {
          results.push({
            productRef,
            combo,
            error: "Option ou valeur non trouvée",
            success: false,
          });
          continue;
        }
        // console.log("productInfo:", productInfo);
        // console.log("combo:", combo);

        let combinationPrice = 0;

        if (
          combo.price_ttc &&
          productInfo.base_price_ht &&
          productInfo.tax_rate
        ) {
          const combinationPriceTTC = parseFloat(combo.price_ttc);
          const combinationPriceHT =
            combinationPriceTTC / (1 + productInfo.tax_rate / 100);

          const priceDifference =
            combinationPriceHT - productInfo.base_price_ht;

          combinationPrice = parseFloat(priceDifference.toFixed(8));
        }
        const combinationData = {
          id_product: productInfo.id,
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
          productInfo.combinations.set(cacheKey, combinationId);
          if (combo.price_ttc) {
            const combinationPriceKey = `${productInfo.id}|${combinationId?.["#cdata"] || combinationId}`;
            entityCache.combinationPrices.set(
              combinationPriceKey,
              parseFloat(combo.price_ttc),
            );
          }
          if (!defaultCombinationId) {
            defaultCombinationId = combinationId;
          }

          results.push({ productRef, combo, id: combinationId, success: true });
        } else {
          results.push({
            productRef,
            combo,
            error: "ID non récupéré",
            success: false,
          });
        }
      } catch (error) {
        results.push({
          productRef,
          combo,
          error: error.message,
          success: false,
        });
      }
    }

    if (defaultCombinationId) {
      const productPatch = {
        id: productInfo.id,
        show_price: 1,
        cache_default_attribute: defaultCombinationId?.["#cdata"],
        id_default_combination: defaultCombinationId?.["#cdata"],
      };
      try {
        await updateResource("product", productInfo.id, productPatch, options);
        productInfo.id_default_combination = defaultCombinationId;
      } catch (error) {
        console.error(`Erreur mise à jour produit ${productRef}:`, error);
      }
    }
  }

  return results;
}

/**
 * Récupération et mise à jour des stocks
 */
export async function updateStocks(productStocks, options = {}) {
  const results = [];

  for (const [productRef, stocks] of Object.entries(productStocks)) {
    const productInfo = entityCache.products.get(productRef);

    if (!productInfo) {
      results.push({ productRef, error: "Produit non trouvé", success: false });
      continue;
    }
    // console.log("productInfo:", productInfo)
    // console.log("stocks", stocks)
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

      try {
        let url = `stock_availables`;
        let urlRest = `filter[id_product]=[${productInfo.id}]`;
        // console.log("combinationId:", combinationId)
        if (combinationId?.["#cdata"]) {
          urlRest += `&filter[id_product_attribute]=[${combinationId?.["#cdata"]}]`;
        }
        // console.log("urlRest:", urlRest)

        const response = await fetchPrestashop(url, { urlRest: urlRest });
        // console.log("response:", response)
        if (response.success && response.data?.stock_availables) {
          let stockAvailableId = null;

          if (Array.isArray(response.data.stock_availables.stock_available)) {
            stockAvailableId =
              response.data.stock_availables.stock_available?.[0]?.["@_id"];
          } else {
            stockAvailableId =
              response.data.stock_availables.stock_available?.["@_id"];
          }
          //   console.log("stockAvailableId:", stockAvailableId)
          if (stockAvailableId) {
            await updateResource(
              "stockAvailable",
              stockAvailableId,
              {
                quantity: stock.stock,
                out_of_stock: 1,
              },
              options,
            );

            const stockKey = combinationId
              ? `${productInfo.id}|${combinationId}`
              : `${productInfo.id}|0`;
            entityCache.stockAvailables.set(stockKey, stockAvailableId);

            results.push({
              productRef,
              stock,
              stockAvailableId,
              success: true,
            });
          } else {
            results.push({
              productRef,
              stock,
              error: "Stock ID non trouvé",
              success: false,
            });
          }
        } else {
          results.push({
            productRef,
            stock,
            error: "Impossible de récupérer le stock",
            success: false,
          });
        }
      } catch (error) {
        results.push({
          productRef,
          stock,
          error: error.message,
          success: false,
        });
      }
    }
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
  const results = [];

  for (const customer of customersData) {
    if (entityCache.customers.has(customer.email)) {
      results.push({
        email: customer.email,
        id: entityCache.customers.get(customer.email),
        cached: true,
      });
      continue;
    }

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
        results.push({ email: customer.email, id: customerId, success: true });
      } else {
        results.push({
          email: customer.email,
          error: "ID non récupéré",
          success: false,
        });
      }
    } catch (error) {
      results.push({
        email: customer.email,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
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

  for (const customer of customersList) {
    const customerId = entityCache.customers.get(customer.email);
    // console.log("customer:", customer)
    // console.log("entityCache.customers:" ,entityCache.customers)
    // console.log("customerId:", customerId?.['#cdata'])
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
      continue;
    }

    try {
      const addressData = {
        id_customer: customerId?.["#cdata"],
        id_manufacturer: "0",
        id_supplier: "0",
        id_warehouse: "0",
        id_country: "8",
        id_state: "0",
        alias: alias,
        company: "",
        lastname: customer.nom?.split(" ").slice(1).join(" ") || "Unknown",
        firstname: customer.nom?.split(" ")[0] || "Client",
        vat_number: "",
        address1: customer.adresse || "Adresse par défaut",
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
        entityCache.addresses.set(alias, addressId);
        results.push({ alias, id: addressId, success: true });
      } else {
        results.push({ alias, error: "ID non récupéré", success: false });
      }
    } catch (error) {
      results.push({ alias, error: error.message, success: false });
    }
  }

  return results;
}

/**
 * Import des paniers
 */
export async function importCarts(cartsData, options = {}) {
  const results = [];

  for (let i = 0; i < cartsData.length; i++) {
    const cart = cartsData[i];
    const customerId = entityCache.customers.get(cart.client_email);

    if (!customerId?.["#cdata"]) {
      results.push({
        email: cart.client_email,
        error: "Client non trouvé",
        success: false,
      });
      continue;
    }

    // Récupérer l'adresse du client
    const alias = `Adresse_${cart.client_nom?.replace(/\s/g, "_") || customerId?.["#cdata"]}`;
    const addressId = entityCache.addresses.get(alias);
    // console.log("addressId:", addressId)
    if (!addressId?.["#cdata"]) {
      results.push({
        email: cart.client_email,
        error: "Adresse non trouvée",
        success: false,
      });
      continue;
    }

    try {
      const cartRows = [];
      //   console.log("cart.panier:", cart.panier);
      for (const item of cart.panier) {
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

          //   console.log("Match trouvé - attributeId:", attributeId);
        }

        cartRows.push({
          id_product: productInfo.id.toString(),
          id_product_attribute: attributeId?.["#cdata"],
          id_address_delivery: addressId?.["#cdata"],
          id_customization: "0",
          quantity: item.quantity.toString(),
        });
      }

      if (cartRows.length === 0) {
        results.push({
          email: cart.client_email,
          error: "Aucun produit valide dans le panier",
          success: false,
        });
        continue;
      }

      const cartData = {
        id_address_delivery: addressId?.["#cdata"],
        id_address_invoice: addressId?.["#cdata"],
        id_currency: "1",
        id_customer: customerId?.["#cdata"],
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
        entityCache.carts.set(cartId, {
          id: cartId,
          customer_email: cart.client_email,
          cart_content: JSON.stringify(cart.panier),
          cart_items: cart.panier.map((item) => ({
            product_reference: item.product_reference,
            attribute_name: item.attribute_name,
            quantity: item.quantity,
          })),
        });
        results.push({ email: cart.client_email, cartId, success: true });
      } else {
        results.push({
          email: cart.client_email,
          error: "ID non récupéré",
          success: false,
        });
      }
    } catch (error) {
      results.push({
        email: cart.client_email,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
}
/**
 * Calcule le prix TTC d'un produit en fonction de sa combinaison
 */
const getProductPriceTTC = (productInfo, combinationAttributeId, quantity) => {
  if (combinationAttributeId && combinationAttributeId !== "0") {
    const combinationPriceKey = `${productInfo.id}|${combinationAttributeId}`;
    const combinationPrice = entityCache.combinationPrices.get(combinationPriceKey);
    
    if (combinationPrice !== undefined) {
      return combinationPrice * quantity;
    }
  }
  
  // Le produit stocké a prix_ht et tax_rate, donc on recalc le TTC
  const basePriceTTC = productInfo.base_price_ht * (1 + productInfo.tax_rate / 100);
  return basePriceTTC * quantity;
};
/**
 * Import des commandes
 */
export async function importOrders(ordersData, options = {}) {
  const results = [];
  // console.log("ordersData:", ordersData)
  for (let i = 0; i < ordersData.length; i++) {
    const order = ordersData[i];
    const customerId = entityCache.customers.get(order.client_email);
    // console.log("customerId:", customerId);
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
    // console.log("addressId:", addressId);
    if (!addressId?.["#cdata"]) {
      results.push({
        email: order.client_email,
        error: "Adresse non trouvée",
        success: false,
      });
      continue;
    }

    let cartId = null;

    for (const [storedCartId, cartInfo] of entityCache.carts.entries()) {
      if (cartInfo.customer_email === order.client_email) {
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
            cartId = storedCartId;
            break;
          }
        }
      }
    }

    // console.log("cartId:", cartId);
    if (!cartId?.["#cdata"]) {
      results.push({
        email: order.client_email,
        error: "Panier non trouvé pour cette commande",
        success: false,
      });
      continue;
    }

    try {
      const orderRows = [];
      let totalProducts = 0;
      let totalPaidTTC = 0;
      for (const item of order.panier) {
        const productInfo = entityCache.products.get(item.product_reference);
        // console.log("productInfo:", productInfo);

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
          // console.log("Match trouvé - attributeId:", attributeId);
        }
        const attributeIdValue = attributeId?.["#cdata"] || attributeId;
        const itemPriceTTC = getProductPriceTTC(productInfo, attributeIdValue, item.quantity);
        totalPaidTTC += itemPriceTTC;
        orderRows.push({
          product_id: productInfo.id.toString(),
          product_attribute_id: attributeId?.["#cdata"],
          product_quantity: item.quantity.toString(),
        });

        totalProducts += item.quantity;
      }

      if (orderRows.length === 0) {
        results.push({
          email: order.client_email,
          error: "Aucun produit valide dans la commande",
          success: false,
        });
        continue;
      }
      // console.log("totalPaidTTC:", totalPaidTTC)
      const orderData = {
        id_address_delivery: addressId?.["#cdata"],
        id_address_invoice: addressId?.["#cdata"],
        id_cart: cartId?.["#cdata"],
        id_currency: "1",
        id_lang: "1",
        id_customer: customerId?.["#cdata"],
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
    //   console.log("orderData:", orderData);

      const response = await addResource("order", orderData, options);
      const orderId = response?.order?.id;

      if (orderId) {
        entityCache.orders.set(orderId, orderId);
        results.push({ email: order.client_email, orderId, success: true });
      } else {
        results.push({
          email: order.client_email,
          error: "ID non récupéré",
          success: false,
        });
      }
    } catch (error) {
      results.push({
        email: order.client_email,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
}

// ==================== FONCTION PRINCIPALE D'IMPORT ====================

export async function runFullImport(
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
    if (onProgress) onProgress("Traitement des images...", 70);

    if (parsedData.zip.images) {
      results.zip.images = await uploadProductImages(parsedData.zip.images);
    }

    if (onStepComplete) onStepComplete("zip", results.zip);

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
    if (onProgress) onProgress("Import des commandes...", 95);
    results.file3.orders_result = await importOrders(
      parsedData.file3.orders,
      apiOptions,
    );

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

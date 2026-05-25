/* eslint-disable react-hooks/exhaustive-deps */
import { useFetch } from "./useFetch.js";
import { useEffect, useState } from "react";
import { parsePrestashopXML } from "../utils/ParserXml.js";

export async function fetchPrestashop(url, options = {}) {
  const apiKey = "2LA1668U53GC9T35AIT5Y3P7E8CKG7LL";
  const baseUrl = "http://localhost/prestashop2/api";

  let fullUrl = `${baseUrl}/${url}?ws_key=${apiKey}`;
  if (options.urlRest) {
    fullUrl += `&${options.urlRest}`;
  }

  try {
    // console.log("fullUrl: ",fullUrl)
    const response = await fetch(fullUrl, {
      method: options?.method || "GET",
      headers: {
        ...options?.headers,
      },
      cache: "force-cache",
      ...options,
    });
    // console.log("response: ",response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const parsedData = await parsePrestashopXML(text);

    return {
      success: true,
      data: parsedData,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

export async function getOrder(idOrder, options = {}) {
  try {
    const response = await fetchPrestashop(`orders/${idOrder}`, options);

    if (!response.success || !response.data?.order) {
      return {
        success: false,
        error: "Commande non trouvée",
        data: null,
      };
    }

    const order = response.data.order;

    const idAddressDelivery =
      order.id_address_delivery?.["#cdata"] || order.id_address_delivery;
    const idAddressInvoice =
      order.id_address_invoice?.["#cdata"] || order.id_address_invoice;
    const idCart = order.id_cart?.["#cdata"] || order.id_cart;
    const idCustomer = order.id_customer?.["#cdata"] || order.id_customer;

    const totalPaid = parseFloat(
      order.total_paid_tax_incl?.["#cdata"] || order.total_paid_tax_incl || 0,
    );
    const totalProducts = parseFloat(
      order.total_products?.["#cdata"] || order.total_products || 0,
    );

    const orderRows = [];
    let orderRowsData = order.associations?.order_rows?.order_row;

    if (orderRowsData) {
      if (!Array.isArray(orderRowsData)) {
        orderRowsData = [orderRowsData];
      }

      for (const row of orderRowsData) {
        orderRows.push({
          product_id: row.product_id?.["#cdata"] || row.product_id,
          product_attribute_id:
            row.product_attribute_id?.["#cdata"] ||
            row.product_attribute_id ||
            "0",
          product_quantity:
            row.product_quantity?.["#cdata"] || row.product_quantity,
        });
      }
    }

    const formattedOrder = {
      id_address_delivery: idAddressDelivery,
      id_address_invoice: idAddressInvoice,
      id_cart: idCart,
      id_currency: order.id_currency?.["#cdata"] || order.id_currency || "1",
      id_lang: order.id_lang?.["#cdata"] || order.id_lang || "1",
      id_customer: idCustomer,
      id_carrier: order.id_carrier?.["#cdata"] || order.id_carrier || "1",
      module: order.module?.["#cdata"] || order.module || "ps_cashondelivery",
      valid: order.valid?.["#cdata"] || order.valid || "1",
      id_shop_group:
        order.id_shop_group?.["#cdata"] || order.id_shop_group || "1",
      id_shop: order.id_shop?.["#cdata"] || order.id_shop || "1",
      payment:
        order.payment?.["#cdata"] ||
        order.payment ||
        "Paiement comptant à la livraison (Cash on delivery)",
      recyclable: order.recyclable?.["#cdata"] || order.recyclable || "0",
      gift: order.gift?.["#cdata"] || order.gift || "0",
      gift_message: "",
      mobile_theme: order.mobile_theme?.["#cdata"] || order.mobile_theme || "0",
      total_paid: totalPaid.toFixed(8),
      total_paid_real: "0",
      total_products: totalProducts.toFixed(8),
      total_products_wt: "0",
      round_mode: order.round_mode?.["#cdata"] || order.round_mode || "2",
      round_type: order.round_type?.["#cdata"] || order.round_type || "2",
      conversion_rate:
        order.conversion_rate?.["#cdata"] || order.conversion_rate || "1",
      associations: {
        order_rows: { order_row: orderRows },
      },
    };

    return {
      success: true,
      data: formattedOrder,
      originalData: order,
    };
  } catch (error) {
    console.error(`Erreur getOrder ${idOrder}:`, error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

export async function getProductStockByAttribute(productId, attributeId) {
  try {
    let filter = `&filter[id_product]=${productId}`;
    if (attributeId && attributeId !== "0" && attributeId !== 0) {
      filter += `&filter[id_product_attribute]=${attributeId}`;
    } else {
      filter += `&filter[id_product_attribute]=0`;
    }
    const response = await fetchPrestashop(`stock_availables`, {
      urlRest: filter,
    });
    if (response.success && response.data?.stock_availables?.stock_available) {
      const stocksData = response.data.stock_availables.stock_available;
      const stockArray = Array.isArray(stocksData) ? stocksData : [stocksData];
      const firstStock = stockArray[0];
      const stockId =
        firstStock["@_id"] || firstStock.id?.["#cdata"] || firstStock.id;
      if (stockId) {
        const detailResponse = await fetchPrestashop(
          `stock_availables/${stockId}`,
        );
        if (detailResponse.data?.stock_available?.quantity) {
          const quantity =
            detailResponse.data.stock_available.quantity["#cdata"] ||
            detailResponse.data.stock_available.quantity;
          return parseInt(quantity || 0);
        }
      }
    }
    return 0;
  } catch (error) {
    console.error("Error fetching product stock by attribute:", error);
    return 0;
  }
}

export async function getStockByStockAvailableId(stockAvailableId) {
  try {
    const response = await fetchPrestashop(
      `stock_availables/${stockAvailableId}`,
    );

    if (response.data?.stock_available?.quantity) {
      return parseInt(response.data.stock_available.quantity["#cdata"] || 0);
    }

    return 0;
  } catch (error) {
    console.error("Error fetching stock by ID:", error);
    return 0;
  }
}

export async function getOptionAndValueNames(combinationId) {
  try {
    const comboResponse = await fetchPrestashop(
      `combinations/${combinationId}`,
    );
    const comboData = comboResponse.data?.combination;
    if (!comboData) {
      console.error("Combinaison non trouvée");
      return null;
    }
    const productOptionValues =
      comboData.associations?.product_option_values?.product_option_value;
    if (!productOptionValues) {
      console.log("Aucune option value pour cette combinaison");
      return [];
    }
    const optionValuesArray = Array.isArray(productOptionValues)
      ? productOptionValues
      : [productOptionValues];
    const results = await Promise.all(
      optionValuesArray.map(async (optionValue) => {
        const optionValueId = optionValue.id?.["#cdata"];
        if (!optionValueId) return null;
        const optionValueResponse = await fetchPrestashop(
          `product_option_values/${optionValueId}`,
        );
        const optionValueData = optionValueResponse.data?.product_option_value;
        if (!optionValueData) return null;
        const groupId = optionValueData.id_attribute_group?.["#cdata"];
        if (!groupId) return null;
        const groupResponse = await fetchPrestashop(
          `product_options/${groupId}`,
        );
        const groupData = groupResponse.data?.product_option;
        return {
          combinationId: combinationId,
          optionValueId: optionValueId,
          optionName:
            optionValueData.name?.language?.["#cdata"] || "Nom inconnu",
          groupId: groupId,
          groupName: groupData?.name?.language?.["#cdata"] || "Groupe inconnu",
        };
      }),
    );
    const validResults = results.filter((result) => result !== null);
    return validResults;
  } catch (error) {
    console.error("Erreur lors de la récupération des noms:", error);
    return null;
  }
}

export async function getCart(idCart, options = {}) {
  try {
    const response = await fetchPrestashop(`carts/${idCart}`, options);
    if (!response.success || !response.data?.cart) {
      return {
        success: false,
        error: "Panier non trouvé",
        data: null,
      };
    }
    const cart = response.data.cart;
    const idAddressDelivery =
      cart.id_address_delivery?.["#cdata"] || cart.id_address_delivery;
    const idAddressInvoice =
      cart.id_address_invoice?.["#cdata"] || cart.id_address_invoice;
    const idCurrency = cart.id_currency?.["#cdata"] || cart.id_currency || "1";
    const idCustomer = cart.id_customer?.["#cdata"] || cart.id_customer;
    const idLang = cart.id_lang?.["#cdata"] || cart.id_lang || "1";
    const idShopGroup =
      cart.id_shop_group?.["#cdata"] || cart.id_shop_group || "1";
    const idShop = cart.id_shop?.["#cdata"] || cart.id_shop || "1";
    const idCarrier = cart.id_carrier?.["#cdata"] || cart.id_carrier || "1";
    const recyclable = cart.recyclable?.["#cdata"] || cart.recyclable || "0";
    const gift = cart.gift?.["#cdata"] || cart.gift || "0";
    const giftMessage = "";
    const mobileTheme =
      cart.mobile_theme?.["#cdata"] || cart.mobile_theme || "0";
    const deliveryOption =
      cart.delivery_option?.["#cdata"] || cart.delivery_option || '{"8":"1,"}';
    const allowSeperatedPackage =
      cart.allow_seperated_package?.["#cdata"] ||
      cart.allow_seperated_package ||
      "0";
    const cartRows = [];
    let cartRowsData = cart.associations?.cart_rows?.cart_row;
    if (cartRowsData) {
      if (!Array.isArray(cartRowsData)) {
        cartRowsData = [cartRowsData];
      }
      for (const row of cartRowsData) {
        cartRows.push({
          id_product: (row.id_product?.["#cdata"] || row.id_product).toString(),
          id_product_attribute:
            row.id_product_attribute?.["#cdata"] ||
            row.id_product_attribute ||
            "0",
          id_address_delivery:
            row.id_address_delivery?.["#cdata"] ||
            row.id_address_delivery ||
            idAddressDelivery,
          id_customization: "0",
          quantity: (
            row.quantity?.["#cdata"] ||
            row.quantity ||
            "1"
          ).toString(),
        });
      }
    }
    const formattedCart = {
      id_address_delivery: idAddressDelivery,
      id_address_invoice: idAddressInvoice,
      id_currency: idCurrency,
      id_customer: idCustomer,
      id_guest: "0",
      id_lang: idLang,
      id_shop_group: idShopGroup,
      id_shop: idShop,
      id_carrier: idCarrier,
      recyclable: recyclable,
      gift: gift,
      gift_message: giftMessage,
      mobile_theme: mobileTheme,
      delivery_option: deliveryOption,
      allow_seperated_package: allowSeperatedPackage,
      associations: {
        cart_rows: { cart_row: cartRows },
      },
    };
    return {
      success: true,
      data: formattedCart,
      originalData: cart,
      cartId: idCart,
    };
  } catch (error) {
    console.error(`Erreur getCart ${idCart}:`, error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

export async function getProduct(idProduct, options = {}) {
  try {
    const response = await fetchPrestashop(`products/${idProduct}`, options);

    if (!response.success || !response.data?.product) {
      return {
        success: false,
        error: "Produit non trouvé",
        data: null,
      };
    }

    const product = response.data.product;

    const id = product.id?.["#cdata"] || product.id;
    const reference = product.reference?.["#cdata"] || product.reference || "";
    const name =
      product.name?.language?.["#cdata"] ||
      product.name?.language ||
      product.name ||
      "";
    const description =
      product.description?.language?.["#cdata"] ||
      product.description?.language ||
      product.description ||
      "";
    const metaDescription =
      product.meta_description?.language?.["#cdata"] ||
      product.meta_description?.language ||
      "";
    const metaKeywords = "";
    const metaTitle = "";
    const linkRewrite =
      product.link_rewrite?.language?.["#cdata"] ||
      product.link_rewrite?.language ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const price = parseFloat(product.price?.["#cdata"] || product.price || 0);
    const wholesalePrice = parseFloat(
      product.wholesale_price?.["#cdata"] || product.wholesale_price || 0,
    );
    const active = product.active?.["#cdata"] || product.active || "1";
    const idManufacturer =
      product.id_manufacturer?.["#cdata"] || product.id_manufacturer || "1";
    const idSupplier =
      product.id_supplier?.["#cdata"] || product.id_supplier || "1";
    const idCategoryDefault =
      product.id_category_default?.["#cdata"] || product.id_category_default;
    const isNew = product.new?.["#cdata"] || product.new || "1";
    const cacheDefaultAttribute =
      product.cache_default_attribute?.["#cdata"] ||
      product.cache_default_attribute ||
      "0";
    const idDefaultCombination =
      product.id_default_combination?.["#cdata"] ||
      product.id_default_combination ||
      "0";
    const type = product.type?.["#cdata"] || product.type || "1";
    const idShopDefault =
      product.id_shop_default?.["#cdata"] || product.id_shop_default || "1";
    const availableDate =
      product.available_date?.["#cdata"] || product.available_date || null;
    const productType =
      product.product_type?.["#cdata"] || product.product_type || "standard";
    const state = product.state?.["#cdata"] || product.state || "1";
    const idTaxRulesGroup =
      product.id_tax_rules_group?.["#cdata"] || product.id_tax_rules_group;
    const availableForOrder =
      product.available_for_order?.["#cdata"] ||
      product.available_for_order ||
      "1";
    const showPrice =
      product.show_price?.["#cdata"] || product.show_price || "1";

    let categories = [];
    const categoriesData = product.associations?.categories?.category;

    if (categoriesData) {
      const categoriesArray = Array.isArray(categoriesData)
        ? categoriesData
        : [categoriesData];
      categories = categoriesArray.map((cat) => ({
        id: cat.id?.["#cdata"] || cat.id,
      }));
    }

    const formattedProduct = {
      reference: reference,
      name: name,
      description: description || name,
      meta_description: metaDescription || name,
      meta_keywords: metaKeywords || "",
      meta_title: metaTitle || "",
      link_rewrite: linkRewrite,
      price: price.toFixed(8),
      wholesale_price: wholesalePrice.toFixed(8),
      active: parseInt(active),
      id_manufacturer: parseInt(idManufacturer),
      id_supplier: parseInt(idSupplier),
      id_category_default: idCategoryDefault
        ? parseInt(idCategoryDefault)
        : undefined,
      new: parseInt(isNew),
      cache_default_attribute: parseInt(cacheDefaultAttribute),
      id_default_combination: parseInt(idDefaultCombination),
      type: parseInt(type),
      id_shop_default: parseInt(idShopDefault),
      available_date: availableDate,
      product_type: productType,
      state: parseInt(state),
      id_tax_rules_group: idTaxRulesGroup
        ? parseInt(idTaxRulesGroup)
        : undefined,
      available_for_order: parseInt(availableForOrder),
      show_price: parseInt(showPrice),
      associations:
        categories.length > 0
          ? {
              categories: {
                category: categories,
              },
            }
          : undefined,
    };

    return {
      success: true,
      data: formattedProduct,
      originalData: product,
      productId: id,
      combinations: product.associations?.combinations?.combination || [],
      stockAvailables:
        product.associations?.stock_availables?.stock_available || [],
    };
  } catch (error) {
    console.error(`Erreur getProduct ${idProduct}:`, error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

export async function getAllEntitiesId(entity, options = {}) {
  try {
    let entityName = entity;
    const response = await fetchPrestashop(entityName, {
      ...options,
      urlRest: "display=[id]",
    });
    let singularEntity = entityName.endsWith("ies")
      ? entityName.slice(0, -3) + "y"
      : entityName.endsWith("s")
        ? entityName.slice(0, -1)
        : entityName;
    if (entity == "taxes") {
      singularEntity = "tax";
    }
    // console.log("response:", response);
    const dataPath = response.data?.[entity]?.[singularEntity];
    if (!response.success || !dataPath) {
      console.error(`Erreur lors de la récupération des ${entity}`);
      return [];
    }
    const items = dataPath;
    const itemsArray = Array.isArray(items) ? items : [items];

    const itemIds = itemsArray
      .map((item) => {
        return item["@_id"] || item.id?.["#cdata"] || item.id;
      })
      .filter((id) => id !== null && id !== undefined);

    return itemIds;
  } catch (error) {
    console.error(`Erreur getAllEntitiesId pour ${entity}:`, error);
    return [];
  }
}

export async function getAllCategoriesId() {
  return getAllEntitiesId("categories");
}

export async function getCategory(idCategory) {
  try {
    const response = await fetchPrestashop(`categories/${idCategory}`);
    if (!response.success || !response.data?.category) {
      return {
        success: false,
        error: `Catégorie ${idCategory} non trouvée`,
        data: null,
      };
    }
    const category = response.data.category;
    let categoryName = "";
    if (category.name) {
      if (category.name.language) {
        categoryName = Array.isArray(category.name.language)
          ? category.name.language[0]?.["#cdata"] || category.name.language[0]
          : category.name.language["#cdata"] || category.name.language;
      } else {
        categoryName = category.name["#cdata"] || category.name;
      }
    }

    let idParent = category.id_parent?.["#cdata"] || category.id_parent || 2;
    let isRootCategory =
      category.is_root_category?.["#cdata"] || category.is_root_category || 0;
    let idShopDefault =
      category.id_shop_default?.["#cdata"] || category.id_shop_default || 1;
    let active = category.active?.["#cdata"] || category.active || 1;
    const isRoot = parseInt(isRootCategory) === 1;
    const finalIdParent = isRoot ? 0 : parseInt(idParent);
    const categoryData = {
      id_parent: finalIdParent,
      id_shop_default: parseInt(idShopDefault),
      is_root_category: isRoot ? 1 : 0,
      name: categoryName || `Catégorie ${idCategory}`,
      description: categoryName || `Catégorie ${idCategory}`,
      link_rewrite: (categoryName || `categorie-${idCategory}`)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      active: parseInt(active),
    };
    return {
      success: true,
      data: categoryData,
      originalData: category,
      categoryId: idCategory,
    };
  } catch (error) {
    console.error(`Erreur getCategory ${idCategory}:`, error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

export async function getTaxe(idTaxe) {
  try {
    const response = await fetchPrestashop(`taxes/${idTaxe}`);
    if (!response.success || !response.data?.tax) {
      return {
        success: false,
        error: `Taxe ${idTaxe} non trouvée`,
        data: null,
      };
    }
    const tax = response.data.tax;
    let rate = tax.rate?.["#cdata"] || tax.rate || "0";
    rate = parseFloat(rate);
    let name = "";
    if (tax.name) {
      if (tax.name.language) {
        name = tax.name.language["#cdata"] || tax.name.language;
      } else {
        name = tax.name["#cdata"] || tax.name;
      }
    }
    const active = tax.active?.["#cdata"] || tax.active || "1";
    const deleted = tax.deleted?.["#cdata"] || tax.deleted || "0";
    const taxData = {
      rate: rate,
      active: active,
      deleted: deleted,
      name: name || `TVA ${rate}%`,
      id: tax.id?.["#cdata"] || tax.id,
    };
    return {
      success: true,
      data: taxData,
      originalData: tax,
    };
  } catch (error) {
    console.error(`Erreur getTaxe ${idTaxe}:`, error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}
export async function getTaxeRuleGroup(idTaxRulesGroup) {
  try {
    const response = await fetchPrestashop(
      `tax_rule_groups/${idTaxRulesGroup}`,
    );

    if (!response.success || !response.data?.tax_rule_group) {
      return {
        success: false,
        error: `Groupe de règles de taxe ${idTaxRulesGroup} non trouvé`,
        data: null,
      };
    }
    const taxRuleGroup = response.data.tax_rule_group;
    let groupName = taxRuleGroup.name?.["#cdata"] || taxRuleGroup.name || "";
    const active =
      taxRuleGroup.active?.["#cdata"] || taxRuleGroup.active || "1";
    const deleted =
      taxRuleGroup.deleted?.["#cdata"] || taxRuleGroup.deleted || "0";
    const taxRuleGroupData = {
      name: groupName,
      active: active,
      deleted: deleted,
      id: taxRuleGroup.id?.["#cdata"] || taxRuleGroup.id,
    };
    return {
      success: true,
      data: taxRuleGroupData,
      originalData: taxRuleGroup,
    };
  } catch (error) {
    console.error(`Erreur getTaxeRuleGroup ${idTaxRulesGroup}:`, error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

export async function getTaxeRule(idTaxeRule) {
  try {
    const response = await fetchPrestashop(`tax_rules/${idTaxeRule}`);
    if (!response.success || !response.data?.tax_rule) {
      return {
        success: false,
        error: `Règle de taxe ${idTaxeRule} non trouvée`,
        data: null,
      };
    }
    const taxRule = response.data.tax_rule;
    const idTaxRulesGroup =
      taxRule.id_tax_rules_group?.["#cdata"] || taxRule.id_tax_rules_group;
    const idState = taxRule.id_state?.["#cdata"] || taxRule.id_state || "0";
    const idCountry =
      taxRule.id_country?.["#cdata"] || taxRule.id_country || "8";
    const zipcodeFrom =
      taxRule.zipcode_from?.["#cdata"] || taxRule.zipcode_from || "0";
    const zipcodeTo =
      taxRule.zipcode_to?.["#cdata"] || taxRule.zipcode_to || "0";
    const idTax = taxRule.id_tax?.["#cdata"] || taxRule.id_tax;
    const behavior = taxRule.behavior?.["#cdata"] || taxRule.behavior || "0";
    const description =
      taxRule.description?.["#cdata"] || taxRule.description || "";
    const taxRuleData = {
      id_tax_rules_group: parseInt(idTaxRulesGroup),
      id_state: parseInt(idState),
      id_country: parseInt(idCountry),
      zipcode_from: parseInt(zipcodeFrom),
      zipcode_to: parseInt(zipcodeTo),
      id_tax: parseInt(idTax),
      behavior: parseInt(behavior),
      description: description,
      id: taxRule.id?.["#cdata"] || taxRule.id,
    };
    return {
      success: true,
      data: taxRuleData,
      originalData: taxRule,
    };
  } catch (error) {
    console.error(`Erreur getTaxeRule ${idTaxeRule}:`, error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

export async function getTaxeValue(idProduct) {
  try {
    const productResponse = await getProduct(idProduct);
    if (!productResponse.success || !productResponse.data) {
      return {
        success: false,
        error: `Produit ${idProduct} non trouvé`,
        data: null,
      };
    }
    const product = productResponse.data;
    const idTaxRulesGroup = product.id_tax_rules_group;
    if (!idTaxRulesGroup) {
      return {
        success: false,
        error: `Le produit ${idProduct} n'a pas de groupe de règles de taxe associé`,
        data: null,
      };
    }
    const taxRuleGroupResponse = await getTaxeRuleGroup(idTaxRulesGroup);
    if (!taxRuleGroupResponse.success || !taxRuleGroupResponse.data) {
      return {
        success: false,
        error: `Groupe de règles de taxe ${idTaxRulesGroup} non trouvé`,
        data: null,
      };
    }
    const filter = `&filter[id_tax_rules_group]=${idTaxRulesGroup}`;
    const taxRulesResponse = await fetchPrestashop(`tax_rules`, {
      urlRest: filter,
    });

    if (
      !taxRulesResponse.success ||
      !taxRulesResponse.data?.tax_rules?.tax_rule
    ) {
      return {
        success: false,
        error: `Aucune règle de taxe trouvée pour le groupe ${idTaxRulesGroup}`,
        data: null,
      };
    }
    let taxRulesList = taxRulesResponse.data.tax_rules.tax_rule;
    if (!Array.isArray(taxRulesList)) {
      taxRulesList = [taxRulesList];
    }
    if (taxRulesList.length === 0) {
      return {
        success: false,
        error: `Aucune règle de taxe valide trouvée`,
        data: null,
      };
    }
    const firstTaxRule = taxRulesList[0];
    // console.log("firstTaxRule:", firstTaxRule)
    const idTaxeRule = firstTaxRule?.["@_id"];
    const taxeRule = await getTaxeRule(idTaxeRule);
    // console.log("taxeRule:", taxeRule)
    const idTax = taxeRule?.data?.id_tax;
    if (!idTax) {
      return {
        success: false,
        error: `ID de taxe non trouvé dans la règle`,
        data: null,
      };
    }
    const taxResponse = await getTaxe(idTax);
    if (!taxResponse.success || !taxResponse.data) {
      return {
        success: false,
        error: `Taxe ${idTax} non trouvée`,
        data: null,
      };
    }
    const taxData = taxResponse.data;
    const result = {
      product_id: idProduct,
      tax_rule_group_id: idTaxRulesGroup,
      tax_rule_group_name: taxRuleGroupResponse.data.name,
      tax_id: taxData.id,
      tax_rate: taxData.rate,
      tax_name: taxData.name,
      tax_active: taxData.active === "1" || taxData.active === 1,
      tax_rule: taxRulesList[0],
    };
    return {
      success: true,
      data: result,
      originalData: {
        product: productResponse.originalData,
        taxRuleGroup: taxRuleGroupResponse.originalData,
        taxRule: firstTaxRule,
        tax: taxResponse.originalData,
      },
    };
  } catch (error) {
    console.error(`Erreur getTaxeValue ${idProduct}:`, error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

export function useFetchPrestashop(url, options = {}) {
  const apiKey = "2LA1668U53GC9T35AIT5Y3P7E8CKG7LL";
  const baseUrl = "http://localhost/prestashop2/api";

  let urll = `${baseUrl}/${url}?ws_key=${apiKey}`;
  if (options?.urlRest) {
    urll = `${baseUrl}/${url}?ws_key=${apiKey}&${options.urlRest}`;
  }
  const { loading, data, errors } = useFetch(urll, options);
  const [parsedData, setParsedData] = useState(null);

  useEffect(() => {
    if (data) {
      parsePrestashopXML(data)
        .then((result) => {
          setParsedData(result);
        })
        .catch((err) => console.error("Erreur parsing:", err));
    }
  }, [data]);
  return { loading, data: parsedData, errors };
}
const nestedUrlsCache = new Map();

export const fetchNestedUrls = async (obj, depth = 2, currentDepth = 0) => {
  if (!obj || typeof obj !== "object") return obj;
  if (currentDepth >= depth) return obj;

  const cacheKey = JSON.stringify(obj) + depth + currentDepth;
  if (nestedUrlsCache.has(cacheKey)) {
    return nestedUrlsCache.get(cacheKey);
  }

  if (Array.isArray(obj)) {
    const result = await Promise.all(
      obj.map((item) => fetchNestedUrls(item, depth, currentDepth + 1)),
    );
    nestedUrlsCache.set(cacheKey, result);
    return result;
  }

  const newObj = { ...obj };

  for (const key in newObj) {
    const value = newObj[key];

    if (value && typeof value === "object" && value["@_href"]) {
      const href = value["@_href"];
      const problematicTypes = [
        "images",
        "customizations",
        "combinations",
        "languages",
        "associations",
        "tags",
        "attachments",
      ];
      const shouldSkip = problematicTypes.some((type) =>
        href.includes(`/${type}/`),
      );

      if (href && !href.endsWith("/0") && !shouldSkip) {
        try {
          const itemUrl = value["@_href"].replace(
            "http://localhost/prestashop2/api/",
            "",
          );

          const urlCacheKey = `url_${itemUrl}`;
          if (nestedUrlsCache.has(urlCacheKey)) {
            newObj[key] = {
              ...value,
              "@_fetched": nestedUrlsCache.get(urlCacheKey),
            };
            continue;
          }

          const apiKey = "2LA1668U53GC9T35AIT5Y3P7E8CKG7LL";
          const baseUrl = "http://localhost/prestashop2/api";
          const fullUrl = `${baseUrl}/${itemUrl}?ws_key=${apiKey}`;

          const response = await fetch(fullUrl, {
            cache: "force-cache",
          });
          const xmlText = await response.text();
          const parsedData = await parsePrestashopXML(xmlText);

          const fetchedData = await fetchNestedUrls(
            parsedData,
            depth,
            currentDepth + 1,
          );

          nestedUrlsCache.set(urlCacheKey, fetchedData);

          newObj[key] = {
            ...value,
            "@_fetched": fetchedData,
          };
        } catch (error) {
          console.error(`Erreur fetch pour ${key}:`, error);
          newObj[key] = {
            ...value,
            "@_error": error.message,
          };
        }
      }
    } else if (value && typeof value === "object") {
      newObj[key] = await fetchNestedUrls(value, depth, currentDepth + 1);
    }
  }

  nestedUrlsCache.set(cacheKey, newObj);
  return newObj;
};

export function useFetchAllResources(url, resourceType, options = {}) {
  const { loading, data, errors } = useFetchPrestashop(url, options);
  const [resourcesData, setResourcesData] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const BATCH_SIZE = options.batchSize || 100;

  useEffect(() => {
    const fetchAllResources = async () => {
      const resourceKey = `${resourceType}s`;
      let itemKey = resourceType;
      resourceType === "categorie" ? (itemKey = "category") : itemKey;

      if (data && data[resourceKey] && data[resourceKey][itemKey]) {
        setLoadingResources(true);

        try {
          const items = data[resourceKey][itemKey];
          const results = [];

          for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (item) => {
              const itemUrl = item["@_href"].replace(
                "http://localhost/prestashop2/api/",
                "",
              );

              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);

              try {
                const apiKey = "2LA1668U53GC9T35AIT5Y3P7E8CKG7LL";
                const baseUrl = "http://localhost/prestashop2/api";
                let fullUrl = `${baseUrl}/${itemUrl}?ws_key=${apiKey}`;
                if (options?.urlRest) {
                  fullUrl += `&${options.urlRest}`;
                }

                const response = await fetch(fullUrl, {
                  cache: "force-cache",
                  signal: controller.signal,
                });
                clearTimeout(timeoutId);

                const xmlText = await response.text();
                let parsedData = await parsePrestashopXML(xmlText);
                // parsedData = await fetchNestedUrls(parsedData, 2); // Réduire depth de 3 à 2

                return parsedData;
              } catch (error) {
                clearTimeout(timeoutId);
                console.error(`Erreur chargement ${itemUrl}:`, error);
                return null;
              }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults.filter((r) => r !== null));

            setResourcesData([...results]);

            if (i + BATCH_SIZE < items.length) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }

          setResourcesData(results);
        } catch (error) {
          console.error(`Erreur chargement ${resourceType}s:`, error);
        } finally {
          setLoadingResources(false);
        }
      }
    };

    fetchAllResources();
  }, [data, resourceType, BATCH_SIZE]);

  return {
    loading: loading || loadingResources,
    data: resourcesData,
    errors,
    resourceList: data,
  };
}

export function useFetchAllProduits(url, options = {}) {
  return useFetchAllResources(url, "product", options);
}

export function useFetchAllCarriers(url) {
  return useFetchAllResources(url, "carrier");
}

export function useFetchAllOrders(url) {
  return useFetchAllResources(url, "order");
}

export function useFetchAllCategories(url) {
  return useFetchAllResources(url, "categorie");
}

export function useFetchAllCustomers(url) {
  return useFetchAllResources(url, "customer");
}

export function useCountPrestashopEntity(entityName, filters = "") {
  const queryParams = `display=[id]${filters ? `&${filters}` : ""}`;
  const url = `${entityName}`;

  const { loading, data, errors } = useFetchPrestashop(url, {
    urlRest: queryParams,
  });

  const [count, setCount] = useState(0);

  useEffect(() => {
    if (data && data[entityName]) {
      const items = data[entityName][entityName.slice(0, -1)];

      if (Array.isArray(items)) {
        setCount(items.length);
      } else if (items) {
        setCount(1);
      } else {
        setCount(0);
      }
    }
  }, [data, entityName]);

  return { loading, count, errors };
}

export function useLatestOrders(limit = 3) {
  const url = "orders";
  const urlRest = `display=full&sort=[id_DESC]&limit=${limit}`;

  const { loading, data, errors } = useFetchPrestashop(url, { urlRest });
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrdersWithNested = async () => {
      // console.log("data", data);

      if (data && data.orders && data.orders.order) {
        let ordersList = Array.isArray(data.orders.order)
          ? data.orders.order
          : [data.orders.order];
        const processedOrders = await Promise.all(
          ordersList.map(async (order) => {
            return await fetchNestedUrls(order, 2);
          }),
        );

        setOrders(processedOrders);
      }
    };

    fetchOrdersWithNested();
  }, [data]);

  return { loading, orders, errors };
}

export function useCategoryName(categoryId) {
  const { loading, data, errors } = useFetchPrestashop(
    `categories/${categoryId}`,
  );
  const [categoryName, setCategoryName] = useState(null);

  useEffect(() => {
    if (data && data.category && data.category.name) {
      if (data.category.name.language) {
        const name = Array.isArray(data.category.name.language)
          ? data.category.name.language[0]
          : data.category.name.language;
        setCategoryName(name);
      } else {
        setCategoryName(data.category.name);
      }
    }
  }, [data]);

  return { loading, categoryName, errors };
}

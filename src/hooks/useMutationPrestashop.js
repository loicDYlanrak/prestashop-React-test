import { useState } from "react";
import { convertToPrestashopXML } from "../utils/BuilderXml";
import { parsePrestashopXML } from "../utils/ParserXml";

const DEFAULT_CONFIG = {
  apiKey: "2LA1668U53GC9T35AIT5Y3P7E8CKG7LL",
  baseUrl: "http://localhost/prestashop2/api",
};

const RESOURCE_ENDPOINTS = {
  category: "categories",
  product: "products",
  customer: "customers",
  manufacturer: "manufacturers",
  supplier: "suppliers",
  tax: "taxes",
  taxRuleGroup: "tax_rule_groups",
  taxRule: "tax_rules",
  productOption: "product_options",
  productOptionValue: "product_option_values",
  combination: "combinations",
  address: "addresses",
  cart: "carts",
  order: "orders",
  image: "images/products",
  stockAvailable: "stock_availables",
  stockMovement: "stock_movements",
};

const MULTILANG_FIELDS = {
  category: [
    "name",
    "link_rewrite",
    "description",
    "meta_title",
    "meta_description",
    "meta_keywords",
  ],
  product: [
    "name",
    "link_rewrite",
    "description",
    "description_short",
    "meta_title",
    "meta_description",
    "meta_keywords",
  ],
  customer: [],
  manufacturer: ["name"],
  supplier: ["name"],
  tax: ["name"],
  taxRuleGroup: [],
  taxRule: [],
  productOption: ["name", "public_name"],
  productOptionValue: ["name"],
  combination: [],
  address: [],
  cart: [],
  order: [],
  stockAvailable: [],
};

/**
 * Hook générique pour ajouter n'importe quelle ressource PrestaShop
 * @param {string} resourceType - Type de ressource
 * @param {Object} customConfig - Configuration personnalisée (optionnelle)
 * @returns {Object} - { addResource, loading, error, data }
 */
export function useAddResource(resourceType, customConfig = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const config = { ...DEFAULT_CONFIG, ...customConfig };
  const endpoint = RESOURCE_ENDPOINTS[resourceType];
  const multilangFields = MULTILANG_FIELDS[resourceType] || [];

  if (!endpoint) {
    throw new Error(
      `Resource type "${resourceType}" not supported. Supported types: ${Object.keys(RESOURCE_ENDPOINTS).join(", ")}`,
    );
  }

  const addResource = async (resourceData, languageId = 1) => {
    setLoading(true);
    setError(null);

    try {
      const url = `${config.baseUrl}/${endpoint}?ws_key=${config.apiKey}`;

      const prestashopData = {
        prestashop: {
          [resourceType]: resourceData,
        },
      };

      const xml = convertToPrestashopXML(
        prestashopData,
        "prestashop",
        true,
        languageId,
        multilangFields,
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
          Accept: "application/xml",
        },
        body: xml,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`HTTP ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      const parsedResponse = await parsePrestashopXML(responseText);

      setData(parsedResponse);
      return parsedResponse;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    addResource,
    loading,
    error,
    data,
  };
}

/**
 * Hook pour mettre à jour une ressource PrestaShop (PATCH)
 * @param {string} resourceType - Type de ressource
 * @param {Object} customConfig - Configuration personnalisée
 * @returns {Object} - { updateResource, loading, error, data }
 */
export function useUpdateResource(resourceType, customConfig = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const config = { ...DEFAULT_CONFIG, ...customConfig };
  const endpoint = RESOURCE_ENDPOINTS[resourceType];
  const multilangFields = MULTILANG_FIELDS[resourceType] || [];

  const updateResource = async (resourceId, resourceData, languageId = 1) => {
    setLoading(true);
    setError(null);

    try {
      const url = `${config.baseUrl}/${endpoint}/${resourceId}?ws_key=${config.apiKey}`;

      const prestashopData = {
        prestashop: {
          [resourceType]: { ...resourceData, id: resourceId },
        },
      };

      const xml = convertToPrestashopXML(
        prestashopData,
        "prestashop",
        true,
        languageId,
        multilangFields,
      );

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/xml",
          Accept: "application/xml",
        },
        body: xml,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      const parsedResponse = await parsePrestashopXML(responseText);

      setData(parsedResponse);
      return parsedResponse;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateResource, loading, error, data };
}

/**
 * Hook pour uploader des images produit
 * @param {Object} customConfig - Configuration personnalisée
 * @returns {Object} - { uploadImage, loading, error, data }
 */
export function useUploadProductImage(customConfig = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const config = { ...DEFAULT_CONFIG, ...customConfig };

  const uploadImage = async (productId, imageFile) => {
    setLoading(true);
    setError(null);

    try {
      const url = `${config.baseUrl}/images/products/${productId}?ws_key=${config.apiKey}`;

      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      const parsedResponse = await parsePrestashopXML(responseText);

      setData(parsedResponse);
      return parsedResponse;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { uploadImage, loading, error, data };
}

// Taxes
export function useAddTax() {
  const { addResource, loading, error, data } = useAddResource("tax");
  return { addTax: addResource, loading, error, data };
}

// Tax Rule Groups
export function useAddTaxRuleGroup() {
  const { addResource, loading, error, data } = useAddResource("taxRuleGroup");
  return { addTaxRuleGroup: addResource, loading, error, data };
}

// Tax Rules
export function useAddTaxRule() {
  const { addResource, loading, error, data } = useAddResource("taxRule");
  return { addTaxRule: addResource, loading, error, data };
}

// Product Options
export function useAddProductOption() {
  const { addResource, loading, error, data } = useAddResource("productOption");
  return { addProductOption: addResource, loading, error, data };
}

// Product Option Values
export function useAddProductOptionValue() {
  const { addResource, loading, error, data } =
    useAddResource("productOptionValue");
  return { addProductOptionValue: addResource, loading, error, data };
}

// Combinations
export function useAddCombination() {
  const { addResource, loading, error, data } = useAddResource("combination");
  return { addCombination: addResource, loading, error, data };
}

// Product PATCH
export function useUpdateProduct() {
  const { updateResource, loading, error, data } = useUpdateResource("product");
  return { updateProduct: updateResource, loading, error, data };
}

// Stock Available PATCH
export function useUpdateStockAvailable() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const config = DEFAULT_CONFIG;

  const updateStockAvailable = async (
    idStockAvailable,
    quantity,
    outOfStock = 1,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const url = `${config.baseUrl}/stock_availables/${idStockAvailable}?ws_key=${config.apiKey}`;

      const stockData = {
        prestashop: {
          stock_available: {
            id: idStockAvailable,
            quantity: quantity,
            out_of_stock: outOfStock,
          },
        },
      };

      const xml = convertToPrestashopXML(stockData, "prestashop", true, 1, []);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/xml",
          Accept: "application/xml",
        },
        body: xml,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      const parsedResponse = await parsePrestashopXML(responseText);

      setData(parsedResponse);
      return parsedResponse;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateStockAvailable, loading, error, data };
}

// Images produit
export function useAddProductImage() {
  const { uploadImage, loading, error, data } = useUploadProductImage();
  return { addProductImage: uploadImage, loading, error, data };
}

// Customers (déjà existant, réexporté)
export function useAddCustomer() {
  const { addResource, loading, error, data } = useAddResource("customer");
  return { addCustomer: addResource, loading, error, data };
}

// Addresses
export function useAddAddress() {
  const { addResource, loading, error, data } = useAddResource("address");
  return { addAddress: addResource, loading, error, data };
}

// Carts
export function useAddCart() {
  const { addResource, loading, error, data } = useAddResource("cart");
  return { addCart: addResource, loading, error, data };
}

// Orders
export function useAddOrder() {
  const { addResource, loading, error, data } = useAddResource("order");
  return { addOrder: addResource, loading, error, data };
}

export function useAddCategory() {
  const { addResource, loading, error, data } = useAddResource("category");
  return { addCategory: addResource, loading, error, data };
}

export function useAddProduct() {
  const { addResource, loading, error, data } = useAddResource("product");
  return { addProduct: addResource, loading, error, data };
}

export function useAddManufacturer() {
  const { addResource, loading, error, data } = useAddResource("manufacturer");
  return { addManufacturer: addResource, loading, error, data };
}

export function useAddSupplier() {
  const { addResource, loading, error, data } = useAddResource("supplier");
  return { addSupplier: addResource, loading, error, data };
}

/**
 * Fonction simple pour ajouter n'importe quelle ressource PrestaShop (version non-Hook)
 * @param {string} resourceType - Type de ressource (ex: 'product', 'category', etc.)
 * @param {Object} resourceData - Données de la ressource
 * @param {Object} options - Options supplémentaires
 * @param {string} options.apiKey - Clé API PrestaShop (optionnelle, utilise DEFAULT_CONFIG)
 * @param {string} options.baseUrl - URL de base de l'API (optionnelle, utilise DEFAULT_CONFIG)
 * @param {number} options.languageId - ID de langue (défaut: 1)
 * @returns {Promise<Object>} - Réponse parsée de l'API
 */
export async function addResource(resourceType, resourceData, options = {}) {
  const config = {
    apiKey: options.apiKey || DEFAULT_CONFIG.apiKey,
    baseUrl: options.baseUrl || DEFAULT_CONFIG.baseUrl,
  };

  const endpoint = RESOURCE_ENDPOINTS[resourceType];
  const multilangFields = MULTILANG_FIELDS[resourceType] || [];
  const languageId = options.languageId || 1;

  if (!endpoint) {
    throw new Error(
      `Resource type "${resourceType}" not supported. Supported types: ${Object.keys(RESOURCE_ENDPOINTS).join(", ")}`,
    );
  }

  const url = `${config.baseUrl}/${endpoint}?ws_key=${config.apiKey}`;

  const prestashopData = {
    prestashop: {
      [resourceType]: resourceData,
    },
  };

  const xml = convertToPrestashopXML(
    prestashopData,
    "prestashop",
    true,
    languageId,
    multilangFields,
  );
  // console.log(xml);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
      Accept: "application/xml",
    },
    body: xml,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const responseText = await response.text();
  const parsedResponse = await parsePrestashopXML(responseText);

  return parsedResponse;
}

export async function addOrder(orderData, options = {}) {
  const hasValidCart =
    orderData.id_cart &&
    orderData.id_cart !== "0" &&
    orderData.id_cart !== 0 &&
    orderData.id_cart !== null &&
    orderData.id_cart !== undefined;

  let finalOrderData = { ...orderData };

  if (!hasValidCart) {
    console.log(
      "Aucun id_cart valide trouvé, création d'un panier à partir de la commande...",
    );
    const cartData = convertOrderToCart(orderData);
    const cartResponse = await addResource("cart", cartData, options);

    let cartId = null;
    if (cartResponse?.cart?.id) {
      cartId = cartResponse.cart.id["#cdata"] || cartResponse.cart.id;
    } else if (cartResponse?.cart?.id?.["#cdata"]) {
      cartId = cartResponse.cart.id["#cdata"];
    }

    if (cartId) {
      finalOrderData.id_cart = cartId;
      console.log(`Panier créé avec succès, ID: ${cartId}`);
    } else {
      throw new Error("Impossible de créer le panier pour la commande");
    }
  }

  return await addResource("order", finalOrderData, options);
}

function convertOrderToCart(orderData) {
  const cartRows = [];

  if (orderData.associations?.order_rows?.order_row) {
    const orderRows = Array.isArray(orderData.associations.order_rows.order_row)
      ? orderData.associations.order_rows.order_row
      : [orderData.associations.order_rows.order_row];

    for (const row of orderRows) {
      cartRows.push({
        id_product: row.product_id,
        id_product_attribute: row.product_attribute_id || "0",
        id_address_delivery: orderData.id_address_delivery,
        id_customization: "0",
        quantity: row.product_quantity,
      });
    }
  }

  const cartData = {
    id_address_delivery: orderData.id_address_delivery,
    id_address_invoice:
      orderData.id_address_invoice || orderData.id_address_delivery,
    id_currency: orderData.id_currency || "1",
    id_customer: orderData.id_customer,
    id_guest: "0",
    id_lang: orderData.id_lang || "1",
    id_shop_group: orderData.id_shop_group || "1",
    id_shop: orderData.id_shop || "1",
    id_carrier: orderData.id_carrier || "1",
    recyclable: orderData.recyclable || "0",
    gift: orderData.gift || "0",
    gift_message: "",
    mobile_theme: orderData.mobile_theme || "0",
    delivery_option: orderData.delivery_option || '{"8":"1,"}',
    allow_seperated_package: orderData.allow_seperated_package || "0",
    associations: {
      cart_rows: { cart_row: cartRows },
    },
  };

  return cartData;
}

export async function addProduct(productData, options = {}) {
  const languageId = options.languageId || 1;
  let categoryId = null;
  let categoryName = null;

  if (productData.associations?.categories?.category) {
    const categories = productData.associations.categories.category;
    const firstCategory = Array.isArray(categories) ? categories[0] : categories;
    categoryId = firstCategory?.id;
  }
  if (!categoryId && productData.category_name) {
    categoryName = productData.category_name;
  }

  if (!categoryId && categoryName) {
    try {
      // console.log(`Catégorie non trouvée, création de la catégorie: ${categoryName}`);      
      const categoryData = {
        id_parent: 2,
        id_shop_default: 1,
        is_root_category: 0,
        name: categoryName,
        description: categoryName,
        link_rewrite: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        active: 1,
      };
      const categoryResponse = await addResource("category", categoryData, {
        ...options,
        languageId,
      });

      categoryId = categoryResponse?.category?.id?.["#cdata"] || categoryResponse?.category?.id;

      if (categoryId) {
        console.log(`Catégorie créée avec succès, ID: ${categoryId}`);
        if (!productData.associations) {
          productData.associations = {};
        }
        if (!productData.associations.categories) {
          productData.associations.categories = {};
        }
        productData.associations.categories.category = [{ id: categoryId }];        
        productData.id_category_default = categoryId;
      } else {
        throw new Error("Impossible de récupérer l'ID de la catégorie créée");
      }
    } catch (error) {
      throw new Error(`Erreur lors de la création de la catégorie "${categoryName}": ${error.message}`);
    }
  }
  if (!categoryId) {
    throw new Error("Catégorie non trouvée et aucun nom de catégorie fourni. Veuillez fournir un ID de catégorie valide ou un nom de catégorie (category_name)");
  }
  const cleanProductData = { ...productData };  
  delete cleanProductData.category_name;
  if (!cleanProductData.id_category_default) {
    cleanProductData.id_category_default = categoryId;
  }
  return await addResource("product", cleanProductData, {
    ...options
  });
}

/**
 * Fonction simple pour mettre à jour n'importe quelle ressource PrestaShop (version non-Hook)
 * @param {string} resourceType - Type de ressource (ex: 'product', 'category', etc.)
 * @param {string|number} resourceId - ID de la ressource à mettre à jour
 * @param {Object} resourceData - Données de la ressource (sans l'id)
 * @param {Object} options - Options supplémentaires
 * @param {string} options.apiKey - Clé API PrestaShop (optionnelle, utilise DEFAULT_CONFIG)
 * @param {string} options.baseUrl - URL de base de l'API (optionnelle, utilise DEFAULT_CONFIG)
 * @param {number} options.languageId - ID de langue (défaut: 1)
 * @returns {Promise<Object>} - Réponse parsée de l'API
 */
export async function updateResource(
  resourceType,
  resourceId,
  resourceData,
  options = {},
) {
  const config = {
    apiKey: options.apiKey || DEFAULT_CONFIG.apiKey,
    baseUrl: options.baseUrl || DEFAULT_CONFIG.baseUrl,
  };

  const endpoint = RESOURCE_ENDPOINTS[resourceType];
  const multilangFields = MULTILANG_FIELDS[resourceType] || [];
  const languageId = options.languageId || 1;

  if (!endpoint) {
    throw new Error(
      `Resource type "${resourceType}" not supported. Supported types: ${Object.keys(RESOURCE_ENDPOINTS).join(", ")}`,
    );
  }

  const url = `${config.baseUrl}/${endpoint}/${resourceId}?ws_key=${config.apiKey}`;

  const prestashopData = {
    prestashop: {
      [endpoint]: { ...resourceData, id: resourceId },
    },
  };

  const xml = convertToPrestashopXML(
    prestashopData,
    "prestashop",
    true,
    languageId,
    multilangFields,
  );
  // console.log(xml)
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/xml",
      Accept: "application/xml",
    },
    body: xml,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const responseText = await response.text();
  const parsedResponse = await parsePrestashopXML(responseText);

  return parsedResponse;
}

/**
 * Fonction simple pour uploader une image produit (version non-Hook)
 * @param {string|number} productId - ID du produit
 * @param {File|Blob} imageFile - Fichier image
 * @param {Object} options - Options supplémentaires
 * @param {string} options.apiKey - Clé API PrestaShop (optionnelle, utilise DEFAULT_CONFIG)
 * @param {string} options.baseUrl - URL de base de l'API (optionnelle, utilise DEFAULT_CONFIG)
 * @returns {Promise<Object>} - Réponse parsée de l'API
 */
export async function uploadProductImage(productId, imageFile, options = {}) {
  const config = {
    apiKey: options.apiKey || DEFAULT_CONFIG.apiKey,
    baseUrl: options.baseUrl || DEFAULT_CONFIG.baseUrl,
  };

  const url = `${config.baseUrl}/images/products/${productId}?ws_key=${config.apiKey}`;

  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const responseText = await response.text();
  const parsedResponse = await parsePrestashopXML(responseText);

  return parsedResponse;
}

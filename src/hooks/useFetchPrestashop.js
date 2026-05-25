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
        data: null
      };
    }

    const order = response.data.order;
    
    const idAddressDelivery = order.id_address_delivery?.["#cdata"] || order.id_address_delivery;
    const idAddressInvoice = order.id_address_invoice?.["#cdata"] || order.id_address_invoice;
    const idCart = order.id_cart?.["#cdata"] || order.id_cart;
    const idCustomer = order.id_customer?.["#cdata"] || order.id_customer;
    
    const totalPaid = parseFloat(order.total_paid_tax_incl?.["#cdata"] || order.total_paid_tax_incl || 0);
    const totalProducts = parseFloat(order.total_products?.["#cdata"] || order.total_products || 0);
    
    const orderRows = [];
    let orderRowsData = order.associations?.order_rows?.order_row;
    
    if (orderRowsData) {
      if (!Array.isArray(orderRowsData)) {
        orderRowsData = [orderRowsData];
      }
      
      for (const row of orderRowsData) {
        orderRows.push({
          product_id: row.product_id?.["#cdata"] || row.product_id,
          product_attribute_id: row.product_attribute_id?.["#cdata"] || row.product_attribute_id || "0",
          product_quantity: row.product_quantity?.["#cdata"] || row.product_quantity,
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
      id_shop_group: order.id_shop_group?.["#cdata"] || order.id_shop_group || "1",
      id_shop: order.id_shop?.["#cdata"] || order.id_shop || "1",
      payment: order.payment?.["#cdata"] || order.payment || "Paiement comptant à la livraison (Cash on delivery)",
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
      conversion_rate: order.conversion_rate?.["#cdata"] || order.conversion_rate || "1",
      associations: {
        order_rows: { order_row: orderRows }
      }
    };
    
    return {
      success: true,
      data: formattedOrder,
      originalData: order
    };
    
  } catch (error) {
    console.error(`Erreur getOrder ${idOrder}:`, error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

export async function getProductStockByAttribute(productId, attributeId) {
  try {
    let filter = `&filter[id_product]=${productId}`;
    if (attributeId && attributeId !== '0' && attributeId !== 0) {
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
      const stockId = firstStock['@_id'] || firstStock.id?.["#cdata"] || firstStock.id;
      if (stockId) {
        const detailResponse = await fetchPrestashop(`stock_availables/${stockId}`);
        if (detailResponse.data?.stock_available?.quantity) {
          const quantity = detailResponse.data.stock_available.quantity["#cdata"] || detailResponse.data.stock_available.quantity;
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
    const response = await fetchPrestashop(`stock_availables/${stockAvailableId}`);
    
    if (response.data?.stock_available?.quantity) {
      return parseInt(response.data.stock_available.quantity["#cdata"] || 0);
    }
    
    return 0;
  } catch (error) {
    console.error("Error fetching stock by ID:", error);
    return 0;
  }
};

export async function getOptionAndValueNames(combinationId) {
  try {
    const comboResponse = await fetchPrestashop(`combinations/${combinationId}`);
    const comboData = comboResponse.data?.combination;
    if (!comboData) {
      console.error("Combinaison non trouvée");
      return null;
    }
    const productOptionValues = comboData.associations?.product_option_values?.product_option_value;
    if (!productOptionValues) {
      console.log("Aucune option value pour cette combinaison");
      return [];
    }
    const optionValuesArray = Array.isArray(productOptionValues) ? productOptionValues : [productOptionValues];
    const results = await Promise.all(
      optionValuesArray.map(async (optionValue) => {
        const optionValueId = optionValue.id?.["#cdata"];
        if (!optionValueId) return null;
        const optionValueResponse = await fetchPrestashop(`product_option_values/${optionValueId}`);
        const optionValueData = optionValueResponse.data?.product_option_value;
        if (!optionValueData) return null;
        const groupId = optionValueData.id_attribute_group?.["#cdata"];
        if (!groupId) return null;
        const groupResponse = await fetchPrestashop(`product_options/${groupId}`);
        const groupData = groupResponse.data?.product_option;
        return {
          combinationId: combinationId,
          optionValueId: optionValueId,
          optionName: optionValueData.name?.language?.["#cdata"] || "Nom inconnu",
          groupId: groupId,
          groupName: groupData?.name?.language?.["#cdata"] || "Groupe inconnu"
        };
      })
    );
    const validResults = results.filter(result => result !== null);
    return validResults;
  } catch (error) {
    console.error("Erreur lors de la récupération des noms:", error);
    return null;
  }
};

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
        "images", "customizations", "combinations", "languages",
        "associations", "tags", "attachments" 
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
                if(options?.urlRest){
                  fullUrl += `&${options.urlRest}`;
                }
                
                const response = await fetch(fullUrl, {
                  cache: "force-cache",
                  signal: controller.signal
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
            results.push(...batchResults.filter(r => r !== null));
            
            setResourcesData([...results]);
            
            if (i + BATCH_SIZE < items.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
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

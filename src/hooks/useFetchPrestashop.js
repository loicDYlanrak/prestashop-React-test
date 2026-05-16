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

export const fetchNestedUrls = async (obj, depth = 2, currentDepth = 0) => {
  if (!obj || typeof obj !== "object") return obj;

  if (currentDepth >= depth) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return await Promise.all(
      obj.map((item) => fetchNestedUrls(item, depth, currentDepth + 1)),
    );
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

  return newObj;
};

export function useFetchAllResources(url, resourceType, options = {}) {
  const { loading, data, errors } = useFetchPrestashop(url, options);
  const [resourcesData, setResourcesData] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    const fetchAllResources = async () => {
      const resourceKey = `${resourceType}s`;
      let itemKey = resourceType;
      resourceType === "categorie" ? (itemKey = "category") : itemKey;
      // console.log("resource key ",resourceKey)
      // console.log("item key ",itemKey)
      // console.log("data in use fetch all ressource  :",data?.[resourceKey]?.[itemKey])
      if (data && data[resourceKey] && data[resourceKey][itemKey]) {
        setLoadingResources(true);
        // console.log("dataaaa");

        try {
          const promises = data[resourceKey][itemKey].map(async (item) => {
            const itemUrl = item["@_href"].replace(
              "http://localhost/prestashop2/api/",
              "",
            );

            const apiKey = "2LA1668U53GC9T35AIT5Y3P7E8CKG7LL";
            const baseUrl = "http://localhost/prestashop2/api";
            const fullUrl = `${baseUrl}/${itemUrl}?ws_key=${apiKey}`;

            const response = await fetch(fullUrl, {
              cache: "force-cache",
            });
            const xmlText = await response.text();
            // console.log(xmlText);

            let parsedData = await parsePrestashopXML(xmlText);
            parsedData = await fetchNestedUrls(parsedData, 3);

            return parsedData;
          });

          const results = await Promise.all(promises);
          // console.log("results : ",results);
          setResourcesData(results);
        } catch (error) {
          console.error(`Erreur chargement ${resourceType}s:`, error);
        } finally {
          setLoadingResources(false);
        }
      }
    };

    fetchAllResources();
  }, [data, resourceType]);

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

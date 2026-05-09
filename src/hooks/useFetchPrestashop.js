import { useFetch } from "./useFetch.js";
import { useEffect, useState } from "react";
import { parsePrestashopXML } from "../utils/ParserXml.js";

export function useFetchPrestashop(url, options = {}) {
  const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
  const baseUrl = "http://localhost/prestashop/api";
  const urll = `${baseUrl}/${url}?ws_key=${apiKey}`;

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

export const fetchNestedUrls = async (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return await Promise.all(obj.map((item) => fetchNestedUrls(item)));
  }

  const newObj = { ...obj };

  for (const key in newObj) {
    const value = newObj[key];

    if (
      //   key.startsWith("id_") &&
      value &&
      typeof value === "object" &&
      value["@_href"]
    ) {
      const href = value["@_href"];
      const problematicTypes = ['images', 'customizations', 'combinations', 'languages'];
      const shouldSkip = problematicTypes.some(type => href.includes(`/${type}/`));
      
      if (href && !href.endsWith('/0') && !shouldSkip) {
        try {
          const itemUrl = value["@_href"].replace(
            "http://localhost/prestashop/api/",
            "",
          );
          const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
          const baseUrl = "http://localhost/prestashop/api";
          const fullUrl = `${baseUrl}/${itemUrl}?ws_key=${apiKey}`;

          const response = await fetch(fullUrl);
          const xmlText = await response.text();
          const parsedData = await parsePrestashopXML(xmlText);

          newObj[key] = {
            ...value,
            "@_fetched": parsedData,
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
      newObj[key] = await fetchNestedUrls(value);
    }
  }

  return newObj;
};

export function useFetchAllResources(url, resourceType) {
  const { loading, data, errors } = useFetchPrestashop(url);
  const [resourcesData, setResourcesData] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    const fetchAllResources = async () => {
      // Vérifier si les données existent et ont la structure attendue
      const resourceKey = `${resourceType}s`;
      const itemKey = resourceType;

      if (data && data[resourceKey] && data[resourceKey][itemKey]) {
        setLoadingResources(true);

        try {
          const promises = data[resourceKey][itemKey].map(async (item) => {
            const itemUrl = item["@_href"].replace(
              "http://localhost/prestashop/api/",
              "",
            );

            const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
            const baseUrl = "http://localhost/prestashop/api";
            const fullUrl = `${baseUrl}/${itemUrl}?ws_key=${apiKey}`;

            const response = await fetch(fullUrl);
            const xmlText = await response.text();
            let parsedData = await parsePrestashopXML(xmlText);
            parsedData = await fetchNestedUrls(parsedData);

            return parsedData;
          });

          const results = await Promise.all(promises);
          console.log(results);
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

export function useFetchAllProduits(url) {
  return useFetchAllResources(url, "product");
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


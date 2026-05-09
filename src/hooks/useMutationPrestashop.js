import { useState } from "react";
import { convertToPrestashopXML } from "../utils/BuilderXml";
import { parsePrestashopXML } from "../utils/ParserXml";

const DEFAULT_CONFIG = {
  apiKey: "Q3971RIRQJVRL981S2KCEGBBMWILW8H1",
  baseUrl: "http://localhost/prestashop/api"
};

const RESOURCE_ENDPOINTS = {
  category: "categories",
  product: "products",
  customer: "customers",
  manufacturer: "manufacturers",
  supplier: "suppliers"
};

const MULTILANG_FIELDS = {
  category: ['name', 'link_rewrite', 'description', 'meta_title', 'meta_description', 'meta_keywords'],
  product: ['name', 'link_rewrite', 'description', 'description_short', 'meta_title', 'meta_description', 'meta_keywords'],
  customer: [],
  manufacturer: ['name'],
  supplier: ['name']
};

/**
 * Hook générique pour ajouter n'importe quelle ressource PrestaShop
 * @param {string} resourceType - Type de ressource ('category', 'product', 'customer', 'manufacturer', 'supplier')
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
    throw new Error(`Resource type "${resourceType}" not supported. Supported types: ${Object.keys(RESOURCE_ENDPOINTS).join(', ')}`);
  }

  const addResource = async (resourceData, languageId = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `${config.baseUrl}/${endpoint}?ws_key=${config.apiKey}`;
      
      const prestashopData = {
        prestashop: {
          [resourceType]: resourceData
        }
      };
      
      const xml = convertToPrestashopXML(
        prestashopData,
        "prestashop",
        true,
        languageId,
        multilangFields
      );
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
          "Accept": "application/xml"
        },
        body: xml
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
    data
  };
}

export function useAddCategory() {
  const { addResource, loading, error, data } = useAddResource('category');
  return { addCategory: addResource, loading, error, data };
}

export function useAddProduct() {
  const { addResource, loading, error, data } = useAddResource('product');
  return { addProduct: addResource, loading, error, data };
}

export function useAddCustomer() {
  const { addResource, loading, error, data } = useAddResource('customer');
  return { addCustomer: addResource, loading, error, data };
}

export function useAddManufacturer() {
  const { addResource, loading, error, data } = useAddResource('manufacturer');
  return { addManufacturer: addResource, loading, error, data };
}

export function useAddSupplier() {
  const { addResource, loading, error, data } = useAddResource('supplier');
  return { addSupplier: addResource, loading, error, data };
}
import { useState } from "react";
import { convertToPrestashopXML } from "../utils/BuilderXml";
import { parsePrestashopXML } from "../utils/ParserXml";

// Configuration par défaut
const DEFAULT_CONFIG = {
  apiKey: "Q3971RIRQJVRL981S2KCEGBBMWILW8H1",
  baseUrl: "http://localhost/prestashop/api"
};

// Mapping des endpoints par ressource
const RESOURCE_ENDPOINTS = {
  category: "categories",
  product: "products",
  customer: "customers",
  manufacturer: "manufacturers",
  supplier: "suppliers"
};

// Champs multilangues par ressource (pour les opérations POST/PUT)
const MULTILANG_FIELDS = {
  category: ['name', 'link_rewrite', 'description', 'meta_title', 'meta_description', 'meta_keywords'],
  product: ['name', 'link_rewrite', 'description', 'description_short', 'meta_title', 'meta_description', 'meta_keywords'],
  customer: [],
  manufacturer: ['name'],
  supplier: ['name']
};

/**
 * Hook générique pour toutes les opérations CRUD PrestaShop
 * @param {string} resourceType - Type de ressource
 * @param {Object} customConfig - Configuration personnalisée
 * @returns {Object} - Méthodes CRUD et états
 */
export function usePrestashopResource(resourceType, customConfig = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const config = { ...DEFAULT_CONFIG, ...customConfig };
  const endpoint = RESOURCE_ENDPOINTS[resourceType];
  const multilangFields = MULTILANG_FIELDS[resourceType] || [];

  if (!endpoint) {
    throw new Error(`Resource type "${resourceType}" not supported. Supported types: ${Object.keys(RESOURCE_ENDPOINTS).join(', ')}`);
  }

  // Opération CREATE (POST)
  const create = async (resourceData, languageId = 1) => {
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
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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

  // Opération READ (GET)
  const get = async (resourceId = null, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${config.baseUrl}/${endpoint}?ws_key=${config.apiKey}`;
      
      if (resourceId) {
        url = `${config.baseUrl}/${endpoint}/${resourceId}?ws_key=${config.apiKey}`;
      }
      
      // Ajout de paramètres optionnels (display, filter, etc.)
      if (options.display) {
        url += `&display=${options.display}`;
      }
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          url += `&filter[${key}]=${value}`;
        });
      }
      if (options.limit) {
        url += `&limit=${options.limit}`;
      }
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/xml"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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

  // Opération UPDATE (PUT)
  const update = async (resourceId, resourceData, languageId = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `${config.baseUrl}/${endpoint}/${resourceId}?ws_key=${config.apiKey}`;
      
      const prestashopData = {
        prestashop: {
          [resourceType]: {
            id: resourceId,
            ...resourceData
          }
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
        method: "PUT",
        headers: {
          "Content-Type": "application/xml",
          "Accept": "application/xml"
        },
        body: xml
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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

  // Opération DELETE
  const remove = async (resourceId) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `${config.baseUrl}/${endpoint}/${resourceId}?ws_key=${config.apiKey}`;
      
      const deleteData = {
        prestashop: {
          [resourceType]: {
            id: resourceId
          }
        }
      };
      
      const xml = convertToPrestashopXML(deleteData, "prestashop", false);
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/xml",
          "Accept": "application/xml"
        },
        body: xml
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const responseText = await response.text();
      let parsedResponse = null;
      
      if (responseText && responseText.trim()) {
        try {
          parsedResponse = await parsePrestashopXML(responseText);
        } catch (parseError) {
          console.warn("Réponse XML non valide:", parseError);
        }
      }
      
      setData(parsedResponse || { success: true, id: resourceId, deleted: true });
      return parsedResponse;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    create,
    get,
    update,
    delete: remove,
    loading,
    error,
    data
  };
}

// Hooks spécifiques pour la rétrocompatibilité (DELETE seulement)
export function useDeleteCategory() {
  const { delete: remove, loading, error, data } = usePrestashopResource('category');
  return { deleteCategory: remove, loading, error, data };
}

export function useDeleteProduct() {
  const { delete: remove, loading, error, data } = usePrestashopResource('product');
  return { deleteProduct: remove, loading, error, data };
}

export function useDeleteCustomer() {
  const { delete: remove, loading, error, data } = usePrestashopResource('customer');
  return { deleteCustomer: remove, loading, error, data };
}

export function useDeleteManufacturer() {
  const { delete: remove, loading, error, data } = usePrestashopResource('manufacturer');
  return { deleteManufacturer: remove, loading, error, data };
}

export function useDeleteSupplier() {
  const { delete: remove, loading, error, data } = usePrestashopResource('supplier');
  return { deleteSupplier: remove, loading, error, data };
}
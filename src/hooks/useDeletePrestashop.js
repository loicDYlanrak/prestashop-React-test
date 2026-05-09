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

/**
 * Hook générique pour supprimer n'importe quelle ressource PrestaShop
 * @param {string} resourceType - Type de ressource ('category', 'product', 'customer', 'manufacturer', 'supplier')
 * @param {Object} customConfig - Configuration personnalisée (optionnelle)
 * @returns {Object} - { deleteResource, loading, error, data }
 */
export function useDeleteResource(resourceType, customConfig = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const config = { ...DEFAULT_CONFIG, ...customConfig };
  const endpoint = RESOURCE_ENDPOINTS[resourceType];

  if (!endpoint) {
    throw new Error(`Resource type "${resourceType}" not supported. Supported types: ${Object.keys(RESOURCE_ENDPOINTS).join(', ')}`);
  }

  const deleteResource = async (resourceId) => {
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
    deleteResource,
    loading,
    error,
    data
  };
}

export function useDeleteCategory() {
  const { deleteResource, loading, error, data } = useDeleteResource('category');
  return { deleteCategory: deleteResource, loading, error, data };
}

export function useDeleteProduct() {
  const { deleteResource, loading, error, data } = useDeleteResource('product');
  return { deleteProduct: deleteResource, loading, error, data };
}

export function useDeleteCustomer() {
  const { deleteResource, loading, error, data } = useDeleteResource('customer');
  return { deleteCustomer: deleteResource, loading, error, data };
}

export function useDeleteManufacturer() {
  const { deleteResource, loading, error, data } = useDeleteResource('manufacturer');
  return { deleteManufacturer: deleteResource, loading, error, data };
}

export function useDeleteSupplier() {
  const { deleteResource, loading, error, data } = useDeleteResource('supplier');
  return { deleteSupplier: deleteResource, loading, error, data };
}
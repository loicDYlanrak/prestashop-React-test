import { useState } from "react";
import { convertToPrestashopXML } from "../utils/BuilderXml";
import { parsePrestashopXML } from "../utils/ParserXml";

export function useDeleteCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const deleteCategory = async (categoryId) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
      const baseUrl = "http://localhost/prestashop/api";
      const url = `${baseUrl}/categories/${categoryId}?ws_key=${apiKey}`;
      
      const deleteData = {
        prestashop: {
          category: {
            id: categoryId
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
      
      setData(parsedResponse || { success: true, id: categoryId, deleted: true });
      return parsedResponse;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    deleteCategory,
    loading,
    error,
    data
  };
}

export function useDeleteProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const deleteProduct = async (productId) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
      const baseUrl = "http://localhost/prestashop/api";
      const url = `${baseUrl}/products/${productId}?ws_key=${apiKey}`;
      
      const deleteData = {
        prestashop: {
          product: {
            id: productId
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
      
      setData(parsedResponse || { success: true, id: productId, deleted: true });
      return parsedResponse;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    deleteProduct,
    loading,
    error,
    data
  };
}

export function useDeleteCustomer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const deleteCustomer = async (customerId) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
      const baseUrl = "http://localhost/prestashop/api";
      const url = `${baseUrl}/customers/${customerId}?ws_key=${apiKey}`;
      
      const deleteData = {
        prestashop: {
          customer: {
            id: customerId
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
      
      setData(parsedResponse || { success: true, id: customerId, deleted: true });
      return parsedResponse;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    deleteCustomer,
    loading,
    error,
    data
  };
}

export function useDeleteManufacturer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const deleteManufacturer = async (manufacturerId) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
      const baseUrl = "http://localhost/prestashop/api";
      const url = `${baseUrl}/manufacturers/${manufacturerId}?ws_key=${apiKey}`;
      
      const deleteData = {
        prestashop: {
          manufacturer: {
            id: manufacturerId
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
      
      setData(parsedResponse || { success: true, id: manufacturerId, deleted: true });
      return parsedResponse;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    deleteManufacturer,
    loading,
    error,
    data
  };
}

export function useDeleteSupplier() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const deleteSupplier = async (supplierId) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
      const baseUrl = "http://localhost/prestashop/api";
      const url = `${baseUrl}/suppliers/${supplierId}?ws_key=${apiKey}`;
      
      const deleteData = {
        prestashop: {
          supplier: {
            id: supplierId
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
      
      setData(parsedResponse || { success: true, id: supplierId, deleted: true });
      return parsedResponse;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    deleteSupplier,
    loading,
    error,
    data
  };
}
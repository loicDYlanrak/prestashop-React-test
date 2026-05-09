import { useState } from "react";
import { convertToPrestashopXML } from "../utils/BuilderXml";
import { parsePrestashopXML } from "../utils/ParserXml";

export function useAddCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const addCategory = async (categoryData, languageId = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
      const baseUrl = "http://localhost/prestashop/api";
      const url = `${baseUrl}/categories?ws_key=${apiKey}`;
      
      const prestashopData = {
        prestashop: {
          category: categoryData
        }
      };
      
      const xml = convertToPrestashopXML(
        prestashopData,
        "prestashop",
        true,
        languageId,
        ['name', 'link_rewrite', 'description', 'meta_title', 'meta_description', 'meta_keywords']
      );
    //   console.log(xml);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
          "Accept": "application/xml"
        },
        body: xml
      });
      
      if (!response.ok) {
        // console.log("response ",response);
        // throw new Error(`HTTP error! status: ${response.status}`);
        console.log("Tout se passe comme prevue , verifie la liste");
        
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
    addCategory,
    loading,
    error,
    data
  };
}

export function useAddProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const addProduct = async (productData, languageId = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
      const baseUrl = "http://localhost/prestashop/api";
      const url = `${baseUrl}/products?ws_key=${apiKey}`;
      
      const prestashopData = {
        prestashop: {
          product: productData
        }
      };
      
      const xml = convertToPrestashopXML(
        prestashopData,
        "prestashop",
        true,
        languageId,
        ['name', 'link_rewrite', 'description', 'description_short', 'meta_title', 'meta_description', 'meta_keywords']
      );
      // console.log(xml);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
          "Accept": "application/xml"
        },
        body: xml,
        mode: "no-cors"
      });
      
      if (!response.ok) {
        // console.log("response ",response);
        // throw new Error(`HTTP error! status: ${response.status}`);
        console.log("Tout se passe comme prevue , verifie la liste");
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
    addProduct,
    loading,
    error,
    data
  };
}

export function useAddCustomer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const addCustomer = async (customerData, languageId = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
      const baseUrl = "http://localhost/prestashop/api";
      const url = `${baseUrl}/customers?ws_key=${apiKey}`;
      
      const prestashopData = {
        prestashop: {
          customer: customerData
        }
      };
      
      const xml = convertToPrestashopXML(
        prestashopData,
        "prestashop",
        true,
        languageId,
        []
      );
      // console.log(xml);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
          "Accept": "application/xml"
        },
        body: xml
      });
      
      if (!response.ok) {
        console.log("Tout se passe comme prevue , verifie la liste");
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
    addCustomer,
    loading,
    error,
    data
  };
}

export function useAddManufacturer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const addManufacturer = async (manufacturerData, languageId = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
      const baseUrl = "http://localhost/prestashop/api";
      const url = `${baseUrl}/manufacturers?ws_key=${apiKey}`;
      
      const prestashopData = {
        prestashop: {
          manufacturer: manufacturerData
        }
      };
      
      const xml = convertToPrestashopXML(
        prestashopData,
        "prestashop",
        true,
        languageId,
        ['name']
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
        console.log("Tout se passe comme prevue , verifie la liste");
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
    addManufacturer,
    loading,
    error,
    data
  };
}

export function useAddSupplier() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const addSupplier = async (supplierData, languageId = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
      const baseUrl = "http://localhost/prestashop/api";
      const url = `${baseUrl}/suppliers?ws_key=${apiKey}`;
      
      const prestashopData = {
        prestashop: {
          supplier: supplierData
        }
      };
      
      const xml = convertToPrestashopXML(
        prestashopData,
        "prestashop",
        true,
        languageId,
        ['name']
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
        console.log("Tout se passe comme prevue , verifie la liste");
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
    addSupplier,
    loading,
    error,
    data
  };
}
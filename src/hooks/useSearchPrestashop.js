import { useState, useCallback } from 'react';
import { parsePrestashopXML } from '../utils/ParserXml';
import { fetchNestedUrls } from './useFetchPrestashop'

export function useSearchPrestashop() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const apiKey = "Q3971RIRQJVRL981S2KCEGBBMWILW8H1";
  const baseUrl = "http://localhost/prestashop/api";

  /**
   * Recherche une entité par un attribut spécifique
   * @param {string} entityType - Type d'entité (categories, products, customers, etc.)
   * @param {string} attribute - Attribut à rechercher (name, id, reference, etc.)
   * @param {string|number} value - Valeur à rechercher
   * @param {string} display - Champs à retourner (full, [id, name], etc.)
   * @returns {Promise<object>} - Résultat de la recherche
   */
  const searchByAttribute = useCallback(async (entityType, attribute, value, display = 'full') => {
    setLoading(true);
    setError(null);
    
    try {
      const filterParam = `filter[${attribute}]=[${value}]`;
      const displayParam = display !== 'full' ? `&display=${display}` : '';
      const url = `${baseUrl}/${entityType}?ws_key=${apiKey}&${filterParam}${displayParam}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/xml'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const xmlText = await response.text();
      let parsedData = await parsePrestashopXML(xmlText);
      parsedData=await fetchNestedUrls(parsedData);
      
      const resourceKey = entityType;
      let entities = parsedData[resourceKey]?.category['@_fetched'] || [];
      
      if (!Array.isArray(entities)) {
        entities = [entities];
      }
      
      setResults(entities);
      return entities;
      
    } catch (err) {
      setError(err.message);
      console.error(`Erreur recherche ${entityType}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Recherche une catégorie par son nom
   * @param {string} name - Nom de la catégorie
   * @returns {Promise<object>}
   */
  const searchCategoryByName = useCallback(async (name) => {
    return searchByAttribute('categories', 'name', name);
  }, [searchByAttribute]);

  /**
   * Recherche un produit par sa référence
   * @param {string} reference - Référence du produit
   * @returns {Promise<object>}
   */
  const searchProductByReference = useCallback(async (reference) => {
    return searchByAttribute('products', 'reference', reference);
  }, [searchByAttribute]);

  /**
   * Recherche un produit par son nom
   * @param {string} name - Nom du produit
   * @returns {Promise<object>}
   */
  const searchProductByName = useCallback(async (name) => {
    return searchByAttribute('products', 'name', name);
  }, [searchByAttribute]);

  /**
   * Recherche une entité avec plusieurs critères
   * @param {string} entityType - Type d'entité
   * @param {object} filters - Objet avec les filtres {attribute: value}
   * @returns {Promise<object>}
   */
  const searchWithMultipleFilters = useCallback(async (entityType, filters) => {
    setLoading(true);
    setError(null);
    
    try {
      // Construire les filtres multiples
      const filterParams = Object.entries(filters)
        .map(([attr, val]) => `filter[${attr}]=[${val}]`)
        .join('&');
      
      const url = `${baseUrl}/${entityType}?ws_key=${apiKey}&${filterParams}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/xml'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const xmlText = await response.text();
      const parsedData = await parsePrestashopXML(xmlText);
      
      const resourceKey = entityType;
      let entities = parsedData[resourceKey]?.[entityType.slice(0, -1)] || [];
      
      if (!Array.isArray(entities)) {
        entities = [entities];
      }
      
      setResults(entities);
      return entities;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    searchByAttribute,
    searchCategoryByName,
    searchProductByReference,
    searchProductByName,
    searchWithMultipleFilters,
    loading,
    error,
    results
  };
}
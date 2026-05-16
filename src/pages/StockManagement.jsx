import { useState, useEffect, useCallback } from "react";
import {
  useFetchAllProduits,
  fetchPrestashop,
} from "../hooks/useFetchPrestashop";
import "./StockManagement.css";

export default function StockManagement() {
  const { loading, data, errors } = useFetchAllProduits("products", { restUrl: "limit=0,100" });
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [combinations, setCombinations] = useState([]);
  const [selectedCombination, setSelectedCombination] = useState(null);
  const [quantityDelta, setQuantityDelta] = useState(1);
  const [updateStatus, setUpdateStatus] = useState({ type: "", message: "" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Transformer les produits
  const transformProduct = useCallback(async (item) => {
    const productData = item.product;
    const name = productData.name?.language?.["#cdata"] || "";
    
    // Vérifier si le produit a des combinaisons
    const hasCombinations = productData.associations?.combinations?.combination &&
      (Array.isArray(productData.associations.combinations.combination)
        ? productData.associations.combinations.combination.length > 0
        : true);

    let productCombinations = [];
    if (hasCombinations) {
      productCombinations = await fetchCombinationsForProduct(productData);
    } else {
      // Produit simple - récupérer le stock
      const stock = await getProductStock(productData);
      productCombinations = [{
        id: null,
        reference: productData.reference?.["#cdata"] || "",
        name: "Défaut",
        quantity: stock,
        price: parseFloat(productData.price?.["#cdata"] || 0),
        defaultOn: true
      }];
    }

    return {
      id: parseInt(productData.id?.["#cdata"]),
      name: name,
      reference: productData.reference?.["#cdata"] || "",
      hasCombinations: hasCombinations,
      combinations: productCombinations,
      active: productData.active?.["#cdata"] === "1",
    };
  }, []);

  // Récupérer les combinaisons d'un produit
  const fetchCombinationsForProduct = async (productData) => {
    try {
      const combinationsData = productData.associations?.combinations?.combination;
      if (!combinationsData) return [];

      const combinationArray = Array.isArray(combinationsData) ? combinationsData : [combinationsData];
      const combinationsId = combinationArray.map(combo => combo.id?.["#cdata"]);

      // Récupérer les détails de chaque combinaison
      const combinationsDetails = await Promise.all(
        combinationsId.map(async (id) => {
          const comboResponse = await fetchPrestashop(`combinations/${id}`);
          return comboResponse.data;
        })
      );

      // Récupérer les stocks
      const stocksData = productData.associations?.stock_availables?.stock_available;
      const stockArray = stocksData ? (Array.isArray(stocksData) ? stocksData : [stocksData]) : [];

      let stocks = stockArray.map(stock => ({
        id: stock.id?.["#cdata"],
        attributeId: stock.id_product_attribute?.["#cdata"],
        quantity: parseInt(stock.quantity?.["#cdata"] || 0),
      }));

      // Récupérer les détails complets des stocks
      const stocksDetails = await Promise.all(
        stocks.map(async (stock) => {
          if (stock.id) {
            const stockResponse = await fetchPrestashop(`stock_availables/${stock.id}`);
            return stockResponse.data;
          }
          return null;
        })
      );

      stocks = stocks.map((stock) => {
        const stockDetail = stocksDetails.find(
          detail => detail?.stock_available?.id?.["#cdata"] === stock.id
        );
        return {
          ...stock,
          quantity: parseInt(stockDetail?.stock_available?.quantity?.["#cdata"] || stock.quantity),
        };
      });

      // Récupérer les noms des options pour chaque combinaison
      const allCombinationsWithDetails = await Promise.all(
        combinationsDetails.map(async (comboDetail) => {
          const productOptionValues = comboDetail?.combination?.associations?.product_option_values?.product_option_value;
          
          let optionValueIds = [];
          if (productOptionValues) {
            if (Array.isArray(productOptionValues)) {
              optionValueIds = productOptionValues.map(value => value?.id?.["#cdata"]).filter(Boolean);
            } else {
              optionValueIds = [productOptionValues?.id?.["#cdata"]].filter(Boolean);
            }
          }

          // Récupérer les noms des options
          let optionNames = [];
          for (const id of optionValueIds) {
            const optionValueResponse = await fetchPrestashop(`product_option_values/${id}`);
            const name = optionValueResponse.data?.product_option_value?.name?.language?.["#cdata"];
            if (name) optionNames.push(name);
          }

          const stock = stocks.find(s => s.attributeId === comboDetail.combination.id?.["#cdata"]);
          
          return {
            id: parseInt(comboDetail.combination.id?.["#cdata"]),
            reference: comboDetail.combination.reference?.["#cdata"] || "",
            name: optionNames.join(" / ") || "Combinaison",
            quantity: stock ? stock.quantity : 0,
            price: parseFloat(comboDetail.combination.price?.["#cdata"] || 0),
            defaultOn: comboDetail.combination.default_on?.["#cdata"] === "1",
          };
        })
      );

      return allCombinationsWithDetails;
    } catch (error) {
      console.error("Error fetching combinations:", error);
      return [];
    }
  };

  // Récupérer le stock d'un produit simple
  const getProductStock = async (productData) => {
    try {
      const stocksData = productData.associations?.stock_availables?.stock_available;
      if (!stocksData) return 0;

      const stockArray = Array.isArray(stocksData) ? stocksData : [stocksData];
      if (stockArray.length === 0) return 0;

      const firstStock = stockArray[0];
      const stockId = firstStock.id?.["#cdata"];

      if (stockId) {
        const stockResponse = await fetchPrestashop(`stock_availables/${stockId}`);
        if (stockResponse.data?.stock_available?.quantity) {
          return parseInt(stockResponse.data.stock_available.quantity["#cdata"] || 0);
        }
      }
      return 0;
    } catch (error) {
      console.error("Error fetching product stock:", error);
      return 0;
    }
  };

  // Charger tous les produits
  useEffect(() => {
    const loadProducts = async () => {
      if (!data || data.length === 0 || processing) return;
      
      setProcessing(true);
      try {
        const batchSize = 5;
        const allProducts = [];
        
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(item => transformProduct(item))
          );
          allProducts.push(...batchResults);
          
          // Mise à jour progressive
          setProducts([...allProducts]);
        }
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setProcessing(false);
      }
    };
    
    loadProducts();
  }, [data, transformProduct]);

  // Mettre à jour le stock via l'API
  const updateStock = async () => {
    if (!selectedProduct) {
      setUpdateStatus({ type: "error", message: "Veuillez sélectionner un produit" });
      return;
    }

    if (quantityDelta === 0) {
      setUpdateStatus({ type: "error", message: "La quantité doit être différente de 0" });
      return;
    }

    setIsUpdating(true);
    setUpdateStatus({ type: "", message: "" });

    try {
      const productId = selectedProduct.id;
      const attributeId = selectedCombination?.id || 0;
      
      const url = `http://localhost/prestashop2/module/stockapi/updateStock?id_product=${productId}&id_attribute=${attributeId}&delta=${quantityDelta}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        setUpdateStatus({ 
          type: "success", 
          message: `Stock mis à jour : ${result.new_quantity} unités disponibles` 
        });
        
        // Mettre à jour l'affichage local
        if (selectedCombination) {
          setSelectedCombination({
            ...selectedCombination,
            quantity: result.new_quantity
          });
          
          // Mettre à jour dans la liste des combinaisons
          setCombinations(prevCombos =>
            prevCombos.map(combo =>
              combo.id === selectedCombination.id
                ? { ...combo, quantity: result.new_quantity }
                : combo
            )
          );
          
          // Mettre à jour dans le produit sélectionné
          setSelectedProduct(prev => ({
            ...prev,
            combinations: prev.combinations.map(combo =>
              combo.id === selectedCombination.id
                ? { ...combo, quantity: result.new_quantity }
                : combo
            )
          }));
        } else {
          // Produit simple
          setSelectedProduct(prev => ({
            ...prev,
            combinations: prev.combinations.map(combo =>
              combo.id === null
                ? { ...combo, quantity: result.new_quantity }
                : combo
            )
          }));
        }
      } else {
        setUpdateStatus({ type: "error", message: result.message || "Erreur lors de la mise à jour" });
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      setUpdateStatus({ type: "error", message: "Erreur réseau lors de la mise à jour" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product) {
      setSelectedProduct(product);
      setCombinations(product.combinations);
      setSelectedCombination(product.combinations.find(c => c.defaultOn) || product.combinations[0] || null);
      setUpdateStatus({ type: "", message: "" });
      setQuantityDelta(1);
    }
  };

  const handleCombinationSelect = (combinationId) => {
    const combo = combinations.find(c => c.id === combinationId);
    setSelectedCombination(combo);
    setQuantityDelta(1);
  };

  if (loading || processing) {
    return (
      <div className="stock-management-loading">
        <div className="spinner"></div>
        <p>Chargement des produits...</p>
      </div>
    );
  }

  if (errors) {
    return (
      <div className="stock-management-error">
        <p>Erreur : {errors.message || "Erreur de chargement"}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="stock-management">
      <div className="page-header">
        <h1 className="page-title">Gestion des stocks</h1>
        <p className="page-description">Ajoutez ou retirez du stock pour vos produits</p>
      </div>

      <div className="stock-management-container">
        {/* Sélection du produit */}
        <div className="form-group">
          <label htmlFor="product-select">Produit</label>
          <select
            id="product-select"
            value={selectedProduct?.id || ""}
            onChange={(e) => handleProductSelect(e.target.value)}
            className="form-select"
          >
            <option value="">Sélectionner un produit</option>
            {products
              .filter(p => p.active)
              .map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} {product.reference && `(Réf: ${product.reference})`}
                </option>
              ))}
          </select>
        </div>

        {/* Sélection de la déclinaison */}
        {selectedProduct && combinations.length > 1 && (
          <div className="form-group">
            <label htmlFor="combination-select">Déclinaison</label>
            <select
              id="combination-select"
              value={selectedCombination?.id || ""}
              onChange={(e) => handleCombinationSelect(e.target.value === "null" ? null : parseInt(e.target.value))}
              className="form-select"
            >
              {combinations.map(combo => (
                <option key={combo.id || "default"} value={combo.id || "null"}>
                  {combo.name} - Stock: {combo.quantity} - Réf: {combo.reference}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Informations stock actuel */}
        {selectedCombination && (
          <div className="current-stock-info">
            <h3>Stock actuel</h3>
            <div className="stock-value">{selectedCombination.quantity}</div>
            <div className="stock-reference">
              Référence: {selectedCombination.reference || selectedProduct?.reference || "N/A"}
            </div>
          </div>
        )}

        {/* Quantité à modifier */}
        <div className="form-group">
          <label htmlFor="quantity-delta">Quantité à {quantityDelta > 0 ? "ajouter" : "retirer"}</label>
          <div className="quantity-delta-control">
            
            <input
              type="number"
              id="quantity-delta"
              value={quantityDelta}
              onChange={(e) => setQuantityDelta(parseInt(e.target.value) || 0)}
              className="form-input quantity-input"
            />
            
          </div>
          <small className="form-hint">
            {quantityDelta > 0 
              ? `Ajoutera ${quantityDelta} unité(s) au stock` 
              : quantityDelta < 0 
                ? `Retirera ${Math.abs(quantityDelta)} unité(s) du stock`
                : "Entrez une quantité différente de 0"}
          </small>
        </div>

        {/* Message de statut */}
        {updateStatus.message && (
          <div className={`status-message ${updateStatus.type}`}>
            {updateStatus.message}
          </div>
        )}

        {/* Bouton de mise à jour */}
        <button
          className="btn-update-stock"
          onClick={updateStock}
          disabled={!selectedProduct || !selectedCombination || quantityDelta === 0 || isUpdating}
        >
          {isUpdating ? (
            <>
              <span className="spinner-small"></span>
              Mise à jour...
            </>
          ) : (
            `Mettre à jour le stock (${quantityDelta > 0 ? "+" : ""}${quantityDelta})`
          )}
        </button>
      </div>
    </div>
  );
}
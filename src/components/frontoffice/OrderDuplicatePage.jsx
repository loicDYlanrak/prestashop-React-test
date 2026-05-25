/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getOrder, getProductStockByAttribute } from "../../hooks/useFetchPrestashop";
import "../../pages/frontoffice/OrderSummaryPage.css";
import { addOrder } from "../../hooks/useMutationPrestashop";
import { deliverOrderById } from "../../utils/orderUtils";

export default function OrderDuplicatePage({ order, nombre }) {
  console.log("order passé en argument:", order);

  const orderId = order?.id?.["#cdata"];
  let nbr = nombre || 1; 
  console.log("nbr:", nbr);
  
  const [updatedOrderItems, setUpdatedOrderItems] = useState([]);
  const [stockErrors, setStockErrors] = useState([]);
  const [isCheckingStock, setIsCheckingStock] = useState(true);
  const [modifiedOrder, setModifiedOrder] = useState(null); 
  const [orderSuccess, setOrderSuccess] = useState(false);

  const processOrderItemsFromArg = async (orderFromArg) => {
    try {
      const orderRows = orderFromArg?.associations?.order_rows?.order_row;
      let itemsArray = [];
      
      if (orderRows) {
        if (!Array.isArray(orderRows)) {
          itemsArray = [orderRows];
        } else {
          itemsArray = orderRows;
        }
      }

      const processedItems = [];
      const stockIssues = [];

      for (const item of itemsArray) {
        const productId = item.product_id?.["#cdata"] || item.product_id;
        const attributeId = item.product_attribute_id?.["#cdata"] || item.product_attribute_id;
        const unitPriceTaxIncl = parseFloat(item.unit_price_tax_incl?.["#cdata"] || item.unit_price_tax_incl || 0);
        const orginalQuantity = parseInt(item.product_quantity?.["#cdata"])
        console.log("orgiinal quantity:", orginalQuantity)
        const newQuantity = parseInt(nbr) *  orginalQuantity;
        // console.log("productId:", productId)
        // console.log("attributeId:", attributeId)
        const availableStock = await getProductStockByAttribute(productId, attributeId);
        // console.log("availableStock:", availableStock)
        if (availableStock < newQuantity) {
          stockIssues.push({
            productId,
            productName: item.product_name?.["#cdata"] || item.product_name || `Produit ${productId}`,
            requestedQuantity: newQuantity,
            availableStock: availableStock,
            hasError: true
          });
        }
        
        const itemTotal = unitPriceTaxIncl * newQuantity;
        
        processedItems.push({
          product_id: productId,
          product_attribute_id: attributeId,
          quantity: newQuantity,
          unit_price_tax_incl: unitPriceTaxIncl,
          total_price: itemTotal,
          product_name: item.product_name?.["#cdata"] || item.product_name,
          availableStock: availableStock,
          hasStockError: availableStock < newQuantity
        });
      }
      
      setUpdatedOrderItems(processedItems);
      setStockErrors(stockIssues);
      
      return { processedItems, stockIssues };
    } catch (error) {
      console.error("Erreur lors du traitement des articles:", error);
      return { processedItems: [], stockIssues: [] };
    }
  };

  const modifyOrderWithNewValues = (originalOrderStructure, newItems, newTotal) => {
    if (!originalOrderStructure || !originalOrderStructure.data) return null;
    
    const modified = { ...originalOrderStructure.data };
    
    if (modified.associations && modified.associations.order_rows) {
      const newOrderRows = newItems.map(item => ({
        product_id: item.product_id,
        product_attribute_id: item.product_attribute_id,
        product_quantity: item.quantity.toString(),
      }));
      
      modified.associations.order_rows.order_row = newOrderRows;
    }
    
    modified.total_paid = newTotal.toFixed(6);
    modified.total_products = newTotal.toFixed(6);
    
    return modified;
  };

  const calculateNewTotal = () => {
    return updatedOrderItems.reduce((total, item) => {
      return total + (item.total_price || 0);
    }, 0);
  };

  const isStockAvailable = () => {
    return !updatedOrderItems.some(item => item.hasStockError === true);
  };

  useEffect(() => {
    const loadAndProcessOrder = async () => {
      setIsCheckingStock(true);
      const { processedItems } = await processOrderItemsFromArg(order);
      const data = await getOrder(orderId);
      const newTotal = processedItems.reduce((sum, item) => sum + item.total_price, 0);
      if (data.data) {
        const modified = modifyOrderWithNewValues(data, processedItems, newTotal);
        setModifiedOrder(modified);
        // console.log("Commande modifiée avec nouveaux prix et quantités:", modified);
      }
      
      setIsCheckingStock(false);
    };
    
    if (order && orderId) {
      loadAndProcessOrder();
    }
  }, [order, orderId, nombre]);
  // console.log("Erreurs de stock:", stockErrors);
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  if (!user) {
    const modalEvent = new CustomEvent("openUserModal");
    window.dispatchEvent(modalEvent);
    return null;
  }

  const newTotal = calculateNewTotal();
  const stockAvailable = isStockAvailable();

  const handleValidate = async () => {
     const orderFinall = modifiedOrder;
     delete orderFinall?.id
     delete orderFinall?.id_cart
    //  console.log("orderFinall:", orderFinall)
     const newOrder =await addOrder(orderFinall, {})
     if (newOrder.order.id) {
        const id= newOrder.order.id?.["#cdata"]
        const deliverded = await deliverOrderById(id)
        console.log("deliverded:", deliverded)
        if(deliverded.success) {
          setOrderSuccess(true)
        }
     }
  }
  if (orderSuccess) {
    return (
      <div className="order-success-container">
        <div className="order-success-card">
          <div className="success-icon">✓</div>
          <h1>Commande dupliquer !</h1>
          <p>Votre commande a été livré avec succès.</p>
          <div className="success-actions">
            <Link to="/" className="btn-home">Retour à l&apos;accueil</Link>
            <Link to="/products" className="btn-continue-shop">Continuer mes achats</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-summary-page">
      <h1>Récapitulatif de votre commande Dupliquer</h1>

      <div className="order-summary-container">
        <div className="order-items-section">
          <h2>Articles commandés</h2>
          
          {isCheckingStock ? (
            <div className="loading-stock">Vérification des stocks en cours...</div>
          ) : (
            <>
              {stockErrors.length > 0 && (
                <div className="stock-errors">
                  <h3>Problèmes de stock :</h3>
                  {stockErrors.map((error, index) => (
                    <div key={index} className="stock-error-item">
                      <span className="product-name">{error.productName}</span>
                      <span className="error-message">
                        Stock insuffisant : {error.requestedQuantity} demandé, 
                        {error.availableStock} disponible(s)
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="order-items-list">
                {updatedOrderItems.map((item, index) => {
                  const itemKey = `${item.product_id}_${item.product_attribute_id}_${index}`;
                  return (
                    <div key={itemKey} className="order-summary-item">
                      <div className="order-item-details">
                        <h3>{item.product_name}</h3>
                        <div className="order-item-info">
                          <div className="order-item-quantity">
                            Quantité: {item.quantity}
                          </div>
                          <div className="order-item-quantity">
                            Prix unitaire: {item.unit_price_tax_incl.toFixed(2)} €
                          </div>
                          <div className="order-item-quantity">
                            Stock disponible: {item.availableStock}
                            {item.hasStockError && (
                              <span className="stock-warning"> Stock insuffisant</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="order-item-price">
                        {item.total_price.toFixed(2)} €
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="order-summary-sidebar">
          <div className="summary-card">
            <h3>Récapitulatif</h3>

            <div className="summary-divider"></div>
            <div className="summary-total">
              <span>Total TTC</span>
              <span>{newTotal.toFixed(2)} €</span>
            </div>

            {stockErrors.length > 0 && (
              <div className="order-error">
                Impossible de valider la commande : certains produits n&apos;ont pas assez de stock.
              </div>
            )}

            <button 
              className="btn-validate-order"
              onClick={handleValidate}
              disabled={!stockAvailable || isCheckingStock}
            >
              {isCheckingStock ? "Vérification des stocks..." : "Confirmer la commande"}
            </button>

            <Link to="/cart" className="btn-back-cart">
              ← Retour au panier
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
// src/pages/frontoffice/OrderSummary.jsx
import { useEffect, useState } from "react";
import { fetchPrestashop } from "../../hooks/useFetchPrestashop";
import { Link } from "react-router-dom";
import "./OrderSummary.css";

export default function OrderSummary() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrdersWithStatus() {
      const userdata = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!userdata) {
        setError("Aucun utilisateur connecté");
        setLoading(false);
        return;
      }

      try {
        const user = JSON.parse(userdata);
        const userID = user?.id;
        
        if (!userID) {
          setError("Utilisateur non trouvé");
          setLoading(false);
          return;
        }

        // Récupérer les commandes du client
        const orderResponse = await fetchPrestashop("orders", {
          urlRest: `filter[id_customer]=[${userID}]`,
        });
        
        const rawOrder = orderResponse.data?.orders?.order;
        const orderIDs = []
          .concat(rawOrder ?? [])
          .map((o) => o?.["@_id"])
          .filter(Boolean);

        if (orderIDs.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        // Récupérer les détails de chaque commande
        const ordersDetails = await Promise.all(
          orderIDs.map((id) =>
            fetchPrestashop(`orders/${id}`, { urlRest: "" })
          )
        );

        // Récupérer les status de chaque commande
        const ordersWithStatus = await Promise.all(
          ordersDetails.map(async (orderDetail) => {
            const orderData = orderDetail.data?.order;
            const statusId = orderData?.current_state?.["#cdata"];
            
            if (statusId) {
              const statusResponse = await fetchPrestashop(`order_states/${statusId}`, { urlRest: "" });
              const statusName = statusResponse.data?.order_state?.name?.language?.["#cdata"] || "Statut inconnu";
              return {
                ...orderData,
                statusName,
                statusColor: statusResponse.data?.order_state?.color?.["#cdata"] || "#999"
              };
            }
            
            return {
              ...orderData,
              statusName: "Statut inconnu",
              statusColor: "#999"
            };
          })
        );

        setOrders(ordersWithStatus);
      } catch (err) {
        console.error("Failed to load orders", err);
        setError("Erreur lors du chargement des commandes");
      } finally {
        setLoading(false);
      }
    }

    loadOrdersWithStatus();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString || dateString === "0000-00-00 00:00:00") return "Non disponible";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadgeStyle = (statusName, statusColor) => {
    return {
      backgroundColor: `${statusColor}20`,
      color: statusColor,
      border: `1px solid ${statusColor}`,
    };
  };

  if (loading) {
    return (
      <div className="order-summary-loading">
        <div className="spinner"></div>
        <p>Chargement de vos commandes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-summary-error">
        <h2>Erreur</h2>
        <p>{error}</p>
        <Link to="/products" className="btn-continue-shopping">
          Retour aux produits
        </Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="order-summary-empty">
        <div className="empty-icon">📦</div>
        <h2>Aucune commande trouvée</h2>
        <p>Vous n&apos;avez pas encore passé de commande</p>
        <Link to="/products" className="btn-continue-shopping">
          Découvrir nos produits
        </Link>
      </div>
    );
  }

  return (
    <div className="order-summary">
      <h1>Mes Commandes</h1>
      
      <div className="orders-list">
        {orders.map((order) => {
          const orderId = order?.id?.["#cdata"];
          const totalPaid = order?.total_paid?.["#cdata"];
          const dateAdd = order?.date_add?.["#cdata"];
          const payment = order?.payment?.["#cdata"];
          const orderRows = order?.associations?.order_rows?.order_row || [];
          
          return (
            <div key={orderId} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <span className="order-number">Commande #{orderId}</span>
                  <span className="order-date">{formatDate(dateAdd)}</span>
                </div>
                <div 
                  className="order-status"
                  style={getStatusBadgeStyle(order.statusName, order.statusColor)}
                >
                  {order.statusName}
                </div>
              </div>
              
              <div className="order-products">
                {orderRows.map((row, idx) => (
                  <div key={idx} className="order-product-item">
                    <div className="product-details">
                      <span className="product-name">{row.product_name?.["#cdata"]}</span>
                      <span className="product-quantity">x{row.product_quantity?.["#cdata"]}</span>
                    </div>
                    <div className="product-price">
                      {parseFloat(row.unit_price_tax_incl?.["#cdata"] || 0).toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="order-footer">
                <div className="order-payment">
                  <span className="payment-label">Paiement :</span>
                  <span className="payment-method">{payment || "Non spécifié"}</span>
                </div>
                <div className="order-total">
                  <span className="total-label">Total :</span>
                  <span className="total-amount">{parseFloat(totalPaid || 0).toFixed(2)} €</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="order-actions">
        <Link to="/products" className="btn-continue">
          ← Continuer mes achats
        </Link>
      </div>
    </div>
  );
}
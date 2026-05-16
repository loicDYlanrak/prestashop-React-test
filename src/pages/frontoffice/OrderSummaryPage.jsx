// src/pages/frontoffice/OrderSummaryPage.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { addResource } from "../../hooks/useMutationPrestashop";
import "./OrderSummaryPage.css";

export default function OrderSummaryPage() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [orderError, setOrderError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }
    setUser(JSON.parse(storedUser));
    
    if (cart.length === 0) {
    //   navigate("/cart");
    }
  }, [navigate, cart]);

  const calculateItemPrice = (item) => {
    if (item.selectedCombination && item.selectedCombination.price > 0) {
      const totalHT = item.price / (1 + (item.taxRate || 20) / 100) + item.selectedCombination.price;
      return totalHT * (1 + (item.taxRate || 20) / 100);
    } else if (item.specificPrice && item.specificPrice < item.price) {
      return item.specificPrice;
    }
    return item.price;
  };

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + calculateItemPrice(item) * item.quantity;
    }, 0);
  };

  const handleValidateOrder = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    setOrderError(null);

    try {
      const orderRows = [];
      let totalPaidTTC = 0;

      for (const item of cart) {
        let attributeId = "0";

        if (item.selectedCombination && item.selectedCombination.id) {
          attributeId = item.selectedCombination.id.toString();
        }

        let itemPrice = calculateItemPrice(item);
        const itemTotalTTC = itemPrice * item.quantity;
        totalPaidTTC += itemTotalTTC;

        orderRows.push({
          product_id: item.id.toString(),
          product_attribute_id: attributeId,
          product_quantity: item.quantity.toString(),
        });
      }

      const cartId = localStorage.getItem("cartId");
      if (!cartId) {
        throw new Error("Aucun panier trouvé. Veuillez d'abord sauvegarder le panier.");
      }

      const orderData = {
        id_address_delivery: user?.addressId || "1",
        id_address_invoice: user?.addressId || "1",
        id_cart: cartId,
        id_currency: "1",
        id_lang: "1",
        id_customer: user?.id,
        id_carrier: "1",
        module: "ps_cashondelivery",
        valid: "1",
        id_shop_group: "1",
        id_shop: "1",
        payment: "Paiement comptant à la livraison (Cash on delivery)",
        recyclable: "0",
        gift: "0",
        gift_message: "",
        mobile_theme: "0",
        total_paid: totalPaidTTC.toFixed(8),
        total_paid_real: "0",
        total_products: "0",
        total_products_wt: "0",
        round_mode: "2",
        round_type: "2",
        conversion_rate: "1",
        associations: {
          order_rows: { order_row: orderRows },
        },
      };

      const response = await addResource("order", orderData, {});
      
      if (response && response.order) {
        setOrderSuccess(true);
        clearCart();
        localStorage.removeItem("cartId");
      } else {
        throw new Error("Erreur lors de la création de la commande");
      }
    } catch (error) {
      console.error("Order validation error:", error);
      setOrderError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="order-success-container">
        <div className="order-success-card">
          <div className="success-icon">✓</div>
          <h1>Commande validée !</h1>
          <p>Votre commande a été enregistrée avec succès.</p>
          <p className="success-message">Vous recevrez un email de confirmation dans les plus brefs délais.</p>
          <div className="success-actions">
            <Link to="/" className="btn-home">Retour à l&apos;accueil</Link>
            <Link to="/products" className="btn-continue-shop">Continuer mes achats</Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="order-summary-empty">
        <h2>Votre panier est vide</h2>
        <Link to="/products" className="btn-continue-shop">Voir les produits</Link>
      </div>
    );
  }

  return (
    <div className="order-summary-page">
      <h1>Récapitulatif de votre commande</h1>

      <div className="order-summary-container">
        <div className="order-items-section">
          <h2>Articles commandés</h2>
          <div className="order-items-list">
            {cart.map((item) => {
              const itemPrice = calculateItemPrice(item);
              const itemTotal = itemPrice * item.quantity;
              return (
                <div key={item.cartItemId} className="order-summary-item">
                  <img src={item.imageUrl} alt={item.name} className="order-item-image" />
                  <div className="order-item-details">
                    <h3>{item.name}</h3>
                    {item.selectedCombination && (
                      <div className="order-item-combination">
                        {item.selectedCombination.optionValues?.map((opt, idx) => (
                          <span key={idx}>{opt.groupName}: {opt.name}</span>
                        ))}
                      </div>
                    )}
                    <div className="order-item-quantity">Quantité: {item.quantity}</div>
                  </div>
                  <div className="order-item-price">{itemTotal.toFixed(2)} €</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="order-summary-sidebar">
          <div className="summary-card">
            <h3>Récapitulatif</h3>
            
            <div className="summary-line">
              <span>Sous-total</span>
              <span>{calculateCartTotal().toFixed(2)} €</span>
            </div>
            <div className="summary-line">
              <span>Livraison</span>
              <span>Gratuite</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-total">
              <span>Total TTC</span>
              <span>{calculateCartTotal().toFixed(2)} €</span>
            </div>

            <div className="delivery-info">
              <h4>Informations de livraison</h4>
              <p>
                {user?.firstname} {user?.lastname}<br />
                {user?.address || "Adresse non renseignée"}
              </p>
            </div>

            {orderError && (
              <div className="order-error">
                {orderError}
              </div>
            )}

            <button 
              className="btn-validate-order"
              onClick={handleValidateOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Validation en cours..." : "Confirmer la commande"}
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
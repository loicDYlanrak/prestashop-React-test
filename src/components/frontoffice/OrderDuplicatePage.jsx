import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { addResource } from "../../hooks/useMutationPrestashop";
import { fetchPrestashop } from "../../hooks/useFetchPrestashop";
import "../../pages/frontoffice/OrderSummaryPage.css";

export default function OrderDuplicatePage(ordersRows, nombre) {
  console.log("ordersRows", ordersRows);
  console.log("nombre", nombre);
  nombre = nombre * 1
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  if (!user) {
    // Ouvrir le modal de choix utilisateur
    const modalEvent = new CustomEvent("openUserModal");
    window.dispatchEvent(modalEvent);
    return;
  }
  const cartRows = [];
  const addressId = user?.addressId || "1";
  if (!Array.isArray(ordersRows)) {
    ordersRows = [ordersRows]
  }
  for (const item of ordersRows) {
    let attributeId = "0";
    console.log("item:", item)
    if (item?.ordersRows[0].product_attribute_id?.["cdata"]) {
      attributeId = item?.ordersRows[0].product_attribute_id?.["cdata"];
    }
    let productPending = null 
    const pending = async function () {    
      productPending = await fetchPrestashop(`products/${item.ordersRows[0].product_id?.["#cdata"]}`, {});
      console.log("productPending:", productPending)
      const stockIds = productPending.data.product.associations.stockAvailables.stockAvailable;
      console.log("stockIds:", stockIds)
      // const stockPending = await fetchPrestashop(`stockAvailables/${productPending}`) 
    }
    pending()


    cartRows.push({
      ...item.ordersRows[0],
      ...productPending,
      id_product: item.ordersRows[0].product_id?.["#cdata"],
      id_product_attribute: attributeId,
      id_address_delivery: addressId,
      id_customization: "0",
      quantity: (parseInt(item.ordersRows[0].product_quantity?.["#cdata"])) * parseInt(item.nombre),
    });
  }

  if (cartRows.length === 0) {
    console.error("Aucun produit valide dans le panier");
    return;
  }
  console.log("cartRows",cartRows)
  
  const cart = {cartRows : cartRows}

  const handleSaveOrder = async () => {
    const cartData = {
      id_address_delivery: addressId,
      id_address_invoice: addressId,
      id_currency: "1",
      id_customer: user?.id || "0",
      id_guest: user?.isAnonymous ? "1" : "0",
      id_lang: "1",
      id_shop_group: "1",
      id_shop: "1",
      id_carrier: "1",
      recyclable: "0",
      gift: "0",
      gift_message: "",
      mobile_theme: "0",
      delivery_option: '{"8":"1,"}',
      allow_seperated_package: "0",
      associations: {
        cart_rows: { cart_row: cartRows },
      },
    };

    const response = await addResource("cart", cartData, {});
    console.log("Cart Save Response:", response);

    if (response?.cart?.id?.["#cdata"]) {
      localStorage.setItem("cartId", response.cart.id["#cdata"]);
      // navigate("/order-summary");
    }
  };
  // const { cart, clearCart } = useCart();
  // const navigate = useNavigate();
  // const [isSubmitting, setIsSubmitting] = useState(false);
  // const [orderSuccess, setOrderSuccess] = useState(false);
  // const [user, setUser] = useState(null);
  // const [orderError, setOrderError] = useState(null);

  // useEffect(() => {
  //   const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
  //   if (!storedUser) {
  //     navigate("/");
  //     return;
  //   }
  //   setUser(JSON.parse(storedUser));

  //   if (cart.length === 0) {
  //   //   navigate("/cart");
  //   }
  // }, [navigate, cart]);

  const calculateItemPrice = (item) => {
    return item.product_price?.["#cdata"];
  };

  // const calculateCartTotal = () => {
  //   return cart.reduce((total, item) => {
  //     return total + calculateItemPrice(item) * item.quantity;
  //   }, 0);
  // };

  // const handleValidateOrder = async () => {
  //   if (!user) return;

  //   setIsSubmitting(true);
  //   setOrderError(null);

  //   try {
  //     const orderRows = [];
  //     let totalPaidTTC = 0;

  //     for (const item of cart) {
  //       let attributeId = "0";

  //       if (item.selectedCombination && item.selectedCombination.id) {
  //         attributeId = item.selectedCombination.id.toString();
  //       }

  //       let itemPrice = calculateItemPrice(item);
  //       const itemTotalTTC = itemPrice * item.quantity;
  //       totalPaidTTC += itemTotalTTC;

  //       orderRows.push({
  //         product_id: item.id.toString(),
  //         product_attribute_id: attributeId,
  //         product_quantity: item.quantity.toString(),
  //       });
  //     }

  //     const cartId = localStorage.getItem("cartId");
  //     if (!cartId) {
  //       throw new Error("Aucun panier trouvé. Veuillez d'abord sauvegarder le panier.");
  //     }

  //     const orderData = {
  //       id_address_delivery: user?.addressId || "1",
  //       id_address_invoice: user?.addressId || "1",
  //       id_cart: cartId,
  //       id_currency: "1",
  //       id_lang: "1",
  //       id_customer: user?.id,
  //       id_carrier: "1",
  //       module: "ps_cashondelivery",
  //       valid: "1",
  //       id_shop_group: "1",
  //       id_shop: "1",
  //       payment: "Paiement comptant à la livraison (Cash on delivery)",
  //       recyclable: "0",
  //       gift: "0",
  //       gift_message: "",
  //       mobile_theme: "0",
  //       total_paid: totalPaidTTC.toFixed(8),
  //       total_paid_real: "0",
  //       total_products: "0",
  //       total_products_wt: "0",
  //       round_mode: "2",
  //       round_type: "2",
  //       conversion_rate: "1",
  //       associations: {
  //         order_rows: { order_row: orderRows },
  //       },
  //     };

  //     const response = await addResource("order", orderData, {});

  //     if (response && response.order) {
  //       setOrderSuccess(true);
  //       clearCart();
  //       localStorage.removeItem("cartId");
  //     } else {
  //       throw new Error("Erreur lors de la création de la commande");
  //     }
  //   } catch (error) {
  //     console.error("Order validation error:", error);
  //     setOrderError(error.message);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  // if (orderSuccess) {
  //   return (
  //     <div className="order-success-container">
  //       <div className="order-success-card">
  //         <div className="success-icon">✓</div>
  //         <h1>Commande validée !</h1>
  //         <p>Votre commande a été enregistrée avec succès.</p>
  //         <p className="success-message">Vous recevrez un email de confirmation dans les plus brefs délais.</p>
  //         <div className="success-actions">
  //           <Link to="/" className="btn-home">Retour à l&apos;accueil</Link>
  //           <Link to="/products" className="btn-continue-shop">Continuer mes achats</Link>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // if (cart.length === 0) {
  //   return (
  //     <div className="order-summary-empty">
  //       <h2>Votre panier est vide</h2>
  //       <Link to="/products" className="btn-continue-shop">Voir les produits</Link>
  //     </div>
  //   );
  // }

  return (
    <div className="order-summary-page">
      <h1>Récapitulatif de votre commande Dupliquer</h1>

      <div className="order-summary-container">
        <div className="order-items-section">
          <h2>Articles commandés</h2>
          <div className="order-items-list">
            {cart.cartRows.map((item) => {
              const itemPrice = calculateItemPrice(item);
              const itemTotal = itemPrice * item.quantity;
              return (
                <div key={item.id?.["#cdata"]} className="order-summary-item">
                  <img src={item.imageUrl} alt={item.name} className="order-item-image" />
                  <div className="order-item-details">
                    <h3>{item.product_name?.["#cdata"]}</h3>
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
            {/* <h3>Récapitulatif</h3> */}

            {/* <div className="summary-line">
              <span>Sous-total</span>
              <span>{calculateCartTotal().toFixed(2)} €</span>
            </div>
            <div className="summary-line">
              <span>Livraison</span>
              <span>Gratuite</span>
            </div> */}
            {/* <div className="summary-divider"></div> */}
            <div className="summary-total">
              {/* <span>Total TTC</span> */}
              {/* <span>{calculateCartTotal().toFixed(2)} €</span> */}
            </div>

            {/* {orderError && (
              <div className="order-error">
                {orderError}
              </div>
            )} */}

            {/* <button 
              className="btn-validate-order"
              onClick={handleValidateOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Validation en cours..." : "Confirmer la commande"}
            </button> */}

            <Link to="/cart" className="btn-back-cart">
              ← Retour au panier
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

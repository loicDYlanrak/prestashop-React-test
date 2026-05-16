// src/pages/frontoffice/CartPage.jsx
import { useCart } from "../../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import "./CartPage.css";
import { addResource } from "../../hooks/useMutationPrestashop";

export default function CartPage() {
  const { cart, cartTotal, removeFromCart, updateQuantity, clearCart } =
    useCart();
  const navigate = useNavigate();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity >= 1) {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
  };

  const handleClearCart = () => {
    if (window.confirm("Voulez-vous vraiment vider votre panier ?")) {
      clearCart();
    }
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  const handleValidateCart = async () => {
    const cartRows = [];
    const addressId = JSON.parse(localStorage.getItem("addressId")); 

    for (const item of cart.panier) {
      const productInfo = cart.products.find(
        (product) => product.reference === item.product_reference
      ); 

      if (!productInfo) continue;

      let attributeId = "0";
      if (item.attribute_name) {
        const targetValue = item.attribute_name.toLowerCase();
        const productRef = item.product_reference;

        for (let [key, value] of Object.entries(productInfo.combinations)) {
          const keyParts = key.split("|");
          const keyRef = keyParts[0];
          const keyValue = keyParts[keyParts.length - 1];

          if (keyRef === productRef && keyValue.toLowerCase() === targetValue) {
            attributeId = value;
            break;
          }
        }
      }

      cartRows.push({
        id_product: productInfo.id.toString(),
        id_product_attribute: attributeId,
        id_address_delivery: addressId,
        id_customization: "0",
        quantity: item.quantity.toString(),
      });
    }

    if (cartRows.length === 0) {
      console.error("Aucun produit valide dans le panier");
      return;
    }

    const cartData = {
      id_address_delivery: addressId,
      id_address_invoice: addressId,
      id_currency: "1",
      id_customer: JSON.parse(localStorage.getItem("customerId")), // Retrieve customerId from localStorage
      id_guest: 0,
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
  };

  const handleValidateOrder = async () => {
    const orderRows = [];
    let totalProducts = 0;
    let totalPaidTTC = 0;
    const addressId = JSON.parse(localStorage.getItem("addressId")); // Retrieve addressId from localStorage
    const customerId = JSON.parse(localStorage.getItem("customerId")); // Retrieve customerId from localStorage

    for (const item of cart.panier) {
      const productInfo = cart.products.find(
        (product) => product.reference === item.product_reference
      ); // Replace entityCache with cart.products

      if (!productInfo) continue;

      let attributeId = "0";
      if (item.attribute_name) {
        const targetValue = item.attribute_name.toLowerCase();
        const productRef = item.product_reference;

        for (let [key, value] of Object.entries(productInfo.combinations)) {
          const keyParts = key.split("|");
          const keyRef = keyParts[0];
          const keyValue = keyParts[keyParts.length - 1];

          if (keyRef === productRef && keyValue.toLowerCase() === targetValue) {
            attributeId = value;
            break;
          }
        }
      }

      const itemPrice = productInfo.price;
      const taxRate = productInfo.taxRate || 20; // Default tax rate is 20%
      const itemPriceTTC = itemPrice * (1 + taxRate / 100) * item.quantity; // Calculate price with tax
      totalPaidTTC += itemPriceTTC;

      orderRows.push({
        product_id: productInfo.id.toString(),
        product_attribute_id: attributeId,
        product_quantity: item.quantity.toString(),
      });

      totalProducts += item.quantity;
    }

    if (orderRows.length === 0) {
      console.error("Aucun produit valide dans la commande");
      return;
    }

    const orderData = {
      id_address_delivery: addressId,
      id_address_invoice: addressId,
      id_cart: JSON.parse(localStorage.getItem("cartId")), 
      id_currency: "1",
      id_lang: "1",
      id_customer: customerId,
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
      total_products: totalProducts.toFixed(8),
      total_products_wt: "0",
      round_mode: "2",
      round_type: "2",
      conversion_rate: "1",
      associations: {
        order_rows: { order_row: orderRows },
      },
    };


    const response = await addResource("order", orderData, {});
    console.log("Order Save Response:", response);
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-icon">🛒</div>
        <h2>Votre panier est vide</h2>
        <p>Découvrez nos produits et ajoutez-les à votre panier</p>
        <Link to="/products" className="btn-continue-shopping">
          Découvrir nos produits
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Mon Panier</h1>

      <div className="cart-container">
        <div className="cart-items">
          <div className="cart-header">
            <div>Produit</div>
            <div>Prix</div>
            <div>Quantité</div>
            <div>Total</div>
            <div></div>
          </div>

          {cart.map((item) => {
            const getItemPrice = (item) => {
              if (
                item.selectedCombination &&
                item.selectedCombination.price > 0
              ) {
                const totalHT =
                  item.price / (1 + (item.taxRate || 20) / 100) +
                  item.selectedCombination.price;
                return totalHT * (1 + (item.taxRate || 20) / 100);
              }
              return item.specificPrice || item.price;
            };

            const itemPrice = getItemPrice(item);
            const itemTotal = itemPrice * item.quantity;
            return (
              <div key={item.id} className="cart-item">
                <div className="cart-item-product">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="cart-item-image"
                  />
                  <div className="cart-item-info">
                    <h3>{item.name}</h3>
                    {item.reference && !item.selectedCombination && (
                      <span className="cart-item-ref">
                        Réf: {item.reference}
                      </span>
                    )}
                    {item.selectedCombination && (
                      <div className="cart-item-combination">
                        <span className="cart-item-ref">
                          Réf:{" "}
                          {item.combinationReference ||
                            item.selectedCombination.reference}
                        </span>
                        <div className="combination-details">
                          {item.selectedCombination.optionValues?.map(
                            (opt, idx) => (
                              <span key={idx} className="combination-option">
                                {opt.groupName}: {opt.name}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="cart-item-price">
                  {item.specificPrice && item.specificPrice < item.price ? (
                    <div className="cart-price-wrapper">
                      <span className="cart-old-price">
                        {item.price.toFixed(2)} €
                      </span>
                      <span className="cart-new-price">
                        {item.specificPrice.toFixed(2)} €
                      </span>
                    </div>
                  ) : (
                    <span>{itemPrice.toFixed(2)} €</span>
                  )}
                </div>

                <div className="cart-item-quantity">
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity - 1)
                    }
                    className="quantity-btn"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(
                        item.id,
                        parseInt(e.target.value) || 1,
                      )
                    }
                    min="1"
                    max={item.quantity}
                    className="quantity-input"
                  />
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity + 1)
                    }
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>

                <div className="cart-item-total">{itemTotal.toFixed(2)} €</div>

                <div className="cart-item-remove">
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="remove-btn"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cart-summary">
          <h3>Résumé de la commande</h3>

          <div className="summary-row">
            <span>Nombre d&apos;articles :</span>
            <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>

          <div className="summary-row">
            <span>Sous-total :</span>
            <span>{cartTotal.toFixed(2)} €</span>
          </div>

          <div className="summary-row">
            <span>Livraison :</span>
            <span>Calculé à l&apos;étape suivante</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-total">
            <span>Total TTC :</span>
            <span>{cartTotal.toFixed(2)} €</span>
          </div>

          <div className="cart-actions">
            <button onClick={handleClearCart} className="btn-clear">
              Vider le panier
            </button>
            <button onClick={handleCheckout} className="btn-checkout">
              Valider la commande →
            </button>
            <button onClick={handleValidateCart}>Valider Panier</button>
            <button onClick={handleValidateOrder}>Valider Commande</button>
          </div>

          <Link to="/products" className="btn-continue">
            ← Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}

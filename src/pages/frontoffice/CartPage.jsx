// src/pages/frontoffice/CartPage.jsx
import { useCart } from "../../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import "./CartPage.css";

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
          </div>

          <Link to="/products" className="btn-continue">
            ← Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}

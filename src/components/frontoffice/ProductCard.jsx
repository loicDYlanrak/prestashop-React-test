/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const hasDiscount =
    product.specificPrice > 0 && product.specificPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.price - product.specificPrice) / product.price) * 100,
      )
    : 0;
  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };
  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    console.log("Ajout au panier:", product);
  };
  return (
    <div className="product-card" onClick={handleCardClick}>
      {product.badge && (
        <div className={`product-badge ${product.badge === "HOT" ? "badge-hot" : "badge-new"}`}>
          {product.badge}
        </div>
      )}
      <div className="product-image">
        <img src={product.imageUrl} alt={product.name} />
        {hasDiscount && (
          <span className="discount-badge">-{discountPercent}%</span>
        )}
        {!product.active && (
          <span className="inactive-badge">Indisponible</span>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}

        <div className="product-pricing">
          {hasDiscount ? (
            <>
              <span className="original-price">
                {product.price.toFixed(2)} €
              </span>
              <span className="discount-price">
                {product.specificPrice.toFixed(2)} €
              </span>
            </>
          ) : (
            <span className="price">{product.price.toFixed(2)} €</span>
          )}
        </div>

        {product.quantity > 0 ? (
          <div className="stock-badge in-stock">✔ En stock</div>
        ) : (
          <div className="stock-badge out-stock">✗ Rupture</div>
        )}

        <button className="btn-add-to-cart" onClick={handleAddToCart}>
          🛒 Ajouter au panier
        </button>
      </div>
    </div>
  );
}

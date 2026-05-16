/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
// contexts/CartContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);

  useEffect(() => {
    // Charger le panier depuis localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    // Sauvegarder le panier dans localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    // Calculer le total
    const total = cart.reduce((sum, item) => {
      const price = item.specificPrice || item.price;
      return sum + price * item.quantity;
    }, 0);
    setCartTotal(total);
  }, [cart]);

  const addToCart = (product, quantity = 1, selectedCombination = null) => {
    setCart((currentCart) => {
      // Créer un identifiant unique basé sur le produit et la combinaison
      const itemId = selectedCombination
        ? `${product.id}_${selectedCombination.id}`
        : `${product.id}`;

      const existingItem = currentCart.find(
        (item) => item.cartItemId === itemId,
      );

      const cartItem = {
        ...product,
        cartItemId: itemId,
        quantity,
        selectedCombination: selectedCombination,
        combinationId: selectedCombination?.id || null,
        combinationReference: selectedCombination?.reference || null,
        combinationPrice: selectedCombination?.price || 0,
      };

      if (existingItem) {
        return currentCart.map((item) =>
          item.cartItemId === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [...currentCart, cartItem];
    });
  };
  const removeFromCart = (cartItemId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.cartItemId !== cartItemId),
    );
  };

  const updateQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item,
      ),
    );
  };
  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

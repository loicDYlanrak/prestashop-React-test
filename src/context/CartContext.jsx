/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
// contexts/CartContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { fetchPrestashop, getOptionAndValueNames } from "../hooks/useFetchPrestashop.js";

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
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));

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

  const loadCartFromPrestashop = async (customerId) => {
  try {
    const responseCarts = await fetchPrestashop("carts", {
      urlRest: `filter[id_customer]=[${customerId}]`,
    });
    
    const cartsData = responseCarts.data?.carts?.cart;
    const cartsArray = Array.isArray(cartsData)
      ? cartsData
      : cartsData
        ? [cartsData]
        : [];
    
    if (cartsArray.length === 0) return null;
    
    const idsCarts = cartsArray.map((cart) => cart.id?.["#cdata"] || cart["@_id"]);
    
    const idsCartWithoutOrder = [];
    for (const idCart of idsCarts) {
      const responseOrders = await fetchPrestashop("orders", {
        urlRest: `filter[id_cart]=[${idCart}]`,
      });
      const ordersData = responseOrders.data?.orders?.order;
      const ordersArray = Array.isArray(ordersData)
        ? ordersData
        : ordersData
          ? [ordersData]
          : [];
      if (ordersArray.length === 0) {
        idsCartWithoutOrder.push(idCart);
      }
    }
    // console.log("idsCartWithoutOrder: ", idsCartWithoutOrder);
    if (idsCartWithoutOrder.length === 0) return null;
    
    const lastCartId = idsCartWithoutOrder[idsCartWithoutOrder.length - 1];
    const responseCartDetails = await fetchPrestashop(`carts/${lastCartId}`);
    const cartDetails = responseCartDetails.data?.cart;
    
    if (!cartDetails || !cartDetails.associations?.cart_rows) return null;
    
    const cartRows = cartDetails.associations.cart_rows.cart_row;
    const cartItems = Array.isArray(cartRows) ? cartRows : [cartRows];
    
    const loadedCart = [];
    for (const row of cartItems) {
      const productId = row.id_product?.["#cdata"];
      const combinationId = row.id_product_attribute?.["#cdata"];
      const quantity = parseInt(row.quantity?.["#cdata"] || 0);
      
      if (quantity <= 0) continue;
      
      const productResponse = await fetchPrestashop(`products/${productId}`);
      const productData = productResponse.data?.product;
      
      if (!productData) continue;
      
      let selectedCombination = null;
      if (combinationId && combinationId !== "0") {
        const comboResponse = await fetchPrestashop(`combinations/${combinationId}`);
        const comboData = comboResponse.data?.combination;
        // console.log("comboData:", comboData)
        const nameOption = await getOptionAndValueNames(combinationId)
        console.log("nameOption:", nameOption)
        if (comboData) {
          selectedCombination = {
            id: parseInt(comboData.id?.["#cdata"]),
            reference:  nameOption?.[0]?.groupName+"-"+nameOption?.[0]?.optionName || "",
            price: parseFloat(comboData.price?.["#cdata"] || 0),
            quantity: quantity
          };
        }
      }
      
      const transformedProduct = await transformPrestashopProduct(productData);
      
      const itemId = selectedCombination
        ? `${productId}_${combinationId}`
        : `${productId}`;
      
      loadedCart.push({
        ...transformedProduct,
        cartItemId: itemId,
        quantity: quantity,
        selectedCombination: selectedCombination,
        combinationId: selectedCombination?.id || null,
        combinationReference: selectedCombination?.reference || null,
        combinationPrice: selectedCombination?.price || 0,
      });
    }
    console.log("loadedCart:", loadedCart)
    if (loadedCart.length > 0) {
      setCart(loadedCart);
      return loadedCart;
    }
    
    return null;
  } catch (error) {
    console.error("Error loading cart from PrestaShop:", error);
    return null;
  }
};

const transformPrestashopProduct = async (productData) => {
  const priceHT = parseFloat(productData.price?.["#cdata"] || 0);
  let taxRate = 20;
  
  const idTaxRuleGroup = productData?.id_tax_rules_group?.["#cdata"];
  if (idTaxRuleGroup) {
    try {
      const taxeRule = `&filter[id_tax_rules_group]=${idTaxRuleGroup}&filter[id_country]=8`;
      const response = await fetchPrestashop("tax_rules", { urlRest: taxeRule });
      if (response?.data?.tax_rules?.tax_rule?.["@_id"]) {
        const idTaxRule = response.data.tax_rules.tax_rule["@_id"];
        const response2 = await fetchPrestashop(`tax_rules/${idTaxRule}`);
        if (response2?.data?.tax_rule?.id_tax?.["#cdata"]) {
          const idTax = response2.data.tax_rule.id_tax["#cdata"];
          const response3 = await fetchPrestashop(`taxes/${idTax}`);
          if (response3?.data?.tax?.rate?.["#cdata"]) {
            taxRate = parseFloat(response3.data.tax.rate["#cdata"]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching tax rate:", error);
    }
  }
  
  const priceTTC = priceHT * (1 + taxRate / 100);
  
  // Vérifier les prix spécifiques
  let finalPrice = priceTTC;
  let specificPriceValue = 0;
  
  const specificPriceResponse = await fetchPrestashop("specific_prices", {
    urlRest: `filter[id_product]=[${productData.id?.["#cdata"]}]`,
  });
  
  if (specificPriceResponse.data?.specific_prices?.specific_price) {
    const specificPricesData = specificPriceResponse.data.specific_prices.specific_price;
    const specificPrice = Array.isArray(specificPricesData) ? specificPricesData[0] : specificPricesData;
    
    if (specificPrice && specificPrice.reduction?.["#cdata"]) {
      const reduction = parseFloat(specificPrice.reduction["#cdata"]);
      const reductionType = specificPrice.reduction_type?.["#cdata"];
      
      if (reductionType === "percentage") {
        finalPrice = priceTTC * (1 - reduction);
        specificPriceValue = finalPrice;
      } else if (reductionType === "amount") {
        finalPrice = priceTTC - reduction;
        specificPriceValue = finalPrice;
      }
    }
  }
  
  let imageUrl = "https://placehold.co/400?text=Product";
  const imagesData = productData.associations?.images?.image;
  if (imagesData) {
    const imageId = Array.isArray(imagesData)
      ? imagesData[0]?.id?.["#cdata"]
      : imagesData?.id?.["#cdata"];
    if (imageId && productData.id?.["#cdata"]) {
      imageUrl = `http://localhost/prestashop2/api/images/products/${productData.id["#cdata"]}/${imageId}?ws_key=2LA1668U53GC9T35AIT5Y3P7E8CKG7LL`;
    }
  }
  
  return {
    id: parseInt(productData.id?.["#cdata"]),
    name: productData.name?.language?.["#cdata"] || "",
    price: finalPrice,
    specificPrice: specificPriceValue,
    imageUrl: imageUrl,
    reference: productData.reference?.["#cdata"] || "",
    taxRate: taxRate,
  };
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
        loadCartFromPrestashop
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

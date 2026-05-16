/* eslint-disable react-hooks/exhaustive-deps */
// ProductDetail.jsx
import { useCart } from "../../context/CartContext";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useFetchAllProduits,
  fetchPrestashop,
} from "../../hooks/useFetchPrestashop";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading: productsLoading, data: allProducts } =
    useFetchAllProduits("products");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [selectedCombination, setSelectedCombination] = useState(null);
  const [combinationStock, setCombinationStock] = useState(0);
  const { addToCart } = useCart();
  const [specificPrices, setSpecificPrices] = useState([]);

  useEffect(() => {
    const findProduct = async () => {
      await fetchSpecificPrices();
      if (!allProducts || allProducts.length === 0) return;

      const foundProduct = allProducts.find(
        (item) => parseInt(item.product.id?.["#cdata"]) === parseInt(id),
      );

      if (foundProduct) {
        const transformedProduct = await transformSingleProduct(foundProduct);
        setProduct(transformedProduct);
        setSelectedImage(transformedProduct.imageUrl);

        if (foundProduct.product.associations?.combinations?.combination) {
          await fetchCombinations(foundProduct.product);
        }

        if (
          transformedProduct.categoryId &&
          transformedProduct.categoryId.length > 0
        ) {
          const sameCategoryProducts = await getRelatedProducts(
            transformedProduct.categoryId[0],
            transformedProduct.id,
          );
          setRelatedProducts(sameCategoryProducts);
        }
      } else {
        await fetchSingleProduct();
      }

      setLoading(false);
    };

    findProduct();
  }, [id, allProducts]);

  const fetchCombinations = async (productData) => {
    try {
      const combinationsData =
        productData.associations?.combinations?.combination;
      if (!combinationsData) {
        setCombinations([]);
        return;
      }

      const combinationArray = Array.isArray(combinationsData)
        ? combinationsData
        : [combinationsData];

      // Récupérer les IDs des combinaisons
      const combinationsId = combinationArray.map(
        (combo) => combo.id?.["#cdata"],
      );

      // 1. Récupérer les détails de chaque combinaison
      const combinationsDetails = await Promise.all(
        combinationsId.map(async (id) => {
          const comboResponse = await fetchPrestashop(`combinations/${id}`);
          return comboResponse.data;
        }),
      );

      // 2. Récupérer les option values pour chaque combinaison (plusieurs attributs possibles)
      const allCombinationsWithOptionValues = await Promise.all(
        combinationsDetails.map(async (comboDetail) => {
          const productOptionValues =
            comboDetail?.combination?.associations?.product_option_values
              ?.product_option_value;

          let optionValueIds = [];
          if (productOptionValues) {
            if (Array.isArray(productOptionValues)) {
              optionValueIds = productOptionValues
                .map((value) => value?.id?.["#cdata"])
                .filter(Boolean);
            } else {
              optionValueIds = [productOptionValues?.id?.["#cdata"]].filter(
                Boolean,
              );
            }
          }

          return {
            combinationId: comboDetail.combination.id?.["#cdata"],
            optionValueIds: optionValueIds,
            price: parseFloat(comboDetail?.combination?.price?.["#cdata"] || 0),
            reference: comboDetail?.combination?.reference?.["#cdata"] || "",
            ean13: comboDetail?.combination?.ean13?.["#cdata"] || "",
            defaultOn: comboDetail?.combination?.default_on?.["#cdata"] === "1",
            imageId: comboDetail?.combination?.id_image?.["#cdata"],
          };
        }),
      );

      // 3. Récupérer tous les IDs d'option values uniques
      const allOptionValueIds = allCombinationsWithOptionValues.flatMap(
        (combo) => combo.optionValueIds || [],
      );
      const uniqueOptionValueIds = [...new Set(allOptionValueIds)];

      // 4. Récupérer les détails de tous les option values
      const optionValuesDetails = await Promise.all(
        uniqueOptionValueIds.map(async (id) => {
          const optionValueResponse = await fetchPrestashop(
            `product_option_values/${id}`,
          );
          return optionValueResponse.data;
        }),
      );

      // 5. Construire les option values avec leurs infos
      const optionsProductValues = optionValuesDetails.map((optionValue) => ({
        id: optionValue.product_option_value.id?.["#cdata"],
        name: optionValue.product_option_value.name?.language?.["#cdata"],
        groupId:
          optionValue.product_option_value.id_attribute_group?.["#cdata"],
      }));

      // 6. Récupérer les noms des groupes d'options
      const groupIds = [
        ...new Set(
          optionsProductValues.map((opt) => opt.groupId).filter(Boolean),
        ),
      ];

      const optionsProductsDetails = await Promise.all(
        groupIds.map(async (groupId) => {
          const optionResponse = await fetchPrestashop(
            `product_options/${groupId}`,
          );
          return optionResponse.data;
        }),
      );

      const optionsDetails = optionsProductsDetails.map((product) => ({
        id: product.product_option.id?.["#cdata"],
        name: product.product_option.name?.language?.["#cdata"],
      }));

      // 7. Associer les noms de groupes
      const optionsWithValues = optionsProductValues.map((optionValue) => {
        const optionDetail = optionsDetails.find(
          (option) => option.id === optionValue.groupId,
        );
        return {
          ...optionValue,
          groupName: optionDetail ? optionDetail.name : "Unknown Group",
        };
      });

      // 8. Récupérer les stocks
      const stocksData =
        productData.associations?.stock_availables?.stock_available;
      const stockArray = stocksData
        ? Array.isArray(stocksData)
          ? stocksData
          : [stocksData]
        : [];

      let stocks = stockArray.map((stock) => ({
        id: stock.id?.["#cdata"],
        attributeId: stock.id_product_attribute?.["#cdata"],
        quantity: parseInt(stock.quantity?.["#cdata"] || 0),
      }));

      // Récupérer les détails complets des stocks
      const stocksDetails = await Promise.all(
        stocks.map(async (stock) => {
          if (stock.id) {
            const stockResponse = await fetchPrestashop(
              `stock_availables/${stock.id}`,
            );
            return stockResponse.data;
          }
          return null;
        }),
      );

      stocks = stocks.map((stock) => {
        const stockDetail = stocksDetails.find(
          (detail) => detail?.stock_available?.id?.["#cdata"] === stock.id,
        );
        return {
          ...stock,
          quantity: parseInt(
            stockDetail?.stock_available?.quantity?.["#cdata"] ||
              stock.quantity,
          ),
        };
      });

      // 9. Construire les combinaisons finales avec TOUS les attributs
      const finalCombinations = allCombinationsWithOptionValues.map((combo) => {
        const stock = stocks.find((s) => s.attributeId === combo.combinationId);

        // Récupérer TOUS les option values pour cette combinaison
        const optionValues = combo.optionValueIds.map((optionValueId) => {
          const optionValue = optionsWithValues.find(
            (opt) => opt.id === optionValueId,
          );
          return {
            id: optionValue?.id,
            name: optionValue?.name || "",
            groupName: optionValue?.groupName || "",
            groupId: optionValue?.groupId,
          };
        });

        let combinationImageUrl = null;
        if (combo.imageId && combo.imageId !== "0") {
          combinationImageUrl = `http://localhost/prestashop/api/images/products/${id}/${combo.imageId}?ws_key=Q3971RIRQJVRL981S2KCEGBBMWILW8H1`;
        }

        return {
          id: parseInt(combo.combinationId),
          reference: combo.reference,
          ean13: combo.ean13,
          quantity: stock ? stock.quantity : 0,
          price: combo.price,
          optionValues: optionValues,
          imageUrl: combinationImageUrl,
          defaultOn: combo.defaultOn,
        };
      });

      // console.log(
      //   "Final combinations with multiple attributes:",
      //   finalCombinations,
      // );
      setCombinations(finalCombinations);

      if (finalCombinations.length > 0) {
        const defaultCombination =
          finalCombinations.find((c) => c.defaultOn) || finalCombinations[0];
        setSelectedCombination(defaultCombination);
        setCombinationStock(defaultCombination.quantity);

        if (defaultCombination.imageUrl) {
          setSelectedImage(defaultCombination.imageUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching combinations:", error);
    }
  };

  // Ajouter cette fonction dans le composant
  const fetchSpecificPrices = async () => {
    try {
      const response = await fetchPrestashop("specific_prices");
      if (response.success && response.data?.specific_prices?.specific_price) {
        const specificPricesData = response.data.specific_prices.specific_price;
        const pricesArray = Array.isArray(specificPricesData)
          ? specificPricesData
          : [specificPricesData];

        // Récupérer les détails complets de chaque prix spécifique
        const pricesWithDetails = await Promise.all(
          pricesArray.map(async (price) => {
            const priceId = price["@_id"];
            const detailResponse = await fetchPrestashop(
              `specific_prices/${priceId}`,
            );
            return detailResponse.data;
          }),
        );

        const formattedPrices = pricesWithDetails.map((detail) => ({
          id_product: detail.specific_price?.id_product?.["#cdata"],
          price: detail.specific_price?.price?.["#cdata"],
          reduction: detail.specific_price?.reduction?.["#cdata"],
          reduction_type: detail.specific_price?.reduction_type?.["#cdata"],
        }));

        setSpecificPrices(formattedPrices);
        console.log("Specific prices loaded:", formattedPrices);
      }
    } catch (error) {
      console.error("Error fetching specific prices:", error);
    }
  };

  // Gestion du changement de combinaison
  const handleCombinationChange = (combinationId) => {
    const combo = combinations.find((c) => c.id === parseInt(combinationId));
    if (combo) {
      setSelectedCombination(combo);
      setCombinationStock(combo.quantity);
      setQuantity(1); // Réinitialiser la quantité

      // Changer l'image si la combinaison a une image spécifique
      if (combo.imageUrl) {
        setSelectedImage(combo.imageUrl);
      } else if (product?.images?.[0]) {
        setSelectedImage(product.images[0].url);
      }
    }
  };

  const getGroupedOptions = () => {
    const groups = {};

    combinations.forEach((combo) => {
      combo.optionValues.forEach((option) => {
        if (!groups[option.groupName]) {
          groups[option.groupName] = [];
        }
        // Éviter les doublons
        if (!groups[option.groupName].find((o) => o.id === option.id)) {
          groups[option.groupName].push({
            id: option.id,
            name: option.name,
            groupId: option.groupId,
            combinationId: combo.id,
            quantity: combo.quantity,
          });
        }
      });
    });

    return groups;
  };

  const getCombinationsForOption = (groupId, optionId) => {
    return combinations.filter((combo) =>
      combo.optionValues.some(
        (opt) => opt.groupId === groupId && opt.id === optionId,
      ),
    );
  };
  const transformSingleProduct = async (item) => {
    const productData = item.product;
    // console.log("Transforming product:", productData);
    const name = productData.name?.language?.["#cdata"] || "";

    let description = "";
    let descriptionLong = "";

    if (productData.description_short?.language) {
      description = (
        productData.description_short.language["#cdata"] || ""
      ).replace(/<[^>]*>/g, "");
    }

    if (productData.description?.language) {
      descriptionLong = (
        productData.description.language["#cdata"] || ""
      ).replace(/<[^>]*>/g, "");
    }

    const idTaxeRuleGroupe = productData?.id_tax_rules_group?.["#cdata"];
    let taxRate = 20;
    try {
      const taxeRule = `&filter[id_tax_rules_group]=${idTaxeRuleGroupe}&filter[id_country]=8`;
      const response = await fetchPrestashop("tax_rules", {
        urlRest: taxeRule,
      });

      if (response?.data?.tax_rules?.tax_rule?.["@_id"]) {
        const idTaxeRule = response.data.tax_rules.tax_rule["@_id"];
        const response2 = await fetchPrestashop(`tax_rules/${idTaxeRule}`);

        if (response2?.data?.tax_rule?.id_tax?.["#cdata"]) {
          const idTaxe = response2.data.tax_rule.id_tax["#cdata"];
          const response3 = await fetchPrestashop(`taxes/${idTaxe}`);

          if (response3?.data?.tax?.rate?.["#cdata"]) {
            taxRate = parseFloat(response3.data.tax.rate["#cdata"]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching tax rate:", error);
    }

    const price = parseFloat(productData.price?.["#cdata"] || 0);
    const priceTTC = price * (1 + taxRate / 100);

    // Calculer la remise spécifique
    let specificPriceValue = 0;
    let finalPrice = priceTTC;
    let discountPercent = 0;

    const productId = productData.id?.["#cdata"];
    // console.log("Calculating specific price for product ID:", productId);
    // console.log("Available specific prices:", specificPrices);
    const productSpecificPrice = specificPrices.find(
      (sp) => sp.id_product == productId,
    );
    
    // console.log("Product specific price found:", productSpecificPrice);
    if (productSpecificPrice && productSpecificPrice.reduction) {
      
      const reduction = parseFloat(productSpecificPrice.reduction);
      if (productSpecificPrice.reduction_type === "percentage") {
        // console.log("Applying percentage reduction:", reduction);
        specificPriceValue = priceTTC * (1 - reduction);
        discountPercent = reduction * 100;
      } else if (productSpecificPrice.reduction_type === "amount") {
        // console.log("Applying amount reduction:", reduction);
        specificPriceValue = priceTTC - reduction;
        discountPercent = (reduction / priceTTC) * 100;
      }
      finalPrice = specificPriceValue;
    }

    let categoryIds = [];
    const categoriesData = productData.associations?.categories?.category;
    if (categoriesData) {
      if (Array.isArray(categoriesData)) {
        categoryIds = categoriesData
          .map((cat) => parseInt(cat.id?.["#cdata"]))
          .filter(Boolean);
      } else if (categoriesData?.id) {
        categoryIds = [parseInt(categoriesData.id["#cdata"])].filter(Boolean);
      }
    }

    let images = [];
    const imagesData = productData.associations?.images?.image;
    if (imagesData) {
      const imageArray = Array.isArray(imagesData) ? imagesData : [imagesData];
      for (const img of imageArray) {
        const imageId = img.id?.["#cdata"];
        if (imageId && productData.id?.["#cdata"]) {
          images.push({
            id: imageId,
            url: `http://localhost/prestashop/api/images/products/${productData.id["#cdata"]}/${imageId}?ws_key=Q3971RIRQJVRL981S2KCEGBBMWILW8H1`,
          });
        }
      }
    }

    const hasCombinations =
      productData.associations?.combinations?.combination &&
      (Array.isArray(productData.associations.combinations.combination)
        ? productData.associations.combinations.combination.length > 0
        : true);
    // console.log("Product has combinations:", hasCombinations);
    return {
      id: parseInt(productData.id?.["#cdata"]),
      name: name,
      description: description,
      descriptionLong: descriptionLong,
      price: finalPrice,
      specificPrice: finalPrice !== priceTTC ? finalPrice : 0,
      discountPercent: discountPercent,
      categoryId: categoryIds || [],
      imageUrl:
        images.length > 0
          ? images[0].url
          : "https://via.placeholder.com/600x600?text=No+Image",
      images: images,
      reference: productData.reference?.["#cdata"] || "",
      quantity: 0,
      active: productData.active?.["#cdata"] === "1",
      taxRate: taxRate,
      hasCombinations: hasCombinations,
    };
  };

  const fetchSingleProduct = async () => {
    try {
      const response = await fetchPrestashop(`products/${id}`);
      if (response.success && response.data?.product) {
        const transformed = await transformSingleProduct({
          product: response.data.product,
        });
        setProduct(transformed);
        setSelectedImage(transformed.imageUrl);

        if (response.data.product.associations?.combinations?.combination) {
          await fetchCombinations(response.data.product);
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };

  const getRelatedProducts = async (categoryId, currentProductId) => {
    if (!allProducts) return [];

    const related = [];
    for (const item of allProducts) {
      const productData = item.product;
      const productId = parseInt(productData.id?.["#cdata"]);

      if (productId === currentProductId) continue;

      let cats = [];
      const categoriesData = productData.associations?.categories?.category;
      if (categoriesData) {
        if (Array.isArray(categoriesData)) {
          cats = categoriesData
            .map((cat) => parseInt(cat.id?.["#cdata"]))
            .filter(Boolean);
        } else if (categoriesData?.id) {
          cats = [parseInt(categoriesData.id["#cdata"])].filter(Boolean);
        }
      }

      if (cats.includes(categoryId) && related.length < 4) {
        const transformed = await transformSingleProduct(item);
        related.push(transformed);
      }
    }

    return related;
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    const maxStock = selectedCombination
      ? combinationStock
      : product?.quantity || 0;
    if (value >= 1 && value <= maxStock) {
      setQuantity(value);
    }
  };

  const incrementQuantity = () => {
    const maxStock = selectedCombination
      ? combinationStock
      : product?.quantity || 0;
    if (quantity < maxStock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    const productToAdd = {
      ...product,
      selectedCombination: selectedCombination,
      selectedCombinationId: selectedCombination?.id,
    };

    // console.log("Ajout au panier:", {
    //   product: productToAdd,
    //   quantity: quantity,
    //   combination: selectedCombination,
    //   totalPrice: getCurrentPrice() * quantity,
    // });
    addToCart(productToAdd, quantity, selectedCombination);
  };

  const getCurrentPrice = () => {
    if (selectedCombination && selectedCombination.price > 0) {
      const totalHT =
        product?.price / (1 + (product?.taxRate || 20) / 100) +
        selectedCombination.price;
      return totalHT * (1 + (product?.taxRate || 20) / 100);
    }
    // console.log("product.specificPrice:", product.specificPrice);
    
    if (product?.specificPrice > 0 && product?.specificPrice < product?.price) {
      return product.specificPrice;
    }

    return product?.price || 0;
  };

  const getTotalStock = () => {
    if (combinations.length > 0) {
      // Si des combinaisons existent, faire la somme de toutes
      return combinations.reduce((total, combo) => total + combo.quantity, 0);
    }
    // Sinon retourner le stock du produit simple
    return product?.quantity || 0;
  };
  const getCurrentStock = () => {
    if (selectedCombination) {
      // console.log(
      //   "Stock de la combinaison sélectionnée:",
      //   selectedCombination.quantity,
      // );
      return selectedCombination.quantity;
    }
    return product?.quantity || 0;
  };

  const hasDiscount =
    product?.specificPrice > 0 &&
    product?.specificPrice < product?.price &&
    !selectedCombination;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.price - product.specificPrice) / product.price) * 100,
      )
    : 0;

  if (loading || productsLoading) {
    return (
      <div className="product-detail-loading">
        <div className="spinner"></div>
        <p>Chargement du produit...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-error">
        <h2>Produit non trouvé</h2>
        <p>
          Le produit que vous recherchez n&apos;existe pas ou a été supprimé.
        </p>
        <button onClick={() => navigate("/products")} className="btn-back">
          Retour aux produits
        </button>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <button onClick={() => navigate("/products")} className="btn-back">
        ← Retour aux produits
      </button>

      <div className="product-detail-container">
        {/* Galerie d'images */}
        <div className="product-gallery">
          <div className="main-image">
            <img src={selectedImage} alt={product.name} />
            {hasDiscount && (
              <span className="discount-badge-large">-{discountPercent}%</span>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-list">
              {product.images.map((img, index) => (
                <div
                  key={img.id}
                  className={`thumbnail ${selectedImage === img.url ? "active" : ""}`}
                  onClick={() => setSelectedImage(img.url)}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} - vue ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informations produit */}
        <div className="product-info-detail">
          <h1 className="product-title">{product.name}</h1>

          {product.reference && !selectedCombination && (
            <div className="product-reference">Réf: {product.reference}</div>
          )}

          {selectedCombination && selectedCombination.reference && (
            <div className="product-reference">
              Réf: {selectedCombination.reference}
            </div>
          )}

          <div className="product-pricing-detail">
            {hasDiscount && !selectedCombination ? (
              <div className="pricing-wrapper">
                <span className="original-price-detail">
                  {product.price.toFixed(2)} €
                </span>
                <span className="discount-price-detail">
                  {product.specificPrice.toFixed(2)} €
                </span>
                <span className="discount-badge-text">
                  Économisez{" "}
                  {(product.price - product.specificPrice).toFixed(2)} €
                </span>
              </div>
            ) : (
              <span className="price-detail">
                {getCurrentPrice().toFixed(2)} €
              </span>
            )}

            {product.taxRate && (
              <div className="tax-info">TTC · TVA {product.taxRate}%</div>
            )}
          </div>

          {/* Sélecteur de combinaisons */}
          {combinations.length > 0 && (
            <div className="combinations-selector">
              <h3>Options disponibles</h3>

              {Object.entries(getGroupedOptions()).map(
                ([groupName, options]) => (
                  <div key={groupName} className="option-group">
                    <label className="option-label">{groupName}</label>
                    <div className="option-values">
                      {options.map((option) => {
                        const availableCombos = getCombinationsForOption(
                          option.groupId,
                          option.id,
                        );
                        const isAvailable = availableCombos.some(
                          (combo) => combo.quantity > 0,
                        );
                        const selectedComboForOption =
                          selectedCombination?.optionValues.find(
                            (opt) =>
                              opt.groupId === option.groupId &&
                              opt.id === option.id,
                          );
                        const isSelected = selectedComboForOption !== undefined;

                        return (
                          <button
                            key={option.id}
                            className={`option-value-btn ${isSelected ? "selected" : ""} ${!isAvailable ? "disabled" : ""}`}
                            onClick={() => {
                              if (isAvailable) {
                                // Trouver la combinaison qui a cette option sélectionnée
                                const comboWithOption = combinations.find(
                                  (combo) =>
                                    combo.optionValues.some(
                                      (opt) => opt.id === option.id,
                                    ) && combo.quantity > 0,
                                );
                                if (comboWithOption) {
                                  handleCombinationChange(comboWithOption.id);
                                }
                              }
                            }}
                            disabled={!isAvailable}
                          >
                            {option.name}
                            {!isAvailable && (
                              <span className="out-of-stock-option">
                                (Rupture)
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}

              {/* Affichage des informations de la combinaison sélectionnée */}
              {selectedCombination && (
                <div className="selected-combination-info">
                  {selectedCombination.reference && (
                    <p>
                      <strong>Référence:</strong>{" "}
                      {selectedCombination.reference}
                    </p>
                  )}
                  {selectedCombination.ean13 && (
                    <p>
                      <strong>EAN13:</strong> {selectedCombination.ean13}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="stock-status">
            {getCurrentStock() > 0 ? (
              <div className="in-stock-detail">
                <span className="stock-icon">✔</span>
                {combinations.length > 0 ? (
                  <>
                    En stock {getCurrentStock()} disponible
                    {getCurrentStock() > 1 ? "s" : ""}
                    {getTotalStock() !== getCurrentStock() && (
                      <span className="total-stock-info">
                        {" "}
                        : {getTotalStock()} au total
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    En stock ({getCurrentStock()} disponible
                    {getCurrentStock() > 1 ? "s" : ""})
                  </>
                )}
              </div>
            ) : (
              <div className="out-stock-detail">
                <span className="stock-icon">✗</span>
                Rupture de stock
              </div>
            )}
          </div>
          {product.description && (
            <div className="product-description-short">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          {product.descriptionLong && (
            <div className="product-description-long">
              <h3>Détails du produit</h3>
              <p>{product.descriptionLong}</p>
            </div>
          )}

          {getCurrentStock() > 0 && (
            <div className="add-to-cart-section">
              <div className="quantity-selector">
                <button onClick={decrementQuantity} disabled={quantity <= 1}>
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  max={getCurrentStock()}
                />
                <button
                  onClick={incrementQuantity}
                  disabled={quantity >= getCurrentStock()}
                >
                  +
                </button>
              </div>

              <button
                className="btn-add-to-cart-detail"
                onClick={handleAddToCart}
              >
                Ajouter au panier · {(getCurrentPrice() * quantity).toFixed(2)}{" "}
                €
              </button>
            </div>
          )}

          {getCurrentStock() === 0 && (
            <button className="btn-out-of-stock" disabled>
              Rupture de stock
            </button>
          )}
        </div>
      </div>

      {/* Produits similaires */}
      {relatedProducts.length > 0 && (
        <div className="related-products">
          <h2>Produits similaires</h2>
          <div className="related-products-grid">
            {relatedProducts.map((relatedProduct) => (
              <div
                key={relatedProduct.id}
                className="related-product-card"
                onClick={() => navigate(`/product/${relatedProduct.id}`)}
              >
                <img src={relatedProduct.imageUrl} alt={relatedProduct.name} />
                <h4>{relatedProduct.name}</h4>
                <p className="related-price">
                  {relatedProduct.specificPrice &&
                  relatedProduct.specificPrice < relatedProduct.price ? (
                    <>
                      <span className="related-old-price">
                        {relatedProduct.price.toFixed(2)} €
                      </span>
                      <span className="related-new-price">
                        {relatedProduct.specificPrice.toFixed(2)} €
                      </span>
                    </>
                  ) : (
                    <span>{relatedProduct.price.toFixed(2)} €</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

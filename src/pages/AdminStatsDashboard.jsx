/* eslint-disable no-unused-vars */
// AdminStatsDashboard.jsx
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { fetchPrestashop } from "../hooks/useFetchPrestashop";
import "./AdminStatsDashboard.css";

export default function AdminStatsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Données principales
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockData, setStockData] = useState([]);
  // Ajoutez cet état avec les autres useState

  // Statistiques calculées
  const [stats, setStats] = useState({
    totalSales: 0, // CA total (ventes)
    totalPurchases: 0, // Coût total d'achat
    totalProfit: 0, // Bénéfice total
    profitMargin: 0, // Marge brute (%)
  });

  // Bénéfices par catégorie
  const [profitByCategory, setProfitByCategory] = useState([]);

  // Stock par catégorie
  const [stockByCategory, setStockByCategory] = useState([]);

  // Récupération des statuts de commandes
  // Récupération des statuts de commandes
  const fetchOrderStatuses = async () => {
    try {
      const response = await fetchPrestashop("order_states", {
        urlRest: "display=full",
      });
      if (response.success && response.data?.order_states?.order_state) {
        const statusesArray = Array.isArray(
          response.data.order_states.order_state,
        )
          ? response.data.order_states.order_state
          : [response.data.order_states.order_state];

        const statusMap = {};
        statusesArray.forEach((status) => {
          const id = status.id?.["#cdata"] || status.id;
          const name =
            status.name?.language?.["#cdata"] ||
            status.name?.language ||
            "Statut inconnu";
          if (id) {
            statusMap[id] = name;
          }
        });
      }
    } catch (error) {
      console.error("Error fetching order statuses:", error);
    }
  };

  // Récupération des catégories
  const fetchCategories = async () => {
    try {
      const response = await fetchPrestashop("categories", {
        urlRest: "display=full&limit=100",
      });
      if (response.success && response.data?.categories?.category) {
        let cats = response.data.categories.category;
        const catsArray = Array.isArray(cats) ? cats : [cats];

        const categoriesMap = catsArray.map((cat) => ({
          id: cat.id?.["#cdata"] || cat.id,
          name:
            cat.name?.language?.["#cdata"] || cat.name?.language || "Sans nom",
          level: cat.level_depth?.["#cdata"] || cat.level_depth || 1,
          idParent: cat.id_parent?.["#cdata"] || cat.id_parent,
        }));

        // Filtrer pour garder uniquement les catégories principales (niveau 1 ou 2)
        setCategories(categoriesMap);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Récupération des produits avec leurs prix d'achat (wholesale_price)
  const fetchProducts = async () => {
    try {
      const response = await fetchPrestashop("products", {
        urlRest: "display=full&limit=1000",
      });
      if (response.success && response.data?.products?.product) {
        let prods = response.data.products.product;
        const prodsArray = Array.isArray(prods) ? prods : [prods];

        const productsWithDetails = prodsArray.map((product) => ({
          id: product.id?.["#cdata"] || product.id,
          name: product.name?.language?.["#cdata"] || "Produit sans nom",
          wholesalePrice: parseFloat(product.wholesale_price?.["#cdata"] || 0),
          price: parseFloat(product.price?.["#cdata"] || 0),
          categoryId: getCategoryIdFromProduct(product),
          reference: product.reference?.["#cdata"] || "",
        }));

        setProducts(productsWithDetails);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Helper pour extraire l'ID de catégorie d'un produit
  const getCategoryIdFromProduct = (product) => {
    const categoriesData = product.associations?.categories?.category;
    if (categoriesData) {
      if (Array.isArray(categoriesData) && categoriesData.length > 0) {
        return categoriesData[0].id?.["#cdata"] || categoriesData[0].id;
      } else if (categoriesData?.id) {
        return categoriesData.id["#cdata"] || categoriesData.id;
      }
    }
    return null;
  };

  // Récupération des commandes avec leurs lignes de produits
  const fetchOrders = async () => {
    try {
      const response = await fetchPrestashop("orders", {
        urlRest: "display=full",
      });
      if (!response.success) {
        throw new Error("Erreur lors du chargement des commandes");
      }

      let ordersData = response.data?.orders?.order;
      if (!ordersData) {
        setOrders([]);
        return;
      }

      let ordersArray = Array.isArray(ordersData) ? ordersData : [ordersData];

      // Récupérer les détails complets de chaque commande
      const ordersWithDetails = await Promise.all(
        ordersArray.map(async (order) => {
          const orderId = order["@_id"] || order.id?.["#cdata"];
          if (!orderId) return order;

          try {
            const detailResponse = await fetchPrestashop(`orders/${orderId}`, {
              urlRest: "display=full",
            });
            if (detailResponse.success && detailResponse.data?.order) {
              return detailResponse.data.order;
            }
          } catch (err) {
            console.error(`Error fetching order ${orderId}:`, err);
          }
          return order;
        }),
      );

      setOrders(ordersWithDetails);
    } catch (err) {
      console.error("Failed to load orders", err);
      setError(err.message || "Erreur lors du chargement des commandes");
    }
  };

  // Récupération des stocks
  const fetchStocks = async () => {
    try {
      const response = await fetchPrestashop("stock_availables", {
        urlRest: "display=full",
      });
      if (
        response.success &&
        response.data?.stock_availables?.stock_available
      ) {
        let stocks = response.data.stock_availables.stock_available;
        const stocksArray = Array.isArray(stocks) ? stocks : [stocks];
        setStockData(stocksArray);
      }
    } catch (error) {
      console.error("Error fetching stocks:", error);
    }
  };

  // Calculer le stock par catégorie
  const calculateStockByCategory = () => {
    // Créer un mapping produitId -> catégorie
    const productCategoryMap = new Map();
    products.forEach((product) => {
      productCategoryMap.set(product.id, product.categoryId);
    });

    // Calculer les quantités réservées à partir des commandes avec statut 11
    const reservedQuantities = new Map(); // productId -> quantité réservée

    orders.forEach((order) => {
      const statusId = order.current_state?.["#cdata"] || order.current_state;

      // Ne prendre que les commandes avec statut "Paiement accepté" (id 11)
      if (statusId === "11") {
        const orderRows = order.associations?.order_rows?.order_row;
        if (!orderRows) return;

        const rowsArray = Array.isArray(orderRows) ? orderRows : [orderRows];

        rowsArray.forEach((row) => {
          const productId = row.product_id?.["#cdata"] || row.product_id;
          const productAttributeId =
            row.product_attribute_id?.["#cdata"] || row.product_attribute_id;
          const quantity = parseInt(
            row.product_quantity?.["#cdata"] || row.product_quantity || 0,
          );

          if (productId) {
            // Normaliser la clé : si pas d'attribut ou attribut "0", utiliser seulement productId
            let key;
            if (
              productAttributeId &&
              productAttributeId !== "0" &&
              productAttributeId !== 0
            ) {
              key = `${productId}_${productAttributeId}`;
            } else {
              key = productId;
            }

            const currentReserved = reservedQuantities.get(key) || 0;
            reservedQuantities.set(key, currentReserved + quantity);
          }
        });
      }
    });

    // console.log("Reserved Quantities Map:", reservedQuantities);

    // Regrouper les stocks par produit et combinaison
    const stocksByProductAndCombination = new Map(); // key -> stock object

    stockData.forEach((stock) => {
      const productId = stock.id_product?.["#cdata"] || stock.id_product;
      const productAttributeId =
        stock.id_product_attribute?.["#cdata"] || stock.id_product_attribute;
      const availableQuantity = parseInt(
        stock.quantity?.["#cdata"] || stock.quantity || 0,
      );

      // Normaliser la clé de la même façon que pour les réservations
      let key;
      if (
        productAttributeId &&
        productAttributeId !== "0" &&
        productAttributeId !== 0
      ) {
        key = `${productId}_${productAttributeId}`;
      } else {
        key = productId;
      }

      if (!stocksByProductAndCombination.has(productId)) {
        stocksByProductAndCombination.set(productId, []);
      }

      stocksByProductAndCombination.get(productId).push({
        key,
        productId,
        productAttributeId,
        availableQuantity,
        originalStock: stock,
      });
    });

    // Filtrer les stocks pour ne garder que les bons (dernier pour simple, tous sauf premier pour combinaisons)
    const filteredStocks = [];

    for (const [
      productId,
      stockList,
    ] of stocksByProductAndCombination.entries()) {
      if (stockList.length === 1) {
        // Produit sans combinaison : prendre le seul stock
        filteredStocks.push(stockList[0]);
      } else {
        // Produit avec combinaisons : prendre tous sauf le premier (stock parent)
        for (let i = 1; i < stockList.length; i++) {
          filteredStocks.push(stockList[i]);
        }
      }
    }

    // Initialiser le stock par catégorie
    const stockMap = new Map();

    filteredStocks.forEach((stock) => {
      const productId = stock.productId;
      const key = stock.key;
      const availableQuantity = stock.availableQuantity;
      const reservedQuantity = reservedQuantities.get(key) || 0;
      const physicalQuantity = availableQuantity + reservedQuantity;

      // console.log(`Reserved quantity for key ${key}: ${reservedQuantity}`);

      const categoryId = productCategoryMap.get(productId);
      if (categoryId) {
        if (!stockMap.has(categoryId)) {
          stockMap.set(categoryId, {
            categoryId,
            categoryName: "",
            physicalQuantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
          });
        }

        const catData = stockMap.get(categoryId);
        catData.physicalQuantity += physicalQuantity;
        catData.reservedQuantity += reservedQuantity;
        catData.availableQuantity += availableQuantity;
      }
    });

    // Ajouter les noms des catégories
    const stockArray = Array.from(stockMap.values()).map((item) => {
      const category = categories.find((c) => c.id == item.categoryId);
      return {
        ...item,
        categoryName: category?.name || `Catégorie #${item.categoryId}`,
      };
    });

    setStockByCategory(stockArray);
  };

  // Calculer les bénéfices par catégorie
  const calculateProfitByCategory = () => {
    // Créer un mapping produitId -> catégorie + prix d'achat
    const productInfoMap = new Map();
    products.forEach((product) => {
      productInfoMap.set(product.id, {
        categoryId: product.categoryId,
        wholesalePrice: product.wholesalePrice,
      });
    });

    // Initialiser les totaux par catégorie
    const categoryTotals = new Map();

    orders.forEach((order) => {
      const statusId = order.current_state?.["#cdata"];
      // Ne prendre que les commandes valides (non annulées)
      if (statusId === "6") return; // Annulée

      const orderRows = order.associations?.order_rows?.order_row;
      if (!orderRows) return;

      const rowsArray = Array.isArray(orderRows) ? orderRows : [orderRows];

      rowsArray.forEach((row) => {
        // console.log("row:", row)
        const productId = row.product_id?.["#cdata"];
        const quantity = parseInt(row.product_quantity?.["#cdata"] || 0);
        const unitPriceTaxIncl = parseFloat(
          row.unit_price_tax_excl?.["#cdata"] || 0,
        );
        // console.log("unitPriceTaxIncl:", unitPriceTaxIncl);
        const productInfo = productInfoMap.get(productId);
        // console.log(`Product ID ${productId} info:`, productInfo)
        if (productInfo && productInfo.categoryId) {
          const wholesalePrice = productInfo.wholesalePrice;
          const costForThisSale = wholesalePrice * quantity;
          const profitForThisSale =
            unitPriceTaxIncl * quantity - costForThisSale;

          if (!categoryTotals.has(productInfo.categoryId)) {
            categoryTotals.set(productInfo.categoryId, {
              categoryId: productInfo.categoryId,
              categoryName: "",
              totalSales: 0,
              totalPurchases: 0,
              totalProfit: 0,
              quantitySold: 0,
            });
          }

          const catData = categoryTotals.get(productInfo.categoryId);
          catData.totalSales += unitPriceTaxIncl * quantity;
          catData.totalPurchases += costForThisSale;
          catData.totalProfit += profitForThisSale;
          catData.quantitySold += quantity;
        }
      });
    });

    const profitArray = Array.from(categoryTotals.values()).map((item) => {
      const category = categories.find((c) => c.id == item.categoryId);
      return {
        ...item,
        categoryName: category?.name || `Catégorie #${item.categoryId}`,
        marginRate:
          item.totalSales > 0 ? (item.totalProfit / item.totalSales) * 100 : 0,
      };
    });

    profitArray.sort((a, b) => b.totalProfit - a.totalProfit);
    setProfitByCategory(profitArray);

    const totalSales = profitArray.reduce(
      (sum, cat) => sum + cat.totalSales,
      0,
    );
    const totalPurchases = profitArray.reduce(
      (sum, cat) => sum + cat.totalPurchases,
      0,
    );
    const totalProfit = profitArray.reduce(
      (sum, cat) => sum + cat.totalProfit,
      0,
    );

    setStats({
      totalSales,
      totalPurchases,
      totalProfit,
      profitMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
    });
  };

  // Chargement initial des données
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchOrderStatuses(),
          fetchCategories(),
          fetchProducts(),
          fetchOrders(),
          fetchStocks(),
        ]);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Recalculer les stats quand les données sont chargées
  useEffect(() => {
    if (products.length > 0 && orders.length > 0 && categories.length > 0) {
      calculateProfitByCategory();
    }
    if (stockData.length > 0 && products.length > 0) {
      calculateStockByCategory();
    }
  }, [products, orders, categories, stockData]);

  const formatPrice = (price) => {
    const truncated = Math.floor(price * 100) / 100;
    return `${truncated.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  };

  if (loading) {
    return (
      <div className="admin-stats-loading">
        <div className="spinner"></div>
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-stats-error">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-retry">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="admin-stats-dashboard">
      <div className="stats-header">
        <h1>Tableau de bord statistique</h1>
        <p>Analyse des ventes, achats et bénéfices par catégorie</p>
      </div>

      {/* Cartes récapitulatives */}
      <div className="stats-overview-grid">
        <div className="stat-overview-card sales">
          <div className="stat-content">
            <span className="stat-label">Montant Total des ventes</span>
            <span className="stat-value">{formatPrice(stats.totalSales)}</span>
          </div>
        </div>

        <div className="stat-overview-card purchases">
          <div className="stat-content">
            <span className="stat-label">Montant Total d&apos;achat</span>
            <span className="stat-value">
              {formatPrice(stats.totalPurchases)}
            </span>
          </div>
        </div>

        <div className="stat-overview-card profit">
          <div className="stat-content">
            <span className="stat-label">Bénéfice total</span>
            <span className="stat-value">{formatPrice(stats.totalProfit)}</span>
          </div>
        </div>
      </div>

      {/* Tableau des bénéfices par catégorie */}
      <div className="profit-by-category-section">
        <h2>Bénéfices par catégorie</h2>
        <div className="table-container">
          <table className="profit-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Quantité vendue</th>
                <th>CA (ventes)</th>
                <th>Coût d&apos;achat</th>
                <th>Bénéfice</th>
              </tr>
            </thead>
            <tbody>
              {profitByCategory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data-cell">
                    Aucune donnée de vente disponible
                  </td>
                </tr>
              ) : (
                profitByCategory.map((cat) => (
                  <tr key={cat.categoryId}>
                    <td className="category-name">{cat.categoryName}</td>
                    <td className="quantity-cell">{cat.quantitySold}</td>
                    <td className="sales-cell">
                      {formatPrice(cat.totalSales)}
                    </td>
                    <td className="purchases-cell">
                      {formatPrice(cat.totalPurchases)}
                    </td>
                    <td className="profit-cell profit-value">
                      {formatPrice(cat.totalProfit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td>
                  <strong>TOTAL</strong>
                </td>
                <td>
                  {profitByCategory.reduce(
                    (sum, cat) => sum + cat.quantitySold,
                    0,
                  )}
                </td>
                <td>
                  <strong>{formatPrice(stats.totalSales)}</strong>
                </td>
                <td>
                  <strong>{formatPrice(stats.totalPurchases)}</strong>
                </td>
                <td>
                  <strong>{formatPrice(stats.totalProfit)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Tableau des stocks par catégorie */}
      <div className="stock-by-category-section">
        <h2>État des stocks par catégorie</h2>
        <div className="table-container">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Quantité physique</th>
                <th>Quantité réservée</th>
                <th>Quantité disponible</th>
              </tr>
            </thead>
            <tbody>
              {stockByCategory.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data-cell">
                    Aucune donnée de stock disponible
                  </td>
                </tr>
              ) : (
                stockByCategory.map((cat) => (
                  <tr key={cat.categoryId}>
                    <td className="category-name">{cat.categoryName}</td>
                    <td className="physical-cell">{cat.physicalQuantity}</td>
                    <td className="reserved-cell">{cat.reservedQuantity}</td>
                    <td className="available-cell">{cat.availableQuantity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

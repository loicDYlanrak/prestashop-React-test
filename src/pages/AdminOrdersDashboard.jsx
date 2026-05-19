/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { fetchPrestashop } from "../hooks/useFetchPrestashop";
import "./AdminOrdersDashboard.css";

export default function AdminOrdersDashboard() {
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [orderStatuses, setOrderStatuses] = useState({});
  const [stockData, setStockData] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [loadingStockHistory, setLoadingStockHistory] = useState(false);
  const [productCombinations, setProductCombinations] = useState({});
  const [customersMap, setCustomersMap] = useState(new Map());
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Statistiques
  const [stats, setStats] = useState({
    dailyCount: 0,
    dailyAmount: 0,
    totalCount: 0,
    totalAmount: 0,
  });

  const fetchStocksAndMouvements = async () => {
    try {
      const stocksResponse = await fetchPrestashop("stock_availables", {
        urlRest: "display=full",
      });
      const movementsResponse = await fetchPrestashop("stock_movements", {
        urlRest: "display=full",
      });

      const combinationsResponse = await fetchPrestashop("combinations", {
        urlRest: "display=full&limit=1000",
      });

      // Récupérer toutes les options et valeurs d'options
      const productOptionsResponse = await fetchPrestashop("product_options", {
        urlRest: "display=full&limit=1000",
      });
      const productOptionValuesResponse = await fetchPrestashop(
        "product_option_values",
        {
          urlRest: "display=full&limit=1000",
        },
      );

      if (
        stocksResponse.success &&
        stocksResponse.data?.stock_availables?.stock_available
      ) {
        let stocks = stocksResponse.data.stock_availables.stock_available;
        const stocksArray = Array.isArray(stocks) ? stocks : [stocks];

        const productsMap = new Map();
        const stockToProductMap = new Map();
        const productsNamesMap = new Map();

        const productsResponse = await fetchPrestashop("products", {
          urlRest: "display=full&limit=1000",
        });

        if (
          productsResponse.success &&
          productsResponse.data?.products?.product
        ) {
          let products = productsResponse.data.products.product;
          const productsArray = Array.isArray(products) ? products : [products];

          productsArray.forEach((product) => {
            const productId = product.id?.["#cdata"];
            const productName =
              product.name?.language?.["#cdata"] || `Produit #${productId}`;
            productsNamesMap.set(productId, productName);
          });
        }

        // Créer un mapping des options (groupes d'attributs)
        const optionsMap = new Map();
        if (
          productOptionsResponse.success &&
          productOptionsResponse.data?.product_options?.product_option
        ) {
          let options =
            productOptionsResponse.data.product_options.product_option;
          const optionsArray = Array.isArray(options) ? options : [options];

          optionsArray.forEach((option) => {
            const optionId = option.id?.["#cdata"];
            const optionName =
              option.name?.language?.["#cdata"] || "Option inconnue";
            optionsMap.set(optionId, { id: optionId, name: optionName });
          });
        }

        // Créer un mapping des valeurs d'options
        const optionValuesMap = new Map();
        if (
          productOptionValuesResponse.success &&
          productOptionValuesResponse.data?.product_option_values
            ?.product_option_value
        ) {
          let optionValues =
            productOptionValuesResponse.data.product_option_values
              .product_option_value;
          const optionValuesArray = Array.isArray(optionValues)
            ? optionValues
            : [optionValues];

          optionValuesArray.forEach((optionValue) => {
            const valueId = optionValue.id?.["#cdata"];
            const valueName =
              optionValue.name?.language?.["#cdata"] || "Valeur inconnue";
            const groupId = optionValue.id_attribute_group?.["#cdata"];
            optionValuesMap.set(valueId, {
              id: valueId,
              name: valueName,
              groupId: groupId,
              groupName: optionsMap.get(groupId)?.name || "Groupe inconnu",
            });
          });
        }

        // Créer un mapping des combinaisons avec les noms complets
        const combinationsMap = new Map();
        if (
          combinationsResponse.success &&
          combinationsResponse.data?.combinations?.combination
        ) {
          let combinations = combinationsResponse.data.combinations.combination;
          const combinationsArray = Array.isArray(combinations)
            ? combinations
            : [combinations];

          combinationsArray.forEach((combination) => {
            const combinationId = combination.id?.["#cdata"];
            const productId = combination.id_product?.["#cdata"];

            // Récupérer les IDs des valeurs d'options
            let optionValueIds = [];
            const productOptionValues =
              combination.associations?.product_option_values
                ?.product_option_value;

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

            // Construire le nom de la combinaison à partir des valeurs d'options
            let combinationName = "";
            if (optionValueIds.length > 0) {
              const names = optionValueIds
                .map((valueId) => {
                  const optionValue = optionValuesMap.get(valueId);
                  return optionValue
                    ? `${optionValue.groupName}: ${optionValue.name}`
                    : null;
                })
                .filter(Boolean);
              combinationName = names.join(" / ");
            }

            combinationsMap.set(combinationId, {
              productId,
              name: combinationName || `Combinaison #${combinationId}`,
              optionValueIds: optionValueIds,
            });
          });
        }

        setProductCombinations(Object.fromEntries(combinationsMap));

        stocksArray.forEach((stock) => {
          const productId = stock.id_product?.["#cdata"];
          const attributeId = stock.id_product_attribute?.["#cdata"];
          const quantity = parseInt(stock.quantity?.["#cdata"] || 0);
          const stockId = stock.id?.["#cdata"];

          const key = `${productId}_${attributeId}`;
          if (!productsMap.has(key)) {
            const productName =
              productsNamesMap.get(productId) || `Produit #${productId}`;
            productsMap.set(key, {
              productId,
              attributeId,
              quantity,
              stockId,
              productName,
            });
          }

          if (stockId) {
            stockToProductMap.set(stockId, {
              productId,
              attributeId,
              quantity,
              stockId,
            });
          }
        });

        setProductsList(Array.from(productsMap.values()));
        setStockData(stocksArray);
        window.stockToProductMap = stockToProductMap;
      }

      if (
        movementsResponse.success &&
        movementsResponse.data?.stock_mvts?.stock_mvt
      ) {
        let movements = movementsResponse.data.stock_mvts.stock_mvt;
        const movementsArray = Array.isArray(movements)
          ? movements
          : [movements];
        setStockMovements(movementsArray);
      }
    } catch (error) {
      console.error("Error fetching stocks and movements:", error);
    }
  };

  const calculateStockHistory = (productId, attributeId = "0") => {
    setLoadingStockHistory(true);

    try {
      // Trouver le stockId correspondant à ce produit/déclinaison
      const stockEntry = stockData.find(
        (stock) =>
          stock.id_product?.["#cdata"] === productId &&
          stock.id_product_attribute?.["#cdata"] === attributeId,
      );

      const stockId = stockEntry?.id?.["#cdata"];

      if (!stockId) {
        setStockHistory([]);
        setLoadingStockHistory(false);
        return;
      }

      // Filtrer les mouvements par id_stock
      const relevantMovements = stockMovements.filter((movement) => {
        const mvtStockId = movement.id_stock?.["#cdata"];
        return mvtStockId === stockId;
      });

      const sortedMovements = [...relevantMovements].sort((a, b) => {
        const dateA = new Date(a.date_add?.["#cdata"]);
        const dateB = new Date(b.date_add?.["#cdata"]);
        return dateA - dateB;
      });

      const currentQuantity = parseInt(stockEntry?.quantity?.["#cdata"] || 0);
      const dailyHistory = new Map();

      sortedMovements.forEach((movement) => {
        const date = movement.date_add?.["#cdata"]?.split(" ")[0];
        if (!date) return;

        const sign = parseInt(movement.sign?.["#cdata"] || 1);
        const quantity = parseInt(movement.physical_quantity?.["#cdata"] || 0);
        const isEntry = sign === 1;

        if (!dailyHistory.has(date)) {
          dailyHistory.set(date, { entries: 0, exits: 0, netChange: 0 });
        }

        const dayData = dailyHistory.get(date);
        if (isEntry) {
          dayData.entries += quantity;
        } else {
          dayData.exits += quantity;
        }
        dayData.netChange += isEntry ? quantity : -quantity;
      });

      const dates = Array.from(dailyHistory.keys()).sort();
      const history = [];

      let runningStock = currentQuantity;

      for (let i = dates.length - 1; i >= 0; i--) {
        const date = dates[i];
        const dayData = dailyHistory.get(date);
        const stockBeforeDay = runningStock - dayData.netChange;
        history.unshift({
          date,
          entries: dayData.entries,
          exits: dayData.exits,
          netChange: dayData.netChange,
          stockAvailable: stockBeforeDay,
          stockEndOfDay: runningStock,
        });
        runningStock = stockBeforeDay;
      }

      if (history.length === 0) {
        const today = new Date().toISOString().split("T")[0];
        history.push({
          date: today,
          entries: 0,
          exits: 0,
          netChange: 0,
          stockAvailable: currentQuantity,
          stockEndOfDay: currentQuantity,
        });
      }

      setStockHistory(history);
    } catch (error) {
      console.error("Error calculating stock history:", error);
      setStockHistory([]);
    } finally {
      setLoadingStockHistory(false);
    }
  };
  // Gérer la sélection d'un produit pour le suivi de stock
  const handleProductForStockSelect = (productKey) => {
    if (!productKey) {
      setSelectedProductForStock(null);
      setStockHistory([]);
      return;
    }

    const [productId, attributeId] = productKey.split("_");
    const product = productsList.find(
      (p) => p.productId === productId && p.attributeId === attributeId,
    );

    setSelectedProductForStock({
      productId,
      attributeId,
      stockId: product?.stockId,
      currentQuantity: product?.quantity || 0,
    });

    calculateStockHistory(productId, attributeId);
  };

  // Formater la date pour l'affichage
  const formatDateShort = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
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
          const color = status.color?.["#cdata"] || status.color || "#999999";
          if (id) {
            statusMap[id] = { name, color };
          }
        });
        setOrderStatuses(statusMap);
      }
    } catch (error) {
      console.error("Error fetching order statuses:", error);
    }
  };

  // Remplacer la section des customers dans fetchAllOrders (vers la ligne ~170)
  const fetchAllOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchPrestashop("orders", {
        urlRest: "display=full",
      });

      if (!response.success) {
        throw new Error("Erreur lors du chargement des commandes");
      }

      let ordersData = response.data?.orders?.order;
      if (!ordersData) {
        setAllOrders([]);
        setFilteredOrders([]);
        setLoading(false);
        return;
      }

      const ordersArray = Array.isArray(ordersData) ? ordersData : [ordersData];

      const ordersWithDetails = await Promise.all(
        ordersArray.map(async (order) => {
          const orderId = order["@_id"];
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

      // Récupérer tous les customers
      const customersResponse = await fetchPrestashop("customers", {
        urlRest: "display=full",
      });

      const customersMap = new Map();
      if (
        customersResponse.success &&
        customersResponse.data?.customers?.customer
      ) {
        let customers = customersResponse.data.customers.customer;
        const customersArray = Array.isArray(customers)
          ? customers
          : [customers];

        await Promise.all(
          customersArray.map(async (customerRef) => {
            const customerId = customerRef?.id?.["#cdata"];

            if (customerId) {
              try {
                const customerDetail = await fetchPrestashop(
                  `customers/${customerId}`,
                  {
                    urlRest: "display=full",
                  },
                );

                console.log(
                  `Customer ${customerId} detail:`,
                  customerDetail.data,
                );
                if (customerDetail.success && customerDetail.data?.customer) {
                  const customer = customerDetail.data.customer;
                  const firstname = customer.firstname?.["#cdata"] || "";
                  const lastname = customer.lastname?.["#cdata"] || "";
                  customersMap.set(customerId, { firstname, lastname });
                }
              } catch (err) {
                console.error(`Error fetching customer ${customerId}:`, err);
              }
            }
          }),
        );
      }
      setCustomersMap(customersMap);

      const sortedOrders = ordersWithDetails.sort((a, b) => {
        const dateA = new Date(a.date_add?.["#cdata"] || 0);
        const dateB = new Date(b.date_add?.["#cdata"] || 0);
        return dateB - dateA;
      });

      setAllOrders(sortedOrders);
      setFilteredOrders(sortedOrders);
    } catch (err) {
      console.error("Failed to load orders", err);
      setError(err.message || "Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les commandes par date (appelé uniquement sur clic)
  const filterOrdersByDate = () => {
    if (!startDate || !endDate) {
      setFilteredOrders(allOrders);
      return;
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = allOrders.filter((order) => {
      const orderDate = new Date(order.date_add?.["#cdata"]);
      return orderDate >= start && orderDate <= end;
    });

    setFilteredOrders(filtered);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    setStartDate(defaultStartDate.toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setFilteredOrders(allOrders);
  };

  // Calculer les statistiques
  const calculateStats = () => {
    const isCancelled = (order) => {
      const statusId = order.current_state?.["#cdata"];
      return statusId === "6";
    };

    // Statistiques pour la période filtrée (exclure annulées)
    let dailyCount = 0;
    let dailyAmount = 0;

    filteredOrders.forEach((order) => {
      if (!isCancelled(order)) {
        dailyCount++;
        const totalPaid = parseFloat(
          order.total_paid_tax_incl?.["#cdata"] || 0,
        );
        dailyAmount += totalPaid;
      }
    });

    // Statistiques totales (exclure annulées)
    let totalCount = 0;
    let totalAmount = 0;

    allOrders.forEach((order) => {
      if (!isCancelled(order)) {
        totalCount++;
        const totalPaid = parseFloat(
          order.total_paid_tax_incl?.["#cdata"] || 0,
        );
        totalAmount += totalPaid;
      }
    });

    setStats({
      dailyCount,
      dailyAmount,
      totalCount,
      totalAmount,
    });
  };

  // Pagination
  const getCurrentPageOrders = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredOrders.length / itemsPerPage);
  };

  const changePage = (page) => {
    setCurrentPage(page);
    // Scroll en haut du tableau
    document
      .querySelector(".orders-table-container")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      document
        .querySelector(".orders-table-container")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goToNextPage = () => {
    if (currentPage < getTotalPages()) {
      setCurrentPage(currentPage + 1);
      document
        .querySelector(".orders-table-container")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset à la première page
  };

  const getOrdersByDay = () => {
    const grouped = {};

    filteredOrders.forEach((order) => {
      const statusId = order.current_state?.["#cdata"];
      const isCancelled = statusId === "6";

      const date = order.date_add?.["#cdata"]?.split(" ")[0];
      if (!date) return;

      if (!grouped[date]) {
        grouped[date] = {
          totalCount: 0,
          cancelledCount: 0,
          amount: 0,
          orders: [],
        };
      }

      grouped[date].totalCount++;

      if (isCancelled) {
        grouped[date].cancelledCount++;
      } else {
        // Ajouter au CA uniquement si non annulée
        grouped[date].amount += parseFloat(
          order.total_paid_tax_incl?.["#cdata"] || 0,
        );
      }

      grouped[date].orders.push(order);
    });

    return Object.entries(grouped)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, data]) => ({ date, ...data }));
  };

  // Obtenir le nom du statut
  const getOrderStatusName = (statusId) => {
    return orderStatuses[statusId]?.name || "Statut inconnu";
  };

  // Obtenir la couleur du statut
  const getOrderStatusColor = (statusId) => {
    return orderStatuses[statusId]?.color || "#999999";
  };

  // Formater le prix
  const formatPrice = (price) => {
    return `${parseFloat(price || 0).toFixed(2)} €`;
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculer le total HT
  const getTotalHT = (order) => {
    // console.log("Calculating total HT for order:", order);
    const totalTax = parseFloat(order.total_paid_tax_excl?.["#cdata"] || 0);
    return formatPrice(totalTax);
  };

  // Calculer le total TTC
  const getTotalTTC = (order) => {
    return formatPrice(order.total_paid_tax_incl?.["#cdata"]);
  };

  // Calculer le total HT des commandes filtrées (exclure annulées)
  const getFilteredTotalHT = () => {
    let total = 0;
    filteredOrders.forEach((order) => {
      const statusId = order.current_state?.["#cdata"];
      if (statusId !== "6") {
        const totalTax = parseFloat(order.total_paid_tax_excl?.["#cdata"] || 0);
        total += totalTax;
      }
    });
    return formatPrice(total);
  };

  // Calculer le total TTC des commandes filtrées (exclure annulées)
  const getFilteredTotalTTC = () => {
    let total = 0;
    filteredOrders.forEach((order) => {
      const statusId = order.current_state?.["#cdata"];
      if (statusId !== "6") {
        total += parseFloat(order.total_paid_tax_incl?.["#cdata"] || 0);
      }
    });
    return formatPrice(total);
  };

  // Fetch initial - une seule fois
  useEffect(() => {
    fetchOrderStatuses();
    fetchAllOrders();
    fetchStocksAndMouvements();
  }, []);

  // Recalculer les stats à chaque changement des commandes filtrées
  useEffect(() => {
    calculateStats();
  }, [filteredOrders, allOrders]);

  const daysGrouped = getOrdersByDay();

  if (loading) {
    return (
      <div className="admin-orders-dashboard-loading">
        <div className="spinner"></div>
        <p>Chargement des commandes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-orders-dashboard-error">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => fetchAllOrders()} className="btn-retry">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="admin-orders-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Commandes</h1>
        <p>Visualisez et analysez vos commandes</p>
      </div>

      {/* Filtres par date */}
      <div className="filters-section" style={{ display: "none" }}>
        <div className="date-filters">
          <div className="filter-group">
            <label>Date de début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="filter-group">
            <label>Date de fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="filter-actions">
            <button onClick={filterOrdersByDate} className="btn-filter">
              Filtrer
            </button>
            <button onClick={resetFilters} className="btn-reset">
              Réinitialiser
            </button>
          </div>
        </div>
        <div className="filter-info">
          <span className="filter-badge">
            {filteredOrders.length} / {allOrders.length} commande(s) sur la
            période
          </span>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-content">
            <div className="stat-label">Commandes (période)</div>
            <div className="stat-value">{stats.dailyCount}</div>
            <div className="stat-sub">{formatPrice(stats.dailyAmount)}</div>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-content">
            <div className="stat-label">CA période</div>
            <div className="stat-value">{formatPrice(stats.dailyAmount)}</div>
            <div className="stat-sub">
              Moyenne:{" "}
              {formatPrice(stats.dailyAmount / (stats.dailyCount || 1))}
            </div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-content">
            <div className="stat-label">Total commandes</div>
            <div className="stat-value">{stats.totalCount}</div>
            <div className="stat-sub">Toutes périodes</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-content">
            <div className="stat-label">CA total</div>
            <div className="stat-value">{formatPrice(stats.totalAmount)}</div>
            <div className="stat-sub">Toutes périodes</div>
          </div>
        </div>
      </div>

      {/* Résumé par jour */}
      <div className="daily-summary">
        <h2>Résumé par jour</h2>

        {/* Totaux généraux de la période */}
        <div className="period-totals">
          <div className="period-total-card">
            <span className="period-total-label">Total HT (période)</span>
            <span className="period-total-value">{getFilteredTotalHT()}</span>
          </div>
          <div className="period-total-card">
            <span className="period-total-label">Total TTC (période)</span>
            <span className="period-total-value">{getFilteredTotalTTC()}</span>
          </div>
        </div>

        <div className="daily-grid">
          {daysGrouped.length === 0 ? (
            <div className="no-data">Aucune commande sur cette période</div>
          ) : (
            daysGrouped.map((day) => (
              <div key={day.date} className="daily-card">
                <div className="daily-header">
                  <span className="daily-date">
                    {new Date(day.date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="daily-count">
                    {day.totalCount} commande(s)
                    {day.cancelledCount > 0 && (
                      <span className="cancelled-count">
                        {" "}
                        (dont {day.cancelledCount} annulée
                        {day.cancelledCount > 1 ? "s" : ""})
                      </span>
                    )}
                  </span>
                </div>
                <div className="daily-amount">{formatPrice(day.amount)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Liste détaillée des commandes */}
      {/* Liste détaillée des commandes */}
      <div className="orders-list-section">
        <h2>Liste des commandes</h2>

        {/* Contrôles de pagination en haut */}
        <div className="pagination-controls-top">
          <div className="items-per-page">
            <label>Afficher : </label>
            <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
              <option value="10">10 lignes</option>
              <option value="25">25 lignes</option>
              <option value="50">50 lignes</option>
              <option value="100">100 lignes</option>
            </select>
          </div>
          <div className="pagination-info">
            {filteredOrders.length > 0 ? (
              <>
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                {Math.min(currentPage * itemsPerPage, filteredOrders.length)}{" "}
                sur {filteredOrders.length} commandes
              </>
            ) : (
              <>0 commande</>
            )}
          </div>
        </div>

        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID Commande</th>
                <th>Date</th>
                <th>Client</th>
                <th>Total HT</th>
                <th>Total TTC</th>
                <th>Statut</th>
                <th>Paiement</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data-cell">
                    Aucune commande trouvée pour cette période
                  </td>
                </tr>
              ) : (
                getCurrentPageOrders().map((order) => {
                  const orderId = order.id?.["#cdata"];
                  const statusId = order.current_state?.["#cdata"];
                  const customerId = order.id_customer?.["#cdata"];
                  const customer = customersMap.get(customerId);
                  const customerName = customer
                    ? `${customer.firstname} ${customer.lastname}`
                    : "Client inconnu";

                  return (
                    <tr key={orderId}>
                      <td className="order-id">#{orderId}</td>
                      <td>{formatDate(order.date_add?.["#cdata"])}</td>
                      <td>{customerName}</td>
                      <td>{getTotalHT(order)}</td>
                      <td className="total-ttc">{getTotalTTC(order)}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: `${getOrderStatusColor(statusId)}20`,
                            color: getOrderStatusColor(statusId),
                            border: `1px solid ${getOrderStatusColor(statusId)}`,
                          }}
                        >
                          {getOrderStatusName(statusId)}
                        </span>
                      </td>
                      <td>{order.payment?.["#cdata"] || "N/A"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Contrôles de pagination en bas */}
        {filteredOrders.length > 0 && (
          <div className="pagination-controls-bottom">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ← Précédent
            </button>

            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                let pageNum;
                if (getTotalPages() <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= getTotalPages() - 2) {
                  pageNum = getTotalPages() - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => changePage(pageNum)}
                    className={`pagination-page-btn ${currentPage === pageNum ? "active" : ""}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === getTotalPages()}
              className="pagination-btn"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>

      {/* Suivi d'évolution du stock */}
      <div className="stock-history-section">
        <h2> Évolution du stock par produit</h2>
        <p className="section-description">
          Visualisez les entrées, sorties et le stock disponible jour par jour
        </p>

        <div className="stock-selector">
          <div className="filter-group" style={{ position: "relative" }}>
            <label>Sélectionner un produit / déclinaison</label>
            <input
              type="text"
              className="product-stock-select"
              placeholder="Rechercher un produit..."
              value={stockSearchQuery}
              onChange={(e) => {
                setStockSearchQuery(e.target.value);
                setShowStockDropdown(true);
                if (!e.target.value) {
                  setSelectedProductForStock(null);
                  setStockHistory([]);
                }
              }}
              onFocus={() => setShowStockDropdown(true)}
              onBlur={() => setTimeout(() => setShowStockDropdown(false), 150)}
              autoComplete="off"
            />
            {showStockDropdown && (
              <ul
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  background: "var(--bg-card, #fff)",
                  border: "1px solid var(--border-color, #ddd)",
                  borderRadius: "6px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  maxHeight: "260px",
                  overflowY: "auto",
                  margin: "4px 0 0",
                  padding: 0,
                  listStyle: "none",
                }}
              >
                {productsList
                  .filter((product) => {
                    const baseName =
                      product.productName || `Produit #${product.productId}`;
                    const isCombination = product.attributeId !== "0";
                    let displayName = baseName;
                    if (
                      isCombination &&
                      productCombinations[product.attributeId]?.name
                    ) {
                      displayName = `${baseName} (${productCombinations[product.attributeId].name})`;
                    }
                    return displayName
                      .toLowerCase()
                      .includes(stockSearchQuery.toLowerCase());
                  })
                  .map((product) => {
                    const baseName =
                      product.productName || `Produit #${product.productId}`;
                    const isCombination = product.attributeId !== "0";
                    let displayName = baseName;
                    if (
                      isCombination &&
                      productCombinations[product.attributeId]?.name
                    ) {
                      displayName = `${baseName} (${productCombinations[product.attributeId].name})`;
                    }
                    return (
                      <li
                        key={`${product.productId}_${product.attributeId}`}
                        onMouseDown={() => {
                          setStockSearchQuery(displayName);
                          setShowStockDropdown(false);
                          handleProductForStockSelect(
                            `${product.productId}_${product.attributeId}`,
                          );
                        }}
                        style={{
                          padding: "10px 14px",
                          cursor: "pointer",
                          borderBottom:
                            "1px solid var(--border-color, #f0f0f0)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.875rem",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--bg-hover, #f5f5f5)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <span>{displayName}</span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted, #888)",
                            marginLeft: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Stock : {product.quantity}
                        </span>
                      </li>
                    );
                  })}
                {productsList.filter((product) => {
                  const baseName =
                    product.productName || `Produit #${product.productId}`;
                  const isCombination = product.attributeId !== "0";
                  let displayName = baseName;
                  if (
                    isCombination &&
                    productCombinations[product.attributeId]?.name
                  ) {
                    displayName = `${baseName} (${productCombinations[product.attributeId].name})`;
                  }
                  return displayName
                    .toLowerCase()
                    .includes(stockSearchQuery.toLowerCase());
                }).length === 0 && (
                  <li
                    style={{
                      padding: "12px 14px",
                      color: "var(--text-muted, #888)",
                      fontSize: "0.875rem",
                      textAlign: "center",
                    }}
                  >
                    Aucun produit trouvé
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {selectedProductForStock && (
          <div className="stock-history-container">
            <div className="current-stock-badge">
              Stock actuel :{" "}
              <strong>{selectedProductForStock.currentQuantity}</strong> unités
            </div>

            {loadingStockHistory ? (
              <div className="loading-history">
                <div className="spinner-small"></div>
                <span>Chargement de l&apos;historique...</span>
              </div>
            ) : stockHistory.length === 0 ? (
              <div className="no-stock-data">
                Aucun mouvement de stock enregistré pour ce produit
              </div>
            ) : (
              <div className="stock-history-table-container">
                <table className="stock-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Entrées (+) </th>
                      <th>Sorties (-) </th>
                      <th>Variation nette</th>
                      <th>Stock disponible (début)</th>
                      <th>Stock disponible (fin)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHistory.map((day, index) => (
                      <tr
                        key={index}
                        className={day.netChange !== 0 ? "has-change" : ""}
                      >
                        <td className="history-date">
                          {formatDateShort(day.date)}
                        </td>
                        <td className="entries-cell">
                          {day.entries > 0 ? (
                            <span className="positive-change">
                              +{day.entries}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="exits-cell">
                          {day.exits > 0 ? (
                            <span className="negative-change">
                              -{day.exits}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="net-change-cell">
                          {day.netChange !== 0 ? (
                            <span
                              className={
                                day.netChange > 0
                                  ? "positive-change"
                                  : "negative-change"
                              }
                            >
                              {day.netChange > 0
                                ? `+${day.netChange}`
                                : day.netChange}
                            </span>
                          ) : (
                            "0"
                          )}
                        </td>
                        <td className="stock-cell">{day.stockAvailable}</td>
                        <td className="stock-cell end-stock">
                          {day.stockEndOfDay}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

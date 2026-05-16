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

      if (
        stocksResponse.success &&
        stocksResponse.data?.stock_availables?.stock_available
      ) {
        let stocks = stocksResponse.data.stock_availables.stock_available;
        const stocksArray = Array.isArray(stocks) ? stocks : [stocks];

        const productsMap = new Map();
        const stockToProductMap = new Map(); // NOUVEAU: mapping id_stock -> produit

        stocksArray.forEach((stock) => {
          const productId = stock.id_product?.["#cdata"];
          const attributeId = stock.id_product_attribute?.["#cdata"];
          const quantity = parseInt(stock.quantity?.["#cdata"] || 0);
          const stockId = stock.id?.["#cdata"];

          const key = `${productId}_${attributeId}`;
          if (!productsMap.has(key)) {
            productsMap.set(key, {
              productId,
              attributeId,
              quantity,
              stockId,
            });
          }

          // NOUVEAU: Ajouter au mapping stockId -> produit
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

        // NOUVEAU: Stocker le mapping
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

  // Récupérer toutes les commandes une seule fois
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

      // Récupérer les détails de chaque commande avec les lignes
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

      // Trier les commandes par date côté client
      const sortedOrders = ordersWithDetails.sort((a, b) => {
        const dateA = new Date(a.date_add?.["#cdata"] || 0);
        const dateB = new Date(b.date_add?.["#cdata"] || 0);
        return dateB - dateA;
      });

      setAllOrders(sortedOrders);
      setFilteredOrders(sortedOrders); // Au début, on affiche tout
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

  // Grouper les commandes par jour (exclure annulées)
  const getOrdersByDay = () => {
    const grouped = {};

    filteredOrders.forEach((order) => {
      const statusId = order.current_state?.["#cdata"];
      // Exclure les commandes annulées des statistiques journalières
      if (statusId === "6") return;

      const date = order.date_add?.["#cdata"]?.split(" ")[0];
      if (!date) return;

      if (!grouped[date]) {
        grouped[date] = {
          count: 0,
          amount: 0,
          orders: [],
        };
      }

      grouped[date].count++;
      grouped[date].amount += parseFloat(
        order.total_paid_tax_incl?.["#cdata"] || 0,
      );
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
      <div className="filters-section">
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
                  <span className="daily-count">{day.count} commande(s)</span>
                </div>
                <div className="daily-amount">{formatPrice(day.amount)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Liste détaillée des commandes */}
      <div className="orders-list-section">
        <h2>Liste des commandes</h2>
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
                filteredOrders.map((order) => {
                  const orderId = order.id?.["#cdata"];
                  const statusId = order.current_state?.["#cdata"];
                  const customerName = order.id_customer?.["@_fetched"]
                    ?.customer
                    ? `${order.id_customer["@_fetched"].customer.firstname?.["#cdata"] || ""} ${order.id_customer["@_fetched"].customer.lastname?.["#cdata"] || ""}`
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
      </div>

      {/* Suivi d'évolution du stock */}
      <div className="stock-history-section">
        <h2> Évolution du stock par produit</h2>
        <p className="section-description">
          Visualisez les entrées, sorties et le stock disponible jour par jour
        </p>

        <div className="stock-selector">
          <div className="filter-group">
            <label>Sélectionner un produit / déclinaison</label>
            <select
              value={
                selectedProductForStock
                  ? `${selectedProductForStock.productId}_${selectedProductForStock.attributeId}`
                  : ""
              }
              onChange={(e) => handleProductForStockSelect(e.target.value)}
              className="product-stock-select"
            >
              <option value="">-- Choisir un produit --</option>
              {productsList.map((product) => {
                let productName = `Produit #${product.productId}`;

                // Chercher le nom dans les commandes
                const orderWithProduct = allOrders.find((order) => {
                  const associations = order.associations;
                  if (associations?.order_rows?.order_row) {
                    const rows = Array.isArray(
                      associations.order_rows.order_row,
                    )
                      ? associations.order_rows.order_row
                      : [associations.order_rows.order_row];
                    return rows.some(
                      (row) => row.product_id?.["#cdata"] === product.productId,
                    );
                  }
                  return false;
                });

                if (orderWithProduct?.associations?.order_rows?.order_row) {
                  const rows = Array.isArray(
                    orderWithProduct.associations.order_rows.order_row,
                  )
                    ? orderWithProduct.associations.order_rows.order_row
                    : [orderWithProduct.associations.order_rows.order_row];
                  const foundRow = rows.find(
                    (row) => row.product_id?.["#cdata"] === product.productId,
                  );
                  if (foundRow?.product_name?.["#cdata"]) {
                    productName = foundRow.product_name["#cdata"];
                  }
                }

                const isCombination = product.attributeId !== "0";
                return (
                  <option
                    key={`${product.productId}_${product.attributeId}`}
                    value={`${product.productId}_${product.attributeId}`}
                  >
                    {productName}{" "}
                    {isCombination
                      ? `(Déclinaison #${product.attributeId})`
                      : "(Produit simple)"}{" "}
                    - Stock: {product.quantity}
                  </option>
                );
              })}
            </select>
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

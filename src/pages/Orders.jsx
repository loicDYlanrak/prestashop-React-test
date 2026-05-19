import { useState, useEffect } from "react";
import "./Orders.css";
import {
  useFetchAllOrders,
  fetchPrestashop,
} from "../hooks/useFetchPrestashop.js";
import { updateResource } from "../hooks/useMutationPrestashop";

const API_CHANGE_STATE_URL =
  "http://localhost/prestashop2/module/orderapi/changeState";

const STATUS_STYLES = {
  "Paiement accepté": { bg: "#27ae60", color: "#fff" },
  livré: { bg: "#2980b9", color: "#fff" },
  Annulé: { bg: "#2c3e50", color: "#fff" },
};

const ALL_STATUSES = Object.keys(STATUS_STYLES);

const STATE_ID_TO_NAME = {
  11: "Paiement effectué",
  5: "livré",
  6: "Annulé",
};

const STATE_NAME_TO_ID = {
  "Paiement effectué": "11",
  livré: "5",
  Annulé: "6",
};

const extractOrderData = (orderData, customersMap) => {
  const order = orderData.order;

  const currentStateId = order.current_state?.["#cdata"] || order.current_state;
  const statusName = STATE_ID_TO_NAME[currentStateId] || "Annulé";

  // Utiliser customersMap pour obtenir le nom du client
  const customerId = order.id_customer?.["#cdata"] || order.id_customer;
  const customer = customersMap.get(customerId);
  const customerName = customer
    ? `${customer.firstname} ${customer.lastname}`.trim()
    : "Client inconnu";

  let country = "France";
  if (order.id_address_delivery?.["@_fetched"]?.address) {
    const address = order.id_address_delivery["@_fetched"].address;
    country = address.country?.["#cdata"] || address.country || "France";
  }

  return {
    id: parseInt(order.id?.["#cdata"] || order.id),
    ref: order.reference?.["#cdata"] || order.reference,
    newClient: false,
    country: country,
    client: customerName,
    total: parseFloat(
      order.total_paid_tax_incl?.["#cdata"] || order.total_paid_tax_incl || 0,
    ),
    payment: order.payment?.["#cdata"] || order.payment || "N/A",
    status: statusName,
    statusId: currentStateId,
    date: order.date_add?.["#cdata"] || order.date_add || "",
    rawData: order,
  };
};

export default function Orders() {
  const { loading, data, errors } = useFetchAllOrders("orders");
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState([]);
  const [filters, setFilters] = useState({
    ref: "",
    newClient: "Tous",
    country: "",
    client: "",
    total: "",
    payment: "",
    status: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [form, setForm] = useState({
    client: "",
    country: "",
    payment: "Payment by check",
    total: "",
    status: "Paiement accepté",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [customersMap, setCustomersMap] = useState(new Map());
  const fetchCustomers = async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };
  useEffect(() => {
    const loadData = async () => {
      await fetchCustomers();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (
      data &&
      Array.isArray(data) &&
      data.length > 0 &&
      customersMap.size > 0
    ) {
      const extractedOrders = data.map((item) =>
        extractOrderData(item, customersMap),
      );
      setOrders(extractedOrders);
    }
  }, [data, customersMap]);

  const filtered = orders.filter(
    (o) =>
      o.ref?.toLowerCase().includes(filters.ref.toLowerCase()) &&
      o.client?.toLowerCase().includes(filters.client.toLowerCase()) &&
      o.country?.toLowerCase().includes(filters.country.toLowerCase()) &&
      (filters.newClient === "Tous" ||
        (filters.newClient === "Oui" ? o.newClient : !o.newClient)) &&
      (filters.status === "" || o.status === filters.status),
  );

  // Pagination
  const getCurrentPageOrders = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filtered.length / itemsPerPage);
  };

  const changePage = (page) => {
    setCurrentPage(page);
    // Scroll en haut du tableau
    document
      .querySelector(".panel-body")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      document
        .querySelector(".panel-body")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goToNextPage = () => {
    if (currentPage < getTotalPages()) {
      setCurrentPage(currentPage + 1);
      document
        .querySelector(".panel-body")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const toggleSelect = (id) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  const toggleAll = () =>
    setSelected(
      selected.length === filtered.length ? [] : filtered.map((o) => o.id),
    );

  // Ouvrir le modal de changement de statut
  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowStatusModal(true);
  };

  // Livrer une commande (changer statut de 11 à 4)
  const deliverOrder = async (order) => {
    if (!window.confirm(`Confirmer la livraison de la commande ${order.ref} ?`))
      return;

    try {
      const response = await fetch(
        `${API_CHANGE_STATE_URL}?id_order=${order.id}&id_state=5`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );
      const result = await response.json();

      if (result.success) {
        // Mettre à jour le statut dans l'état local
        setOrders(
          orders.map((o) =>
            o.id === order.id ? { ...o, status: "livré", statusId: "5" } : o,
          ),
        );
        alert(result.message || `Commande ${order.ref} marquée comme livrée`);
      } else {
        throw new Error(result.message || "Erreur lors de la livraison");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Impossible de livrer la commande. Veuillez réessayer.");
    }
  };

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus || newStatus === selectedOrder.status) {
      setShowStatusModal(false);
      return;
    }

    setUpdatingStatus(true);

    try {
      const newStatusId = STATE_NAME_TO_ID[newStatus];
      const orderId = selectedOrder.id;

      const response = await updateResource("order", orderId, {
        id: orderId,
        current_state: newStatusId,
      });

      if (response) {
        setOrders(
          orders.map((order) =>
            order.id === selectedOrder.id
              ? { ...order, status: newStatus, statusId: newStatusId }
              : order,
          ),
        );
        alert(
          `Statut de la commande ${selectedOrder.ref} mis à jour : ${newStatus}`,
        );
      } else {
        throw new Error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Impossible de mettre à jour le statut. Veuillez réessayer.");
    } finally {
      setUpdatingStatus(false);
      setShowStatusModal(false);
      setSelectedOrder(null);
    }
  };

  const addOrder = () => {
    if (!form.client) return;
    const newId = Math.max(...orders.map((o) => o.id), 0) + 1;
    const ref = Math.random().toString(36).substring(2, 10).toUpperCase();
    const now = new Date();
    const dateStr = now.toLocaleString("fr-FR");

    setOrders([
      {
        id: newId,
        ref,
        newClient: false,
        ...form,
        total: parseFloat(form.total) || 0,
        date: dateStr,
        statusId: STATE_NAME_TO_ID[form.status],
      },
      ...orders,
    ]);
    setShowModal(false);
    setForm({
      client: "",
      country: "",
      payment: "Payment by check",
      total: "",
      status: "Paiement accepté",
    });
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading-container">Chargement des commandes...</div>
      </div>
    );
  }

  if (errors) {
    return (
      <div className="orders-page">
        <div className="error-container">Erreur: {errors.toString()}</div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {/* Top bar */}
      <div className="page-header">
        <div className="breadcrumb">Commandes</div>
        <div className="page-header-row">
          <h1 className="page-title">Commandes ({orders.length})</h1>
          <div style={{ display: "none", gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              {" "}
              Ajouter une commande
            </button>
            <button className="btn btn-dark"> Booster les ventes</button>
            <button className="btn btn-outline">Aide</button>
          </div>
        </div>
      </div>

      {/* Table panel */}
      <div className="panel">
        <div
          className="panel-header-row"
          style={{ justifyContent: "space-between" }}
        >
          <span className="panel-title">Commandes ({filtered.length})</span>
        </div>

        <div className="panel-body">
          <div className="orders-toolbar">
            {/* Controls de pagination en haut */}
            <div
              className="pagination-controls"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div
                className="items-per-page"
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <label style={{ fontSize: "13px" }}>Afficher :</label>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <option value="10">10 lignes</option>
                  <option value="25">25 lignes</option>
                  <option value="50">50 lignes</option>
                  <option value="100">100 lignes</option>
                </select>
              </div>
              <div
                className="pagination-info"
                style={{ fontSize: "13px", color: "#666" }}
              >
                {filtered.length > 0 ? (
                  <>
                    Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                    {Math.min(currentPage * itemsPerPage, filtered.length)} sur{" "}
                    {filtered.length} commandes
                  </>
                ) : (
                  <>0 commande</>
                )}
              </div>
            </div>
          </div>

          <table className="ps-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    checked={
                      selected.length === filtered.length && filtered.length > 0
                    }
                    onChange={toggleAll}
                  />
                </th>
                <th>ID</th>
                <th>Référence</th>
                <th>Nouveau client</th>
                <th>Livraison</th>
                <th>Client</th>
                <th>Total </th>
                <th>Paiement</th>
                <th>État</th>
                <th>Date</th>
                {/* <th className="col-actions">Actions</th> */}
              </tr>
              {/* Filter row */}
              <tr className="filter-row">
                <td />
                <td>
                  <input
                    className="filter-input"
                    placeholder="ID..."
                    value={filters.ref}
                    onChange={(e) =>
                      setFilters({ ...filters, ref: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    className="filter-input"
                    placeholder="Référence..."
                    value={filters.ref}
                    onChange={(e) =>
                      setFilters({ ...filters, ref: e.target.value })
                    }
                  />
                </td>
                <td>
                  <select
                    className="filter-select"
                    value={filters.newClient}
                    onChange={(e) =>
                      setFilters({ ...filters, newClient: e.target.value })
                    }
                  >
                    <option>Tous</option>
                    <option>Oui</option>
                    <option>Non</option>
                  </select>
                </td>
                <td>
                  <select
                    className="filter-select"
                    value={filters.country}
                    onChange={(e) =>
                      setFilters({ ...filters, country: e.target.value })
                    }
                  >
                    <option value="">Tous</option>
                    <option>États-Unis</option>
                    <option>France</option>
                  </select>
                </td>
                <td>
                  <input
                    className="filter-input"
                    placeholder="Client..."
                    value={filters.client}
                    onChange={(e) =>
                      setFilters({ ...filters, client: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input className="filter-input" placeholder="Total min..." />
                </td>
                <td>
                  <input className="filter-input" placeholder="Paiement..." />
                </td>
                <td>
                  <select
                    className="filter-select"
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                  >
                    <option value="">Tous</option>
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 3 }}
                  >
                    <input
                      className="filter-input"
                      placeholder="YYYY-MM-DD"
                      style={{ width: 100 }}
                    />
                  </div>
                </td>
                {/* <td><button className="btn btn-search"> Rechercher</button></td> */}
              </tr>
            </thead>
            <tbody>
              {getCurrentPageOrders().map((o) => {
                const st = STATUS_STYLES[o.status] || {
                  bg: "#7f8c8d",
                  color: "#fff",
                };
                const isPaid = o.status === "Paiement accepté";
                // console.log(o.date)
                return (
                  <tr
                    key={o.id}
                    className={selected.includes(o.id) ? "row-selected" : ""}
                  >
                    <td className="col-check">
                      <input
                        type="checkbox"
                        checked={selected.includes(o.id)}
                        onChange={() => toggleSelect(o.id)}
                      />
                    </td>
                    <td>{o.id}</td>
                    <td className="ref-cell">{o.ref}</td>
                    <td>{o.newClient ? "Oui" : "Non"}</td>
                    <td>{o.country}</td>
                    <td>{o.client}</td>
                    <td>
                      <span className={isPaid ? "total-badge" : ""}>
                        {o.total.toFixed(2).replace(".", ",")} €
                      </span>
                    </td>
                    <td>{o.payment}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        {o.statusId === "11" ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <span
                              className="status-badge"
                              style={{
                                background:
                                  STATUS_STYLES["Paiement accepté"]?.bg ||
                                  "#27ae60",
                                color:
                                  STATUS_STYLES["Paiement accepté"]?.color ||
                                  "#fff",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            >
                              {o.status}
                            </span>
                            <button
                              className="deliver-btn"
                              onClick={() => deliverOrder(o)}
                              style={{
                                background: "#27ae60",
                                color: "#fff",
                                border: "none",
                                padding: "4px 12px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              Livrer
                            </button>
                            <button
                              className="cancel-btn"
                              onClick={() => {
                                setSelectedOrder(o);
                                setNewStatus("Annulé");
                                setShowStatusModal(true);
                              }}
                              style={{
                                background: "#e74c3c",
                                color: "#fff",
                                border: "none",
                                padding: "4px 12px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            className="status-badge editable-status"
                            style={{
                              background: st.bg,
                              color: st.color,
                              cursor: "pointer",
                              border: "none",
                              padding: "4px 8px",
                              borderRadius: "4px",
                            }}
                            onClick={() => openStatusModal(o)}
                            title="Cliquer pour modifier le statut"
                          >
                            {o.status}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="date-cell">{o.date.toString() || "-"}</td>
                    {/* <td className="col-actions">
                      <div className="action-btns">
                        <button className="action-btn" title="Voir"></button>
                        <button className="action-btn" title="Facture"></button>
                        <button className="action-btn" title="Changer statut" onClick={() => openStatusModal(o)}>📝</button>
                      </div>
                    </td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div
              className="pagination-controls-bottom"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "15px",
                marginTop: "20px",
                paddingTop: "15px",
                borderTop: "1px solid #eee",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                style={{
                  padding: "6px 12px",
                  backgroundColor: currentPage === 1 ? "#e0e0e0" : "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "13px",
                }}
              >
                ← Précédent
              </button>

              <div
                className="pagination-pages"
                style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}
              >
                {Array.from(
                  { length: Math.min(5, getTotalPages()) },
                  (_, i) => {
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
                        style={{
                          minWidth: "32px",
                          padding: "6px 10px",
                          backgroundColor:
                            currentPage === pageNum ? "#007bff" : "#fff",
                          color: currentPage === pageNum ? "#fff" : "#333",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === getTotalPages()}
                style={{
                  padding: "6px 12px",
                  backgroundColor:
                    currentPage === getTotalPages() ? "#e0e0e0" : "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor:
                    currentPage === getTotalPages() ? "not-allowed" : "pointer",
                  fontSize: "13px",
                }}
              >
                Suivant →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouvelle commande</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Client</label>
                <input
                  value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                  placeholder="Nom du client"
                />
              </div>
              <div className="form-group">
                <label>Pays</label>
                <input
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  placeholder="ex : France"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Total (€)</label>
                  <input
                    type="number"
                    value={form.total}
                    onChange={(e) =>
                      setForm({ ...form, total: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Paiement</label>
                  <select
                    value={form.payment}
                    onChange={(e) =>
                      setForm({ ...form, payment: e.target.value })
                    }
                  >
                    <option>Payment by check</option>
                    <option>Bank wire</option>
                    <option>PayPal</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>État</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowModal(false)}
              >
                Annuler
              </button>
              <button className="btn btn-primary" onClick={addOrder}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal changement de statut */}
      {showStatusModal && selectedOrder && (
        <div
          className="modal-overlay"
          onClick={() => setShowStatusModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier le statut de la commande</h2>
              <button
                className="modal-close"
                onClick={() => setShowStatusModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Commande</label>
                <input
                  type="text"
                  value={`${selectedOrder.ref} - ${selectedOrder.client}`}
                  disabled
                  style={{ background: "#f5f5f5" }}
                />
              </div>
              <div className="form-group">
                <label>Nouveau statut</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div
                className="current-status-info"
                style={{
                  marginTop: 10,
                  padding: 8,
                  background: "#f0f0f0",
                  borderRadius: 4,
                }}
              >
                <strong>Statut actuel :</strong> {selectedOrder.status}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowStatusModal(false)}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={updateOrderStatus}
                disabled={updatingStatus}
              >
                {updatingStatus ? "Mise à jour..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

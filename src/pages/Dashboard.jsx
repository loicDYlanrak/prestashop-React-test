import "./Dashboard.css";
import { useLatestOrders, useCountPrestashopEntity } from "../hooks/useFetchPrestashop";

export default function Dashboard() {
  const { count: productsCount, loading: productsLoading, errors: productsErrors } = useCountPrestashopEntity("products");
  const { count: ordersCount, loading: ordersLoading, errors: ordersErrors } = useCountPrestashopEntity("orders");
  const { count: customersCount, loading: customersLoading, errors: customersErrors } = useCountPrestashopEntity("customers");
  const { count: carriersCount, loading: carriersLoading, errors: carriersErrors } = useCountPrestashopEntity("carriers");
  const { loading: ordersListLoading, orders, errors: ordersListErrors } = useLatestOrders();

  const getCustomerName = (order) => {
    if (order.id_customer && order.id_customer["@_fetched"]) {
      const customer = order.id_customer["@_fetched"].customer;
      return `${customer.firstname["#cdata"]} ${customer.lastname["#cdata"]}`;
    }
    return "Client inconnu";
  };

  const getTotalAmount = (order) => {
    if (order.total_paid_tax_incl) {
      const amount = parseFloat(order.total_paid_tax_incl["#cdata"]);
      return `${amount.toFixed(2)} €`;
    }
    return "0.00 €";
  };

  const getOrderStatus = (order) => {
    if (order.current_state && order.current_state["@_fetched"]) {
      const state = order.current_state["@_fetched"].order_state;
      return state.name.language["#cdata"];
    }
    return "Statut inconnu";
  };

  const getStatusBadgeClass = (status) => {
    if (status.toLowerCase().includes("livré") || status.toLowerCase().includes("delivered")) {
      return "badge--success";
    }
    if (status.toLowerCase().includes("expédié") || status.toLowerCase().includes("shipped")) {
      return "badge--info";
    }
    if (status.toLowerCase().includes("paiement accepté") || status.toLowerCase().includes("payment accepted")) {
      return "badge--success";
    }
    if (status.toLowerCase().includes("envoyé") || status.toLowerCase().includes("sent")) {
      return "badge--info";
    }
    if (status.toLowerCase().includes("erreur")) {
      return "badge--danger";
    }
    return "badge--warning";
  };

  const stats = [
    { 
      label: "Commandes", 
      value: ordersCount || "0",  
      sub: "Ce mois", 
      color: "#25b9d7",
      loading: ordersLoading,
      error: ordersErrors
    },
    { 
      label: "Clients", 
      value: customersCount || "0",  
      sub: "Total", 
      color: "#6c5ce7",
      loading: customersLoading,
      error: customersErrors
    },
    {
      label: "Transporteurs",
      value: carriersCount || "0",  
      sub: "Ce mois",
      color: "#00b894",
      loading: carriersLoading,
      error: carriersErrors
    },
    {
      label: "Produits actifs",
      value: productsCount || "0",  
      sub: "En catalogue",
      color: "#e17055",
      loading: productsLoading,
      error: productsErrors
    },
  ];

  const isLoading = productsLoading || ordersLoading || customersLoading || carriersLoading || ordersListLoading;
  const hasError = productsErrors || ordersErrors || customersErrors || carriersErrors || ordersListErrors;
  
  return (
    <div className="dashboard">
      <div className="page-header">
        <div className="breadcrumb">Accueil</div>
        <h1 className="page-title">Tableau de bord</h1>
      </div>

      <div className="dashboard-stats">
        {isLoading && <div>Chargement des données...</div>}
        {hasError && <div>Erreur lors du chargement des données</div>}
        
        {!isLoading && !hasError && stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-panels">
        <div className="panel">
          <div className="panel-header">Dernières commandes</div>
          <div className="panel-body">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id["#cdata"]}>
                      <td>{order.id["#cdata"]}</td>
                      <td>{getCustomerName(order)}</td>
                      <td>{getTotalAmount(order)}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(getOrderStatus(order))}`}>
                          {getOrderStatus(order)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      Aucune commande trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
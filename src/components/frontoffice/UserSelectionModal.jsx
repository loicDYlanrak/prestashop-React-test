/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { fetchPrestashop } from "../../hooks/useFetchPrestashop";
import "./UserSelectionModal.css";

export default function UserSelectionModal({ isOpen, onClose, onUserSelect }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetchPrestashop("customers");
      // console.log("customers: ", response);

      if (response.success && response.data?.customers?.customer) {
        const customersList = response.data.customers.customer;

        const customersWithDetails = await Promise.all(
          customersList.map(async (customerRef) => {
            const customerId = customerRef["@_id"];
            const customerDetails = await fetchPrestashop(
              `customers/${customerId}`,
            );
            console.log(`customer ${customerId}: `, customerDetails);

            if (customerDetails.success && customerDetails.data?.customer) {
              const cust = customerDetails.data.customer;
              return {
                id: parseInt(cust.id?.["#cdata"] || customerId),
                firstname: cust.firstname?.["#cdata"] || "",
                lastname: cust.lastname?.["#cdata"] || "",
                email: cust.email?.["#cdata"] || "",
                isGuest: cust.is_guest?.["#cdata"] === "1",
                active: cust.active?.["#cdata"] === "1",
              };
            }
            return null;
          }),
        );

        const validCustomers = customersWithDetails
          .filter((c) => c !== null)
          .sort((a, b) => a.firstname.localeCompare(b.firstname));

        setCustomers(validCustomers);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUserId(user.id);
  };

  const handleConfirm = () => {
    if (selectedUserId) {
      const selectedUser = customers.find((c) => c.id === selectedUserId);
      if (selectedUser) {
        onUserSelect(selectedUser);
        onClose();
      }
    }
  };

  const handleAnonymousSelect = () => {
    const anonymousUser = {
      id: 0,
      firstname: "Invité",
      lastname: "",
      email: "",
      isGuest: true,
      active: true,
      isAnonymous: true,
    };
    onUserSelect(anonymousUser);
    onClose();
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div className="user-selection-overlay" onClick={onClose}>
      <div
        className="user-selection-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="user-selection-header">
          <h2>Choisir un utilisateur</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="user-selection-content">
          {/* Option anonyme */}
          <div
            className={`user-card anonymous ${selectedUserId === 0 ? "selected" : ""}`}
            onClick={() => handleAnonymousSelect()}
          >
            <div className="user-avatar anonymous-avatar">👤</div>
            <div className="user-info">
              <div className="user-name">Utilisateur anonyme</div>
              <div className="user-email">Navigation sans connexion</div>
              <div className="user-badge anonymous-badge">Invité</div>
            </div>
            {selectedUserId === 0 && <div className="check-mark">✓</div>}
          </div>

          <div className="divider">
            <span>ou sélectionner un compte existant</span>
          </div>

          {/* Barre de recherche */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Liste des clients */}
          {loading ? (
            <div className="loading-customers">
              <div className="spinner-small"></div>
              <p>Chargement des utilisateurs...</p>
            </div>
          ) : (
            <div className="customers-list">
              {filteredCustomers.length === 0 ? (
                <div className="no-customers">
                  <p>Aucun utilisateur trouvé</p>
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`user-card ${selectedUserId === customer.id ? "selected" : ""}`}
                    onClick={() => handleUserSelect(customer)}
                  >
                    <div className="user-avatar">
                      {customer.firstname?.charAt(0) || "U"}
                    </div>
                    <div className="user-info">
                      <div className="user-name">
                        {customer.firstname} {customer.lastname}
                      </div>
                      <div className="user-email">{customer.email}</div>
                      <div className="user-badge">
                        {customer.isGuest ? "Invité" : "Client"}
                        {!customer.active && " (Inactif)"}
                      </div>
                    </div>
                    {selectedUserId === customer.id && (
                      <div className="check-mark">✓</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="user-selection-footer">
          <div className="footer-left">
            <button
              className="btn-register"
              onClick={() => console.log("Inscription à ajouter")}
            >
              Créer un nouveau compte
            </button>
          </div>
          <div className="footer-right">
            <button className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn-confirm"
              onClick={handleConfirm}
              disabled={!selectedUserId}
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

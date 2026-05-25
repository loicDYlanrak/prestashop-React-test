/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import "./CustomerAddressManager.css";
import {
  getAllEntitiesId,
  getCustomer,
  getAddresses,
} from "../hooks/useFetchPrestashop";
import { addResource, updateResource } from "../hooks/useMutationPrestashop";
import { deleteResource } from "../hooks/useDeletePrestashop";

export default function CustomerAddressManager() {
  const ITEMS_PER_PAGE = 10;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("customers");
  const [errors, setErrors] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [currentCustomerPage, setCurrentCustomerPage] = useState(1);

  const [addresses, setAddresses] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customersForAddresses, setCustomersForAddresses] = useState([]);
  const [currentAddressPage, setCurrentAddressPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [modalType, setModalType] = useState("customer");

  // Customer form
  const [customerForm, setCustomerForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    passwd: "",
    active: true,
    id_lang: "1",
    id_shop: "1",
  });

  // Address form
  const [addressForm, setAddressForm] = useState({
    id_customer: "",
    alias: "",
    company: "",
    lastname: "",
    firstname: "",
    address1: "",
    address2: "",
    postcode: "",
    city: "",
    phone: "",
    phone_mobile: "",
    vat_number: "",
    other: "",
  });

  // Load all customers
  const loadAllCustomers = async () => {
    setLoading(true);
    setErrors(null);
    try {
      const customerIds = await getAllEntitiesId("customers");
      if (customerIds && customerIds.length > 0) {
        const customerPromises = customerIds.map(async (id) => {
          const result = await getCustomer(id);
          if (result.success && result.data) {
            return {
              id: parseInt(id),
              firstname: result.data.firstname,
              lastname: result.data.lastname,
              email: result.data.email,
              fullName: `${result.data.firstname} ${result.data.lastname}`,
              active: result.data.active === "1" || result.data.active === 1,
            };
          }
          return null;
        });
        const results = await Promise.all(customerPromises);
        setCustomers(results.filter((c) => c !== null));
      } else {
        setCustomers([]);
      }
      setCurrentCustomerPage(1);
    } catch (err) {
      console.error("Erreur lors du chargement des clients:", err);
      setErrors({ message: err.message || "Erreur lors du chargement des clients" });
    } finally {
      setLoading(false);
    }
  };

  // Load all addresses
  const loadAllAddresses = async () => {
    try {
      const allCustomers = customers.length > 0 ? customers : await getAllEntitiesId("customers").then(async (ids) => {
        const promises = ids.map(async (id) => {
          const result = await getCustomer(id);
          if (result.success && result.data) {
            return {
              id: parseInt(id),
              firstname: result.data.firstname,
              lastname: result.data.lastname,
              email: result.data.email,
              fullName: `${result.data.firstname} ${result.data.lastname}`,
            };
          }
          return null;
        });
        const results = await Promise.all(promises);
        return results.filter((c) => c !== null);
      });
      
      setCustomersForAddresses(allCustomers);

      let allAddresses = [];
      for (const customer of allCustomers) {
        const result = await getAddresses(customer.id);
        if (result.success && result.data && result.data.addresses) {
          const customerAddresses = result.data.addresses.map((addr) => ({
            ...addr,
            customer_name: customer.fullName,
            customer_email: customer.email,
          }));
          allAddresses = [...allAddresses, ...customerAddresses];
        }
      }
      setAddresses(allAddresses);
      setCurrentAddressPage(1);
    } catch (err) {
      console.error("Erreur lors du chargement des adresses:", err);
    }
  };

  useEffect(() => {
    loadAllCustomers();
  }, []);

  useEffect(() => {
    if (activeTab === "addresses") {
      loadAllAddresses();
    }
  }, [activeTab, customers]);

  const resetCustomerForm = () => {
    setCustomerForm({
      firstname: "",
      lastname: "",
      email: "",
      passwd: "",
      active: true,
      id_lang: "1",
      id_shop: "1",
    });
  };

  const resetAddressForm = () => {
    setAddressForm({
      id_customer: selectedCustomerId || "",
      alias: "",
      company: "",
      lastname: "",
      firstname: "",
      address1: "",
      address2: "",
      postcode: "",
      city: "",
      phone: "",
      phone_mobile: "",
      vat_number: "",
      other: "",
    });
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (message) => {
    setErrors({ message });
    setTimeout(() => setErrors(null), 5000);
  };

  const getPaginatedData = (data, page) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems) => {
    return Math.ceil(totalItems / ITEMS_PER_PAGE);
  };

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Précédent
        </button>
        <span className="pagination-info">
          Page {currentPage} sur {totalPages}
        </span>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Suivant →
        </button>
      </div>
    );
  };

  // ========== CUSTOMER CRUD ==========
  const openCustomerModal = (customer = null) => {
    setModalType("customer");
    if (customer) {
      setEditItem(customer);
      setSelectedCustomerId(customer?.id)
      setCustomerForm({
        firstname: customer.firstname,
        lastname: customer.lastname,
        email: customer.email,
        passwd: "",
        active: customer.active,
        id_lang: "1",
        id_shop: "1",
      });
    } else {
      resetCustomerForm();
      setEditItem(null);
    }
    setShowModal(true);
  };

  const saveCustomer = async () => {
    if (!customerForm.firstname.trim()) {
      showError("Le prénom est requis");
      return;
    }
    if (!customerForm.lastname.trim()) {
      showError("Le nom est requis");
      return;
    }
    if (!customerForm.email.trim()) {
      showError("L'email est requis");
      return;
    }
    if (!editItem && !customerForm.passwd.trim()) {
      showError("Le mot de passe est requis pour un nouveau client");
      return;
    }

    setActionLoading(true);
    try {
      const customerData = {
        firstname: customerForm.firstname,
        lastname: customerForm.lastname,
        email: customerForm.email,
        active: customerForm.active ? "1" : "0",
        id_lang: customerForm.id_lang,
        id_shop: customerForm.id_shop,
      };

      if (customerForm.passwd) {
        customerData.passwd = customerForm.passwd;
      }

      if (editItem) {
        customerData.id = editItem.id;
        await updateResource("customer", editItem.id, customerData);
        showSuccess(`Client "${customerForm.firstname} ${customerForm.lastname}" modifié avec succès`);
      } else {
        await addResource("customer", customerData);
        showSuccess(`Client "${customerForm.firstname} ${customerForm.lastname}" créé avec succès`);
      }

      setShowModal(false);
      resetCustomerForm();
      setEditItem(null);
      await loadAllCustomers();
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCustomer = async (id, name) => {
    // Check if customer has addresses
    const customerAddresses = addresses.filter((a) => a.id_customer == id);
    if (customerAddresses.length > 0) {
      showError(`Impossible de supprimer ce client car il possède ${customerAddresses.length} adresse(s). Supprimez d'abord ses adresses.`);
      return;
    }

    if (!window.confirm(`Supprimer le client "${name}" ?`)) return;

    setActionLoading(true);
    try {
      await deleteResource("customer", id);
      showSuccess(`Client "${name}" supprimé avec succès`);
      await loadAllCustomers();
      if (activeTab === "addresses") {
        await loadAllAddresses();
      }
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la suppression");
    } finally {
      setActionLoading(false);
    }
  };

  // ========== ADDRESS CRUD ==========
  const openAddressModal = (address = null) => {
    setModalType("address");
    if (address) {
      setEditItem(address);
      setAddressForm({
        id_customer: address.id_customer,
        alias: address.alias || "",
        company: address.company || "",
        lastname: address.lastname,
        firstname: address.firstname,
        address1: address.address1,
        address2: address.address2 || "",
        postcode: address.postcode,
        city: address.city,
        phone: address.phone || "",
        phone_mobile: address.phone_mobile || "",
        vat_number: address.vat_number || "",
        other: address.other || "",
      });
    } else {
      resetAddressForm();
      setEditItem(null);
    }
    setShowModal(true);
  };

  const saveAddress = async () => {
    if (!addressForm.id_customer) {
      showError("Le client est requis");
      return;
    }
    if (!addressForm.lastname.trim()) {
      showError("Le nom est requis");
      return;
    }
    if (!addressForm.firstname.trim()) {
      showError("Le prénom est requis");
      return;
    }
    if (!addressForm.address1.trim()) {
      showError("L'adresse est requise");
      return;
    }
    if (!addressForm.city.trim()) {
      showError("La ville est requise");
      return;
    }
    if (!addressForm.postcode.trim()) {
      showError("Le code postal est requis");
      return;
    }

    setActionLoading(true);
    try {
      const addressData = {
        id_customer: parseInt(addressForm.id_customer),
        id_country: "8",  // France par défaut
        id_state: "0",
        alias: addressForm.alias || "Mon adresse",
        company: addressForm.company || "",
        lastname: addressForm.lastname,
        firstname: addressForm.firstname,
        address1: addressForm.address1,
        address2: addressForm.address2 || "",
        postcode: addressForm.postcode,
        city: addressForm.city,
        other: addressForm.other || "",
        phone: addressForm.phone || "",
        phone_mobile: addressForm.phone_mobile || "",
        vat_number: addressForm.vat_number || "",
      };

      if (editItem) {
        addressData.id = editItem.id;
        await updateResource("address", editItem.id, addressData);
        showSuccess(`Adresse de "${addressForm.firstname} ${addressForm.lastname}" modifiée avec succès`);
      } else {
        await addResource("address", addressData);
        showSuccess(`Adresse de "${addressForm.firstname} ${addressForm.lastname}" créée avec succès`);
      }

      setShowModal(false);
      resetAddressForm();
      setEditItem(null);
      await loadAllAddresses();
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteAddress = async (id, addressLine) => {
    if (!window.confirm(`Supprimer l'adresse "${addressLine}" ?`)) return;

    setActionLoading(true);
    try {
      await deleteResource("address", id);
      showSuccess(`Adresse supprimée avec succès`);
      await loadAllAddresses();
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la suppression");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && activeTab === "customers" && customers.length === 0) {
    return (
      <div className="customer-address-manager">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-address-manager">
      <div className="page-header">
        <div className="breadcrumb">
          Clients &gt; <strong>Gestion des clients et adresses</strong>
        </div>
        <div className="page-header-row">
          <h1 className="page-title">Gestion des Clients et Adresses</h1>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {successMessage}
          <button className="alert-close" onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}
      
      {errors && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {errors.message}
          <button className="alert-close" onClick={() => setErrors(null)}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "customers" ? "active" : ""}`}
          onClick={() => setActiveTab("customers")}
        >
          Clients ({customers.length})
        </button>
        <button
          className={`tab ${activeTab === "addresses" ? "active" : ""}`}
          onClick={() => setActiveTab("addresses")}
        >
          Adresses ({addresses.length})
        </button>
      </div>

      {/* Customers Tab */}
      {activeTab === "customers" && (
        <div className="panel">
          <div className="panel-header-row">
            <span className="panel-title">Liste des clients ({customers.length} total)</span>
            <button className="btn btn-primary" onClick={() => openCustomerModal()}>
              ＋ Nouveau client
            </button>
          </div>
          <div className="panel-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Nom complet</th>
                  <th>Email</th>
                  <th>Statut</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      Aucun client trouvé
                    </td>
                  </tr>
                ) : (
                  getPaginatedData(customers, currentCustomerPage).map((customer) => (
                    <tr key={customer.id}>
                      <td className="col-id">{customer.id}</td>
                      <td className="customer-name">{customer.fullName}</td>
                      <td className="customer-email">{customer.email}</td>
                      <td>
                        <span className={`badge ${customer.active ? "badge-success" : "badge-danger"}`}>
                          {customer.active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-btns">
                          <button
                            className="action-btn"
                            onClick={() => openCustomerModal(customer)}
                            disabled={actionLoading}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn action-btn--danger"
                            onClick={() => deleteCustomer(customer.id, customer.fullName)}
                            disabled={actionLoading}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination
              currentPage={currentCustomerPage}
              totalPages={getTotalPages(customers.length)}
              onPageChange={setCurrentCustomerPage}
            />
          </div>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === "addresses" && (
        <div className="panel">
          <div className="panel-header-row">
            <span className="panel-title">Liste des adresses ({addresses.length} total)</span>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                if (customersForAddresses.length === 0) {
                  showError("Aucun client disponible. Créez d'abord un client.");
                  return;
                }
                openAddressModal();
              }}
            >
              ＋ Nouvelle adresse
            </button>
          </div>
          <div className="panel-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Client</th>
                  <th>Destinataire</th>
                  <th>Adresse</th>
                  <th>Ville</th>
                  <th>Code postal</th>
                  <th>Téléphone</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {addresses.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-row">
                      Aucune adresse trouvée
                    </td>
                  </tr>
                ) : (
                  getPaginatedData(addresses, currentAddressPage).map((address) => (
                    <tr key={address.id}>
                      <td className="col-id">{address.id}</td>
                      <td className="customer-info">
                        <div className="customer-name-cell">{address.customer_name}</div>
                        <div className="customer-email-cell">{address.customer_email}</div>
                      </td>
                      <td>{address.firstname} {address.lastname}</td>
                      <td className="address-line">
                        {address.address1}
                        {address.address2 && `, ${address.address2}`}
                      </td>
                      <td>{address.city}</td>
                      <td>{address.postcode}</td>
                      <td>
                        {address.phone || address.phone_mobile || "-"}
                      </td>
                      <td className="col-actions">
                        <div className="action-btns">
                          <button
                            className="action-btn"
                            onClick={() => openAddressModal(address)}
                            disabled={actionLoading}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn action-btn--danger"
                            onClick={() => deleteAddress(address.id, `${address.address1}`)}
                            disabled={actionLoading}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination
              currentPage={currentAddressPage}
              totalPages={getTotalPages(addresses.length)}
              onPageChange={setCurrentAddressPage}
            />
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalType === "customer" && (editItem ? "Modifier le client" : "Nouveau client")}
                {modalType === "address" && (editItem ? "Modifier l'adresse" : "Nouvelle adresse")}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Customer Form */}
              {modalType === "customer" && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Prénom *</label>
                      <input
                        type="text"
                        value={customerForm.firstname}
                        onChange={(e) => setCustomerForm({ ...customerForm, firstname: e.target.value })}
                        placeholder="Prénom"
                      />
                    </div>
                    <div className="form-group">
                      <label>Nom *</label>
                      <input
                        type="text"
                        value={customerForm.lastname}
                        onChange={(e) => setCustomerForm({ ...customerForm, lastname: e.target.value })}
                        placeholder="Nom"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      placeholder="client@exemple.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Mot de passe {!editItem && "*"}</label>
                    <input
                      type="password"
                      value={customerForm.passwd}
                      onChange={(e) => setCustomerForm({ ...customerForm, passwd: e.target.value })}
                      placeholder={editItem ? "Laisser vide pour ne pas modifier" : "Mot de passe"}
                    />
                    {editItem && <small className="form-hint">Laissez vide pour conserver le mot de passe actuel</small>}
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={customerForm.active}
                        onChange={(e) => setCustomerForm({ ...customerForm, active: e.target.checked })}
                      />
                      {" "}Client actif
                    </label>
                  </div>
                </>
              )}

              {/* Address Form */}
              {modalType === "address" && (
                <>
                  <div className="form-group">
                    <label>Client *</label>
                    <select
                      value={addressForm.id_customer}
                      onChange={(e) => setAddressForm({ ...addressForm, id_customer: parseInt(e.target.value) })}
                    >
                      <option value="">Sélectionner un client</option>
                      {customersForAddresses.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.fullName} - {customer.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Prénom *</label>
                      <input
                        type="text"
                        value={addressForm.firstname}
                        onChange={(e) => setAddressForm({ ...addressForm, firstname: e.target.value })}
                        placeholder="Prénom du destinataire"
                      />
                    </div>
                    <div className="form-group">
                      <label>Nom *</label>
                      <input
                        type="text"
                        value={addressForm.lastname}
                        onChange={(e) => setAddressForm({ ...addressForm, lastname: e.target.value })}
                        placeholder="Nom du destinataire"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Alias</label>
                    <input
                      type="text"
                      value={addressForm.alias}
                      onChange={(e) => setAddressForm({ ...addressForm, alias: e.target.value })}
                      placeholder="Ex: Maison, Bureau, etc."
                    />
                    <small className="form-hint">Nom descriptif pour cette adresse</small>
                  </div>

                  <div className="form-group">
                    <label>Société</label>
                    <input
                      type="text"
                      value={addressForm.company}
                      onChange={(e) => setAddressForm({ ...addressForm, company: e.target.value })}
                      placeholder="Nom de l'entreprise (optionnel)"
                    />
                  </div>

                  <div className="form-group">
                    <label>Adresse *</label>
                    <input
                      type="text"
                      value={addressForm.address1}
                      onChange={(e) => setAddressForm({ ...addressForm, address1: e.target.value })}
                      placeholder="Numéro et nom de rue"
                    />
                  </div>

                  <div className="form-group">
                    <label>Complément d&apos;adresse</label>
                    <input
                      type="text"
                      value={addressForm.address2}
                      onChange={(e) => setAddressForm({ ...addressForm, address2: e.target.value })}
                      placeholder="Bâtiment, appartement, etc. (optionnel)"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Code postal *</label>
                      <input
                        type="text"
                        value={addressForm.postcode}
                        onChange={(e) => setAddressForm({ ...addressForm, postcode: e.target.value })}
                        placeholder="Code postal"
                      />
                    </div>
                    <div className="form-group">
                      <label>Ville *</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        placeholder="Ville"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Téléphone fixe</label>
                      <input
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        placeholder="01 23 45 67 89"
                      />
                    </div>
                    <div className="form-group">
                      <label>Téléphone mobile</label>
                      <input
                        type="tel"
                        value={addressForm.phone_mobile}
                        onChange={(e) => setAddressForm({ ...addressForm, phone_mobile: e.target.value })}
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Numéro de TVA</label>
                    <input
                      type="text"
                      value={addressForm.vat_number}
                      onChange={(e) => setAddressForm({ ...addressForm, vat_number: e.target.value })}
                      placeholder="Numéro de TVA intracommunautaire (optionnel)"
                    />
                  </div>

                  <div className="form-group">
                    <label>Informations complémentaires</label>
                    <textarea
                      value={addressForm.other}
                      onChange={(e) => setAddressForm({ ...addressForm, other: e.target.value })}
                      placeholder="Instructions de livraison, point de repère, etc."
                      rows="3"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (modalType === "customer") saveCustomer();
                  else saveAddress();
                }}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span className="spinner-small"></span>
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
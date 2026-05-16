// src/pages/frontoffice/UserSelectionPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPrestashop } from '../../hooks/useFetchPrestashop';
import './UserSelectionPage.css';

export default function UserSelectionPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

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
            const customerDetails = await fetchPrestashop(`customers/${customerId}`);
            // console.log(`customer ${customerId}: `, customerDetails);
            const addresses = await fetchPrestashop(`addresses`,{urlRest: `filter[id_customer]=${customerId}`});
            // console.log(`addresses for customer ${customerId}: `, addresses);
            const addressId = addresses.data?.addresses?.address?.[0]?.["@_id"] || addresses.data?.addresses?.address?.["@_id"] || null;
            // console.log(`addressId for customer ${customerId}: `, addressId);
            if (customerDetails.success && customerDetails.data?.customer) {
              const cust = customerDetails.data.customer;
              return {
                addressId: addressId,
                id: parseInt(cust.id?.["#cdata"] || customerId),
                firstname: cust.firstname?.["#cdata"] || "",
                lastname: cust.lastname?.["#cdata"] || "",
                email: cust.email?.["#cdata"] || "",
                isGuest: cust.is_guest?.["#cdata"] === "1",
                active: cust.active?.["#cdata"] === "1"
              };
            }
            return null;
          })
        );
        
        const validCustomers = customersWithDetails
          .filter(c => c !== null)
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
      const selectedUser = customers.find(c => c.id === selectedUserId);
      if (selectedUser) {
        localStorage.setItem('user', JSON.stringify(selectedUser));
        navigate('/products');
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
      isAnonymous: true
    };
    localStorage.setItem('user', JSON.stringify(anonymousUser));
    navigate('/');
  };

  const filteredCustomers = customers.filter(customer => 
    customer.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="user-selection-page">
      <div className="user-selection-page-container">
        <div className="user-selection-page-header">
          <h1>Bienvenue sur TsenaNTsika</h1>
          <p>Choisissez votre profil pour continuer</p>
        </div>

        <div className="user-selection-page-content">
          {/* Option anonyme */}
          <div className="selection-section">
            <h2>Navigation rapide</h2>
            <div 
              className={`user-card-page anonymous ${selectedUserId === 0 ? 'selected' : ''}`}
              onClick={() => handleAnonymousSelect()}
            >
              <div className="user-avatar-page anonymous-avatar">👤</div>
              <div className="user-info-page">
                <div className="user-name-page">Utilisateur anonyme</div>
                <div className="user-email-page">Navigation sans connexion</div>
                <div className="user-badge-page anonymous-badge">Invité</div>
              </div>
              {selectedUserId === 0 && <div className="check-mark-page">✓</div>}
            </div>
          </div>

          <div className="divider-page">
            <span>ou sélectionner un compte existant</span>
          </div>

          {/* Barre de recherche */}
          <div className="search-section">
            <div className="search-container-page">
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-page"
              />
            </div>

            {/* Liste des clients */}
            {loading ? (
              <div className="loading-customers-page">
                <div className="spinner-page"></div>
                <p>Chargement des utilisateurs...</p>
              </div>
            ) : (
              <div className="customers-list-page">
                {filteredCustomers.length === 0 ? (
                  <div className="no-customers-page">
                    <p>Aucun utilisateur trouvé</p>
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`user-card-page ${selectedUserId === customer.id ? 'selected' : ''}`}
                      onClick={() => handleUserSelect(customer)}
                    >
                      <div className="user-avatar-page">
                        {customer.firstname?.charAt(0) || 'U'}
                      </div>
                      <div className="user-info-page">
                        <div className="user-name-page">
                          {customer.firstname} {customer.lastname}
                        </div>
                        <div className="user-email-page">{customer.email}</div>
                        <div className="user-badge-page">
                          {customer.isGuest ? 'Invité' : 'Client'}
                          {!customer.active && ' (Inactif)'}
                        </div>
                      </div>
                      {selectedUserId === customer.id && <div className="check-mark-page">✓</div>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="user-selection-page-footer">
          <button 
            className="btn-confirm-page" 
            onClick={handleConfirm}
            disabled={!selectedUserId}
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { getAllEntitiesId, getCustomer } from "../../hooks/useFetchPrestashop";
import "./LoginModal.css";
import bcrypt from "bcryptjs";

// eslint-disable-next-line react/prop-types
export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const optionIds = await getAllEntitiesId("customers");
      if (optionIds && optionIds.length > 0) {
        const optionPromises = optionIds.map(async (id) => {
          const result = await getCustomer(id);
          if (result.success && result.data) {
            return result;
          }
          return null;
        });
        const results = await Promise.all(optionPromises);
        setCustomers(results.filter((o) => o !== null));
        console.log("results:", results)
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      setError("Erreur de chargement des données");
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email || !password) {
        setError("Email et mot de passe requis");
        setLoading(false);
        return;
      }

      // Vérifier si les clients sont encore en cours de chargement
      if (isLoadingCustomers) {
        setError("Chargement des données utilisateur en cours, veuillez réessayer");
        setLoading(false);
        return;
      }

      // Chercher l'utilisateur par email
      const customer = customers.find(
        (item) => item.data && item.data.email === email
      );

      if (!customer) {
        setError("Email ou mot de passe incorrect");
        setLoading(false);
        return;
      }

      // Comparer le mot de passe
      const isPasswordValid = await bcrypt.compare(password, customer.data.passwd);
      
      if (isPasswordValid) {
        console.log("Connexion réussie !");
        // Stocker les infos utilisateur si nécessaire
        const userData = {
          id: customer.data.id,
          email: customer.data.email,
          firstname: customer.data.firstname,
          lastname: customer.data.lastname
        };
        
        if (onLoginSuccess) {
          onLoginSuccess(userData);
        }
        
        onClose(); // Fermer la modale après connexion réussie
      } else {
        setError("Email ou mot de passe incorrect");
      }
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError("Erreur de connexion: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Connexion</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          {isLoadingCustomers && (
            <div className="info-message">Chargement des données utilisateur...</div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              disabled={isLoadingCustomers}
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoadingCustomers}
            />
          </div>

          <button 
            type="submit" 
            className="btn-submit" 
            disabled={loading || isLoadingCustomers}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
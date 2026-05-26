/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./FrontHeader.css";
import UserSelectionModal from "./UserSelectionModal";
import UserProfileModal from "./UserProfileModal";
import { useCart } from "../../context/CartContext";

export default function FrontHeader() {
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { cart, loadCartFromPrestashop } = useCart();

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
  }, []);

  useEffect(() => {
    if (user && user.id && !user.isAnonymous && loadCartFromPrestashop) {
      setIsLoadingCart(true);
      loadCartFromPrestashop(user.id)
        .then(() => {
          setIsLoadingCart(false);
        })
        .catch((error) => {
          console.error("Error loading cart:", error);
          setIsLoadingCart(false);
        });
    }
  }, [user]);

  useEffect(() => {
    const handleOpenModal = () => {
      setShowUserModal(true);
    };

    window.addEventListener("openUserModal", handleOpenModal);

    return () => {
      window.removeEventListener("openUserModal", handleOpenModal);
    };
  }, []);

  const handleUserSelect = (userData) => {
    setShowUserModal(false);
    
    if (userData.isAnonymous) {
      sessionStorage.setItem(
        "user",
        JSON.stringify({ ...userData, isAnonymous: true, remember: false })
      );
      localStorage.removeItem("user");
    } else {
      localStorage.setItem(
        "user",
        JSON.stringify({ ...userData, isAnonymous: false, remember: true })
      );
      sessionStorage.removeItem("user");
    }
    
    setUser(userData);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("cart");
    localStorage.removeItem("cart");
    setShowUserMenu(false);
    navigate("/");
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    setShowProfileModal(true);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <>
      <header className="front-header">
        <div className="front-header-container">
          <Link to="/" className="front-logo">
            <span className="logo-icon"></span>
            <span className="logo-text">TsenaNTsika</span>
          </Link>

          <nav className="front-nav">
            <Link to="/" className="nav-link">
              Accueil
            </Link>
            <Link to="/products" className="nav-link">
              Produits
            </Link>
            <Link to="/select-user" className="nav-link">
              Choisir Utilisateur
            </Link>
            {user && (
              <Link to="/orders" className="nav-link">
                Mes Commandes
              </Link>
            )}
          </nav>

          <div className="front-header-actions">
            <Link to="/cart" className="cart-link">
              <span className="cart-icon">Panier</span>
              {cartItemCount > 0 && (
                <span className="cart-count">{cartItemCount}</span>
              )}
            </Link>
            
            {user ? (
              <div className="user-menu-container">
                <button 
                  className="user-menu-trigger"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <span className="user-avatar-2">
                    {user.firstname?.charAt(0)}{user.lastname?.charAt(0)}
                  </span>
                  <span className="user-name-2">
                    {user.isAnonymous
                      ? `Invité${user.firstname ? ` ${user.firstname}` : ""}`
                      : `${user.firstname} ${user.lastname}`}
                  </span>
                  <span className="user-menu-arrow">▼</span>
                </button>
                
                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <button onClick={handleProfileClick} className="dropdown-item">
                      Mon profil
                    </button>
                    <button onClick={handleLogout} className="dropdown-item logout">
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="btn-login"
                onClick={() => setShowUserModal(true)}
              >
                Se connecter / Choisir un utilisateur
              </button>
            )}
          </div>
        </div>
      </header>

      <UserSelectionModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onUserSelect={handleUserSelect}
      />

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUserUpdate={handleUserUpdate}
      />
    </>
  );
}
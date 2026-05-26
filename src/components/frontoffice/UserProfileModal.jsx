/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { updateResource } from "../../hooks/useMutationPrestashop";
import { getCustomer } from "../../hooks/useFetchPrestashop";

export default function UserProfileModal({ isOpen, onClose, user, onUserUpdate }) {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    passwd: "",
    currentPasswd: "",
    confirmPasswd: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      const loadUserData = async () => {
        if (!user.isAnonymous) {
          const result = await getCustomer(user.id);
          if (result.success && result.data) {
            setFormData({
              firstname: result.data.firstname || "",
              lastname: result.data.lastname || "",
              email: result.data.email || "",
              passwd: "",
              currentPasswd: "",
              confirmPasswd: "",
            });
          }
        } else {
          setFormData({
            firstname: user.firstname || "",
            lastname: user.lastname || "",
            email: user.email || "",
            passwd: "",
            currentPasswd: "",
            confirmPasswd: "",
          });
        }
      };
      loadUserData();
    }
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstname.trim()) {
      newErrors.firstname = "Le prénom est requis";
    }
    if (!formData.lastname.trim()) {
      newErrors.lastname = "Le nom est requis";
    }
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    
    if (showPasswordFields) {
      if (!formData.currentPasswd) {
        newErrors.currentPasswd = "Le mot de passe actuel est requis";
      }
      if (formData.passwd && formData.passwd.length < 6) {
        newErrors.passwd = "Le nouveau mot de passe doit contenir au moins 6 caractères";
      }
      if (formData.passwd !== formData.confirmPasswd) {
        newErrors.confirmPasswd = "Les mots de passe ne correspondent pas";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    setSuccessMessage(null);
    
    try {
      if (user.isAnonymous) {
        const updatedUser = {
          ...user,
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
        };
        
        if (showPasswordFields && formData.passwd) {
          updatedUser.passwd = formData.passwd;
        }
        
        if (user.remember) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } else {
          sessionStorage.setItem("user", JSON.stringify(updatedUser));
        }
        
        onUserUpdate(updatedUser);
        setSuccessMessage("Profil mis à jour avec succès");
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1500);
      } else {
        const updateData = {
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          id: user.id,
        };
        
        if (showPasswordFields && formData.passwd) {
          updateData.passwd = formData.passwd;
        }
        
        const result = await updateResource("customer", user.id, updateData);
        console.log("result:", result)
        if (result.customer) {
          const refreshedUser = await getCustomer(user.id);
          if (refreshedUser.success && refreshedUser.data) {
            const updatedUserData = {
              ...user,
              firstname: refreshedUser.data.firstname,
              lastname: refreshedUser.data.lastname,
              email: refreshedUser.data.email,
            };
            
            if (user?.remember) {
              localStorage.setItem("user", JSON.stringify(updatedUserData));
            } else {
              sessionStorage.setItem("user", JSON.stringify(updatedUserData));
            }
            
            onUserUpdate(updatedUserData);
            setSuccessMessage("Profil mis à jour avec succès");
            setTimeout(() => {
              setSuccessMessage(null);
              onClose();
            }, 1500);
          }
        } else {
        
          setErrors({ submit: result.error || "Erreur lors de la mise à jour" });
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      setErrors({ submit: error.message || "Une erreur est survenue" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Modifier mon profil</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {successMessage && (
              <div className="alert alert-success">
                <span className="alert-icon">✓</span>
                {successMessage}
              </div>
            )}
            
            {errors.submit && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠</span>
                {errors.submit}
              </div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label>Prénom *</label>
                <input
                  type="text"
                  value={formData.firstname}
                  onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                  className={errors.firstname ? "error" : ""}
                />
                {errors.firstname && <span className="error-message">{errors.firstname}</span>}
              </div>
              
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.lastname}
                  onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                  className={errors.lastname ? "error" : ""}
                />
                {errors.lastname && <span className="error-message">{errors.lastname}</span>}
              </div>
            </div>
            
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? "error" : ""}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showPasswordFields}
                  onChange={(e) => {
                    setShowPasswordFields(e.target.checked);
                    if (!e.target.checked) {
                      setFormData({
                        ...formData,
                        passwd: "",
                        currentPasswd: "",
                        confirmPasswd: "",
                      });
                    }
                  }}
                />
                Changer mon mot de passe
              </label>
            </div>
            
            {showPasswordFields && (
              <>
                {!user.isAnonymous && (
                  <div className="form-group">
                    <label>Mot de passe actuel *</label>
                    <input
                      type="password"
                      value={formData.currentPasswd}
                      onChange={(e) => setFormData({ ...formData, currentPasswd: e.target.value })}
                      className={errors.currentPasswd ? "error" : ""}
                      placeholder="Votre mot de passe actuel"
                    />
                    {errors.currentPasswd && <span className="error-message">{errors.currentPasswd}</span>}
                  </div>
                )}
                
                <div className="form-group">
                  <label>Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={formData.passwd}
                    onChange={(e) => setFormData({ ...formData, passwd: e.target.value })}
                    className={errors.passwd ? "error" : ""}
                    placeholder="Minimum 6 caractères"
                  />
                  {errors.passwd && <span className="error-message">{errors.passwd}</span>}
                </div>
                
                <div className="form-group">
                  <label>Confirmer le nouveau mot de passe</label>
                  <input
                    type="password"
                    value={formData.confirmPasswd}
                    onChange={(e) => setFormData({ ...formData, confirmPasswd: e.target.value })}
                    className={errors.confirmPasswd ? "error" : ""}
                    placeholder="Répéter le nouveau mot de passe"
                  />
                  {errors.confirmPasswd && <span className="error-message">{errors.confirmPasswd}</span>}
                </div>
              </>
            )}
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
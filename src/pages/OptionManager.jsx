/* eslint-disable react-hooks/exhaustive-deps */
// OptionManager.jsx
/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import "./OptionManager.css";
import {
  getAllEntitiesId,
  getProductOptions,
  getProductOptionValues,
} from "../hooks/useFetchPrestashop";
import { addResource, updateResource } from "../hooks/useMutationPrestashop";
import { deleteResource } from "../hooks/useDeletePrestashop";

export default function OptionManager() {
  const ITEMS_PER_PAGE = 10;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("options");
  const [errors, setErrors] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [options, setOptions] = useState([]);
  const [optionValues, setOptionValues] = useState([]);

  const [currentOptionPage, setCurrentOptionPage] = useState(1);
  const [currentOptionValuePage, setCurrentOptionValuePage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [modalType, setModalType] = useState("option");

  const [optionForm, setOptionForm] = useState({
    name: "",
    public_name: "",
    is_color_group: false,
    group_type: "select",
  });

  const [optionValueForm, setOptionValueForm] = useState({
    id_attribute_group: "",
    name: "",
    color: "",
  });

  const loadAllOptions = async () => {
    setLoading(true);
    setErrors(null);
    try {
      const optionIds = await getAllEntitiesId("product_options");
      if (optionIds && optionIds.length > 0) {
        const optionPromises = optionIds.map(async (id) => {
          const result = await getProductOptions(id);
          if (result.success && result.data) {
            return {
              id: parseInt(id),
              name: result.data.name,
              public_name: result.data.public_name,
              is_color_group: result.data.is_color_group === 1,
              group_type: result.data.group_type,
            };
          }
          return null;
        });
        const results = await Promise.all(optionPromises);
        setOptions(results.filter((o) => o !== null));
      } else {
        setOptions([]);
      }
      await loadAllOptionValues();
      setCurrentOptionPage(1);
      setCurrentOptionValuePage(1);
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      setErrors({ message: err.message || "Erreur lors du chargement des données" });
    } finally {
      setLoading(false);
    }
  };

  const loadAllOptionValues = async () => {
    try {
      const valueIds = await getAllEntitiesId("product_option_values");
      if (valueIds && valueIds.length > 0) {
        const valuePromises = valueIds.map(async (id) => {
          const result = await getProductOptionValues(id);
          if (result.success && result.data) {
            const optionResult = await getProductOptions(result.data.id_attribute_group);
            return {
              id: parseInt(id),
              id_attribute_group: parseInt(result.data.id_attribute_group),
              name: result.data.name,
              color: result.data.color || "",
              group_name: optionResult.success ? optionResult.data.name : `Groupe ${result.data.id_attribute_group}`,
            };
          }
          return null;
        });
        const results = await Promise.all(valuePromises);
        // console.log("results:", results)
        setOptionValues(results)
        // console.log("optionValues:", optionValues)
    } else {
        setOptionValues([]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des valeurs d'options:", err);
    }
  };

  useEffect(() => {
    loadAllOptions();
  }, []);

  const resetForms = () => {
    setOptionForm({
      name: "",
      public_name: "",
      is_color_group: false,
      group_type: "select",
    });
    setOptionValueForm({
      id_attribute_group: "",
      name: "",
      color: "",
    });
    setEditItem(null);
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

  const openOptionModal = (option = null) => {
    setModalType("option");
    if (option) {
      setEditItem(option);
      setOptionForm({
        name: option.name,
        public_name: option.public_name || option.name,
        is_color_group: option.is_color_group,
        group_type: option.group_type,
      });
    } else {
      resetForms();
    }
    setShowModal(true);
  };

  const saveOption = async () => {
    if (!optionForm.name.trim()) {
      showError("Le nom de l'option est requis");
      return;
    }

    setActionLoading(true);
    try {
      const optionData = {
        name: optionForm.name,
        public_name: optionForm.public_name || optionForm.name,
        is_color_group: optionForm.is_color_group ? "1" : "0",
        group_type: optionForm.group_type,
      };

      if (editItem) {
        optionData.id = editItem.id;
        await updateResource("product_option", editItem.id, optionData);
        showSuccess(`Option "${optionForm.name}" modifiée avec succès`);
      } else {
        await addResource("product_option", optionData);
        showSuccess(`Option "${optionForm.name}" créée avec succès`);
      }

      setShowModal(false);
      resetForms();
      await loadAllOptions();
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteOption = async (id, name) => {
    const hasValues = optionValues.some((v) => v.id_attribute_group === id);
    if (hasValues) {
      showError("Impossible de supprimer cette option car elle contient des valeurs");
      return;
    }

    if (!window.confirm(`Supprimer l'option "${name}" ?`)) return;

    setActionLoading(true);
    try {
      await deleteResource("product_option", id);
      showSuccess(`Option "${name}" supprimée avec succès`);
      await loadAllOptions();
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la suppression");
    } finally {
      setActionLoading(false);
    }
  };

  // ========== OPTION VALUES CRUD ==========
  const openOptionValueModal = (value = null) => {
    setModalType("optionValue");
    if (value) {
      setEditItem(value);
      setOptionValueForm({
        id_attribute_group: value.id_attribute_group,
        name: value.name,
        color: value.color || "",
      });
    } else {
      resetForms();
      // Sélectionner la première option par défaut si disponible
      if (options.length > 0 && !optionValueForm.id_attribute_group) {
        setOptionValueForm((prev) => ({
          ...prev,
          id_attribute_group: options[0].id,
        }));
      }
    }
    setShowModal(true);
  };

  const saveOptionValue = async () => {
    if (!optionValueForm.id_attribute_group) {
      showError("Le groupe d'option est requis");
      return;
    }
    if (!optionValueForm.name.trim()) {
      showError("Le nom de la valeur est requis");
      return;
    }

    setActionLoading(true);
    try {
      const optionValueData = {
        id_attribute_group: parseInt(optionValueForm.id_attribute_group),
        name: optionValueForm.name,
        ...(optionValueForm.color && { color: optionValueForm.color }),
      };

      if (editItem) {
        optionValueData.id = editItem.id;
        await updateResource("product_option_value", editItem.id, optionValueData);
        showSuccess(`Valeur "${optionValueForm.name}" modifiée avec succès`);
      } else {
        await addResource("product_option_value", optionValueData);
        showSuccess(`Valeur "${optionValueForm.name}" créée avec succès`);
      }

      setShowModal(false);
      resetForms();
      await loadAllOptions();
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteOptionValue = async (id, name) => {
    if (!window.confirm(`Supprimer la valeur "${name}" ?`)) return;

    setActionLoading(true);
    try {
      await deleteResource("product_option_value", id);
      showSuccess(`Valeur "${name}" supprimée avec succès`);
      await loadAllOptions();
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la suppression");
    } finally {
      setActionLoading(false);
    }
  };

  const getGroupTypeLabel = (type) => {
    const types = {
      select: "Liste déroulante",
      radio: "Boutons radio",
      color: "Couleur",
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="option-manager">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="option-manager">
      <div className="page-header">
        <div className="breadcrumb">
          Produits &gt; <strong>Options et attributs</strong>
        </div>
        <div className="page-header-row">
          <h1 className="page-title">Gestion des Options et Attributs</h1>
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
          className={`tab ${activeTab === "options" ? "active" : ""}`}
          onClick={() => setActiveTab("options")}
        >
          Options ({options.length})
        </button>
        <button
          className={`tab ${activeTab === "optionValues" ? "active" : ""}`}
          onClick={() => setActiveTab("optionValues")}
        >
          Valeurs d&apos;options ({optionValues.length})
        </button>
      </div>

      {/* Options Tab */}
      {activeTab === "options" && (
        <div className="panel">
          <div className="panel-header-row">
            <span className="panel-title">Liste des options ({options.length} total)</span>
            <button className="btn btn-primary" onClick={() => openOptionModal()}>
              ＋ Nouvelle option
            </button>
          </div>
          <div className="panel-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Nom</th>
                  <th>Nom public</th>
                  <th>Type d&apos;affichage</th>
                  <th>Groupe de couleurs</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {options.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      Aucune option trouvée
                    </td>
                  </tr>
                ) : (
                  getPaginatedData(options, currentOptionPage).map((option) => (
                    <tr key={option.id}>
                      <td className="col-id">{option.id}</td>
                      <td className="option-name">{option.name}</td>
                      <td>{option.public_name}</td>
                      <td>
                        <span className="badge badge-secondary">
                          {getGroupTypeLabel(option.group_type)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${option.is_color_group ? "badge-success" : "badge-secondary"}`}>
                          {option.is_color_group ? "Oui" : "Non"}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-btns">
                          <button
                            className="action-btn"
                            onClick={() => openOptionModal(option)}
                            disabled={actionLoading}
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn action-btn--danger"
                            onClick={() => deleteOption(option.id, option.name)}
                            disabled={actionLoading}
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
              currentPage={currentOptionPage}
              totalPages={getTotalPages(options.length)}
              onPageChange={setCurrentOptionPage}
            />
          </div>
        </div>
      )}

      {/* Option Values Tab */}
      {activeTab === "optionValues" && (
        <div className="panel">
          <div className="panel-header-row">
            <span className="panel-title">Liste des valeurs d&apos;options ({optionValues.length} total)</span>
            <button className="btn btn-primary" onClick={() => openOptionValueModal()}>
              ＋ Nouvelle valeur
            </button>
          </div>
          <div className="panel-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Option parente</th>
                  <th>Nom</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {optionValues.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      Aucune valeur d&apos;option trouvée
                    </td>
                  </tr>
                ) : (
                  getPaginatedData(optionValues, currentOptionValuePage).map((value) => { return (
                    <tr key={value.id}>
                      <td className="col-id">{value.id}</td>
                      <td>
                        <span className="badge badge-info">
                          {value.group_name}
                        </span>
                      </td>
                      <td className="value-name">
                        {value.color ? (
                          <div className="color-value-preview">
                            <span 
                              className="color-swatch" 
                              style={{ backgroundColor: value.color}}
                            ></span>
                            {value.name}
                          </div>
                        ) : (
                          value.name
                        )}
                      </td>
                      <td className="col-actions">
                        <div className="action-btns">
                          <button
                            className="action-btn"
                            onClick={() => openOptionValueModal(value)}
                            disabled={actionLoading}
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn action-btn--danger"
                            onClick={() => deleteOptionValue(value.id, value.name)}
                            disabled={actionLoading}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
            <Pagination
              currentPage={currentOptionValuePage}
              totalPages={getTotalPages(optionValues.length)}
              onPageChange={setCurrentOptionValuePage}
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
                {modalType === "option" && (editItem ? "Modifier l'option" : "Nouvelle option")}
                {modalType === "optionValue" && (editItem ? "Modifier la valeur" : "Nouvelle valeur")}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Option Form */}
              {modalType === "option" && (
                <>
                  <div className="form-group">
                    <label>Nom *</label>
                    <input
                      value={optionForm.name}
                      onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                      placeholder="Ex: Taille, Couleur, Matière..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom public *</label>
                    <input
                      value={optionForm.public_name}
                      onChange={(e) => setOptionForm({ ...optionForm, public_name: e.target.value })}
                      placeholder="Nom public affiché aux clients"
                    />
                    <small className="form-hint">Laissez vide pour utiliser le nom</small>
                  </div>
                  <div className="form-group">
                    <label>Type d&apos;affichage</label>
                    <select
                      value={optionForm.group_type}
                      onChange={(e) => setOptionForm({ ...optionForm, group_type: e.target.value })}
                    >
                      <option value="select">Liste déroulante</option>
                      <option value="radio">Boutons radio</option>
                      <option value="color">Couleur</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={optionForm.is_color_group}
                        onChange={(e) => setOptionForm({ ...optionForm, is_color_group: e.target.checked })}
                      />
                      {" "}Groupe de couleurs (affiche des carrés de couleur)
                    </label>
                  </div>
                </>
              )}

              {/* Option Value Form */}
              {modalType === "optionValue" && (
                <>
                  <div className="form-group">
                    <label>Option parente *</label>
                    <select
                      value={optionValueForm.id_attribute_group}
                      onChange={(e) => setOptionValueForm({ ...optionValueForm, id_attribute_group: parseInt(e.target.value) })}
                    >
                      <option value="">Sélectionner une option</option>
                      {options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} {!option.is_color_group ? `(${getGroupTypeLabel(option.group_type)})` : "(Couleur)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nom *</label>
                    <input
                      value={optionValueForm.name}
                      onChange={(e) => setOptionValueForm({ ...optionValueForm, name: e.target.value })}
                      placeholder="Ex: Rouge, XL, Coton..."
                    />
                  </div>
                  
                  {/* Champ couleur - visible uniquement si l'option parente est un groupe de couleurs ou de type color */}
                  {(() => {
                    const selectedOption = options.find(o => o.id === optionValueForm.id_attribute_group);
                    const showColorField = selectedOption?.is_color_group || selectedOption?.group_type === "color";
                    return showColorField && (
                      <div className="form-group">
                        <label>Couleur (code hexadécimal)</label>
                        <div className="color-input-group">
                          <input
                            type="color"
                            value={optionValueForm.color || "#000000"}
                            onChange={(e) => setOptionValueForm({ ...optionValueForm, color: e.target.value })}
                            className="color-picker"
                          />
                          <input
                            type="text"
                            value={optionValueForm.color}
                            onChange={(e) => setOptionValueForm({ ...optionValueForm, color: e.target.value })}
                            placeholder="#RRGGBB"
                            className="color-text"
                          />
                        </div>
                        <small className="form-hint">Code couleur hexadécimal (ex: #FF0000 pour rouge)</small>
                      </div>
                    );
                  })()}
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
                  if (modalType === "option") saveOption();
                  else saveOptionValue();
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
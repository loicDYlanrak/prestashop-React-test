/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import "./TaxManager.css";
import {
  getAllEntitiesId,
  getTaxe,
  getTaxeRuleGroup,
  getTaxeRule,
} from "../hooks/useFetchPrestashop";
import { addResource, updateResource } from "../hooks/useMutationPrestashop";
import {
  deleteResource,
} from "../hooks/useDeletePrestashop";

export default function TaxManager() {
  const ITEMS_PER_PAGE = 10;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("taxes");
  const [errors, setErrors] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [taxes, setTaxes] = useState([]);
  const [taxRuleGroups, setTaxRuleGroups] = useState([]);
  const [taxRules, setTaxRules] = useState([]);

  const [currentTaxPage, setCurrentTaxPage] = useState(1);
  const [currentTaxRuleGroupPage, setCurrentTaxRuleGroupPage] = useState(1);
  const [currentTaxRulePage, setCurrentTaxRulePage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [modalType, setModalType] = useState("tax"); 

  const [taxForm, setTaxForm] = useState({
    name: "",
    rate: "",
    active: true,
    deleted: false,
  });

  const [taxRuleGroupForm, setTaxRuleGroupForm] = useState({
    name: "",
    active: true,
    deleted: false,
  });

  const [taxRuleForm, setTaxRuleForm] = useState({
    id_tax_rules_group: "",
    id_country: "8",
    id_state: "0",
    zipcode_from: "0",
    zipcode_to: "0",
    id_tax: "",
    behavior: "0",
    description: "",
  });

  const loadAllTaxData = async () => {
    setLoading(true);
    setErrors(null);
    try {
      const taxIds = await getAllEntitiesId("taxes");
      if (taxIds && taxIds.length > 0) {
        const taxPromises = taxIds.map(async (id) => {
          const result = await getTaxe(id);
          if (result.success && result.data) {
            return {
              id: parseInt(id),
              name: result.data.name,
              rate: result.data.rate,
              active: result.data.active === "1" || result.data.active === 1,
              deleted: result.data.deleted === "1" || result.data.deleted === 1,
            };
          }
          return null;
        });
        const results = await Promise.all(taxPromises);
        setTaxes(results.filter((t) => t !== null));
      } else {
        setTaxes([]);
      }
      const taxRuleGroupIds = await getAllEntitiesId("tax_rule_groups");
      if (taxRuleGroupIds && taxRuleGroupIds.length > 0) {
        const groupPromises = taxRuleGroupIds.map(async (id) => {
          const result = await getTaxeRuleGroup(id);
          if (result.success && result.data) {
            return {
              id: parseInt(id),
              name: result.data.name,
              active: result.data.active === "1" || result.data.active === 1,
              deleted: result.data.deleted === "1" || result.data.deleted === 1,
            };
          }
          return null;
        });
        const results = await Promise.all(groupPromises);
        setTaxRuleGroups(results.filter((g) => g !== null));
      } else {
        setTaxRuleGroups([]);
      }

      const taxRuleIds = await getAllEntitiesId("tax_rules");
      if (taxRuleIds && taxRuleIds.length > 0) {
        const rulePromises = taxRuleIds.map(async (id) => {
          const result = await getTaxeRule(id);
          if (result.success && result.data) {
            return {
              id: parseInt(id),
              id_tax_rules_group: result.data.id_tax_rules_group,
              id_country: result.data.id_country,
              id_state: result.data.id_state,
              zipcode_from: result.data.zipcode_from,
              zipcode_to: result.data.zipcode_to,
              id_tax: result.data.id_tax,
              behavior: result.data.behavior,
              description: result.data.description,
            };
          }
          return null;
        });
        const results = await Promise.all(rulePromises);
        setTaxRules(results.filter((r) => r !== null));
      } else {
        setTaxRules([]);
      }

      setCurrentTaxPage(1);
      setCurrentTaxRuleGroupPage(1);
      setCurrentTaxRulePage(1);
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      setErrors({ message: err.message || "Erreur lors du chargement des données" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllTaxData();
  }, []);

  const resetForms = () => {
    setTaxForm({
      name: "",
      rate: "",
      active: true,
      deleted: false,
    });
    setTaxRuleGroupForm({
      name: "",
      active: true,
      deleted: false,
    });
    setTaxRuleForm({
      id_tax_rules_group: "",
      id_country: "8",
      id_state: "0",
      zipcode_from: "0",
      zipcode_to: "0",
      id_tax: "",
      behavior: "0",
      description: "",
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

  const openTaxModal = (tax = null) => {
    setModalType("tax");
    if (tax) {
      setEditItem(tax);
      setTaxForm({
        name: tax.name,
        rate: tax.rate,
        active: tax.active,
        deleted: tax.deleted,
      });
    } else {
      resetForms();
    }
    setShowModal(true);
  };

  const saveTax = async () => {
    if (!taxForm.name.trim()) {
      showError("Le nom de la taxe est requis");
      return;
    }
    if (!taxForm.rate || isNaN(parseFloat(taxForm.rate))) {
      showError("Le taux de taxe est requis et doit être un nombre");
      return;
    }

    setActionLoading(true);
    try {
      const taxData = {
        name: taxForm.name,
        rate: parseFloat(taxForm.rate).toString(),
        active: taxForm.active ? "1" : "0",
        deleted: taxForm.deleted ? "1" : "0",
      };

      if (editItem) {
        taxData.id = editItem.id;
        await updateResource("tax", editItem.id, taxData);
        showSuccess(`Taxe "${taxForm.name}" modifiée avec succès`);
      } else {
        await addResource("tax", taxData);
        showSuccess(`Taxe "${taxForm.name}" créée avec succès`);
      }

      setShowModal(false);
      resetForms();
      await loadAllTaxData();
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteTax = async (id, name) => {
    if (!window.confirm(`Supprimer la taxe "${name}" ?`)) return;

    setActionLoading(true);
    try {
      await deleteResource("tax", id);
      showSuccess(`Taxe "${name}" supprimée avec succès`);
      await loadAllTaxData();
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la suppression");
    } finally {
      setActionLoading(false);
    }
  };

  const openTaxRuleGroupModal = (group = null) => {
    setModalType("taxRuleGroup");
    if (group) {
      setEditItem(group);
      setTaxRuleGroupForm({
        name: group.name,
        active: group.active,
        deleted: group.deleted,
      });
    } else {
      resetForms();
    }
    setShowModal(true);
  };

  const saveTaxRuleGroup = async () => {
    if (!taxRuleGroupForm.name.trim()) {
      showError("Le nom du groupe est requis");
      return;
    }

    setActionLoading(true);
    try {
      const groupData = {
        name: taxRuleGroupForm.name,
        active: taxRuleGroupForm.active ? "1" : "0",
        deleted: taxRuleGroupForm.deleted ? "1" : "0",
      };

      if (editItem) {
        groupData.id = editItem.id;
        await updateResource("taxRuleGroup", editItem.id, groupData);
        showSuccess(`Groupe "${taxRuleGroupForm.name}" modifié avec succès`);
      } else {
        await addResource("taxRuleGroup", groupData);
        showSuccess(`Groupe "${taxRuleGroupForm.name}" créé avec succès`);
      }

      setShowModal(false);
      resetForms();
      await loadAllTaxData();
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteTaxRuleGroup = async (id, name) => {
    const hasRules = taxRules.some((rule) => rule.id_tax_rules_group === id);
    if (hasRules) {
      showError("Impossible de supprimer ce groupe car il contient des règles de taxe");
      return;
    }

    if (!window.confirm(`Supprimer le groupe "${name}" ?`)) return;

    setActionLoading(true);
    try {
      await deleteResource("taxRuleGroup", id);
      showSuccess(`Groupe "${name}" supprimé avec succès`);
      await loadAllTaxData();
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la suppression");
    } finally {
      setActionLoading(false);
    }
  };

  const openTaxRuleModal = (rule = null) => {
    setModalType("taxRule");
    if (rule) {
      setEditItem(rule);
      setTaxRuleForm({
        id_tax_rules_group: rule.id_tax_rules_group,
        id_country: rule.id_country,
        id_state: rule.id_state,
        zipcode_from: rule.zipcode_from,
        zipcode_to: rule.zipcode_to,
        id_tax: rule.id_tax,
        behavior: rule.behavior,
        description: rule.description || "",
      });
    } else {
      resetForms();
    }
    setShowModal(true);
  };

  const saveTaxRule = async () => {
    if (!taxRuleForm.id_tax_rules_group) {
      showError("Le groupe de règles est requis");
      return;
    }
    if (!taxRuleForm.id_tax) {
      showError("La taxe est requise");
      return;
    }

    setActionLoading(true);
    try {
      const ruleData = {
        id_tax_rules_group: parseInt(taxRuleForm.id_tax_rules_group),
        id_country: parseInt(taxRuleForm.id_country),
        id_state: parseInt(taxRuleForm.id_state),
        zipcode_from: taxRuleForm.zipcode_from.toString(),
        zipcode_to: taxRuleForm.zipcode_to.toString(),
        id_tax: parseInt(taxRuleForm.id_tax),
        behavior: parseInt(taxRuleForm.behavior),
        description: taxRuleForm.description || "",
      };

      if (editItem) {
        ruleData.id = editItem.id;
        await updateResource("taxRule", editItem.id, ruleData);
        showSuccess(`Règle de taxe modifiée avec succès`);
      } else {
        await addResource("taxRule", ruleData);
        showSuccess(`Règle de taxe créée avec succès`);
      }

      setShowModal(false);
      resetForms();
      await loadAllTaxData();
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteTaxRule = async (id) => {
    if (!window.confirm(`Supprimer cette règle de taxe ?`)) return;

    setActionLoading(true);
    try {
      await deleteResource("taxRule", id);
      showSuccess(`Règle de taxe supprimée avec succès`);
      await loadAllTaxData();
    } catch (err) {
      console.error("Erreur:", err);
      showError(err.message || "Erreur lors de la suppression");
    } finally {
      setActionLoading(false);
    }
  };

  const getTaxName = (id) => {
    const tax = taxes.find((t) => t.id === id);
    return tax ? `${tax.name} (${tax.rate}%)` : `Taxe ${id}`;
  };

  const getGroupName = (id) => {
    const group = taxRuleGroups.find((g) => g.id === id);
    return group ? group.name : `Groupe ${id}`;
  };

  if (loading) {
    return (
      <div className="tax-manager">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des données fiscales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tax-manager">
      <div className="page-header">
        <div className="breadcrumb">
          International &gt; <strong>Taxes</strong>
        </div>
        <div className="page-header-row">
          <h1 className="page-title">Gestion des Taxes</h1>
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
          className={`tab ${activeTab === "taxes" ? "active" : ""}`}
          onClick={() => setActiveTab("taxes")}
        >
          Taxes ({taxes.length})
        </button>
        <button
          className={`tab ${activeTab === "taxRuleGroups" ? "active" : ""}`}
          onClick={() => setActiveTab("taxRuleGroups")}
        >
          Groupes de règles ({taxRuleGroups.length})
        </button>
        <button
          className={`tab ${activeTab === "taxRules" ? "active" : ""}`}
          onClick={() => setActiveTab("taxRules")}
        >
          Règles de taxe ({taxRules.length})
        </button>
      </div>

      {/* Taxes Tab */}
      {activeTab === "taxes" && (
        <div className="panel">
          <div className="panel-header-row">
            <span className="panel-title">Liste des taxes ({taxes.length} total)</span>
            <button className="btn btn-primary" onClick={() => openTaxModal()}>
              ＋ Nouvelle taxe
            </button>
          </div>
          <div className="panel-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Nom</th>
                  <th>Taux (%)</th>
                  <th>Statut</th>
                  <th>Supprimé</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      Aucune taxe trouvée
                    </td>
                  </tr>
                ) : (
                  getPaginatedData(taxes, currentTaxPage).map((tax) => (
                    <tr key={tax.id}>
                      <td className="col-id">{tax.id}</td>
                      <td className="tax-name">{tax.name}</td>
                      <td>{tax.rate}%</td>
                      <td>
                        <span className={`badge ${tax.active ? "badge-success" : "badge-danger"}`}>
                          {tax.active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${tax.deleted ? "badge-danger" : "badge-secondary"}`}>
                          {tax.deleted ? "Oui" : "Non"}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-btns">
                          <button
                            className="action-btn"
                            onClick={() => openTaxModal(tax)}
                            disabled={actionLoading}
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn action-btn--danger"
                            onClick={() => deleteTax(tax.id, tax.name)}
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
              currentPage={currentTaxPage}
              totalPages={getTotalPages(taxes.length)}
              onPageChange={setCurrentTaxPage}
            />
          </div>
        </div>
      )}

      {/* Tax Rule Groups Tab */}
      {activeTab === "taxRuleGroups" && (
        <div className="panel">
          <div className="panel-header-row">
            <span className="panel-title">Liste des groupes de règles ({taxRuleGroups.length} total)</span>
            <button className="btn btn-primary" onClick={() => openTaxRuleGroupModal()}>
              ＋ Nouveau groupe
            </button>
          </div>
          <div className="panel-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Nom</th>
                  <th>Statut</th>
                  <th>Supprimé</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxRuleGroups.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      Aucun groupe de règles trouvé
                    </td>
                  </tr>
                ) : (
                  getPaginatedData(taxRuleGroups, currentTaxRuleGroupPage).map((group) => (
                    <tr key={group.id}>
                      <td className="col-id">{group.id}</td>
                      <td className="group-name">{group.name}</td>
                      <td>
                        <span className={`badge ${group.active ? "badge-success" : "badge-danger"}`}>
                          {group.active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${group.deleted ? "badge-danger" : "badge-secondary"}`}>
                          {group.deleted ? "Oui" : "Non"}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-btns">
                          <button
                            className="action-btn"
                            onClick={() => openTaxRuleGroupModal(group)}
                            disabled={actionLoading}
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn action-btn--danger"
                            onClick={() => deleteTaxRuleGroup(group.id, group.name)}
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
              currentPage={currentTaxRuleGroupPage}
              totalPages={getTotalPages(taxRuleGroups.length)}
              onPageChange={setCurrentTaxRuleGroupPage}
            />
          </div>
        </div>
      )}

      {/* Tax Rules Tab */}
      {activeTab === "taxRules" && (
        <div className="panel">
          <div className="panel-header-row">
            <span className="panel-title">Liste des règles de taxe ({taxRules.length} total)</span>
            <button className="btn btn-primary" onClick={() => openTaxRuleModal()}>
              ＋ Nouvelle règle
            </button>
          </div>
          <div className="panel-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Groupe</th>
                  <th>Pays</th>
                  <th>Taxe</th>
                  <th>Code postal</th>
                  <th>Comportement</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxRules.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      Aucune règle de taxe trouvée
                    </td>
                  </tr>
                ) : (
                  getPaginatedData(taxRules, currentTaxRulePage).map((rule) => (
                    <tr key={rule.id}>
                      <td className="col-id">{rule.id}</td>
                      <td>{getGroupName(rule.id_tax_rules_group)}</td>
                      <td>France (ID: {rule.id_country})</td>
                      <td>{getTaxName(rule.id_tax)}</td>
                      <td>
                        {rule.zipcode_from === "0" && rule.zipcode_to === "0"
                          ? "Tous"
                          : `${rule.zipcode_from} → ${rule.zipcode_to}`}
                      </td>
                      <td>
                        <span className="badge badge-secondary">
                          {rule.behavior === 0 ? "Aucun" : rule.behavior === 1 ? "Augmenter" : "Réduire"}
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-btns">
                          <button
                            className="action-btn"
                            onClick={() => openTaxRuleModal(rule)}
                            disabled={actionLoading}
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn action-btn--danger"
                            onClick={() => deleteTaxRule(rule.id)}
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
              currentPage={currentTaxRulePage}
              totalPages={getTotalPages(taxRules.length)}
              onPageChange={setCurrentTaxRulePage}
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
                {modalType === "tax" && (editItem ? "Modifier la taxe" : "Nouvelle taxe")}
                {modalType === "taxRuleGroup" && (editItem ? "Modifier le groupe" : "Nouveau groupe")}
                {modalType === "taxRule" && (editItem ? "Modifier la règle" : "Nouvelle règle")}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Tax Form */}
              {modalType === "tax" && (
                <>
                  <div className="form-group">
                    <label>Nom *</label>
                    <input
                      value={taxForm.name}
                      onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
                      placeholder="Ex: TVA 20%"
                    />
                  </div>
                  <div className="form-group">
                    <label>Taux (%) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={taxForm.rate}
                      onChange={(e) => setTaxForm({ ...taxForm, rate: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={taxForm.active}
                          onChange={(e) => setTaxForm({ ...taxForm, active: e.target.checked })}
                        />
                        {" "}Actif
                      </label>
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={taxForm.deleted}
                          onChange={(e) => setTaxForm({ ...taxForm, deleted: e.target.checked })}
                        />
                        {" "}Supprimé
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Tax Rule Group Form */}
              {modalType === "taxRuleGroup" && (
                <>
                  <div className="form-group">
                    <label>Nom *</label>
                    <input
                      value={taxRuleGroupForm.name}
                      onChange={(e) => setTaxRuleGroupForm({ ...taxRuleGroupForm, name: e.target.value })}
                      placeholder="Ex: TVA Standard"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={taxRuleGroupForm.active}
                          onChange={(e) => setTaxRuleGroupForm({ ...taxRuleGroupForm, active: e.target.checked })}
                        />
                        {" "}Actif
                      </label>
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={taxRuleGroupForm.deleted}
                          onChange={(e) => setTaxRuleGroupForm({ ...taxRuleGroupForm, deleted: e.target.checked })}
                        />
                        {" "}Supprimé
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Tax Rule Form */}
              {modalType === "taxRule" && (
                <>
                  <div className="form-group">
                    <label>Groupe de règles *</label>
                    <select
                      value={taxRuleForm.id_tax_rules_group}
                      onChange={(e) => setTaxRuleForm({ ...taxRuleForm, id_tax_rules_group: e.target.value })}
                    >
                      <option value="">Sélectionner un groupe</option>
                      {taxRuleGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} {!group.active && "(inactif)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Taxe *</label>
                    <select
                      value={taxRuleForm.id_tax}
                      onChange={(e) => setTaxRuleForm({ ...taxRuleForm, id_tax: e.target.value })}
                    >
                      <option value="">Sélectionner une taxe</option>
                      {taxes.map((tax) => (
                        <option key={tax.id} value={tax.id}>
                          {tax.name} ({tax.rate}%) {!tax.active && "(inactif)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Pays</label>
                    <input
                      value={taxRuleForm.id_country}
                      onChange={(e) => setTaxRuleForm({ ...taxRuleForm, id_country: e.target.value })}
                      placeholder="ID du pays (ex: 8 pour France)"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Code postal (de)</label>
                      <input
                        value={taxRuleForm.zipcode_from}
                        onChange={(e) => setTaxRuleForm({ ...taxRuleForm, zipcode_from: e.target.value })}
                        placeholder="0 = tous"
                      />
                    </div>
                    <div className="form-group">
                      <label>Code postal (à)</label>
                      <input
                        value={taxRuleForm.zipcode_to}
                        onChange={(e) => setTaxRuleForm({ ...taxRuleForm, zipcode_to: e.target.value })}
                        placeholder="0 = tous"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Comportement</label>
                    <select
                      value={taxRuleForm.behavior}
                      onChange={(e) => setTaxRuleForm({ ...taxRuleForm, behavior: e.target.value })}
                    >
                      <option value="0">Aucun - Utiliser cette taxe</option>
                      <option value="1">Augmenter - Ajouter à la taxe existante</option>
                      <option value="2">Réduire - Remplacer la taxe</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={taxRuleForm.description}
                      onChange={(e) => setTaxRuleForm({ ...taxRuleForm, description: e.target.value })}
                      placeholder="Description optionnelle"
                      rows="2"
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
                  if (modalType === "tax") saveTax();
                  else if (modalType === "taxRuleGroup") saveTaxRuleGroup();
                  else saveTaxRule();
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
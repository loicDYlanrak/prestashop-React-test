import { useState, useEffect } from "react";
import "./Categories.css";
import { getCategory, getAllCategoriesId } from "../hooks/useFetchPrestashop.js";
import { addResource, updateResource } from "../hooks/useMutationPrestashop.js";

export default function Categories() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState(null);
  const [search, setSearch] = useState("");
  const [searchDesc, setSearchDesc] = useState("");
  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    id_parent: "",
    position: "",
    active: true,
  });

  const loadAllCategories = async () => {
    setLoading(true);
    setErrors(null);
    
    try {
      const categoryIds = await getAllCategoriesId();
      if (!categoryIds || categoryIds.length === 0) {
        setCategories([]);
        setLoading(false);
        return;
      }
      const categoriesPromises = categoryIds.map(async (id) => {
        const result = await getCategory(id);
        if (result.success && result.data) {
          return {
            id: parseInt(id),
            name: result.data.name,
            description: result.data.description || "",
            id_parent: result.data.id_parent === 0 ? null : result.data.id_parent,
            nombres_produits: 0, 
            position: parseInt(result.data.id_parent) || 0,
            active: result.data.active === 1,
            level_depth: 0,
            is_root_category: result.data.is_root_category === 1,
            date_add: null,
            date_upd: null,
          };
        }
        return null;
      });
      
      const results = await Promise.all(categoriesPromises);
      const validCategories = results.filter(cat => cat !== null);
      
      const sortedCategories = validCategories.sort((a, b) => a.position - b.position);
      setCategories(sortedCategories);
      
    } catch (err) {
      console.error("Erreur lors du chargement des catégories:", err);
      setErrors({ message: err.message || "Erreur lors du chargement des catégories" });
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadAllCategories();
  };

  useEffect(() => {
    loadAllCategories();
  }, []);

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) &&
      (c.description || "").toLowerCase().includes(searchDesc.toLowerCase())
  );

  const getParentName = (parentId) => {
    if (!parentId) return "-";
    const parent = categories.find((c) => c.id === parentId);
    return parent ? parent.name : "-";
  };

  const getParentOptions = () => {
    const rootCategories = categories.filter(c => c.id_parent === null || c.id_parent === 2);
    return rootCategories
      .filter((c) => c.id !== editCategory?.id)
      .map((c) => ({ id: c.id, name: c.name }));
  };

  const generateLinkRewrite = (name) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const saveCategory = async () => {
    if (!form.name.trim()) {
      setActionError("Le nom de la catégorie est requis");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const linkRewrite = generateLinkRewrite(form.name);
      
      const categoryData = {
        id_parent: form.id_parent ? parseInt(form.id_parent) : 2,
        id_shop_default: 1,
        is_root_category: form.id_parent ? 0 : 0,
        name: form.name,
        description: form.description || form.name,
        link_rewrite: linkRewrite,
        active: form.active ? 1 : 0,
        position: form.position ? parseInt(form.position) : 0,
      };

      if (editCategory) {
        categoryData.id = editCategory.id;
        await updateResource("category", editCategory.id, categoryData);
        setSuccessMessage(`Catégorie "${form.name}" modifiée avec succès`);
      } else {
        const response = await addResource("category", categoryData);
        const newCategoryId = response?.category?.id?.["#cdata"] || response?.category?.id;
        if (newCategoryId) {
          setSuccessMessage(`Catégorie "${form.name}" créée avec succès (ID: ${newCategoryId})`);
        } else {
          setSuccessMessage(`Catégorie "${form.name}" créée avec succès`);
        }
      }

      setShowModal(false);
      resetForm();
      setTimeout(() => {
        loadAllCategories();
      }, 1500);
      
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
      setActionError(err.message || "Erreur lors de la sauvegarde de la catégorie");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCategory = async (id, name) => {
    const hasChildren = categories.some((c) => c.id_parent === id);
    if (hasChildren) {
      alert("Impossible de supprimer cette catégorie car elle contient des sous-catégories.");
      return;
    }

    if (!window.confirm(`Supprimer la catégorie "${name}" ?`)) return;

    setDeleteLoading(true);
    setActionError(null);
    
    try {
      const { deleteResource } = await import("../hooks/useDeletePrestashop.js");
      await deleteResource("categories", id);
      
      setSuccessMessage(`Catégorie "${name}" supprimée avec succès`);
      await loadAllCategories();
      
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      setActionError(err.message || "Erreur lors de la suppression de la catégorie");
    } finally {
      setDeleteLoading(false);
    }
  };

  const deleteSelectedCategories = async () => {
    if (selected.length === 0) {
      alert("Veuillez sélectionner au moins une catégorie");
      return;
    }

    const categoriesToDelete = categories.filter(c => selected.includes(c.id));
    const hasChildren = categoriesToDelete.some(c => 
      categories.some(child => child.id_parent === c.id)
    );
    
    if (hasChildren) {
      alert("Impossible de supprimer certaines catégories car elles contiennent des sous-catégories");
      return;
    }

    if (!window.confirm(`Supprimer ${selected.length} catégorie(s) ?`)) return;

    setDeleteLoading(true);
    setActionError(null);
    
    const { deleteResource } = await import("../hooks/useDeletePrestashop.js");
    let deletedCount = 0;
    let errorCount = 0;

    for (const id of selected) {
      try {
        await deleteResource("category", id);
        deletedCount++;
      } catch (err) {
        console.error(`Erreur suppression catégorie ${id}:`, err);
        errorCount++;
      }
    }

    setSelected([]);
    setSuccessMessage(`Supprimées: ${deletedCount}, Erreurs: ${errorCount}`);
    await loadAllCategories();
    setDeleteLoading(false);
  };

  const toggleActive = async (id, currentActive, name) => {
    try {
      const categoryToUpdate = categories.find(c => c.id === id);
      const newActiveState = !currentActive;
      
      const categoryData = {
        id_parent: categoryToUpdate.id_parent || 2,
        id_shop_default: 1,
        is_root_category: 0,
        name: categoryToUpdate.name,
        description: categoryToUpdate.description || categoryToUpdate.name,
        link_rewrite: generateLinkRewrite(categoryToUpdate.name),
        active: newActiveState ? 1 : 0,
        position: categoryToUpdate.position,
      };

      await updateResource("category", id, categoryData);
      
      setCategories(
        categories.map((c) =>
          c.id === id ? { ...c, active: newActiveState } : c
        )
      );
      
      setSuccessMessage(`Catégorie "${name}" ${newActiveState ? "activée" : "désactivée"}`);
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error("Erreur lors du changement de statut:", err);
      setActionError(err.message || "Erreur lors du changement de statut");
    }
  };

  const openNew = () => {
    setEditCategory(null);
    setForm({
      name: "",
      description: "",
      id_parent: "",
      position: categories.length + 1,
      active: true,
    });
    setActionError(null);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditCategory(c);
    setForm({
      name: c.name,
      description: c.description || "",
      id_parent: c.id_parent || "",
      position: c.position,
      active: c.active,
    });
    setActionError(null);
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      id_parent: "",
      position: "",
      active: true,
    });
    setEditCategory(null);
    setActionError(null);
  };

  const toggleSelect = (id) => {
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((s) => s !== id) : [...sel, id]
    );
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((c) => c.id));
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (loading) {
    return (
      <div className="categories-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des catégories...</p>
        </div>
      </div>
    );
  }

  if (errors) {
    return (
      <div className="categories-page">
        <div className="error-container">
          <p>
            Erreur lors du chargement des catégories :{" "}
            {errors.message || "Erreur inconnue"}
          </p>
          <button
            onClick={() => loadAllCategories()}
            className="btn btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <div className="breadcrumb">
          Catalogue &gt; <strong>Catégories</strong>
        </div>
        <div className="page-header-row">
          <h1 className="page-title">Catégories</h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-primary" onClick={openNew}>
              <span>＋</span> Nouvelle catégorie
            </button>
          </div>
        </div>
      </div>

      {/* Messages de statut */}
      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {successMessage}
          <button className="alert-close" onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}
      
      {actionError && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {actionError}
          <button className="alert-close" onClick={() => setActionError(null)}>×</button>
        </div>
      )}

      {/* Barre d'actions sélection */}
      {selected.length > 0 && (
        <div className="selection-bar">
          <span className="selection-count">{selected.length} catégorie(s) sélectionnée(s)</span>
          <button 
            className="btn btn-danger btn-sm" 
            onClick={deleteSelectedCategories}
            disabled={deleteLoading}
          >
            🗑 Supprimer la sélection
          </button>
        </div>
      )}

      <div className="panel">
        <div className="panel-header-row">
          <span className="panel-title">Catégories ({filtered.length})</span>
          <button className="btn-refresh" onClick={refetch} disabled={loading}>
            🔄
          </button>
        </div>

        <div className="panel-body">
          <table className="cat-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="col-id">ID</th>
                <th>Nom</th>
                <th>Description</th>
                <th>Catégorie mère</th>
                <th className="col-position">Position</th>
                <th>Statut</th>
                <th className="col-actions">Actions</th>
              </tr>
              <tr className="filter-row">
                <th className="col-check"></th>
                <th></th>
                <th>
                  <input
                    className="filter-input"
                    placeholder="Chercher un nom"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </th>
                <th>
                  <input
                    className="filter-input"
                    placeholder="Chercher une description"
                    value={searchDesc}
                    onChange={(e) => setSearchDesc(e.target.value)}
                  />
                </th>
                <th></th>
                <th></th>
                <th></th>
                <th>
                  <button className="btn btn-search" onClick={() => {}}>
                     Rechercher
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
                    Aucune catégorie trouvée
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className={selected.includes(c.id) ? "row-selected" : ""}
                  >
                    <td className="col-check">
                      <input
                        type="checkbox"
                        checked={selected.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                      />
                    </td>
                    <td className="col-id">{c.id}</td>
                    <td className="category-name">{c.name}</td>
                    <td className="category-desc">{c.description || "-"}</td>
                    <td>{getParentName(c.id_parent)}</td>
                    <td className="col-position">{c.position}</td>
                    <td>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={c.active}
                          onChange={() => toggleActive(c.id, c.active, c.name)}
                          disabled={deleteLoading}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td className="col-actions">
                      <div className="action-btns">
                        <button
                          className="action-btn"
                          title="Modifier"
                          onClick={() => openEdit(c)}
                          disabled={deleteLoading}
                        >
                          Edit
                        </button>
                        <button
                          className="action-btn action-btn--more"
                          title="Supprimer"
                          onClick={() => deleteCategory(c.id, c.name)}
                          disabled={deleteLoading}
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création/modification */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
              </h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nom *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nom de la catégorie"
                />
                {form.name && (
                  <small className="form-hint">
                    URL générée: {generateLinkRewrite(form.name)}
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Description (optionnelle)"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Catégorie mère</label>
                <select
                  value={form.id_parent}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      id_parent: e.target.value ? parseInt(e.target.value) : "",
                    })
                  }
                >
                  <option value="">Aucune (catégorie racine)</option>
                  {getParentOptions().map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="number"
                    value={form.position}
                    onChange={(e) =>
                      setForm({ ...form, position: e.target.value })
                    }
                    placeholder="Ordre d'affichage"
                  />
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.value === "true" })
                    }
                  >
                    <option value="true">Actif</option>
                    <option value="false">Inactif</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={saveCategory}
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
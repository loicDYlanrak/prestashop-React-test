import { useState, useEffect } from "react";
import "./Categories.css";
import { useFetchAllCategories } from "../hooks/useFetchPrestashop.js";
import { useDeleteCategory } from "../hooks/useDeletePrestashop.js";

export default function Categories() {
  const { loading, data, errors } = useFetchAllCategories("categories");
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [searchDesc, setSearchDesc] = useState("");
  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    categorie_mere: "",
    position: "",
    active: true,
  });

  useEffect(() => {
    if (data && data.length > 0) {
      const transformedCategories = data.map((item) => {
        const categoryData = item.category;

        // Extraire le nom (qui est dans language)
        let name = "";
        if (categoryData.name && categoryData.name.language) {
          name = categoryData.name.language["#cdata"] || "";
        }

        // Extraire la description
        let description = "";
        if (categoryData.description && categoryData.description.language) {
          // Enlever les balises HTML de la description
          const rawDesc = categoryData.description.language["#cdata"] || "";
          description = rawDesc.replace(/<[^>]*>/g, "").trim();
        }

        // Extraire l'ID parent
        let parentId = null;
        if (categoryData.id_parent) {
          parentId = categoryData.id_parent["#cdata"]
            ? parseInt(categoryData.id_parent["#cdata"])
            : null;
        }

        // Compter le nombre de produits
        let productCount = 0;
        if (categoryData.nb_products_recursive) {
          productCount =
            parseInt(categoryData.nb_products_recursive["#cdata"]) || 0;
          productCount < 0 ? (productCount *= -1) : productCount;
        }

        return {
          id: parseInt(categoryData.id["#cdata"]),
          name: name,
          description: description,
          categorie_mere: parentId,
          nombres_produits: productCount,
          position: parseInt(categoryData.position?.["#cdata"] || 0),
          active: categoryData.active?.["#cdata"] === "1",
          level_depth: parseInt(categoryData.level_depth?.["#cdata"] || 0),
          is_root_category: categoryData.is_root_category?.["#cdata"] === "1",
          date_add: categoryData.date_add?.["#cdata"],
          date_upd: categoryData.date_upd?.["#cdata"],
        };
      });

      // Trier par position
      const sortedCategories = transformedCategories.sort(
        (a, b) => a.position - b.position,
      );
      setCategories(sortedCategories);
    }
  }, [data]);

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) &&
      (c.description || "").toLowerCase().includes(searchDesc.toLowerCase()),
  );

  const getParentName = (parentId) => {
    if (!parentId) return "-";
    const parent = categories.find((c) => c.id === parentId);
    return parent ? parent.name : "-";
  };

  const toggleActive = (id) => {
    setCategories(
      categories.map((c) => (c.id === id ? { ...c, active: !c.active } : c)),
    );
  };

  const toggleSelect = (id) => {
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((s) => s !== id) : [...sel, id],
    );
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((c) => c.id));
  };

  const openNew = () => {
    setEditCategory(null);
    setForm({
      name: "",
      description: "",
      categorie_mere: "",
      position: categories.length + 1,
      active: true,
    });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditCategory(c);
    setForm({
      name: c.name,
      description: c.description || "",
      categorie_mere: c.categorie_mere || "",
      position: c.position,
      active: c.active,
    });
    setShowModal(true);
  };

  const saveCategory = () => {
    if (!form.name) return;

    if (editCategory) {
      setCategories(
        categories.map((c) =>
          c.id === editCategory.id
            ? {
                ...c,
                name: form.name,
                description: form.description,
                categorie_mere: form.categorie_mere || null,
                position: parseInt(form.position) || c.position,
                active: form.active,
              }
            : c,
        ),
      );
    } else {
      const newId = Math.max(...categories.map((c) => c.id), 0) + 1;
      setCategories([
        ...categories,
        {
          id: newId,
          name: form.name,
          description: form.description,
          categorie_mere: form.categorie_mere || null,
          nombres_produits: 0,
          position: parseInt(form.position) || categories.length + 1,
          active: form.active,
        },
      ]);
    }
    setShowModal(false);
  };

  const deleteCategory = (id) => {
    const hasChildren = categories.some((c) => c.categorie_mere === id);
    if (hasChildren) {
      alert(
        "Impossible de supprimer cette catégorie car elle contient des sous-catégories.",
      );
      return;
    }
    if (window.confirm("Supprimer cette catégorie ?")) {
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  const {
    deleteCategory: deleteApiCategory,
    loading: deleteLoading,
    error: deleteError,
  } = useDeleteCategory();

  const resetCategories = async () => {
    // Trouver toutes les catégories avec ID >= 13
    const categoriesToDelete = categories.filter((cat) => cat.id >= 13);

    if (categoriesToDelete.length === 0) {
      alert("Aucune catégorie avec un ID supérieur ou égal à 13 à supprimer.");
      return;
    }

    // Confirmation
    const confirmMessage =
      `⚠️ RÉINITIALISATION DES CATÉGORIES ⚠️\n\n` +
      `${categoriesToDelete.length} catégorie(s) avec ID >= 13 vont être supprimées :\n` +
      categoriesToDelete.map((c) => `- ID ${c.id}: ${c.name}`).join("\n") +
      `\n\nCette action est irréversible. Continuer ?`;

    if (!window.confirm(confirmMessage)) return;

    // Supprimer chaque catégorie
    let deletedCount = 0;
    let errorCount = 0;

    for (const category of categoriesToDelete) {
      try {
        await deleteApiCategory(category.id);
        deletedCount++;
        console.log(`Catégorie ${category.id} (${category.name}) supprimée`);
      } catch (err) {
        console.error(`Erreur suppression catégorie ${category.id}:`, err);
        errorCount++;
      }
    }

    const remainingCategories = categories.filter((cat) => cat.id < 13);
    setCategories(remainingCategories);

    // Afficher le résultat
    alert(
      ` Réinitialisation terminée !\n\n` +
        `Supprimées : ${deletedCount}\n` +
        `Erreurs : ${errorCount}\n` +
        `Catégories restantes : ${remainingCategories.length}`,
    );
  };

  const parentOptions = categories
    .filter((c) => c.id !== editCategory?.id)
    .map((c) => ({ id: c.id, name: c.name }));

  // Affichage du chargement
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

  // Affichage des erreurs
  if (errors) {
    return (
      <div className="categories-page">
        <div className="error-container">
          <p>
            Erreur lors du chargement des catégories :{" "}
            {errors.message || "Erreur inconnue"}
          </p>
          <button
            onClick={() => window.location.reload()}
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
            <button
              className="btn btn-danger"
              onClick={resetCategories}
              disabled={deleteLoading}
            >
              {deleteLoading
                ? "Suppression en cours..."
                : "🔄 Réinitialiser catégories (ID ≥ 13)"}
            </button>
            <button className="btn btn-primary" onClick={openNew}>
              <span>＋</span> Nouvelle catégorie
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header-row">
          <span className="panel-title">Catégories ({filtered.length})</span>
          <div className="filter-bar">
            <button className="btn btn-outline dropdown-btn">
              Filtrer par statut <span>▾</span>
            </button>
          </div>
        </div>

        <div className="panel-body">
          <table className="cat-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    checked={
                      selected.length === filtered.length && filtered.length > 0
                    }
                    onChange={toggleAll}
                  />
                </th>
                <th className="col-id">ID ▼</th>
                <th>Nom</th>
                <th>Description</th>
                <th>Catégorie mère</th>
                <th className="col-qty">Nb produits</th>
                <th className="col-position">Position</th>
                <th>Affichage</th>
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
                <th>
                  <select className="filter-select">
                    <option>Toutes</option>
                    {parentOptions.map((opt) => (
                      <option key={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </th>
                <th>
                  <div className="filter-minmax">
                    <input placeholder="Min" />
                    <input placeholder="Max" />
                  </div>
                </th>
                <th>
                  <div className="filter-minmax">
                    <input placeholder="Min" />
                    <input placeholder="Max" />
                  </div>
                </th>
                <th>
                  <select className="filter-select">
                    <option>Tous</option>
                    <option>Actif</option>
                    <option>Inactif</option>
                  </select>
                </th>
                <th>
                  <button className="btn btn-search">🔍 Rechercher</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{ textAlign: "center", padding: "40px" }}
                  >
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
                    <td>{getParentName(c.categorie_mere)}</td>
                    <td className="col-qty">{c.nombres_produits}</td>
                    <td className="col-position">{c.position}</td>
                    <td>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={c.active}
                          onChange={() => toggleActive(c.id)}
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
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn action-btn--more"
                          title="Supprimer"
                          onClick={() => deleteCategory(c.id)}
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
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
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
                  style={{
                    padding: "8px 10px",
                    border: "1px solid #d0d5df",
                    borderRadius: "3px",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>
              <div className="form-group">
                <label>Catégorie mère</label>
                <select
                  value={form.categorie_mere}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      categorie_mere: e.target.value
                        ? parseInt(e.target.value)
                        : "",
                    })
                  }
                  style={{
                    padding: "8px 10px",
                    border: "1px solid #d0d5df",
                    borderRadius: "3px",
                    background: "#fff",
                  }}
                >
                  <option value="">Aucune (catégorie racine)</option>
                  {parentOptions.map((opt) => (
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
                  />
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.value === "true" })
                    }
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #d0d5df",
                      borderRadius: "3px",
                      background: "#fff",
                    }}
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
                onClick={() => setShowModal(false)}
              >
                Annuler
              </button>
              <button className="btn btn-primary" onClick={saveCategory}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

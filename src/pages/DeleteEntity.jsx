// DeleteEntity.jsx
import { useState, useEffect } from "react";
import "./DeleteEntity.css";
import { useFetchAllCategories } from "../hooks/useFetchPrestashop.js";
import { useDeleteCategory } from "../hooks/useDeletePrestashop.js";

const ENTITY_TYPES = [
  { value: "categories", label: "Catégories", endpoint: "categories" },
  { value: "products", label: "Produits", endpoint: "products" },
  { value: "customers", label: "Clients", endpoint: "customers" },
  { value: "orders", label: "Commandes", endpoint: "orders" },
];

const PROTECTED_CATEGORY_IDS = [1, 2]; 

export default function DeleteEntity() {
  const [entity, setEntity] = useState("categories");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [search, setSearch] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteResults, setDeleteResults] = useState(null);

  // Fetch des catégories
  const {
    loading: loadingCategories,
    data: categoriesData,
    errors: categoriesErrors,
    refetch: refetchCategories,
  } = useFetchAllCategories("categories");

  const { deleteCategory, loading: deletingCategory, error: deleteError } =
    useDeleteCategory();

  const [items, setItems] = useState([]);

  // Transformer les données des catégories
  useEffect(() => {
    if (categoriesData && categoriesData.length > 0 && entity === "categories") {
      const transformedItems = categoriesData.map((item) => {
        const categoryData = item.category;

        // Extraire le nom
        let name = "";
        if (categoryData.name && categoryData.name.language) {
          name = categoryData.name.language["#cdata"] || "";
        }

        return {
          id: parseInt(categoryData.id["#cdata"]),
          name: name,
          isProtected: PROTECTED_CATEGORY_IDS.includes(
            parseInt(categoryData.id["#cdata"])
          ),
          level_depth: parseInt(categoryData.level_depth?.["#cdata"] || 0),
          nb_products: parseInt(categoryData.nb_products_recursive?.["#cdata"] || 0),
        };
      });

      // Trier par ID
      const sortedItems = transformedItems.sort((a, b) => a.id - b.id);
      setItems(sortedItems);
    }
  }, [categoriesData, entity]);

  // Filtrer les items
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Vérifier si tous les items filtrés sont sélectionnés
  useEffect(() => {
    if (filteredItems.length > 0) {
      const allSelected = filteredItems.every((item) =>
        selectedItems.includes(item.id)
      );
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, filteredItems]);

  const handleSelectAll = () => {
    if (selectAll) {
      // Désélectionner tous
      setSelectedItems([]);
    } else {
      // Sélectionner tous les items non protégés
      const selectableIds = filteredItems
        .filter((item) => !item.isProtected)
        .map((item) => item.id);
      setSelectedItems(selectableIds);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (selectedItems.length === 0) return;

    setDeleting(true);
    setDeleteResults(null);

    const results = {
      success: [],
      errors: [],
      protected: [],
    };

    for (const id of selectedItems) {
      const item = items.find((i) => i.id === id);
      
      // Vérifier si l'item est protégé
      if (item?.isProtected) {
        results.protected.push({
          id,
          name: item.name,
          message: "Cette catégorie est protégée et ne peut pas être supprimée",
        });
        continue;
      }

      try {
        await deleteCategory(id);
        results.success.push({ id, name: item?.name || `ID ${id}` });
        
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        results.errors.push({
          id,
          name: item?.name || `ID ${id}`,
          error: err.message || "Erreur inconnue",
        });
      }
    }

    setDeleteResults(results);
    setDeleting(false);
    setShowConfirmModal(false);

    // Rafraîchir la liste des catégories
    if (results.success.length > 0) {
      setTimeout(() => {
        refetchCategories();
        setSelectedItems([]);
      }, 1000);
    }
  };

  const openConfirmModal = () => {
    if (selectedItems.length === 0) {
      alert("Veuillez sélectionner au moins une catégorie à supprimer");
      return;
    }
    setShowConfirmModal(true);
  };

  const getSelectedCount = () => {
    return selectedItems.length;
  };

  const getProtectedSelectedCount = () => {
    return selectedItems.filter((id) => {
      const item = items.find((i) => i.id === id);
      return item?.isProtected;
    }).length;
  };

  // Affichage du chargement
  if (loadingCategories && entity === "categories") {
    return (
      <div className="delete-entity-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des catégories...</p>
        </div>
      </div>
    );
  }

  // Affichage des erreurs
  if (categoriesErrors) {
    return (
      <div className="delete-entity-page">
        <div className="error-container">
          <p>
            Erreur lors du chargement :{" "}
            {categoriesErrors.message || "Erreur inconnue"}
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="delete-entity-page">
      <div className="page-header">
        <div className="breadcrumb">
          Catalogue &gt; <strong>Suppression</strong>
        </div>
        <div className="page-header-row">
          <h1 className="page-title">Supprimer des entités</h1>
        </div>
      </div>

      <div className="delete-entity-grid">
        {/* Panel de configuration */}
        <div className="panel">
          <div className="panel-header">Configuration</div>
          <div className="panel-body">
            <div className="form-group">
              <label>Type d&apos;entité à supprimer</label>
              <select value={entity} onChange={(e) => setEntity(e.target.value)}>
                {ENTITY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <span className="form-hint">
                Sélectionnez le type d&apos;entité que vous souhaitez supprimer
              </span>
            </div>

            {entity === "categories" && (
              <div className="info-box">
                <strong>⚠️ Informations importantes :</strong>
                <ul>
                  <li>Les catégories avec les IDs <strong>1 et 2</strong> sont protégées et ne peuvent pas être supprimées</li>
                  <li>Une catégorie contenant des sous-catégories ne peut pas être supprimée</li>
                  <li>La suppression est définitive et irréversible</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Panel de liste et suppression */}
        <div className="panel">
          <div className="panel-header-row">
            <span className="panel-title">
              {entity === "categories" ? "Catégories" : "Entités"} à supprimer
              {items.length > 0 && ` (${items.length} total)`}
            </span>
            <div className="selection-info">
              {selectedItems.length > 0 && (
                <span className="badge">
                  {selectedItems.length} sélectionnée(s)
                  {getProtectedSelectedCount() > 0 &&
                    ` (dont ${getProtectedSelectedCount()} protégée(s))`}
                </span>
              )}
            </div>
          </div>

          <div className="panel-body">
            {/* Barre de recherche et actions */}
            <div className="toolbar">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Rechercher par nom..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              <button
                className="btn btn-danger"
                onClick={openConfirmModal}
                disabled={selectedItems.length === 0 || deleting}
              >
                🗑️ Supprimer la sélection ({getSelectedCount()})
              </button>
            </div>

            {/* Résultats de suppression */}
            {deleteResults && (
              <div className="delete-results">
                {deleteResults.success.length > 0 && (
                  <div className="alert alert--success">
                    <strong> Suppressions réussies :</strong>
                    <ul>
                      {deleteResults.success.map((item) => (
                        <li key={item.id}>
                          {item.name} (ID: {item.id})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {deleteResults.protected.length > 0 && (
                  <div className="alert alert--warning">
                    <strong>⚠️ Catégories protégées (non supprimées) :</strong>
                    <ul>
                      {deleteResults.protected.map((item) => (
                        <li key={item.id}>
                          {item.name} (ID: {item.id}) - {item.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {deleteResults.errors.length > 0 && (
                  <div className="alert alert--error">
                    <strong>❌ Erreurs lors de la suppression :</strong>
                    <ul>
                      {deleteResults.errors.map((item) => (
                        <li key={item.id}>
                          {item.name} (ID: {item.id}) - {item.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tableau des catégories */}
            {filteredItems.length === 0 ? (
              <div className="empty-state">
                <p>Aucune catégorie trouvée</p>
              </div>
            ) : (
              <table className="delete-table">
                <thead>
                  <tr>
                    <th className="col-check">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        disabled={filteredItems.filter((i) => !i.isProtected).length === 0}
                      />
                    </th>
                    <th className="col-id">ID</th>
                    <th>Nom</th>
                    <th className="col-depth">Niveau</th>
                    <th className="col-products">Nb produits</th>
                    <th className="col-status">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className={
                        selectedItems.includes(item.id) ? "row-selected" : ""
                      }
                    >
                      <td className="col-check">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          disabled={item.isProtected}
                        />
                      </td>
                      <td className="col-id">{item.id}</td>
                      <td className="item-name">
                        {item.name}
                        {item.isProtected && (
                          <span className="protected-badge" title="Catégorie protégée">
                            🔒 Protégée
                          </span>
                        )}
                      </td>
                      <td className="col-depth">
                        <span className="depth-badge">Niveau {item.level_depth}</span>
                      </td>
                      <td className="col-products">
                        {item.nb_products > 0 ? (
                          <span className="products-count">{item.nb_products}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="col-status">
                        {item.nb_products > 0 ? (
                          <span className="status-badge status-has-products">
                            ⚠️ Contient des produits
                          </span>
                        ) : (
                          <span className="status-badge status-ok">✓ Supprimable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmer la suppression</h2>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-icon">⚠️</div>
              <p className="confirm-message">
                Vous allez supprimer <strong>{getSelectedCount()} catégorie(s)</strong>.
              </p>
              {getProtectedSelectedCount() > 0 && (
                <div className="warning-message">
                  Attention : {getProtectedSelectedCount()} catégorie(s) protégée(s) seront ignorées.
                </div>
              )}
              <p className="confirm-warning">
                Cette action est irréversible. Les catégories contenant des sous-catégories
                ou des produits ne pourront pas être supprimées.
              </p>
              <div className="selected-list">
                <strong>Catégories à supprimer :</strong>
                <ul>
                  {selectedItems
                    .filter((id) => {
                      const item = items.find((i) => i.id === id);
                      return item && !item.isProtected;
                    })
                    .slice(0, 10)
                    .map((id) => {
                      const item = items.find((i) => i.id === id);
                      return (
                        <li key={id}>
                          {item?.name} (ID: {id})
                          {item?.nb_products > 0 && " - ⚠️ Contient des produits"}
                        </li>
                      );
                    })}
                  {selectedItems.filter((id) => {
                    const item = items.find((i) => i.id === id);
                    return item && !item.isProtected;
                  }).length > 10 && (
                    <li>
                      ... et{" "}
                      {selectedItems.filter((id) => {
                        const item = items.find((i) => i.id === id);
                        return item && !item.isProtected;
                      }).length - 10}{" "}
                      autre(s)
                    </li>
                  )}
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowConfirmModal(false)}>
                Annuler
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Suppression en cours..." : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicateur de chargement pendant la suppression */}
      {deleting && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Suppression en cours...</p>
          </div>
        </div>
      )}
    </div>
  );
}
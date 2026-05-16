import { useState, useEffect } from "react";
import { fetchPrestashop } from "../hooks/useFetchPrestashop.js";
import { deleteResource } from "../hooks/useDeletePrestashop.js";
import "./ResetData.css";

export default function ResetData() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataToDelete, setDataToDelete] = useState({});
  const [loading, setLoading] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const entitiesToReset = [
    {
      name: "order_details",
      endpoint: "order_details",
      deleteEndpoint: "order_details",
    },
    {
      name: "order_cart_rules",
      endpoint: "order_cart_rules",
      deleteEndpoint: "order_cart_rules",
    },
    {
      name: "order_histories",
      endpoint: "order_histories",
      deleteEndpoint: "order_histories",
    },
    {
      name: "order_invoices",
      endpoint: "order_invoices",
      deleteEndpoint: "order_invoices",
    },
    {
      name: "order_payments",
      endpoint: "order_payments",
      deleteEndpoint: "order_payments",
    },
    {
      name: "order_slip",
      endpoint: "order_slip",
      deleteEndpoint: "order_slip",
    },
    {
      name: "order_carriers",
      endpoint: "order_carriers",
      deleteEndpoint: "order_carriers",
    },
    {
      name: "orders",
      endpoint: "orders",
      deleteEndpoint: "orders",
    },
    {
      name: "carts",
      endpoint: "carts",
      deleteEndpoint: "carts",
    },
    {
      name: "combinations",
      endpoint: "combinations",
      deleteEndpoint: "combinations",
    },
    {
      name: "specific_prices",
      endpoint: "specific_prices",
      deleteEndpoint: "specific_prices",
    },
    // {
    //   name: "stock_availables",
    //   endpoint: "stock_availables",
    //   deleteEndpoint: "stock_availables",
    // },
    // {
    //   name: "images",
    //   endpoint: "images/products",
    //   deleteEndpoint: "images",
    // },
    {
      name: "customers",
      endpoint: "customers",
      deleteEndpoint: "customers",
      excludeIds: [1, 2, 3]
    },
    {
      name: "products",
      endpoint: "products",
      deleteEndpoint: "products",
    },
    {
      name: "tax_rules",
      endpoint: "tax_rules",
      deleteEndpoint: "tax_rules",
      excludeIds: Array.from({ length: 145 }, (_, i) => i + 1),
    },
    {
      name: "tax_rule_groups",
      endpoint: "tax_rule_groups",
      deleteEndpoint: "tax_rule_groups",
      excludeIds: Array.from({ length: 5 }, (_, i) => i + 1),
    },
    {
      name: "taxes",
      endpoint: "taxes",
      deleteEndpoint: "taxes",
      excludeIds: Array.from({ length: 32 }, (_, i) => i + 1),
    },
    {
      name: "product_feature_values",
      endpoint: "product_feature_values",
      deleteEndpoint: "product_feature_values",
    },
    {
      name: "product_features",
      endpoint: "product_features",
      deleteEndpoint: "product_features",
    },
    {
      name: "product_option_values",
      endpoint: "product_option_values",
      deleteEndpoint: "product_option_values",
    },
    {
      name: "product_options",
      endpoint: "product_options",
      deleteEndpoint: "product_options",
    },

    {
      name: "categories",
      endpoint: "categories",
      deleteEndpoint: "categories",
      excludeIds: [1, 2],
    },
  ];

  const fetchAllIdsToDelete = async () => {
    setLoading(true);
    setVerificationComplete(false);
    const results = {};

    for (const entity of entitiesToReset) {
      try {
        const urlRest = `display=[id]`;
        const result = await fetchPrestashop(entity.endpoint, { urlRest });

        if (result.success && result.data) {
          const entityData = result.data[entity.name];
          let items = [];
          const singularKey = entity.name.slice(0, -1);
          const pluralKey = entity.name;

          if (entityData && entityData[singularKey]) {
            items = Array.isArray(entityData[singularKey])
              ? entityData[singularKey]
              : [entityData[singularKey]];
          } else if (entityData && entityData[pluralKey]) {
            items = Array.isArray(entityData[pluralKey])
              ? entityData[pluralKey]
              : [entityData[pluralKey]];
          } else if (entityData && entityData[singularKey] !== undefined) {
            items = Array.isArray(entityData[singularKey])
              ? entityData[singularKey]
              : [entityData[singularKey]];
          } else if (entityData && entityData[pluralKey] !== undefined) {
            items = Array.isArray(entityData[pluralKey])
              ? entityData[pluralKey]
              : [entityData[pluralKey]];
          } else if (Array.isArray(entityData)) {
            items = entityData;
          } else if (entityData && typeof entityData === "object") {
            for (const key in entityData) {
              if (Array.isArray(entityData[key])) {
                items = entityData[key];
                break;
              } else if (
                entityData[key] &&
                typeof entityData[key] === "object" &&
                !Object.prototype.hasOwnProperty.call(entityData[key], "@_href")
              ) {
                for (const subKey in entityData[key]) {
                  if (Array.isArray(entityData[key][subKey])) {
                    items = entityData[key][subKey];
                    break;
                  }
                }
              }
            }
          }

          let ids = items
            .map((item) => {
              let rawId =
                item.id ||
                item["@_id"] ||
                (item["@_href"] ? item["@_href"].split("/").pop() : null);
              let finalId =
                rawId && typeof rawId === "object" && rawId["#cdata"]
                  ? rawId["#cdata"]
                  : rawId;

              return finalId;
            })
            .filter((id) => id !== null);

          // Exclure certains IDs si nécessaire
          if (entity.excludeIds && entity.excludeIds.length > 0) {
            ids = ids.filter((id) => !entity.excludeIds.includes(parseInt(id)));
          }

          results[entity.name] = {
            ids: ids,
            total: ids.length,
            endpoint: entity.endpoint,
            deleteEndpoint: entity.deleteEndpoint,
          };
        } else {
          results[entity.name] = {
            ids: [],
            total: 0,
            endpoint: entity.endpoint,
            deleteEndpoint: entity.deleteEndpoint,
            error: result.error || "Erreur de récupération",
          };
        }
      } catch (error) {
        console.error(`Erreur pour ${entity.name}:`, error);
        results[entity.name] = {
          ids: [],
          total: 0,
          endpoint: entity.endpoint,
          error: error.message,
        };
      }
    }

    setDataToDelete(results);
    setLoading(false);
    setVerificationComplete(true);
  };

  useEffect(() => {
    fetchAllIdsToDelete();
  }, []);

  const checkDataToDelete = () => {
    if (Object.keys(dataToDelete).length === 0) {
      return false;
    }

    let totalItems = 0;

    for (const [name, info] of Object.entries(dataToDelete)) {
      totalItems += info.total || 0;
    }

    if (totalItems === 0) {
      return false;
    }

    return true;
  };

  const deleteEntityItem = async (deleteEndpoint, id) => {
    try {
      const result = await deleteResource(deleteEndpoint, id);

      if (result.success) {
        return { success: true, id };
      } else {
        return { success: false, id, error: result.error };
      }
    } catch (err) {
      return { success: false, id, error: err.message };
    }
  };

  // Réinitialiser complètement les données
  const resetAllData = async () => {
    if (!checkDataToDelete()) {
      alert("Aucune donnée à supprimer. La base est déjà propre !");
      return;
    }

    let totalItems = 0;
    for (const [name, info] of Object.entries(dataToDelete)) {
      totalItems += info.total || 0;
    }

    const confirmMessage =
      `⚠️ RÉINITIALISATION COMPLÈTE ⚠️\n\n` +
      `Cette action va supprimer DEFINITIVEMENT:\n` +
      ` TOTAL: ${totalItems} élément(s)\n\n` +
      `⚠️ Cette action est IRREVERSIBLE !\n\n` +
      `Êtes-vous ABSOLUMENT sûr de vouloir continuer ?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsProcessing(true);

    let totalDeleted = 0;
    let totalErrors = 0;

    for (const entity of entitiesToReset) {
      const entityData = dataToDelete[entity.name];
      if (!entityData || entityData.total === 0) continue;

      for (const id of entityData.ids) {
        const result = await deleteEntityItem(entity.deleteEndpoint, id);

        if (result.success) {
          totalDeleted++;
        } else {
          totalErrors++;
        }

        // Petite pause pour éviter de surcharger l'API
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }

    alert(
      `🎉 RÉINITIALISATION TERMINÉE !\n\nRésultat final: ${totalDeleted} supprimés, ${totalErrors} erreurs`,
    );

    // Recharger les données après suppression
    if (
      window.confirm(
        "Réinitialisation terminée ! Voulez-vous recharger la page pour voir les changements ?",
      )
    ) {
      window.location.reload();
    }

    setIsProcessing(false);
  };

  const getTotalItems = () => {
    let total = 0;
    for (const [name, info] of Object.entries(dataToDelete)) {
      total += info.total || 0;
    }
    return total;
  };

  const getNonEmptyEntities = () => {
    const entities = [];
    for (const [name, info] of Object.entries(dataToDelete)) {
      if (info.total > 0) {
        entities.push({ name, total: info.total, ids: info.ids });
      }
    }
    return entities;
  };

  return (
    <div className="reset-page">
      <div className="reset-container">
        {/* En-tête */}
        <div className="reset-header">
          <h1 className="reset-title">Réinitialisation des données</h1>
        </div>

        {/* Zone d'action principale */}
        <div className="action-card">
          {/* Indicateur de vérification en cours */}
          {loading && (
            <div className="verification-status">
              <div className="spinner"></div>
              <p>Vérification des données en cours...</p>
            </div>
          )}

          {/* Bouton de réinitialisation */}
          {verificationComplete && !loading && (
            <div className="button-group">
              <button
                onClick={resetAllData}
                className="btn btn-danger"
                disabled={isProcessing || getTotalItems() === 0}
              >
                {isProcessing
                  ? "⏳ Suppression en cours..."
                  : `🗑️ Réinitialiser toutes les données (${getTotalItems()} élément(s))`}
              </button>
            </div>
          )}

          {/* Message si aucune donnée à supprimer */}
          {verificationComplete && !loading && getTotalItems() === 0 && (
            <div className="empty-message-box">
              <p> Aucune donnée à supprimer. La base est déjà propre !</p>
            </div>
          )}
        </div>

        {/* Résumé des données à supprimer */}
        {verificationComplete && !loading && getTotalItems() > 0 && (
          <div className="summary-card">
            <div className="summary-header">
              <h3> Résumé des données à supprimer</h3>
              <span className="total-badge has-data">
                Total: {getTotalItems()} élément(s)
              </span>
            </div>
            <div className="summary-content">
              <ul className="entity-list">
                {getNonEmptyEntities().map((entity, idx) => (
                  <li key={idx} className="entity-item">
                    <span className="entity-name">{entity.name}</span>
                    <span className="entity-count">
                      {entity.total} élément(s)
                    </span>
                    <span className="entity-ids">
                      IDs: {entity.ids.slice(0, 5).join(", ")}
                      {entity.ids.length > 5 && "..."}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

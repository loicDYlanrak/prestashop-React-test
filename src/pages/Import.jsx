import { useState, useRef } from "react";
import "./ImportExport.css";
import { useImportHandler } from "../hooks/useImportHandler";

const ENTITY_TYPES = [
  "Products",
  "Categories",
  "Customers",
  "Adresses",
  "Marques",
  "Fournisseurs",
  "Commandes",
  "Détails des commandes",
];

export default function Import() {
  const [entity, setEntity] = useState("Products");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();
  
  const { importing, result, handleImport, setResult } = useImportHandler();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const onImport = () => {
    handleImport(file, entity);
  };

  return (
    <div className="ie-page">
      <div className="page-header">
        <div className="breadcrumb">
          Catalogue &gt; <strong>Import</strong>
        </div>
        <div className="page-header-row">
          <h1 className="page-title">Importer un fichier CSV</h1>
        </div>
      </div>

      <div className="ie-grid">
        {/* LEFT: Config */}
        <div className="panel">
          <div className="panel-header">Configuration de l&apos;import</div>
          <div className="panel-body ie-form">
            <div className="form-group">
              <label>Type d&apos;entité à importer</label>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <span className="form-hint">
                Sélectionnez le type de données que contient votre fichier.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Upload + action */}
        <div className="ie-right">
          <div className="panel">
            <div className="panel-header">Fichier à importer</div>
            <div className="panel-body ie-form">
              <div
                className={`drop-zone ${dragging ? "drop-zone--active" : ""} ${file ? "drop-zone--has-file" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                {file ? (
                  <div className="drop-zone-file">
                    <span className="drop-zone-icon">📄</span>
                    <div className="drop-zone-filename">{file.name}</div>
                    <div className="drop-zone-size">
                      {(file.size / 1024).toFixed(1)} Ko
                    </div>
                    <button
                      className="drop-zone-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setResult(null);
                      }}
                    >
                      ✕ Retirer
                    </button>
                  </div>
                ) : (
                  <div className="drop-zone-empty">
                    <span className="drop-zone-icon">📂</span>
                    <div className="drop-zone-label">
                      Glissez votre fichier CSV ici
                    </div>
                    <div className="drop-zone-sub">
                      ou cliquez pour parcourir
                    </div>
                    <div className="drop-zone-formats">
                      Formats acceptés : .csv, .txt
                    </div>
                  </div>
                )}
              </div>

              {result && (
                <div
                  className={`alert ${result.success ? "alert--success" : "alert--error"}`}
                >
                  {result.success ? (
                    <>
                      <strong> Import réussi</strong>
                      <p>
                        {result.rows} catégories importées, {result.errors}{" "}
                        erreur(s).
                      </p>
                      {result.details && result.details.errors.length > 0 && (
                        <details style={{ marginTop: "10px" }}>
                          <summary>Voir les détails des erreurs</summary>
                          <ul style={{ fontSize: "12px", marginTop: "8px" }}>
                            {result.details.errors.map((err, idx) => (
                              <li key={idx}>
                                <strong>
                                  {err.name || `Ligne ${err.line}`}
                                </strong>
                                : {err.error}
                                {err.nameParent &&
                                  ` (parent recherché: ${err.nameParent})`}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                      {result.details && result.details.success.length > 0 && (
                        <details style={{ marginTop: "10px" }}>
                          <summary>Voir les catégories importées</summary>
                          <ul style={{ fontSize: "12px", marginTop: "8px" }}>
                            {result.details.success.map((cat, idx) => (
                              <li key={idx}>
                                {cat.name} (ID original:{" "}
                                {cat.originalId || "N/A"} → Nouvel ID:{" "}
                                {cat.newId})
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </>
                  ) : (
                    <>
                      <strong>❌ Erreur lors de l&apos;import</strong>
                      <p>
                        {result.errorMessage ||
                          "Vérifiez le format du fichier."}
                      </p>
                    </>
                  )}
                </div>
              )}

              <button
                className={`btn btn-primary btn-full btn-lg ${importing ? "btn--loading" : ""}`}
                onClick={onImport}
                disabled={!file || importing}
              >
                {importing ? "⏳ Import en cours..." : "⬆️ Lancer l'import"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
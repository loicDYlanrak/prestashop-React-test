import { useState, useRef } from "react";
import "./ImportExport.css";
import FileInput from "../components/frontoffice/FileInput";
import FileSummary from "../components/frontoffice/FileSummary";
import InstructionsPanel from "../components/frontoffice/InstructionsPanel";
import ImportResult from "../components/frontoffice/ImportResult";
import { processAllFiles } from "../utils/csvParser";
import { runFullImport } from "../utils/dataImporter";

export default function ImportData() {
  // États pour les 4 fichiers
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [file3, setFile3] = useState(null);
  const [zipFile, setZipFile] = useState(null);

  // États pour l'import
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  // Refs pour les inputs
  const fileRef1 = useRef();
  const fileRef2 = useRef();
  const fileRef3 = useRef();
  const zipRef = useRef();

  const handleImport = async () => {
    // Vérifier que tous les fichiers sont présents
    if (!file1 || !file2 || !file3 || !zipFile) {
      setResult({
        success: false,
        message: "Veuillez sélectionner les 3 fichiers CSV et le fichier ZIP",
      });
      return;
    }

    setImporting(true);
    setResult(null);

    // Créer le FormData
    const formData = new FormData();
    formData.append("fichier1", file1);
    formData.append("fichier2", file2);
    formData.append("fichier3", file3);
    formData.append("images_zip", zipFile);

    try {
      const parsedData = await processAllFiles(file1, file2, file3, zipFile);

      if (parsedData.global_success) {
        const importResults = await runFullImport(parsedData, {
          onProgress: (message, percent) => {
            console.log(`[${percent}%] ${message}`);
          },
          onStepComplete: (step, data) => {
            console.log(`Étape ${step} terminée:`, data);
          },
          onError: (error) => {
            console.error("Erreur d'import:", error);
          },
        });
        console.log("importResults: ", importResults)
        setResult({
          success: true,
          message: "Import réussi !",
          details: {
            produits: {
              total: parsedData.file1.total_products,
              categories: parsedData.file1.categories,
              taxes: parsedData.file1.taxes,
            },
            combinaisons: {
              options: parsedData.file2.product_options,
              combinaisons_par_produit: parsedData.file2.product_combinations,
              stocks: parsedData.file2.product_stocks,
            },
            clients: {
              total_clients: parsedData.file3.total_customers,
              total_commandes: parsedData.file3.total_orders,
              adresses: parsedData.file3.addresses,
            },
            images: {
              total_images: parsedData.zip.total_images,
              produits_avec_images: parsedData.zip.product_with_images,
            },
          },
        });

        console.log("Données parsées:", parsedData);
      } else {
        setResult({
          success: false,
          message: "Erreur lors de l'import des fichiers",
          details: {
            file1_error:
              parsedData.file1?.success === false ? "Erreur fichier 1" : null,
            file2_error:
              parsedData.file2?.success === false ? "Erreur fichier 2" : null,
            file3_error:
              parsedData.file3?.success === false ? "Erreur fichier 3" : null,
            zip_error:
              parsedData.zip?.success === false ? parsedData.zip?.error : null,
          },
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Erreur lors du traitement: " + error.message,
      });
    } finally {
      setImporting(false);
    }
  };

  const resetAll = () => {
    setFile1(null);
    setFile2(null);
    setFile3(null);
    setZipFile(null);
    setResult(null);
  };

  // Vérifier si tous les fichiers sont chargés
  const allFilesLoaded = file1 && file2 && file3 && zipFile;

  return (
    <div className="ie-page">
      <div className="page-header">
        <div className="breadcrumb">
          Import &gt; <strong>Import des données </strong>
        </div>
      </div>

      <div className="ie-grid">
        {/* Colonne de gauche - Fichiers CSV */}
        <div className="panel">
          <div className="panel-header">
            Fichiers CSV à importer
            <span
              style={{
                fontSize: "12px",
                fontWeight: "normal",
                marginLeft: "10px",
              }}
            ></span>
          </div>
          <div className="panel-body ie-form">
            {/* Fichier 1 */}
            <div className="form-group">
              <label>
                Fichier 1 <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <FileInput
                label="Fichier CSV 1"
                file={file1}
                setFile={setFile1}
                inputRef={fileRef1}
                onFileRemove={() => setResult(null)}
              />
            </div>

            {/* Fichier 2 */}
            <div className="form-group">
              <label>
                Fichier 2 <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <FileInput
                label="Fichier CSV 2"
                file={file2}
                setFile={setFile2}
                inputRef={fileRef2}
                onFileRemove={() => setResult(null)}
              />
            </div>

            {/* Fichier 3 */}
            <div className="form-group">
              <label>
                Fichier 3 <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <FileInput
                label="Fichier CSV 3"
                file={file3}
                setFile={setFile3}
                inputRef={fileRef3}
                onFileRemove={() => setResult(null)}
              />
            </div>
          </div>
        </div>

        {/* Colonne de droite - ZIP et actions */}
        <div className="ie-right">
          {/* Fichier ZIP */}
          <div className="panel">
            <div className="panel-header"> Images associées</div>
            <div className="panel-body ie-form">
              <div className="form-group">
                <label>
                  Fichier ZIP des images{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <FileInput
                  label="Archive ZIP des images"
                  file={zipFile}
                  setFile={setZipFile}
                  inputRef={zipRef}
                  accept=".zip,.rar,.7z"
                  onFileRemove={() => setResult(null)}
                />
              </div>

              {/* Résumé des fichiers sélectionnés */}
              <FileSummary
                file1={file1}
                file2={file2}
                file3={file3}
                zipFile={zipFile}
              />

              {/* Message de résultat */}
              <ImportResult result={result} />

              {/* Boutons d'action */}
              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button
                  className={`btn btn-primary btn-full btn-lg ${importing ? "btn--loading" : ""}`}
                  onClick={handleImport}
                  disabled={!allFilesLoaded || importing}
                  style={{ flex: 2 }}
                >
                  {importing
                    ? " Import en cours..."
                    : " Lancer l'import complet"}
                </button>

                <button
                  className="btn btn-outline"
                  onClick={resetAll}
                  disabled={importing}
                  style={{ flex: 1 }}
                >
                  Tout effacer
                </button>
              </div>
            </div>
          </div>

          {/* Panel d'instructions */}
          <InstructionsPanel />
        </div>
      </div>
    </div>
  );
}

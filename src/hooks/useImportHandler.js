import { useState } from "react";
import { importCategories } from "../utils/categoryImporter";
import { useAddCategory } from "./useMutationPrestashop";

export const useImportHandler = () => {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const { addCategory } = useAddCategory();

  const handleImport = async (file, entity) => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const parsedData = 

      
      console.log(parsedData);
      
      if (entity === "Categories") {
        const hasMainCategory = parsedData.some((cat) => cat.id === 2);
        if (!hasMainCategory) {
          throw new Error(
            "Le fichier CSV doit contenir une catégorie principale avec id=2"
          );
        }

        const importResults = await importCategories(parsedData, addCategory, 1);

        setResult({
          success: true,
          rows: importResults.success.length,
          errors: importResults.errors.length,
          details: importResults,
        });
      } else {
        setTimeout(() => {
          setImporting(false);
          setResult({ success: true, rows: parsedData.length, errors: 0 });
        }, 1800);
        return;
      }
    } catch (err) {
      console.error("Erreur d'import:", err);
      setResult({
        success: false,
        rows: 0,
        errors: 1,
        errorMessage: err.message,
      });
    } finally {
      setImporting(false);
    }
  };

  return {
    importing,
    result,
    handleImport,
    setResult,
  };
};
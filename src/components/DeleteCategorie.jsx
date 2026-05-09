import { useDeleteCategory, useDeleteProduct } from "../hooks/useDeletePrestashop.js";

export function DeleteCategorie() {
  const { deleteCategory, loading: catLoading, error: catError, data: catData } = useDeleteCategory();
  const { deleteProduct, loading: prodLoading, error: prodError, data: prodData } = useDeleteProduct();
  const catId = 21;
  const handleDeleteCategory = async () => {
    try {
      await deleteCategory(catId);
      console.log("Catégorie supprimée:");
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };
  const prdId = 24;
  const handleDeleteProduct = async () => {
    try {
      await deleteProduct(prdId);
      console.log("Produit supprimé:");
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  return (
    <div>
      <button onClick={handleDeleteCategory} disabled={catLoading}>
        {catLoading ? "Suppression..." : `Supprimer catégorie ${catId}`}
      </button>
      {catError && <p>Erreur: {catError}</p>}
      {catData && <p>Catégorie supprimée avec succès!</p>}

      <button onClick={handleDeleteProduct} disabled={prodLoading}>
        {prodLoading ? "Suppression..." : `Supprimer produit ${prdId}`}
      </button>
      {prodError && <p>Erreur: {prodError}</p>}
      {prodData && <p>Produit supprimé avec succès!</p>}
    </div>
  );
}
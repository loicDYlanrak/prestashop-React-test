import { useAddCategory } from "../hooks/useMutationPrestashop.js";

export function AddCategorie() {
  const { addCategory, loading, error, data } = useAddCategory();

  const handleSubmit = async () => {
    const categorieMainData = {
        id_parent: 2,
        active: 1,
        id_shop_default: 1,
        id_root_category: 0,
        name: "Categorie demo",
        link_rewrite: "Categorie demo",
        description:
          "Pour tout ce qui transforme un simple logement en un véritable cocon personnel.",
    };
    try {
      const result = await addCategory(categorieMainData, 1);
      console.log("Catégorie créée:", result);
    } catch (err) {
      console.error("Erreur lors de la création:", err);
    }
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Création..." : "Ajouter la catégorie"}
      </button>
      {error && <p>Erreur: {error}</p>}
      {data && <p>Catégorie créée avec succès!</p>}
    </div>
  );
}

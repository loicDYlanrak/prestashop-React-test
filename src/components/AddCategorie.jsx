import { useAddCategory } from "../hooks/useMutationPrestashop.js";

export function AddCategory() {
  const { addCategory, loading, error, data } = useAddCategory();

  const handleSubmit = async () => {
    const categorieMainData = {
        id_parent: 17,
        active: 1,
        id_shop_default: 1,
        id_root_category: 0,
        name: "Sous categorie",
        link_rewrite: "Sous categorie",
        description:
          "Pour tout ce qui transforme un simple logement en un véritable cocon personnel.",
    };
    try {
        await addCategory(categorieMainData, 1);
      console.log("Catégorie créée:");
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

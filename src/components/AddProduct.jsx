// AddProduct.jsx
import { useAddProduct } from "../hooks/useMutationPrestashop.js";

export function AddProduct() {
  const { addProduct, loading, error, data } = useAddProduct();

  const handleSubmit = async () => {
    const productData = {
      id_manufacturer: 1,
      id_supplier: 1,
      id_brand: 10,
      id_category_default: 1,
      new: 1,
      id_default_combination: 1,
      id_tax_rules_group: 1,
      type: 1,
      id_shop_default: 1,
      reference: "123456",
      supplier_reference: "ABCDEF",
      ean13: "1231231231231",
      state: 1,
      product_type: "standard",
      price: 123.45,
      unit_price: 123.45,
      active: 1,
      name: "Product Test Add 1 ",
      description: "Description test add 1",
      description_short: "",
      meta_description: "Description test add 1",
      meta_keywords: "",
      meta_title: "",
      link_rewrite: "",
      associations: {
        categories: {
          category: {
            id: 12
          }
        }
      }
    };

    try {
      const result = await addProduct(productData, 1);
      console.log("Produit créé:", result);
    } catch (err) {
      console.error("Erreur lors de la création:", err);
    }
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Création..." : "Ajouter le produit"}
      </button>
      {error && <p>Erreur: {error}</p>}
      {data && <p>Produit créé avec succès!</p>}
    </div>
  );
}
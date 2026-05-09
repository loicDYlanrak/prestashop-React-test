import { useAddCustomer } from "../hooks/useMutationPrestashop.js";

export function AddCustomer() {
  const { addCustomer, loading, error, data } = useAddCustomer();

  const handleSubmit = async () => {
    const customerData = {
      id_default_group: 3,
      id_lang: 1,
      passwd: "password123",
      lastname: "CustomerLast",
      firstname: "customerFirst",
      email: `customer.${Date.now()}@example.com`, 
      id_gender: 1,
      active: 1,
      associations: {
        groups: {
          group: {
            id: 3
          }
        }
      }
    };

    try {
      const result = await addCustomer(customerData, 1);
      console.log("Client créé:", result);
    } catch (err) {
      console.error("Erreur lors de la création:", err);
    }
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Création..." : "Ajouter le client"}
      </button>
      {error && <p>Erreur: {error}</p>}
      {data && <p>Client créé avec succès!</p>}
    </div>
  );
}
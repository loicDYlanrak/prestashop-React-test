import { useDeleteCustomer } from "../hooks/useDeletePrestashop.js";
import { useDeleteManufacturer } from "../hooks/useDeletePrestashop.js";
import { useDeleteSupplier } from "../hooks/useDeletePrestashop.js";

export function DeleteCustomer() {
  const { deleteCustomer, loading, error, data } = useDeleteCustomer();
  const customerId = 4;

  const handleDelete = async () => {
    try {
      await deleteCustomer(customerId);
      console.log("Client supprimé avec succès");
    } catch (err) {
      console.error("Erreur suppression client:", err);
    }
  };

  return (
    <div>
      <button onClick={handleDelete} disabled={loading}>
        {loading ? "Suppression..." : `Supprimer client ${customerId}`}
      </button>
      {error && <p>Erreur: {error}</p>}
      {data && <p>Client supprimé avec succès!</p>}
    </div>
  );
}

export function DeleteManufacturer() {
  const { deleteManufacturer, loading, error, data } = useDeleteManufacturer();
  const manufacturerId = 1;

  const handleDelete = async () => {
    try {
      await deleteManufacturer(manufacturerId);
      console.log("Fabricant supprimé avec succès");
    } catch (err) {
      console.error("Erreur suppression fabricant:", err);
    }
  };

  return (
    <div>
      <button onClick={handleDelete} disabled={loading}>
        {loading ? "Suppression..." : `Supprimer fabricant ${manufacturerId}`}
      </button>
      {error && <p>Erreur: {error}</p>}
      {data && <p>Fabricant supprimé avec succès!</p>}
    </div>
  );
}

export function DeleteSupplier() {
  const { deleteSupplier, loading, error, data } = useDeleteSupplier();
  const supplierId = 1;

  const handleDelete = async () => {
    try {
      await deleteSupplier(supplierId);
      console.log("Fournisseur supprimé avec succès");
    } catch (err) {
      console.error("Erreur suppression fournisseur:", err);
    }
  };

  return (
    <div>
      <button onClick={handleDelete} disabled={loading}>
        {loading ? "Suppression..." : `Supprimer fournisseur ${supplierId}`}
      </button>
      {error && <p>Erreur: {error}</p>}
      {data && <p>Fournisseur supprimé avec succès!</p>}
    </div>
  );
}

// Ou un composant unifié
export function DeleteAllResources() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3>Suppression de ressources</h3>
      <DeleteCustomer />
      <DeleteManufacturer />
      <DeleteSupplier />
    </div>
  );
}
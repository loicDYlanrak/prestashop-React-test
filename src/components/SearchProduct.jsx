// Dans votre composant AddProduct.jsx ou autre
import { useSearchPrestashop } from '../hooks/useSearchPrestashop';

export function SearchProduct() {
  const { 
    searchCategoryByName, 
    loading, 
    error, 
    results 
  } = useSearchPrestashop();

  const handleSearchCategory = async () => {
    try {
      // Rechercher une catégorie par son nom
      const categories = await searchCategoryByName('Enfants');
      console.log('Catégories trouvées:', categories);
      
    } catch (err) {
      console.error('Erreur recherche:', err);
    }
  };

  return (
    <div>
      <button onClick={handleSearchCategory} disabled={loading}>
        {loading ? 'Recherche...' : 'Rechercher'}
      </button>
      {error && <div>Erreur: {error}</div>}
      {results && "Recherche termine" }
    </div>
  );
}
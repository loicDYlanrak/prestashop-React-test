# Hooks Custom - API PrestaShop

## 📍 Vue d'ensemble

Les hooks custom encapsulent la logique métier pour interagir avec l'API PrestaShop. Ils sont situés dans `src/hooks/`.

### 📋 Liste des hooks
- `useFetch` - Fetch générique
- `useFetchPrestashop` - Fetch spécialisé PrestaShop
- `useMutationPrestashop` - CRUD pour PrestaShop
- `useDeletePrestashop` - Suppression de ressources
- `useGenericFetch` - Opérations CRUD génériques
- `useImportHandler` - Gestion des imports
- `useSearchPrestashop` - Recherche d'entités

---

## 🌐 useFetch

### 📄 Fichier
`src/hooks/useFetch.js`

### 🎯 Description
Hook fetch générique pour n'importe quelle URL. Gère le loading et les erreurs automatiquement.

### 📚 API

```javascript
const { loading, data, errors } = useFetch(url, options);
```

**Paramètres :**
| Nom | Type | Description |
|-----|------|-------------|
| `url` | string | URL à fetcher |
| `options` | Object | Options fetch (headers, method, etc.) |

**Retour :**
| Propriété | Type | Description |
|-----------|------|-------------|
| `loading` | boolean | En cours de chargement |
| `data` | string | Réponse brute (texte) |
| `errors` | Error\|null | Erreur si survenue |

### 📖 Exemple
```javascript
import { useFetch } from '../hooks/useFetch';

function MyComponent() {
  const { loading, data, errors } = useFetch('https://api.example.com/data');
  
  if (loading) return <div>Chargement...</div>;
  if (errors) return <div>Erreur: {errors.message}</div>;
  
  return <div>{data}</div>;
}
```

---

## 🏪 useFetchPrestashop

### 📄 Fichier
`src/hooks/useFetchPrestashop.js`

### 🎯 Description
Hook spécialisé pour récupérer des données PrestaShop. Parse automatiquement la réponse XML et supporte les URLs imbriquées.

### 📚 API

#### `useFetchPrestashop(url, options)`
Hook principal

```javascript
const { loading, data, errors } = useFetchPrestashop('products', options);
```

**Paramètres :**
| Nom | Type | Description |
|-----|------|-------------|
| `url` | string | Endpoint PrestaShop (sans host) |
| `options` | Object | Options additionnelles |
| `options.urlRest` | string | Paramètres GET additionnels (ex: "filter[name]=[test]") |
| `options.method` | string | Méthode HTTP (défaut: "GET") |

**Retour :**
| Propriété | Type | Description |
|-----------|------|-------------|
| `loading` | boolean | En cours de chargement |
| `data` | Object | Données parsées depuis XML |
| `errors` | Error\|null | Erreur si survenue |

**Exemple :**
```javascript
import { useFetchPrestashop } from '../hooks/useFetchPrestashop';

function ProductsList() {
  const { loading, data, errors } = useFetchPrestashop('products', {
    urlRest: 'display=id,name,price&limit=10'
  });
  
  if (loading) return <div>Chargement...</div>;
  if (errors) return <div>Erreur</div>;
  
  return (
    <ul>
      {data.product?.map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

#### `fetchPrestashop(url, options)` - Fonction asynchrone
Pour les appels directs sans hook

```javascript
const result = await fetchPrestashop('products', {
  method: 'GET',
  urlRest: 'filter[id]=[123]'
});

console.log(result.success, result.data);
```

#### `fetchNestedUrls(obj, depth, currentDepth)`
Récupère les URLs imbriquées avec une limite de profondeur

```javascript
const product = { ...productData };
const expanded = await fetchNestedUrls(product, depth=2);
// Récupère les informations imbriquées (images, attributs, etc.)
```

### ⚙️ Configuration
```javascript
const apiKey = "2LA1668U53GC9T35AIT5Y3P7E8CKG7LL";
const baseUrl = "http://localhost/prestashop2/api";
```

---

## 🔧 useMutationPrestashop

### 📄 Fichier
`src/hooks/useMutationPrestashop.js`

### 🎯 Description
Hook pour effectuer des opérations de modification (POST, PUT, DELETE) sur les ressources PrestaShop.

### 📚 API Principal

#### `useAddResource(resourceType, customConfig)`
Hook pour créer des ressources

```javascript
const { addResource, loading, error, data } = useAddResource('product');
```

**Paramètres :**
| Nom | Type | Description |
|-----|------|-------------|
| `resourceType` | string | Type de ressource (product, category, customer, etc.) |
| `customConfig` | Object | Config personnalisée |

**Types supportés :**
- `category`, `product`, `customer`, `manufacturer`, `supplier`, `tax`, `taxRuleGroup`, `taxRule`, `productOption`, `productOptionValue`, `combination`, `address`, `cart`, `order`, `stockAvailable`

**Retour :**
| Propriété | Type | Description |
|-----------|------|-------------|
| `addResource` | Function | Fonction pour créer une ressource |
| `loading` | boolean | En cours de traitement |
| `error` | Error\|null | Erreur si survenue |
| `data` | Object | Réponse de création |

### 🔧 Fonctions utilitaires

#### `addResource(resourceType, resourceData, options)`
Crée une ressource PrestaShop

```javascript
const response = await addResource('product', {
  name: 'Mon produit',
  reference: 'SKU123',
  price: 29.99,
  id_category_default: 5
});
```

#### `updateResource(resourceType, resourceId, updates, options)`
Met à jour une ressource

```javascript
const response = await updateResource('product', 123, {
  name: 'Nouveau nom',
  price: 39.99
});
```

#### `uploadProductImage(productId, imageFile, imagePosition)`
Ajoute une image à un produit

```javascript
const response = await uploadProductImage(123, fileObject, 1);
```

#### Champs multilingues
Certains champs supportent les langues :
- `product` : name, link_rewrite, description, description_short, meta_title, etc.
- `category` : name, link_rewrite, description, etc.

```javascript
const product = {
  name: {
    language: {
      "@_id": 1,
      "#cdata": "Mon produit"
    }
  }
};
```

### 📖 Exemple complet
```javascript
import { useAddResource } from '../hooks/useMutationPrestashop';

function AddProductForm() {
  const { addResource, loading, error } = useAddResource('product');
  
  const handleSubmit = async (formData) => {
    try {
      const result = await addResource({
        name: formData.name,
        reference: formData.reference,
        price: formData.price,
        active: 1
      });
      alert('Produit créé: ' + result.product.id);
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };
  
  return (
    <form onSubmit={(e) => handleSubmit(e)}>
      {/* Formulaire */}
      <button disabled={loading}>
        {loading ? 'Ajout en cours...' : 'Ajouter'}
      </button>
    </form>
  );
}
```

---

## 🗑️ useDeletePrestashop

### 📄 Fichier
`src/hooks/useDeletePrestashop.js`

### 🎯 Description
Hook pour supprimer des ressources PrestaShop.

### 📚 API

#### `useDeleteResource(resourceType, customConfig)`
Hook générique de suppression

```javascript
const { deleteResource, loading, error } = useDeleteResource('product');
```

#### Hooks spécialisés
```javascript
const { deleteCategory, loading, error } = useDeleteCategory();
const { deleteProduct, loading, error } = useDeleteProduct();
const { deleteCustomer, loading, error } = useDeleteCustomer();
```

#### `deleteResource(resourceUrl, resourceId)`
Fonction asynchrone directe

```javascript
await deleteResource('products', 123);
```

### 📖 Exemple
```javascript
import { useDeleteProduct } from '../hooks/useDeletePrestashop';

function DeleteProductButton({ productId }) {
  const { deleteProduct, loading } = useDeleteProduct();
  
  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr?')) {
      try {
        await deleteProduct(productId);
        alert('Produit supprimé');
      } catch (err) {
        alert('Erreur: ' + err.message);
      }
    }
  };
  
  return (
    <button onClick={handleDelete} disabled={loading}>
      {loading ? 'Suppression...' : 'Supprimer'}
    </button>
  );
}
```

---

## 🔍 useSearchPrestashop

### 📄 Fichier
`src/hooks/useSearchPrestashop.js`

### 🎯 Description
Hook pour rechercher des entités PrestaShop avec des filtres.

### 📚 API

#### `useSearchPrestashop()`
Hook principal

```javascript
const { 
  searchByAttribute,
  searchCategoryByName,
  searchProductByReference,
  searchProductByName,
  searchWithMultipleFilters,
  loading,
  error,
  results
} = useSearchPrestashop();
```

#### `searchByAttribute(entityType, attribute, value, display)`
Recherche générique par attribut

```javascript
const results = await searchByAttribute('products', 'reference', 'SKU123', 'full');
```

**Paramètres :**
| Nom | Type | Description |
|-----|------|-------------|
| `entityType` | string | Type d'entité (categories, products, customers) |
| `attribute` | string | Attribut à filtrer (name, reference, email) |
| `value` | string\|number | Valeur recherchée |
| `display` | string | Champs à retourner (défaut: 'full') |

#### `searchCategoryByName(name)`
Recherche une catégorie par nom
```javascript
const category = await searchCategoryByName('Électronique');
```

#### `searchProductByReference(reference)`
Recherche un produit par référence
```javascript
const product = await searchProductByReference('SKU123');
```

#### `searchProductByName(name)`
Recherche un produit par nom
```javascript
const products = await searchProductByName('Laptop');
```

#### `searchWithMultipleFilters(entityType, filters)`
Recherche avec plusieurs critères
```javascript
const results = await searchWithMultipleFilters('products', {
  reference: 'SKU123',
  active: 1,
  name: 'Laptop'
});
```

### 📖 Exemple
```javascript
import { useSearchPrestashop } from '../hooks/useSearchPrestashop';

function SearchProducts() {
  const { searchProductByName, loading, results } = useSearchPrestashop();
  
  const handleSearch = async (keyword) => {
    const products = await searchProductByName(keyword);
  };
  
  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {loading && <div>Recherche...</div>}
      <ul>
        {results?.map(p => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 📥 useImportHandler

### 📄 Fichier
`src/hooks/useImportHandler.js`

### 🎯 Description
Hook pour gérer l'import de fichiers CSV/XML vers PrestaShop.

### 📚 API

```javascript
const { 
  importing, 
  result, 
  handleImport, 
  setResult 
} = useImportHandler();
```

**Retour :**
| Propriété | Type | Description |
|-----------|------|-------------|
| `importing` | boolean | Import en cours |
| `result` | Object | Résultat de l'import |
| `handleImport` | Function | Fonction d'import |
| `setResult` | Function | Réinitialiser le résultat |

#### `handleImport(file, entity)`
Lance un import

**Paramètres :**
- `file` (File) : Fichier à importer
- `entity` (string) : Type d'entité (ex: 'Categories', 'Products')

**Résultat retourné :**
```javascript
{
  success: true/false,
  rows: number,          // Nombre de lignes traitées
  errors: number,        // Nombre d'erreurs
  details: Object,       // Détails des erreurs
  errorMessage: string   // Message d'erreur global
}
```

### 📖 Exemple
```javascript
import { useImportHandler } from '../hooks/useImportHandler';

function ImportForm() {
  const { importing, result, handleImport } = useImportHandler();
  
  const handleFileSelect = async (file) => {
    await handleImport(file, 'Categories');
  };
  
  return (
    <div>
      <input type="file" onChange={(e) => handleFileSelect(e.target.files[0])} />
      {importing && <div>Import en cours...</div>}
      {result && (
        <div>
          <p>Lignes traitées: {result.rows}</p>
          <p>Erreurs: {result.errors}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 useGenericFetch

### 📄 Fichier
`src/hooks/useGenericFetch.js`

### 🎯 Description
Hook CRUD générique pour les ressources PrestaShop avec support complet des opérations.

### 📚 API

```javascript
const {
  create,
  get,
  update,
  delete: deleteResource,
  loading,
  error,
  data
} = usePrestashopResource('product');
```

**Types supportés :**
- category, product, customer, manufacturer, supplier

#### `create(resourceData, languageId)`
Crée une ressource

```javascript
await create({
  name: 'Nouveau produit',
  reference: 'SKU001'
}, 1);
```

#### `get(resourceId, options)`
Récupère une ressource

```javascript
const product = await get(123);
const products = await get(null, { display: 'id,name' });
```

#### `update(resourceId, updates)`
Met à jour une ressource

```javascript
await update(123, { name: 'Nom modifié' });
```

#### `delete(resourceId)`
Supprime une ressource

```javascript
await deleteResource(123);
```

---

## ⚙️ Configuration commune

### Clés API
```javascript
const DEFAULT_CONFIG = {
  apiKey: "2LA1668U53GC9T35AIT5Y3P7E8CKG7LL",
  baseUrl: "http://localhost/prestashop2/api"
};
```

### Champs multilingues
Certains champs doivent être enveloppés avec un ID de langue :
```javascript
{
  name: {
    language: {
      "@_id": 1,
      "#cdata": "Valeur"
    }
  }
}
```

---

## 🐛 Gestion des erreurs

### Pattern commun
```javascript
try {
  const result = await addResource('product', data);
  alert('Succès!');
} catch (err) {
  // err.message contient le détail de l'erreur
  alert('Erreur: ' + err.message);
}
```

### Types d'erreurs courantes
- `HTTP error! status: 400` - Données invalides
- `HTTP error! status: 401` - Clé API invalide
- `HTTP error! status: 404` - Ressource non trouvée
- `HTTP error! status: 500` - Erreur serveur

---

**Fichiers sources** : `src/hooks/*.js`

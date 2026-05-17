# Architecture - Prestashop React

## 🏗️ Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│           Interface Utilisateur (React)                 │
│  (Admin Components + Front-office Components)           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│           Couche de Gestion d'État                      │
│  (AuthContext, CartContext)                             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│           Hooks Personnalisés (Custom Hooks)            │
│  (useFetchPrestashop, useMutationPrestashop, etc.)      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│           Services & Utilitaires                        │
│  (API Service, Parseurs XML/CSV, Importateurs)         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│           API PrestaShop (HTTP/XML)                     │
│  http://localhost/prestashop2/api                       │
└─────────────────────────────────────────────────────────┘
```

## 📊 Flux de données

### Flux de lecture (GET)
```
Composant
  │
  ├─→ useFetchPrestashop / useGenericFetch
  │       │
  │       ├─→ fetch(url)
  │       │
  │       └─→ parsePrestashopXML / ParserXml
  │
  ├─→ Mise à jour du state
  │
  └─→ Re-render du composant
```

### Flux de modification (POST/PUT/DELETE)
```
Composant
  │
  ├─→ useMutationPrestashop / useDeleteResource
  │       │
  │       ├─→ convertToPrestashopXML (BuilderXml)
  │       │
  │       ├─→ fetch(url, { method, body: xml })
  │       │
  │       └─→ parsePrestashopXML
  │
  ├─→ Mise à jour du state
  │
  └─→ Re-render + notification
```

### Flux d'import
```
Utilisateur choisit fichier
  │
  ├─→ useImportHandler
  │       │
  │       ├─→ csvParser.parseFile1Products
  │       │
  │       ├─→ dataImporter.importCategories
  │       │   dataImporter.importProducts
  │       │
  │       └─→ Utilise useMutationPrestashop en boucle
  │
  ├─→ Accumule les résultats
  │
  └─→ Affiche le rapport d'import
```

## 🔄 Cycle de vie des requêtes API

### 1. Configuration
```javascript
// Défaut
const DEFAULT_CONFIG = {
  apiKey: "2LA1668U53GC9T35AIT5Y3P7E8CKG7LL",
  baseUrl: "http://localhost/prestashop2/api",
  timeout: 5000
};
```

### 2. Endpoints principaux
```
GET    /api/products          - Lister les produits
POST   /api/products          - Créer un produit
PUT    /api/products/{id}     - Modifier un produit
DELETE /api/products/{id}     - Supprimer un produit

GET    /api/categories        - Lister les catégories
POST   /api/categories        - Créer une catégorie
DELETE /api/categories/{id}   - Supprimer une catégorie

GET    /api/customers         - Lister les clients
POST   /api/customers         - Créer un client
DELETE /api/customers/{id}    - Supprimer un client

GET    /api/orders            - Lister les commandes
```

### 3. Format des requêtes

#### GET
```bash
GET /api/products?ws_key=KEY&display=id,name&filter[reference]=[SKU123]
```

#### POST/PUT (XML)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <product>
    <id><![CDATA[1]]></id>
    <name>
      <language id="1"><![CDATA[Mon produit]]></language>
    </name>
  </product>
</prestashop>
```

## 🗂️ Organisation des modules

### 1. **Contexts** (`src/context/`)
Gestion d'état global avec React Context
- `AuthContext` : Authentification utilisateur
- `CartContext` : Gestion du panier

### 2. **Hooks** (`src/hooks/`)
Logique métier réutilisable
- `useFetch` : Fetch générique avec loading/error
- `useFetchPrestashop` : Fetch spécialisé PrestaShop
- `useMutationPrestashop` : CRUD pour PrestaShop
- `useDeletePrestashop` : Suppression de ressources
- `useGenericFetch` : Opérations CRUD génériques
- `useImportHandler` : Gestion des imports
- `useSearchPrestashop` : Recherche d'entités

### 3. **Services** (`src/services/`)
Couche API et configuration
- `api.jsx` : Configuration fetch avec intercepteurs

### 4. **Utils** (`src/utils/`)
Utilitaires et transformations de données
- `csvParser.js` : Parse CSV en objets
- `ParserXml.js` : Parse réponses XML PrestaShop
- `BuilderXml.js` : Construit XML PrestaShop
- `dataImporter.js` : Logique d'import complet
- `categoryImporter.js` : Import spécifique catégories

### 5. **Components** (`src/components/`)
Composants réutilisables

#### Admin
- `AddProduct.jsx` : Formulaire ajout produit
- `AddCategorie.jsx` : Formulaire ajout catégorie
- `AddCustomer.jsx` : Formulaire ajout client
- `ListProduct.jsx` : Liste des produits
- `SearchProduct.jsx` : Recherche de produits
- `DeleteCategorie.jsx` : Suppression de catégorie
- `DeleteCustomer.jsx` : Suppression de client
- `Header.jsx` : En-tête admin
- `Sidebar.jsx` : Menu latéral
- `Layout.jsx` : Layout admin

#### Front-office
- `FrontLayout.jsx` : Layout client
- `FrontHeader.jsx` : En-tête client
- `ProductCard.jsx` : Carte produit
- `ProductsList.jsx` : Liste produits
- `CategoryFilter.jsx` : Filtres catégorie
- `LoginModal.jsx` : Modal connexion
- `CartPage.jsx` : Page panier
- `UserSelectionModal.jsx` : Modal sélection utilisateur

### 6. **Pages** (`src/pages/`)
Pages principales de l'application

#### Admin
- `Dashboard.jsx` : Dashboard principal
- `Products.jsx` : Gestion des produits
- `Categories.jsx` : Gestion des catégories
- `Customers.jsx` : Gestion des clients
- `Orders.jsx` : Gestion des commandes
- `Stock.jsx` : Gestion du stock
- `Import.jsx` : Page d'import
- `Export.jsx` : Page d'export
- `AdminOrdersDashboard.jsx` : Dashboard commandes

#### Front-office
- `ProductsList.jsx` : Liste produits
- `ProductDetail.jsx` : Détail produit
- `CartPage.jsx` : Panier
- `OrderSummary.jsx` : Résumé commande
- `UserSelectionPage.jsx` : Sélection utilisateur

### 7. **Routes** (`src/routes/`)
Configuration des routes (non utilisée - utilise BrowserRouter inline dans App.jsx)

## 🔐 Sécurité et considérations

### ⚠️ Problèmes actuels
1. **Clé API en dur** : À déplacer en `.env`
2. **Pas d'authentification API** : Les clés sont visibles côté client
3. **Validation minimale** : Ajouter des validations de schéma strictes

### ✅ Bonnes pratiques
1. Toujours valider les données côté client
2. Utiliser des messages d'erreur significatifs
3. Implémenter les timeouts pour les requêtes
4. Logger les erreurs pour le debugging

## 🎯 Patterns utilisés

### 1. **Context + Hooks**
```javascript
// Création du contexte
const AuthContext = createContext();

// Provider
export function AuthProvider({ children }) { ... }

// Hook custom pour utiliser le contexte
export function useAuth() { ... }
```

### 2. **Custom Hooks pour logique**
```javascript
export function useFetchPrestashop(url, options) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [errors, setErrors] = useState(null);
  
  useEffect(() => {
    // Logique de fetch
  }, [url, options]);
  
  return { loading, data, errors };
}
```

### 3. **Séparation Fetch/Parse**
```javascript
const response = await fetch(url); // Récupère les données
const parsed = await parsePrestashopXML(response); // Parse l'XML
```

## 📈 Performance

### Caching
- `dataImporter.js` utilise des Maps pour cacher les ressources
- Évite les requêtes redondantes pendant l'import

### Optimisation
- Paginer les listes si elles deviennent trop grandes
- Utiliser React.memo pour les composants purs
- Implémenter un lazy loading pour les images

## 🧪 Testing

### Ressources de test
- Fichiers CSV dans `todo/` pour tester l'import
- Données de test dans `models/_data.js`

---

**Pour plus de détails**, consultez les fichiers de documentation spécifiques :
- [CONTEXTS.md](./CONTEXTS.md)
- [HOOKS.md](./HOOKS.md)
- [SERVICES_UTILS.md](./SERVICES_UTILS.md)
- [COMPONENTS.md](./COMPONENTS.md)

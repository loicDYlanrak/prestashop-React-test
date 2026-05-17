# Guide de développement

## 📋 Table des matières
1. [Setup & Installation](#setup--installation)
2. [Structure du projet](#structure-du-projet)
3. [Conventions de code](#conventions-de-code)
4. [Workflow de développement](#workflow-de-développement)
5. [Déploiement](#déploiement)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup & Installation

### Prérequis
- **Node.js** >= 14
- **npm** ou **yarn**
- **PrestaShop 8** accessible via `http://localhost/prestashop2/api`
- **Clé API PrestaShop** valide

### Installation du projet
```bash
# Cloner le projet
git clone <repository>
cd prestashop-React-test

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

### Configuration
Créer un fichier `.env.local` :
```bash
VITE_API_BASE_URL=http://localhost/prestashop2/api
VITE_API_TIMEOUT=5000
VITE_API_KEY=2LA1668U53GC9T35AIT5Y3P7E8CKG7LL
```

---

## 📂 Structure du projet

### Vue d'ensemble
```
prestashop-React-test/
├── src/
│   ├── components/        # Composants réutilisables
│   ├── context/           # Contextes globaux
│   ├── hooks/             # Hooks custom
│   ├── pages/             # Pages de l'app
│   ├── services/          # Services API
│   ├── utils/             # Utilitaires
│   ├── App.jsx            # Composant principal
│   ├── main.jsx           # Point d'entrée
│   └── *.css              # Styles globaux
├── docs/                  # Documentation
├── public/                # Assets statiques
├── vite.config.js         # Config Vite
├── eslint.config.js       # Config ESLint
└── package.json           # Dépendances
```

### Hiérarchie des dossiers
```
src/
├── components/
│   ├── AddCategorie.jsx
│   ├── AddProduct.jsx
│   ├── Layout.jsx         # Layout admin
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   └── frontoffice/
│       ├── FrontLayout.jsx    # Layout front
│       ├── FrontHeader.jsx
│       ├── ProductCard.jsx
│       └── ...
│
├── context/
│   ├── AuthContext.jsx    # Gestion authentification
│   └── CartContext.jsx    # Gestion panier
│
├── hooks/
│   ├── useFetch.js        # Fetch générique
│   ├── useFetchPrestashop.js
│   ├── useMutationPrestashop.js
│   ├── useDeletePrestashop.js
│   ├── useSearchPrestashop.js
│   ├── useImportHandler.js
│   └── useGenericFetch.js
│
├── pages/
│   ├── Dashboard.jsx
│   ├── Products.jsx
│   ├── Import.jsx
│   └── frontoffice/
│       ├── ProductsList.jsx
│       ├── CartPage.jsx
│       └── ...
│
├── services/
│   └── api.jsx            # Service API
│
└── utils/
    ├── csvParser.js       # Parse CSV
    ├── ParserXml.js       # Parse XML
    ├── BuilderXml.js      # Crée XML
    ├── dataImporter.js    # Import complet
    └── categoryImporter.js
```

---

## 📝 Conventions de code

### Nommage des fichiers

#### Composants React
```javascript
// PascalCase avec extension .jsx
ProductCard.jsx
FrontLayout.jsx
AddProduct.jsx
```

#### Hooks
```javascript
// Commencent par "use" (convention React)
useFetchPrestashop.js
useMutationPrestashop.js
```

#### Utilitaires et services
```javascript
// camelCase avec extension .js
csvParser.js
ParserXml.js
dataImporter.js
```

### Nommage des variables

#### Constantes
```javascript
// UPPER_CASE
const DEFAULT_CONFIG = { ... };
const RESOURCE_ENDPOINTS = { ... };
const MAX_RETRIES = 3;
```

#### Fonctions et variables
```javascript
// camelCase
function handleImportFile() { }
const [isLoading, setIsLoading] = useState(false);
const user = { name: 'John' };
```

#### Classes et types
```javascript
// PascalCase
class ProductManager { }
const UserType = { ... };
```

### Commentaires

#### JSDoc pour fonctions publiques
```javascript
/**
 * Crée une ressource PrestaShop
 * @param {string} resourceType - Type de ressource
 * @param {object} resourceData - Données à créer
 * @returns {Promise<object>} - Réponse de création
 * @throws {Error} Si erreur API
 */
async function addResource(resourceType, resourceData) {
  // ...
}
```

#### Commentaires inline pour logique complexe
```javascript
// Créer un ID unique basé sur produit + combinaison
const itemId = selectedCombination
  ? `${product.id}_${selectedCombination.id}`
  : `${product.id}`;
```

#### Commentaires pour les sections
```javascript
// ==================== FICHIER 1 : PRODUITS ====================

// ===== Importation des catégories =====
```

### Style de code

#### Imports
```javascript
// Grouper les imports
import React, { useState, useEffect } from 'react';

// Imports locaux après les dépendances
import { useFetchPrestashop } from '../hooks/useFetchPrestashop';
import Layout from '../components/Layout';
```

#### Destructuring
```javascript
// Préférer la destructuration
const { user, login, logout } = useAuth();
const { loading, data, errors } = useFetch(url);

// Plutôt que
const context = useAuth();
const user = context.user;
```

#### Conditionnels
```javascript
// Garder les conditions lisibles
if (!data) return <Loading />;
if (error) return <Error message={error} />;

// Éviter les ternaires imbriquées
const status = loading ? 'loading' : error ? 'error' : 'success';

// Préférer :
let status = 'success';
if (loading) status = 'loading';
if (error) status = 'error';
```

---

## 🛠️ Workflow de développement

### Ajouter une nouvelle fonctionnalité

#### 1. Créer le hook custom (si nécessaire)
```javascript
// src/hooks/useMyFeature.js
export function useMyFeature() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  return { data, loading };
}
```

#### 2. Créer le composant
```javascript
// src/components/MyComponent.jsx
import { useMyFeature } from '../hooks/useMyFeature';

export function MyComponent() {
  const { data, loading } = useMyFeature();
  
  return <div>{data}</div>;
}
```

#### 3. Utiliser dans une page
```javascript
// src/pages/MyPage.jsx
import { MyComponent } from '../components/MyComponent';
import Layout from '../components/Layout';

function MyPage() {
  return (
    <Layout>
      <h1>Ma page</h1>
      <MyComponent />
    </Layout>
  );
}
```

#### 4. Ajouter la route
```javascript
// src/App.jsx
<Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
```

### Ajouter un nouveau service/utilitaire

```javascript
// src/utils/myUtil.js
/**
 * Fait quelque chose d'utile
 * @param {any} input - Paramètre
 * @returns {any} Résultat
 */
export function doSomething(input) {
  // Implémentation
  return result;
}

export const helper = (value) => {
  // Code helper
};
```

### Gestion des erreurs

#### Pattern recommandé
```javascript
try {
  const result = await addResource('product', data);
  // Succès
  alert('Produit créé avec succès!');
  navigate('/products');
} catch (error) {
  // Erreur
  console.error('Erreur création produit:', error);
  setError(error.message);
  // Afficher message utilisateur
  alert('Erreur: ' + error.message);
}
```

#### Affichage des erreurs
```javascript
{error && (
  <div className="error-message" role="alert">
    <strong>Erreur!</strong> {error}
  </div>
)}
```

### Validation des données

#### Validation côté client
```javascript
function validateProduct(product) {
  const errors = {};
  
  if (!product.name?.trim()) {
    errors.name = 'Le nom est requis';
  }
  
  if (!product.price || product.price < 0) {
    errors.price = 'Le prix doit être positif';
  }
  
  return errors;
}

// Utilisation
const errors = validateProduct(formData);
if (Object.keys(errors).length > 0) {
  setValidationErrors(errors);
  return;
}
```

---

## 🧪 Bonnes pratiques

### Performance

#### 1. Utiliser React.memo pour les composants purs
```javascript
const ProductCard = React.memo(function ProductCard({ product }) {
  return <div>{product.name}</div>;
});
```

#### 2. Utiliser useCallback pour les callbacks
```javascript
const handleAddToCart = useCallback((product) => {
  addToCart(product, 1);
}, [addToCart]);
```

#### 3. Lazy loading des routes
```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### Sécurité

#### 1. Variables d'environnement
```javascript
// ❌ MAUVAIS
const apiKey = "2LA1668U53GC9T35AIT5Y3P7E8CKG7LL";

// ✅ BON
const apiKey = import.meta.env.VITE_API_KEY;
```

#### 2. Validation des entrées utilisateur
```javascript
// ❌ MAUVAIS
const url = `/api/products/${userInput}`;

// ✅ BON
const url = `/api/products/${encodeURIComponent(userInput)}`;
```

#### 3. Gestion des tokens
```javascript
// À implémenter : JWT tokens avec refresh
const token = localStorage.getItem('auth_token');
if (isTokenExpired(token)) {
  const newToken = await refreshToken();
  localStorage.setItem('auth_token', newToken);
}
```

### Accessibilité

```javascript
// Utiliser des labels
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ARIA attributes
<button aria-label="Ajouter au panier">
  <CartIcon />
</button>

// Roles
<div role="alert">{error}</div>
```

---

## 🚢 Déploiement

### Build de production
```bash
npm run build
```

### Vérifier le build
```bash
npm run preview
```

### Fichiers générés
```
dist/
├── index.html
├── assets/
│   ├── index-*.js
│   └── index-*.css
```

### Variables d'environnement en production
```bash
# .env.production
VITE_API_BASE_URL=https://api.example.com/prestashop/api
VITE_API_KEY=production_key_here
VITE_API_TIMEOUT=10000
```

### Checklist avant déploiement
- [ ] Pas de console.log() en production
- [ ] Clés API en variables d'environnement
- [ ] HTTPS configuré
- [ ] CORS configuré correctement
- [ ] Tests effectués
- [ ] Documentation à jour
- [ ] Notifications d'erreur configurées

---

## 🐛 Troubleshooting

### Problème : API non accessible
**Symptôme** : Erreur "Cannot reach API"

**Solutions** :
1. Vérifier que PrestaShop est démarré
2. Vérifier la clé API dans `.env`
3. Vérifier l'URL de base
4. Vérifier les en-têtes CORS

```javascript
// Test
const result = await fetch('http://localhost/prestashop2/api/products?ws_key=XXX');
console.log(result.ok);
```

### Problème : Erreur de parsing XML
**Symptôme** : "Erreur lors du parsing XML"

**Solutions** :
1. Vérifier que la réponse est du XML valide
2. Vérifier les caractères spéciaux (accents)
3. Vérifier l'encodage UTF-8

```javascript
// Debug
const response = await fetch(url);
const text = await response.text();
console.log(text); // Vérifier le contenu
```

### Problème : Timeout des requêtes
**Symptôme** : "Request timeout after 5000ms"

**Solutions** :
1. Augmenter le timeout
2. Optimiser la requête (filtres, pagination)
3. Vérifier la connexion réseau

```javascript
const response = await fetchWithTimeout(url, {
  timeout: 10000  // 10 secondes
});
```

### Problème : État non mis à jour
**Symptôme** : Composant ne se re-render pas

**Solutions** :
1. Vérifier que setState est appelé correctement
2. Vérifier les dépendances de useEffect
3. Vérifier que les hooks sont appelés au bon endroit

```javascript
// ❌ MAUVAIS
if (condition) {
  const [state, setState] = useState(false); // Placer les hooks au top-level
}

// ✅ BON
const [state, setState] = useState(false);
useEffect(() => {
  if (condition) {
    // ...
  }
}, [condition]);
```

### Problème : localStorage ne persiste pas
**Symptôme** : Données perdues après refresh

**Solutions** :
1. Vérifier le mode navigation privée
2. Vérifier les paramètres de localStorage
3. Vérifier que les données sont sérialisées en JSON

```javascript
// Vérifier
console.log(localStorage.getItem('key'));

// Tester l'ajout
localStorage.setItem('test', 'value');
console.log(localStorage.getItem('test'));
```

---

## 📚 Ressources utiles

### Documentation
- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [Vite Documentation](https://vitejs.dev)
- [PrestaShop Web Service](https://devdocs.prestashop.com/1.7/development/webservice/)

### Outils
- **VS Code Extensions** : ES7+ React/Redux/React-Native snippets
- **DevTools** : React Developer Tools
- **Postman** : Tester les API
- **Insomnia** : Alternative à Postman

### Déboggage
```javascript
// Logger les requêtes
console.log('Requête:', url, options);

// Logger l'état
console.log('State:', state);

// Debugger
debugger; // Met en pause l'exécution
```

---

## 📞 Contacter l'équipe

Pour des questions ou problèmes :
1. Vérifier la documentation (docs/)
2. Chercher dans le code existant
3. Demander à un développeur senior
4. Créer une issue si c'est un bug

---

**Dernière mise à jour** : Mai 2024
**Auteur** : Équipe développement
**Version** : 1.0

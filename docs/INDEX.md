# 📚 Index de la Documentation

Bienvenue dans la documentation complète du projet Prestashop React. Veuillez consulter les guides appropriés selon votre besoin.

---

## 🚀 Démarrer rapidement

### Pour les nouveaux développeurs
1. **[README.md](./README.md)** - Vue d'ensemble du projet
2. **[GUIDE_DEVELOPPEMENT.md](./GUIDE_DEVELOPPEMENT.md)** - Setup et conventions
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Structure et flux de données

### Pour les développeurs expérimentés
- **[ROUTES_ENDPOINTS.md](./ROUTES_ENDPOINTS.md)** - Routes et endpoints API
- **[SERVICES_UTILS.md](./SERVICES_UTILS.md)** - Services et utilitaires

---

## 📖 Documentation par module

### 🔐 Authentification et État Global
- **[CONTEXTS.md](./CONTEXTS.md)** - AuthContext et CartContext
  - Authentification utilisateur
  - Gestion du panier
  - Persistance localStorage

### 🎣 Hooks Custom
- **[HOOKS.md](./HOOKS.md)** - Tous les hooks personnalisés
  - useFetch - Fetch générique
  - useFetchPrestashop - API PrestaShop
  - useMutationPrestashop - CRUD
  - useDeletePrestashop - Suppression
  - useSearchPrestashop - Recherche
  - useImportHandler - Import données

### 🛠️ Services et Utilitaires
- **[SERVICES_UTILS.md](./SERVICES_UTILS.md)** - Services API et transformations
  - api.jsx - Configuration API
  - csvParser.js - Parsing CSV
  - ParserXml.js - Parsing XML
  - BuilderXml.js - Construction XML
  - dataImporter.js - Import complet
  - categoryImporter.js - Import catégories

### 🎨 Composants
- **[COMPONENTS.md](./COMPONENTS.md)** - Composants réutilisables
  - Composants Admin (Layout, Sidebar, Forms)
  - Composants Front-office (ProductCard, CategoryFilter, etc.)
  - Modals et Inputs

### 📄 Pages
- **[PAGES.md](./PAGES.md)** - Pages de l'application
  - Pages Admin (Dashboard, Products, Categories, etc.)
  - Pages Front-office (ProductsList, CartPage, etc.)
  - Flux et patterns

### 🗺️ Routes et Endpoints
- **[ROUTES_ENDPOINTS.md](./ROUTES_ENDPOINTS.md)** - Routes Frontend et API
  - Routes React Router
  - Endpoints PrestaShop
  - Paramètres et filtres

### 📐 Architecture
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture globale
  - Diagrammes flux
  - Organisation des modules
  - Patterns utilisés
  - Performance et sécurité

---

## 🎯 Guides par cas d'usage

### 👤 Je veux modifier l'authentification
→ [CONTEXTS.md](./CONTEXTS.md#-authcontext)

### 🛒 Je veux modifier le panier
→ [CONTEXTS.md](./CONTEXTS.md#-cartcontext)

### 🔌 Je veux ajouter un appel API PrestaShop
→ [HOOKS.md](./HOOKS.md#-usefetchprestashop)

### ➕ Je veux créer une nouvelle ressource
→ [HOOKS.md](./HOOKS.md#-usemutationprestashop)

### 🗑️ Je veux supprimer une ressource
→ [HOOKS.md](./HOOKS.md#-usedeleteprestashop)

### 🔍 Je veux chercher des données
→ [HOOKS.md](./HOOKS.md#-usesearchprestashop)

### 📥 Je veux importer des données
→ [SERVICES_UTILS.md](./SERVICES_UTILS.md#-dataimporter) et [HOOKS.md](./HOOKS.md#-useimporthandler)

### 🎨 Je veux créer un nouveau composant
→ [COMPONENTS.md](./COMPONENTS.md) et [GUIDE_DEVELOPPEMENT.md](./GUIDE_DEVELOPPEMENT.md#ajouter-une-nouvelle-fonctionnalité)

### 📄 Je veux créer une nouvelle page
→ [PAGES.md](./PAGES.md#-patterns-courants)

### 🛣️ Je veux ajouter une nouvelle route
→ [ROUTES_ENDPOINTS.md](./ROUTES_ENDPOINTS.md#-routes-frontend-react-router)

### 🐛 J'ai une erreur
→ [GUIDE_DEVELOPPEMENT.md](./GUIDE_DEVELOPPEMENT.md#-troubleshooting)

---

## 📋 Structure des fichiers de documentation

```
docs/
├── README.md                    # Vue d'ensemble (COMMENCER ICI!)
├── ARCHITECTURE.md              # Architecture du projet
├── CONTEXTS.md                  # Gestion d'état (Auth + Cart)
├── HOOKS.md                     # Hooks custom pour PrestaShop
├── SERVICES_UTILS.md            # Services API et utilitaires
├── COMPONENTS.md                # Composants réutilisables
├── PAGES.md                     # Pages de l'application
├── ROUTES_ENDPOINTS.md          # Routes et endpoints API
├── GUIDE_DEVELOPPEMENT.md       # Guide de développement
└── INDEX.md                     # Ce fichier
```

---

## 🔄 Flux recommandé de lecture

### Pour **comprendre** le projet
1. README.md
2. ARCHITECTURE.md
3. CONTEXTS.md
4. HOOKS.md

### Pour **développer** une nouvelle fonctionnalité
1. GUIDE_DEVELOPPEMENT.md (workflow)
2. Module concerné (COMPONENTS, PAGES, etc.)
3. SERVICES_UTILS.md (si besoin d'API)
4. ROUTES_ENDPOINTS.md (si besoin de routes)

### Pour **déboguer** un problème
1. GUIDE_DEVELOPPEMENT.md (troubleshooting)
2. Module concerné (documentation spécifique)
3. ROUTES_ENDPOINTS.md (vérifier endpoints)

---

## 📊 Quick Reference

### Contextes disponibles
```javascript
const { user, login, logout } = useAuth();
const { cart, addToCart, removeFromCart } = useCart();
```

### Hooks disponibles
```javascript
useFetch(url, options)
useFetchPrestashop(url, options)
useAddResource(resourceType)
useDeleteResource(resourceType)
useSearchPrestashop()
useImportHandler()
```

### Patterns courants
```javascript
// Fetch + Loading + Error
const { loading, data, errors } = useFetchPrestashop('products');

// CRUD
const { addResource } = useAddResource('product');
await addResource({ name: 'Produit' });

// Recherche
const { searchProductByName } = useSearchPrestashop();
const results = await searchProductByName('Laptop');

// Import
const { importing, result, handleImport } = useImportHandler();
await handleImport(file, 'Categories');
```

### Routes principales
```
GET  /login                      → Authentification
GET  /dashboard                  → Accueil admin (protégé)
GET  /products, /categories, etc → Pages admin (protégé)
GET  /                           → Accueil client (public)
GET  /product/:id                → Détail produit (public)
GET  /cart                       → Panier (public)
```

---

## 🎓 Conventions importantes

### Nommage
- Fichiers composants : **PascalCase** (ProductCard.jsx)
- Fichiers hooks : **camelCase avec "use"** (useFetchPrestashop.js)
- Constantes : **UPPER_CASE** (DEFAULT_CONFIG)
- Variables : **camelCase** (userName)

### Structure CSS
- Un fichier CSS par composant
- Même nom que le composant (ProductCard.jsx → ProductCard.css)

### Gestion des erreurs
- Toujours utiliser try/catch
- Afficher un feedback utilisateur
- Logger pour le debugging

### Validation
- Valider les données côté client
- Utiliser des messages d'erreur clairs
- Indiquer le numéro de ligne en cas d'erreur (import)

---

## 📞 Support et questions

### Avant de poser une question
1. ✅ Lire la documentation pertinente
2. ✅ Chercher dans le code existant
3. ✅ Vérifier le troubleshooting

### Types de questions
- **Questions techniques** → Voir la documentation du module
- **Problèmes de configuration** → Voir GUIDE_DEVELOPPEMENT.md
- **Erreurs API** → Voir ROUTES_ENDPOINTS.md et troubleshooting
- **Architectures/patterns** → Voir ARCHITECTURE.md

---

## 🗂️ Checkpoints par étape

### ✅ Avant de commencer à développer
- [ ] Lire README.md
- [ ] Lire GUIDE_DEVELOPPEMENT.md (setup)
- [ ] Comprendre ARCHITECTURE.md
- [ ] Vérifier les conventions de code

### ✅ Avant de modifier un composant
- [ ] Consulter COMPONENTS.md
- [ ] Regarder les props requises
- [ ] Vérifier les dépendances
- [ ] Tester les changements

### ✅ Avant d'ajouter une nouvelle page
- [ ] Consulter PAGES.md (patterns)
- [ ] Créer la route dans App.jsx
- [ ] Documenter la nouvelle page
- [ ] Tester l'accès

### ✅ Avant de faire un appel API
- [ ] Consulter HOOKS.md
- [ ] Consulter ROUTES_ENDPOINTS.md
- [ ] Gérer loading et erreurs
- [ ] Tester avec Postman si nécessaire

### ✅ Avant de commit
- [ ] Pas de console.log() en production
- [ ] Pas de clés API en dur
- [ ] Documentation à jour
- [ ] Tests effectués
- [ ] Pas d'erreurs ESLint

---

## 📈 Métriques du projet

### Taille du projet
- **Fichiers** : ~50 fichiers
- **Lignes de code** : ~5000+ lignes
- **Composants** : ~20 composants
- **Pages** : ~12 pages
- **Hooks** : ~7 hooks custom

### Modules clés
- **Gestion d'état** : AuthContext + CartContext
- **API** : 7 hooks pour PrestaShop
- **Utilitaires** : 5 modules de transformation
- **Composants** : Admin + Front-office séparés

---

## 🚀 Prochaines étapes

Après avoir lu cette documentation :

1. **Pour développer** :
   - [ ] Lire GUIDE_DEVELOPPEMENT.md complet
   - [ ] Configurer l'environnement local
   - [ ] Faire un premier commit pour tester

2. **Pour améliorer** :
   - [ ] Ajouter des tests unitaires
   - [ ] Optimiser les performances
   - [ ] Améliorer la sécurité (JWT, etc.)
   - [ ] Ajouter une validation de schéma (Zod, Yup)

3. **Pour étendre** :
   - [ ] Ajouter de nouvelles pages
   - [ ] Étendre les fonctionnalités d'import
   - [ ] Ajouter des exports avancés
   - [ ] Intégrer des notifications en temps réel

---

## 📝 Historique des mises à jour

| Date | Version | Changements |
|------|---------|------------|
| Mai 2024 | 1.0 | Documentation initiale complète |
| - | - | - |

---

## 🙏 Remerciements

Merci d'utiliser et de contribuer à cette documentation. Elle est maintenue à jour par l'équipe développement. Pour des suggestions ou corrections, veuillez contacter l'équipe.

---

**Dernière mise à jour** : Mai 2024
**Version** : 1.0
**Auteur** : Équipe développement

---

**👉 Commencez par [README.md](./README.md)** ✨

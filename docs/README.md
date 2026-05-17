# Documentation du Projet Prestashop React

## 📋 Vue d'ensemble

Ce projet est une application React pour la gestion de Prestashop. Il combine :
- Une **interface d'administration** pour la gestion des produits, catégories, clients et commandes
- Une **interface client** (front-office) pour la consultation des produits, panier et commandes
- Une **API REST** pour l'intégration avec Prestashop

## 📁 Structure du projet

```
src/
├── components/          # Composants React (Admin & Front)
├── context/            # Contextes globaux (Auth, Cart)
├── hooks/              # Hooks custom pour PrestaShop
├── pages/              # Pages de l'application
├── services/           # Services API
├── utils/              # Utilitaires et parseurs
└── routes/             # Configuration des routes
```

## 🚀 Guide de démarrage rapide

### Prérequis
- Node.js >= 14
- PrestaShop API accessible via `http://localhost/prestashop2/api`
- Clé API PrestaShop : `2LA1668U53GC9T35AIT5Y3P7E8CKG7LL`

### Installation
```bash
npm install
npm run dev
```

## 📚 Documentation détaillée

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture globale et flux de données
- **[CONTEXTS.md](./CONTEXTS.md)** - Gestion d'état avec les Contextes
- **[HOOKS.md](./HOOKS.md)** - Hooks custom pour PrestaShop
- **[SERVICES_UTILS.md](./SERVICES_UTILS.md)** - Services API et utilitaires
- **[COMPONENTS.md](./COMPONENTS.md)** - Composants UI et leur utilisation
- **[PAGES.md](./PAGES.md)** - Pages de l'application

## 🎯 Fonctionnalités principales

### Administration
- ✅ Gestion des produits
- ✅ Gestion des catégories
- ✅ Gestion des clients
- ✅ Gestion des commandes
- ✅ Import/Export de données (CSV, XML)
- ✅ Gestion du stock
- ✅ Gestion des commandes administrateur

### Front-office
- ✅ Consultation des produits
- ✅ Filtrage par catégorie
- ✅ Gestion du panier
- ✅ Gestion des commandes client
- ✅ Authentification client

## 🔑 Points clés à retenir

### Gestion de l'authentification
Utilisez le `AuthContext` pour accéder aux informations d'utilisateur
```javascript
const { user, login, logout } = useAuth();
```

### Gestion du panier
Utilisez le `CartContext` pour gérer le panier
```javascript
const { cart, addToCart, removeFromCart } = useCart();
```

### Appels API PrestaShop
Utilisez les hooks `useFetchPrestashop`, `useMutationPrestashop` pour interagir avec l'API
```javascript
const { loading, data, errors } = useFetchPrestashop('products');
```

## ⚠️ Points d'attention

1. **Clé API en dur** : La clé API est actuellement en dur dans le code. À déplacer en variables d'environnement pour la production.
2. **Validation des données** : Les parseurs CSV/XML doivent valider strictement les données importées
3. **Gestion d'erreurs** : Toujours gérer les erreurs réseau et les timeouts
4. **Performance** : Le cache est utilisé pour éviter les requêtes redondantes

## 🔍 Dépannage courant

### API non accessible
Vérifiez que PrestaShop est en cours d'exécution et que la clé API est valide.

### Erreurs de parsing XML
Les réponses PrestaShop doivent être en XML valide. Vérifiez le format des données envoyées.

### Timeouts
Augmentez le timeout dans la configuration API si les requêtes sont trop longues.

## 📝 Conventions de code

- **Noms des fichiers** : camelCase pour les composants (ProductCard.jsx)
- **Noms des fonctions** : camelCase (fetchPrestashop)
- **Noms des constantes** : UPPER_CASE (DEFAULT_CONFIG)
- **Commentaires** : JSDoc pour les fonctions publiques

## 🤝 Contribution

Lors de la modification du code :
1. Mettre à jour la documentation appropriée
2. Respecter les conventions de code
3. Tester les changements avant de commit
4. Ajouter des commentaires pour les fonctionnalités complexes

---

**Dernière mise à jour** : Mai 2024

# Pages

## 📍 Vue d'ensemble

Les pages sont les vues principales de l'application. Elles utilisent les composants et hooks pour afficher les données et gérer les workflows.

### 📋 Structure
```
src/pages/
├── Admin Pages
│   ├── Dashboard.jsx           # Page d'accueil admin
│   ├── Products.jsx            # Gestion produits
│   ├── Categories.jsx          # Gestion catégories
│   ├── Customers.jsx           # Gestion clients
│   ├── Orders.jsx              # Gestion commandes
│   ├── Stock.jsx               # Gestion stock
│   ├── Import.jsx              # Import données
│   ├── Export.jsx              # Export données
│   ├── DeleteEntity.jsx        # Suppression entités
│   ├── ResetData.jsx           # Réinitialiser données
│   ├── AdminOrdersDashboard.jsx # Dashboard commandes
│   └── *.css
└── Front-office Pages
    ├── ProductsList.jsx        # Liste produits
    ├── ProductDetail.jsx       # Détail produit
    ├── CartPage.jsx            # Page panier
    ├── OrderSummary.jsx        # Résumé commande
    ├── OrderSummaryPage.jsx    # Page résumé complet
    ├── UserSelectionPage.jsx   # Sélection utilisateur
    └── *.css
```

---

## 👨‍💼 Pages Admin

### Dashboard

#### 📄 Fichier
`src/pages/Dashboard.jsx`

#### 🎯 Description
Page d'accueil principale de l'interface d'administration.

#### 📊 Affichage
- Statistiques principales
- Derniers produits
- Dernières commandes
- État du système

#### 📖 Exemple de structure
```javascript
<Layout>
  <div className="dashboard">
    <h1>Tableau de bord</h1>
    <div className="stats">
      <StatCard label="Produits" value={productCount} />
      <StatCard label="Clients" value={customerCount} />
      <StatCard label="Commandes" value={orderCount} />
    </div>
    {/* Graphiques et listes */}
  </div>
</Layout>
```

---

### Products

#### 📄 Fichier
`src/pages/Products.jsx`

#### 🎯 Description
Page de gestion complète des produits.

#### 📚 Fonctionnalités
- Liste tous les produits
- Recherche et filtrage
- Ajouter nouveau produit
- Modifier produit
- Supprimer produit
- Importer produits (CSV)
- Voir les détails

#### 🔄 Flux principal
```
Products Page
├── ListProduct (affichage liste)
├── SearchProduct (recherche)
└── Boutons d'action
    ├── Ajouter → AddProduct
    ├── Modifier → Formulaire
    └── Supprimer → Confirmation
```

#### 📖 Exemple
```javascript
function Products() {
  const [showAddForm, setShowAddForm] = useState(false);
  
  return (
    <Layout>
      <h1>Gestion des produits</h1>
      <SearchProduct />
      <button onClick={() => setShowAddForm(true)}>
        Ajouter un produit
      </button>
      {showAddForm && <AddProduct />}
      <ListProduct />
    </Layout>
  );
}
```

---

### Categories

#### 📄 Fichier
`src/pages/Categories.jsx`

#### 🎯 Description
Page de gestion des catégories de produits.

#### 📚 Fonctionnalités
- Affichage arborescence catégories
- Ajouter catégorie
- Modifier catégorie
- Supprimer catégorie
- Organiser hiérarchie

#### 🔄 Structure
```
Catégories
├── Catégorie 1
│   ├── Sous-catégorie 1.1
│   └── Sous-catégorie 1.2
└── Catégorie 2
```

---

### Customers

#### 📄 Fichier
`src/pages/Customers.jsx`

#### 🎯 Description
Gestion des clients (customer management).

#### 📚 Fonctionnalités
- Liste des clients
- Ajouter client
- Modifier infos client
- Supprimer client
- Voir commandes client
- Export clients

#### 💡 Informations affichées
- Email
- Prénom/Nom
- Adresse
- Téléphone
- Date d'inscription
- Groupe client

---

### Orders

#### 📄 Fichier
`src/pages/Orders.jsx`

#### 🎯 Description
Gestion des commandes (orders management).

#### 📚 Fonctionnalités
- Liste des commandes
- Voir détails commande
- Modifier statut
- Voir produits commandés
- Ajouter notes/commentaires
- Générer facture
- Contacter client

#### 📊 Colonnes affichées
- ID commande
- Client
- Date
- Montant
- Statut
- Actions

---

### Stock

#### 📄 Fichier
`src/pages/Stock.jsx`

#### 🎯 Description
Gestion du stock des produits.

#### 📚 Fonctionnalités
- Vue d'ensemble du stock
- Produits en rupture
- Faible stock (alerte)
- Ajouter stock
- Réduire stock
- Voir historique

#### ⚠️ Alertes
- Produits à 0 stock
- Produits < seuil d'alerte
- Produits à commander

---

### Import

#### 📄 Fichier
`src/pages/Import.jsx`

#### 🎯 Description
Page d'import de données CSV/XML.

#### 📚 Workflow
1. Sélectionner type d'import (Produits, Catégories, Clients, etc.)
2. Choisir fichier CSV/XML
3. Prévisualiser données
4. Valider
5. Importer
6. Voir résultats

#### 📋 Formats supportés
- CSV avec en-têtes
- Encodage UTF-8 ou Latin-1
- Séparateur virgule

#### 🔄 Exemple de structure
```javascript
function Import() {
  const [importType, setImportType] = useState('');
  const [file, setFile] = useState(null);
  const { importing, result, handleImport } = useImportHandler();
  
  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    await handleImport(selectedFile, importType);
  };
  
  return (
    <Layout>
      <h1>Importer des données</h1>
      <select onChange={(e) => setImportType(e.target.value)}>
        <option value="">Sélectionner type</option>
        <option value="Categories">Catégories</option>
        <option value="Products">Produits</option>
      </select>
      <FileInput onChange={handleFileSelect} />
      {importing && <div>Import en cours...</div>}
      {result && <ImportResult result={result} />}
    </Layout>
  );
}
```

---

### Export

#### 📄 Fichier
`src/pages/Export.jsx`

#### 🎯 Description
Page d'export de données.

#### 📚 Fonctionnalités
- Exporter produits (CSV/XML)
- Exporter catégories
- Exporter clients
- Exporter commandes
- Filtrer avant export
- Choisir colonnes

#### 📥 Formats de sortie
- CSV (excel compatible)
- XML (PrestaShop format)

---

### DeleteEntity

#### 📄 Fichier
`src/pages/DeleteEntity.jsx`

#### 🎯 Description
Interface générique de suppression d'entités.

#### 📚 Gère les types
- Catégories
- Produits
- Clients
- Commandes

#### 🔄 Workflow
1. Sélectionner type d'entité
2. Sélectionner l'entité à supprimer
3. Confirmation
4. Suppression effectuée

---

### ResetData

#### 📄 Fichier
`src/pages/ResetData.jsx`

#### 🎯 Description
⚠️ Réinitialise les données de la boutique.

#### ⚠️ DANGER
- Action irréversible
- Supprime TOUS les produits/catégories/clients
- Confirmation requise

#### 🔐 Sécurité
- Double confirmation nécessaire
- Sauvegarder avant d'utiliser

---

### AdminOrdersDashboard

#### 📄 Fichier
`src/pages/AdminOrdersDashboard.jsx`

#### 🎯 Description
Dashboard spécialisé pour les commandes.

#### 📊 Affichage
- Commandes par statut
- Statistiques CA
- Dernières commandes
- Clients VIP
- Produits les plus vendus

---

## 🛍️ Pages Front-office

### ProductsList

#### 📄 Fichier
`src/pages/frontoffice/ProductsList.jsx`

#### 🎯 Description
Page d'accueil client affichant tous les produits.

#### 📚 Fonctionnalités
- Grille/liste produits
- Filtres par catégorie
- Recherche
- Tri (prix, nom, date)
- Pagination

#### 🔄 Composants utilisés
- FrontHeader
- CategoryFilter
- ProductCard
- Pagination

#### 📖 Exemple
```javascript
function ProductsList() {
  const [category, setCategory] = useState(null);
  const { loading, data } = useFetchPrestashop('products');
  const filteredProducts = data?.filter(p => 
    !category || p.id_category === category
  );
  
  return (
    <FrontLayout>
      <CategoryFilter onChange={setCategory} />
      <div className="products-grid">
        {filteredProducts?.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </FrontLayout>
  );
}
```

---

### ProductDetail

#### 📄 Fichier
`src/pages/frontoffice/ProductDetail.jsx`

#### 🎯 Description
Page détail d'un produit unique.

#### 📚 Affichage
- Images (galerie)
- Description complète
- Prix
- Disponibilité stock
- Avis clients
- Produits similaires
- Formulaire ajout au panier

#### 🔄 Données affichées
```javascript
{
  id: 123,
  name: "Produit",
  price: 29.99,
  description: "...",
  images: [...],
  combinaisons: [
    { id: 456, name: "S-RED", price: 0 }
  ],
  stock: 10,
  reviews: [...]
}
```

#### 📖 Routing
```
/product/:id → ProductDetail
```

---

### CartPage

#### 📄 Fichier
`src/pages/frontoffice/CartPage.jsx`

#### 🎯 Description
Page du panier (shopping cart).

#### 📚 Fonctionnalités
- Liste articles du panier
- Modification quantités
- Suppression articles
- Coupon/code promo
- Résumé prix (sous-total, taxes, total)
- Bouton checkout
- Continuer shopping

#### 💾 Données du panier
```javascript
{
  cartItemId: "123_456",
  name: "Produit",
  quantity: 2,
  price: 29.99,
  subtotal: 59.98
}
```

#### 📖 Exemple
```javascript
function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  
  return (
    <FrontLayout>
      <h1>Mon panier</h1>
      <table>
        <tbody>
          {cart.map(item => (
            <tr key={item.cartItemId}>
              <td>{item.name}</td>
              <td>
                <input 
                  type="number" 
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.cartItemId, e.target.value)}
                />
              </td>
              <td>{item.price * item.quantity}€</td>
              <td>
                <button onClick={() => removeFromCart(item.cartItemId)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>Total: {cartTotal}€</div>
      <button>Valider commande</button>
    </FrontLayout>
  );
}
```

---

### OrderSummary

#### 📄 Fichier
`src/pages/frontoffice/OrderSummary.jsx`

#### 🎯 Description
Résumé de la commande avant validation.

#### 📚 Affichage
- Articles à commander
- Adresse livraison
- Adresse facturation
- Mode paiement
- Total estimé
- Conditions générales

#### 🔄 Actions
- Modifier panier
- Valider commande

---

### OrderSummaryPage

#### 📄 Fichier
`src/pages/frontoffice/OrderSummaryPage.jsx`

#### 🎯 Description
Page de résumé complet de la commande (après validation).

#### 📚 Affichage
- Numéro commande
- Date
- État de la commande
- Articles commandés
- Détails livraison
- Détails facturation
- Historique commande

---

### UserSelectionPage

#### 📄 Fichier
`src/pages/frontoffice/UserSelectionPage.jsx`

#### 🎯 Description
Page de sélection/création utilisateur au début du checkout.

#### 📚 Options
1. **Utilisateur existant** - Se connecter
2. **Nouvel utilisateur** - Créer un compte
3. **Commande sans compte** - Invité

#### 🔄 Workflow
```
UserSelectionPage
├── Login (utilisateur existant)
├── Register (créer compte)
└── Guest (sans compte)
    └── Continuer → CartPage
```

---

## 🎨 CSS et styles

### Structure des fichiers CSS
- Chaque page a son fichier CSS correspondant
- Nommage : `NomPage.css`
- Localisation : même dossier que la page

### Exemple
```css
/* Products.css */
.products-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

.product-item {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
}
```

---

## 🔄 Patterns courants

### Page avec chargement et erreur
```javascript
function MyPage() {
  const { loading, data, errors } = useFetchPrestashop('products');
  
  if (loading) return <Layout><div>Chargement...</div></Layout>;
  if (errors) return <Layout><div>Erreur: {errors.message}</div></Layout>;
  
  return (
    <Layout>
      {/* Contenu */}
    </Layout>
  );
}
```

### Page avec formulaire
```javascript
function AddPage() {
  const [formData, setFormData] = useState({});
  const { addResource, loading, error } = useAddResource('product');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addResource(formData);
      alert('Succès!');
      navigate('/products');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };
  
  return (
    <Layout>
      <form onSubmit={handleSubmit}>
        {/* Champs */}
        <button disabled={loading}>
          {loading ? 'Ajout en cours...' : 'Ajouter'}
        </button>
      </form>
    </Layout>
  );
}
```

### Page avec filtres
```javascript
function ListPage() {
  const [filters, setFilters] = useState({});
  const filteredData = data?.filter(item => {
    return Object.entries(filters).every(([key, value]) => 
      !value || item[key] === value
    );
  });
  
  return (
    <Layout>
      <FilterBar onFilter={setFilters} />
      <List data={filteredData} />
    </Layout>
  );
}
```

---

## 📍 Routes (Routing)

### Configuration (dans App.jsx)
```javascript
<Routes>
  {/* Admin */}
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
  <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
  
  {/* Front-office */}
  <Route path="/" element={<ProductsList />} />
  <Route path="/product/:id" element={<ProductDetail />} />
  <Route path="/cart" element={<CartPage />} />
  
  {/* Auth */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
</Routes>
```

---

## ⚡ Points d'attention

1. **Layout wrapper** : Chaque page admin doit être enveloppée par `<Layout />`
2. **ProtectedRoute** : Pages d'administration doivent être protégées
3. **Loading states** : Toujours afficher un feedback lors du chargement
4. **Error handling** : Afficher les erreurs de manière claire
5. **Contextes** : Utiliser `useAuth()` et `useCart()` quand nécessaire
6. **Navigation** : Utiliser React Router pour naviguer entre pages

---

**Fichiers sources** : `src/pages/`

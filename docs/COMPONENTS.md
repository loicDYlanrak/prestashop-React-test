# Composants

## 📍 Vue d'ensemble

Les composants sont divisés en deux catégories :
- **Admin Components** : Interface d'administration
- **Front-office Components** : Interface client

### 📋 Structure
```
src/components/
├── Admin components
│   ├── AddCategorie.jsx
│   ├── AddCustomer.jsx
│   ├── AddProduct.jsx
│   ├── DeleteCategorie.jsx
│   ├── DeleteCustomer.jsx
│   ├── Header.jsx
│   ├── Layout.jsx
│   ├── ListProduct.jsx
│   ├── ProtectedRoute.jsx
│   ├── SearchProduct.jsx
│   ├── Sidebar.jsx
│   └── *.css
└── frontoffice/
    ├── CategoryFilter.jsx
    ├── FileInput.jsx
    ├── FileSummary.jsx
    ├── FrontHeader.jsx
    ├── FrontLayout.jsx
    ├── ImportResult.jsx
    ├── InstructionsPanel.jsx
    ├── LoginModal.jsx
    ├── ProductCard.jsx
    ├── UserSelectionModal.jsx
    └── *.css
```

---

## 👥 Composants Admin

### ProtectedRoute

#### 📄 Fichier
`src/components/ProtectedRoute.jsx`

#### 🎯 Description
Contrôle l'accès aux routes qui nécessitent une authentification.

#### 📚 API
```javascript
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

#### 🔄 Comportement
- ✅ Si authentifié : affiche le contenu
- ❌ Si non authentifié : redirige vers `/login`

#### 📖 Exemple d'utilisation
```javascript
import ProtectedRoute from './ProtectedRoute';
import Dashboard from '../pages/Dashboard';

<BrowserRouter>
  <Routes>
    <Route element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  </Routes>
</BrowserRouter>
```

---

### Layout

#### 📄 Fichier
`src/components/Layout.jsx`

#### 🎯 Description
Layout principal de l'interface d'administration.

#### 📚 Composants enfants
- `<Header />` : En-tête
- `<Sidebar />` : Menu latéral
- Routes de contenu

#### 🎨 Structure
```
┌─────────────────────────────┐
│      Header                 │
├─────────┬───────────────────┤
│         │                   │
│ Sidebar │   Contenu Page    │
│         │                   │
└─────────┴───────────────────┘
```

---

### Header

#### 📄 Fichier
`src/components/Header.jsx`

#### 🎯 Description
En-tête de l'interface admin avec logo et info utilisateur.

#### 📚 Fonctionnalités
- Logo/titre application
- Info utilisateur connecté
- Bouton déconnexion

#### 📖 Exemple
```javascript
import Header from './Header';

<Header />
// Affiche : App Logo + Utilisateur connecté + Logout
```

---

### Sidebar

#### 📄 Fichier
`src/components/Sidebar.jsx`

#### 🎯 Description
Menu de navigation latéral de l'interface admin.

#### 📚 Menus disponibles
- Dashboard
- Produits
- Catégories
- Clients
- Commandes
- Stock
- Import/Export
- Réinitialiser données

#### 📖 Exemple
```javascript
import Sidebar from './Sidebar';

<Sidebar />
```

---

### ListProduct

#### 📄 Fichier
`src/components/ListProduct.jsx`

#### 🎯 Description
Affiche la liste des produits avec options de gestion.

#### 📚 Fonctionnalités
- Liste tous les produits
- Recherche et filtrage
- Actions : Modifier, Supprimer
- Pagination (si applicable)

#### 💡 Props
```typescript
interface ListProductProps {
  // Aucune prop requise
}
```

#### 📖 Exemple
```javascript
import { ListProduct } from './ListProduct';

<ListProduct />
```

---

### SearchProduct

#### 📄 Fichier
`src/components/SearchProduct.jsx`

#### 🎯 Description
Formulaire de recherche avancée de produits.

#### 📚 Fonctionnalités
- Recherche par référence
- Recherche par nom
- Recherche par catégorie
- Affichage des résultats

#### 💡 Props
```typescript
interface SearchProductProps {
  // Aucune prop requise
}
```

---

### AddProduct

#### 📄 Fichier
`src/components/AddProduct.jsx`

#### 🎯 Description
Formulaire d'ajout d'un nouveau produit.

#### 📚 Champs du formulaire
- Nom du produit
- Référence (SKU)
- Prix TTC
- Catégorie
- Description
- Image(s)
- Combinaisons (variantes)

#### 📖 Exemple
```javascript
import { AddProduct } from './AddProduct';

<AddProduct />
```

#### 🔄 Flux
1. Remplissage du formulaire
2. Validation des données
3. Appel API POST
4. Confirmation/Erreur

---

### AddCategorie

#### 📄 Fichier
`src/components/AddCategorie.jsx`

#### 🎯 Description
Formulaire d'ajout d'une nouvelle catégorie.

#### 📚 Champs
- Nom de la catégorie
- Catégorie parent
- Description
- Image

#### 📖 Exemple
```javascript
import { AddCategorie } from './AddCategorie';

<AddCategorie />
```

---

### DeleteCategorie

#### 📄 Fichier
`src/components/DeleteCategorie.jsx`

#### 🎯 Description
Interface de suppression de catégories.

#### 📚 Fonctionnalités
- Liste les catégories
- Sélection de catégorie à supprimer
- Confirmation avant suppression
- Feedback d'erreur

#### 📖 Exemple
```javascript
import { DeleteCategorie } from './DeleteCategorie';

<DeleteCategorie />
```

---

### AddCustomer

#### 📄 Fichier
`src/components/AddCustomer.jsx`

#### 🎯 Description
Formulaire d'ajout d'un client.

#### 📚 Champs
- Prénom
- Nom
- Email
- Adresse
- Téléphone
- Groupe client

#### 📖 Exemple
```javascript
import { AddCustomer } from './AddCustomer';

<AddCustomer />
```

---

### DeleteCustomer

#### 📄 Fichier
`src/components/DeleteCustomer.jsx`

#### 🎯 Description
Interface de suppression de clients.

#### 📚 Fonctionnalités
- Recherche de client
- Sélection pour suppression
- Confirmation
- Feedback

#### 📖 Exemple
```javascript
import { DeleteCustomer } from './DeleteCustomer';

<DeleteCustomer />
```

---

## 🛒 Composants Front-office

### FrontLayout

#### 📄 Fichier
`src/components/frontoffice/FrontLayout.jsx`

#### 🎯 Description
Layout principal du front-office client.

#### 📚 Structure
- En-tête client (FrontHeader)
- Contenu principal
- Panier (affichage résumé)

#### 📖 Exemple
```javascript
import FrontLayout from './frontoffice/FrontLayout';

<FrontLayout>
  <ProductsList />
</FrontLayout>
```

---

### FrontHeader

#### 📄 Fichier
`src/components/frontoffice/FrontHeader.jsx`

#### 🎯 Description
En-tête du front-office avec navigation et info panier.

#### 📚 Fonctionnalités
- Logo
- Recherche rapide
- Icon panier avec nombre d'articles
- Lien déconnexion
- Navigation rapide

#### 📖 Exemple
```javascript
import FrontHeader from './frontoffice/FrontHeader';

<FrontHeader />
```

---

### ProductCard

#### 📄 Fichier
`src/components/frontoffice/ProductCard.jsx`

#### 🎯 Description
Affichage d'une carte produit dans la liste ou grille.

#### 💡 Props
```typescript
interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: number;
    image?: string;
    combinaisons?: Array;
  };
  onAddToCart?: (product: any) => void;
}
```

#### 📖 Exemple
```javascript
import ProductCard from './frontoffice/ProductCard';

<ProductCard 
  product={product}
  onAddToCart={handleAddToCart}
/>
```

#### 🎨 Affichage
- Image du produit
- Nom
- Prix
- Bouton "Ajouter au panier"
- Lien détails

---

### CategoryFilter

#### 📄 Fichier
`src/components/frontoffice/CategoryFilter.jsx`

#### 🎯 Description
Filtres de catégories pour la liste produits.

#### 📚 Fonctionnalités
- Liste des catégories
- Sélection multiple (checkbox)
- Applique les filtres

#### 💡 Props
```typescript
interface CategoryFilterProps {
  categories: Array;
  selectedCategories: Array;
  onChange: (categories: Array) => void;
}
```

#### 📖 Exemple
```javascript
import CategoryFilter from './frontoffice/CategoryFilter';

<CategoryFilter 
  categories={categories}
  selectedCategories={selected}
  onChange={handleFilterChange}
/>
```

---

### LoginModal

#### 📄 Fichier
`src/components/frontoffice/LoginModal.jsx`

#### 🎯 Description
Modal de connexion/inscription client.

#### 📚 Fonctionnalités
- Onglet Connexion
- Onglet Inscription
- Validation formulaire
- Gestion erreurs

#### 💡 Props
```typescript
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}
```

#### 📖 Exemple
```javascript
import LoginModal from './frontoffice/LoginModal';

const [isOpen, setIsOpen] = useState(false);

<>
  <button onClick={() => setIsOpen(true)}>Se connecter</button>
  <LoginModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
</>
```

---

### UserSelectionModal

#### 📄 Fichier
`src/components/frontoffice/UserSelectionModal.jsx`

#### 🎯 Description
Modal pour sélectionner/créer un utilisateur lors du checkout.

#### 📚 Fonctionnalités
- Sélection utilisateur existant
- Formulaire création compte
- Validation
- Confirmation

#### 💡 Props
```typescript
interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelected: (user: any) => void;
}
```

---

### ProductsList

#### 📄 Fichier (dans components/frontoffice/)
`src/components/frontoffice/ProductsList.jsx`

#### 🎯 Description
Affichage grille/liste des produits avec filtres.

#### 📚 Composants enfants
- CategoryFilter
- ProductCard (répétés)

#### 🔄 Flux
1. Chargement produits
2. Affichage liste
3. Filtrage par catégorie
4. Clic sur produit → Détails

#### 📖 Exemple
```javascript
<ProductsList />
```

---

### FileInput

#### 📄 Fichier
`src/components/frontoffice/FileInput.jsx`

#### 🎯 Description
Composant pour sélectionner un fichier d'import (CSV/XML).

#### 💡 Props
```typescript
interface FileInputProps {
  accept?: string;
  onChange: (file: File) => void;
  disabled?: boolean;
}
```

#### 📖 Exemple
```javascript
<FileInput 
  accept=".csv,.xml"
  onChange={handleFileSelect}
/>
```

---

### FileSummary

#### 📄 Fichier
`src/components/frontoffice/FileSummary.jsx`

#### 🎯 Description
Affichage résumé du fichier sélectionné.

#### 💡 Props
```typescript
interface FileSummaryProps {
  file?: File;
  onRemove: () => void;
}
```

---

### InstructionsPanel

#### 📄 Fichier
`src/components/frontoffice/InstructionsPanel.jsx`

#### 🎯 Description
Panneau d'instructions pour l'import de données.

#### 📚 Affiche
- Format attendu du fichier
- Colonnes requises
- Exemples

---

### ImportResult

#### 📄 Fichier
`src/components/frontoffice/ImportResult.jsx`

#### 🎯 Description
Affichage des résultats d'import.

#### 💡 Props
```typescript
interface ImportResultProps {
  result: {
    success: boolean;
    rows: number;
    errors: number;
    errorMessage?: string;
    details?: any;
  };
  onClose: () => void;
}
```

#### 📊 Affichage
- Nombre de lignes traitées
- Nombre d'erreurs
- Détail des erreurs
- Message de statut

---

## 🎨 Styles CSS

### Structure
```
src/components/
├── Header.css
├── Layout.css
├── Sidebar.css
└── frontoffice/
    ├── CategoryFilter.css
    ├── FrontHeader.css
    ├── FrontLayout.css
    ├── LoginModal.css
    ├── ProductCard.css
    └── UserSelectionModal.css
```

### Nommage
- Les CSS sont situés côté à côté avec les composants
- Même nom de fichier (ProductCard.jsx / ProductCard.css)

---

## 🔄 Patterns courants

### Formulaire avec validation
```javascript
function AddProductForm() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Submit
    try {
      await addResource('product', formData);
      alert('Succès!');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Champs */}
    </form>
  );
}
```

### Composant avec loading
```javascript
function ProductsList() {
  const { loading, data, errors } = useFetchPrestashop('products');
  
  if (loading) return <div>Chargement...</div>;
  if (errors) return <div>Erreur: {errors.message}</div>;
  
  return (
    <ul>
      {data?.map(p => <ProductCard key={p.id} product={p} />)}
    </ul>
  );
}
```

### Modal contrôlée
```javascript
function MyModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Titre</h2>
        {/* Contenu */}
        <button onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}
```

---

## ⚡ Points d'attention

1. **Props validation** : Ajouter PropTypes pour valider les props
2. **Event handling** : Toujours utiliser `onClick`, `onChange`, etc.
3. **Optimisation** : Utiliser React.memo pour les composants purs
4. **Accessibility** : Utiliser des labels et ARIA attributes
5. **Erreurs** : Toujours afficher un feedback utilisateur

---

**Fichiers sources** : `src/components/`

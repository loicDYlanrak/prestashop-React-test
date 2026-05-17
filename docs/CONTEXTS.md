# Contextes - Gestion d'état global

## 📍 Vue d'ensemble

Les contextes gèrent l'état global de l'application. Deux contextes principaux :
1. **AuthContext** : Authentification et informations utilisateur
2. **CartContext** : Gestion du panier client

---

## 🔐 AuthContext

### 📄 Fichier
`src/context/AuthContext.jsx`

### 🎯 Responsabilités
- Gérer l'authentification des utilisateurs
- Persister les données utilisateur en localStorage
- Fournir les méthodes de login/logout/register

### 💾 État
```javascript
{
  user: {
    email: "user@example.com",
    name: "username"
  }
}
```

### 📚 API du contexte

#### `useAuth()` Hook
```javascript
const { user, login, register, logout } = useAuth();
```

**Retour :**
| Propriété | Type | Description |
|-----------|------|-------------|
| `user` | Object\|null | Utilisateur courant ou null |
| `login` | Function | Connecter un utilisateur |
| `register` | Function | Créer un nouveau compte |
| `logout` | Function | Déconnecter l'utilisateur |

### 🔧 Méthodes

#### `login(email, password)`
Connecte un utilisateur

**Paramètres :**
- `email` (string) : Email de l'utilisateur
- `password` (string) : Mot de passe

**Retour :** boolean (true si succès)

**Exemple :**
```javascript
const { login } = useAuth();

const handleLogin = async () => {
  const success = login("user@example.com", "password123");
  if (success) {
    // Rediriger vers dashboard
    navigate("/dashboard");
  }
};
```

**⚠️ Note :** Le mot de passe n'est pas stocké, seul l'email et le nom sont conservés en localStorage.

#### `register(name, email, password)`
Crée un nouveau compte utilisateur

**Paramètres :**
- `name` (string) : Nom de l'utilisateur
- `email` (string) : Email
- `password` (string) : Mot de passe

**Retour :** boolean (true si succès)

**Exemple :**
```javascript
const { register } = useAuth();

const handleRegister = () => {
  const success = register("John Doe", "john@example.com", "secure123");
  if (success) {
    navigate("/login");
  }
};
```

#### `logout()`
Déconnecte l'utilisateur courant

**Retour :** void

**Exemple :**
```javascript
const { logout } = useAuth();

const handleLogout = () => {
  logout();
  navigate("/login");
};
```

### 💾 Persistance
- **localStorage key** : `ps_user`
- **Format** : JSON
- **Chargement automatique** : Au montage du Provider

```javascript
const [user, setUser] = useState(() => {
  const saved = localStorage.getItem('ps_user')
  return saved ? JSON.parse(saved) : null
})
```

### 🔒 Sécurité
⚠️ **À AMÉLIORER** :
- Les credentials ne doivent pas être stockés en localStorage
- Implémenter une validation serveur
- Ajouter un système de tokens JWT

---

## 🛒 CartContext

### 📄 Fichier
`src/context/CartContext.jsx`

### 🎯 Responsabilités
- Gérer le panier des produits
- Persister le panier en localStorage
- Calculer le total du panier
- Gérer les variations de produits (combinaisons)

### 💾 État
```javascript
{
  cart: [
    {
      id: 123,
      cartItemId: "123_456",
      name: "Produit",
      price: 29.99,
      specificPrice: null,
      quantity: 2,
      selectedCombination: { id: 456, reference: "COMB1", price: 5.00 },
      combinationId: 456,
      combinationReference: "COMB1",
      combinationPrice: 5.00
    }
  ],
  cartTotal: 64.98
}
```

### 📚 API du contexte

#### `useCart()` Hook
```javascript
const { 
  cart, 
  cartTotal, 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart 
} = useCart();
```

**Retour :**
| Propriété | Type | Description |
|-----------|------|-------------|
| `cart` | Array | Articles du panier |
| `cartTotal` | Number | Total du panier |
| `addToCart` | Function | Ajouter un article |
| `removeFromCart` | Function | Supprimer un article |
| `updateQuantity` | Function | Modifier la quantité |
| `clearCart` | Function | Vider le panier |

### 🔧 Méthodes

#### `addToCart(product, quantity, selectedCombination)`
Ajoute un produit au panier

**Paramètres :**
- `product` (Object) : Produit avec au minimum `id`, `name`, `price`
- `quantity` (number, optional) : Quantité (défaut: 1)
- `selectedCombination` (Object, optional) : Variante du produit

**Exemple :**
```javascript
const { addToCart } = useCart();

const handleAddToCart = (product, quantity = 1) => {
  const combination = { 
    id: 456, 
    reference: "COMB1", 
    price: 5.00 
  };
  
  addToCart(product, quantity, combination);
};
```

**Comportement :**
- Si le produit existe déjà, augmente la quantité
- Les combinaisons crées un ID unique (`{productId}_{combinationId}`)
- Sauvegarde automatiquement en localStorage

#### `removeFromCart(cartItemId)`
Retire un article du panier

**Paramètres :**
- `cartItemId` (string) : ID unique de l'article

**Exemple :**
```javascript
const { removeFromCart } = useCart();

const handleRemove = (cartItemId) => {
  removeFromCart(cartItemId);
};
```

#### `updateQuantity(cartItemId, quantity)`
Modifie la quantité d'un article

**Paramètres :**
- `cartItemId` (string) : ID unique de l'article
- `quantity` (number) : Nouvelle quantité

**Comportement :**
- Si `quantity <= 0`, supprime l'article
- Recalcule automatiquement le total

**Exemple :**
```javascript
const { updateQuantity } = useCart();

const handleQuantityChange = (cartItemId, newQuantity) => {
  updateQuantity(cartItemId, newQuantity);
};
```

#### `clearCart()`
Vide complètement le panier

**Retour :** void

**Exemple :**
```javascript
const { clearCart } = useCart();

const handleClearCart = () => {
  clearCart();
};
```

### 💾 Persistance
- **localStorage key** : `cart`
- **Format** : JSON
- **Chargement** : Au premier montage du Provider
- **Sauvegarde** : Automatique à chaque changement

```javascript
useEffect(() => {
  localStorage.setItem("cart", JSON.stringify(cart));
  
  // Calcul du total
  const total = cart.reduce((sum, item) => {
    const price = item.specificPrice || item.price;
    return sum + price * item.quantity;
  }, 0);
  setCartTotal(total);
}, [cart]);
```

### 📊 Calcul du total
```javascript
total = Σ(price_item × quantity_item)

// Utilise specificPrice si disponible, sinon price
price = item.specificPrice || item.price
```

### 🔄 Gestion des combinaisons (Variantes)
Les produits peuvent avoir des combinaisons (ex: taille, couleur)

**Structure d'une combinaison :**
```javascript
{
  id: 456,           // ID de la combinaison
  reference: "S-RED", // Code de la variante
  price: 5.00        // Prix supplémentaire
}
```

**Stockage du panier :**
```javascript
{
  cartItemId: "123_456",      // {productId}_{combinationId}
  combinationId: 456,
  combinationReference: "S-RED",
  combinationPrice: 5.00,
  selectedCombination: { ... }
}
```

---

## 🚀 Utilisation dans les composants

### Exemple complet
```javascript
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function ProductDetail() {
  const { user } = useAuth();
  const { addToCart, cart, cartTotal } = useCart();
  
  if (!user) {
    return <div>Veuillez vous connecter</div>;
  }
  
  const handleAddToCart = (product) => {
    addToCart(product, 1);
    alert('Produit ajouté!');
  };
  
  return (
    <div>
      <h2>Votre panier ({cart.length} articles)</h2>
      <p>Total: {cartTotal.toFixed(2)}€</p>
      <button onClick={() => handleAddToCart(product)}>
        Ajouter au panier
      </button>
    </div>
  );
}
```

---

## ⚡ Points d'attention

### AuthContext
1. **Pas de validation serveur** - À implémenter
2. **Pas de sécurité de token** - Utiliser JWT
3. **Pas de refresh token** - Ajouter expiration
4. **localStorage en clair** - Considérer le chiffrement

### CartContext
1. **Les prix sont fixes** - Pas de synchronisation en temps réel avec PrestaShop
2. **Pas de vérification de stock** - À valider lors de la commande
3. **Les combinaisons doivent être valides** - À vérifier côté serveur
4. **Pas de synchro multi-onglet** - localStorage ne met à jour qu'un onglet

---

## 🔄 Intégration avec d'autres modules

### AuthContext + Pages protégées
```javascript
// ProtectedRoute.jsx
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}
```

### CartContext + API PrestaShop
```javascript
// Dans la page de checkout
const { cart } = useCart();

const createOrder = async () => {
  // Créer une commande PrestaShop avec les items du panier
  const response = await addResource('order', {
    products: cart,
    ...
  });
};
```

---

**Fichier source** : [`src/context/AuthContext.jsx`](../src/context/AuthContext.jsx), [`src/context/CartContext.jsx`](../src/context/CartContext.jsx)

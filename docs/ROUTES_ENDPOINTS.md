# Routes et Endpoints

## 📍 Vue d'ensemble

Ce document liste toutes les routes disponibles dans l'application et les endpoints PrestaShop utilisés.

---

## 🗺️ Routes Frontend (React Router)

### Routes Publiques

```
GET  /login              → Login.jsx (Connexion admin)
GET  /register           → Register.jsx (Inscription)
GET  /                   → ProductsList.jsx (Accueil client)
```

### Routes Protégées (Admin)

Toutes les routes commençant par `/admin/` ou `/dashboard` nécessitent une authentification.

```
GET  /dashboard                    → Dashboard.jsx (Accueil admin)
GET  /products                     → Products.jsx (Gestion produits)
GET  /categories                   → Categories.jsx (Gestion catégories)
GET  /customers                    → Customers.jsx (Gestion clients)
GET  /orders                       → Orders.jsx (Gestion commandes)
GET  /stock                        → Stock.jsx (Gestion stock)
GET  /import                       → Import.jsx (Import données)
GET  /export                       → Export.jsx (Export données)
GET  /delete                       → DeleteEntity.jsx (Suppression)
GET  /reset-data                   → ResetData.jsx (Réinitialiser)
GET  /admin-orders                 → AdminOrdersDashboard.jsx (Dashboard commandes)
```

### Routes Front-office (Client)

```
GET  /                             → ProductsList.jsx (Liste produits)
GET  /product/:id                  → ProductDetail.jsx (Détail produit)
GET  /user-selection               → UserSelectionPage.jsx (Sélection utilisateur)
GET  /cart                         → CartPage.jsx (Panier)
GET  /order-summary                → OrderSummary.jsx (Résumé commande)
GET  /order-summary-page/:id       → OrderSummaryPage.jsx (Résumé détaillé)
```

### Redirection des routes
```
/login (non-authentifié) → redirige vers /login
/* (non-authentifié, admin) → redirige vers /login
```

---

## 🌐 Endpoints API PrestaShop

### Configuration
```
Base URL: http://localhost/prestashop2/api
Clé API: 2LA1668U53GC9T35AIT5Y3P7E8CKG7LL
Format: XML
Authentification: Query parameter ws_key
```

### Format des requêtes

#### GET (Récupération)
```
GET /api/products?ws_key=KEY&display=id,name&filter[reference]=[SKU123]&limit=10&page=1
```

#### POST/PUT (Création/Modification)
```
Content-Type: application/xml
Body: XML avec données
```

#### DELETE (Suppression)
```
DELETE /api/products/123?ws_key=KEY
```

---

## 📋 Endpoints utilisés

### 🏷️ Produits

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/products` | Lister tous les produits |
| GET | `/products/{id}` | Récupérer un produit |
| POST | `/products` | Créer un produit |
| PUT | `/products/{id}` | Modifier un produit |
| DELETE | `/products/{id}` | Supprimer un produit |
| GET | `/products/{id}/combinations` | Combinaisons du produit |
| POST | `/products/{id}/images` | Ajouter image |
| DELETE | `/products/{id}/images/{image_id}` | Supprimer image |

**Exemple requête GET :**
```bash
GET /api/products?ws_key=2LA1668U53GC9T35AIT5Y3P7E8CKG7LL&display=id,name,reference,price
```

**Exemple réponse :**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <product>
    <id>123</id>
    <name><language id="1"><![CDATA[Produit]]></language></name>
    <reference><![CDATA[SKU001]]></reference>
    <price><![CDATA[29.99]]></price>
  </product>
</prestashop>
```

---

### 📂 Catégories

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/categories` | Lister catégories |
| GET | `/categories/{id}` | Récupérer catégorie |
| POST | `/categories` | Créer catégorie |
| PUT | `/categories/{id}` | Modifier catégorie |
| DELETE | `/categories/{id}` | Supprimer catégorie |

**Exemple POST :**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <category>
    <id_parent><![CDATA[2]]></id_parent>
    <active><![CDATA[1]]></active>
    <name>
      <language id="1"><![CDATA[Électronique]]></language>
    </name>
    <description>
      <language id="1"><![CDATA[Produits électroniques]]></language>
    </description>
  </category>
</prestashop>
```

---

### 👥 Clients

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/customers` | Lister clients |
| GET | `/customers/{id}` | Récupérer client |
| POST | `/customers` | Créer client |
| PUT | `/customers/{id}` | Modifier client |
| DELETE | `/customers/{id}` | Supprimer client |

---

### 📦 Commandes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/orders` | Lister commandes |
| GET | `/orders/{id}` | Récupérer commande |
| POST | `/orders` | Créer commande |
| PUT | `/orders/{id}` | Modifier commande |
| DELETE | `/orders/{id}` | Supprimer commande |

---

### 📊 Stock

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/stock_availables` | État du stock |
| GET | `/stock_availables/{id}` | Stock produit |
| PUT | `/stock_availables/{id}` | Modifier stock |

---

### 💰 Impôts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/taxes` | Lister taxes |
| GET | `/taxes/{id}` | Récupérer taxe |
| POST | `/taxes` | Créer taxe |

---

### 🏭 Fabricants

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/manufacturers` | Lister fabricants |
| GET | `/manufacturers/{id}` | Récupérer fabricant |
| POST | `/manufacturers` | Créer fabricant |

---

### 🚚 Fournisseurs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/suppliers` | Lister fournisseurs |
| GET | `/suppliers/{id}` | Récupérer fournisseur |
| POST | `/suppliers` | Créer fournisseur |

---

### 🎯 Adresses

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/addresses` | Lister adresses |
| GET | `/addresses/{id}` | Récupérer adresse |
| POST | `/addresses` | Créer adresse |

---

### 🛒 Panier (Carts)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/carts` | Lister paniers |
| GET | `/carts/{id}` | Récupérer panier |
| POST | `/carts` | Créer panier |

---

## 📈 Filtres et paramètres courants

### Filtrage
```
?filter[reference]=[SKU123]      # Filtrer par référence
?filter[name]=[Laptop]            # Filtrer par nom
?filter[active]=[1]               # Filtrer par statut actif
?filter[id_category]=[5]          # Filtrer par catégorie
```

### Affichage (display)
```
?display=id,name,price            # Afficher colonnes spécifiques
?display=full                      # Afficher tout
```

### Pagination
```
?limit=10&page=1                  # 10 éléments, page 1
?limit=50                         # 50 éléments par défaut
```

### Tri
```
?sort=[name]_ASC                  # Trier par nom (ascendant)
?sort=[price]_DESC                # Trier par prix (descendant)
```

---

## 🔄 Flux de requêtes courants

### Création produit complet
```javascript
// 1. Créer catégorie si nécessaire
POST /api/categories?ws_key=KEY
  { categorie_data }

// 2. Créer produit
POST /api/products?ws_key=KEY
  { product_data }

// 3. Ajouter image (optionnel)
POST /api/products/{product_id}/images?ws_key=KEY
  { form-data }

// 4. Ajouter combinaisons (optionnel)
POST /api/combinations?ws_key=KEY
  { combination_data }

// 5. Mettre à jour le stock
PUT /api/stock_availables/{stock_id}?ws_key=KEY
  { stock_data }
```

### Import de données
```javascript
// 1. Parser le fichier CSV
parseFile1Products(csvContent)

// 2. Boucler sur chaque produit
for (const product of products) {
  // 3. Créer catégorie si nécessaire
  // 4. Créer produit
  // 5. Ajouter combinaisons
}

// 6. Retourner les résultats
{ success: [...], errors: [...] }
```

---

## ⚠️ Gestion des erreurs API

### Codes HTTP courants
| Code | Signification | Action |
|------|---------------|--------|
| 200 | OK | Succès |
| 201 | Created | Création réussie |
| 400 | Bad Request | Données invalides, vérifier le format |
| 401 | Unauthorized | Clé API invalide |
| 403 | Forbidden | Accès refusé |
| 404 | Not Found | Ressource inexistante |
| 500 | Server Error | Erreur serveur PrestaShop |

### Exemple de gestion d'erreur
```javascript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  return await response.json();
} catch (error) {
  console.error('Erreur API:', error.message);
  throw error;
}
```

---

## 🔐 Sécurité des endpoints

### Points critiques
1. **Clé API** : À mettre en variable d'environnement
2. **CORS** : Vérifier que PrestaShop accepte l'origine
3. **HTTPS** : Utiliser en production
4. **Validation** : Valider tous les inputs côté client et serveur

### Exemple requête sécurisée
```javascript
const apiKey = import.meta.env.VITE_API_KEY;
const baseUrl = import.meta.env.VITE_API_BASE_URL;

const response = await fetch(`${baseUrl}/products?ws_key=${apiKey}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/xml',
    'Accept': 'application/xml'
  }
});
```

---

## 📚 Ressources

### PrestaShop WebService Documentation
- [Webservice API](https://devdocs.prestashop.com/1.7/development/webservice/)
- [Structure XML](https://devdocs.prestashop.com/1.7/development/webservice/tutorials/creating-resources/)
- [Filtrage et paramètres](https://devdocs.prestashop.com/1.7/development/webservice/tutorials/advanced-parameters/)

### Outils de test
- **Postman** : Tester les requêtes API
- **curl** : Ligne de commande
- **Insomnia** : Interface graphique
- **VS Code REST Client** : Plugin

### Exemple curl
```bash
# GET
curl "http://localhost/prestashop2/api/products?ws_key=2LA1668U53GC9T35AIT5Y3P7E8CKG7LL"

# POST
curl -X POST "http://localhost/prestashop2/api/products?ws_key=2LA1668U53GC9T35AIT5Y3P7E8CKG7LL" \
  -H "Content-Type: application/xml" \
  -d @product.xml
```

---

**Dernière mise à jour** : Mai 2024

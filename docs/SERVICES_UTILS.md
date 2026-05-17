# Services et Utilitaires

## 📍 Vue d'ensemble

Ce dossier contient les services API et utilitaires pour transformer et importer les données.

### 📋 Structure
```
src/
├── services/
│   └── api.jsx                 # Configuration API générique
└── utils/
    ├── csvParser.js             # Parser CSV
    ├── ParserXml.js             # Parser XML PrestaShop
    ├── BuilderXml.js            # Constructeur XML
    ├── dataImporter.js          # Logique d'import complet
    └── categoryImporter.js      # Import catégories
```

---

## 🌐 Services

### api.jsx

#### 📄 Fichier
`src/services/api.jsx`

#### 🎯 Description
Service API générique avec support des timeouts et intercepteurs.

#### ⚙️ Configuration
```javascript
const defaultConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || "5000"),
  headers: {
    "Content-Type": "application/json",
  },
};
```

#### 📚 API

##### `fetchWithTimeout(url, options)`
Fait une requête fetch avec timeout

```javascript
const response = await fetchWithTimeout(url, {
  timeout: 5000,
  method: 'GET'
});
```

**Paramètres :**
- `url` : URL complète ou relative
- `options.timeout` : Timeout en ms (défaut: 5000)

**Lance une erreur si :**
- Timeout dépassé : `Error: Request timeout after 5000ms`
- Erreur réseau

##### `createApi(config)`
Crée une instance API avec intercepteurs

```javascript
const api = createApi({
  baseURL: 'http://localhost/api',
  timeout: 10000
});
```

**Méthodes de l'API :**

###### `api.get(url, options)`
Requête GET
```javascript
const response = await api.get('/products', {
  headers: { 'Authorization': 'Bearer token' }
});
const data = await response.json();
```

###### `api.post(url, data, options)`
Requête POST
```javascript
const response = await api.post('/products', {
  name: 'Produit',
  price: 29.99
});
```

###### `api.put(url, data, options)`
Requête PUT
```javascript
const response = await api.put('/products/123', {
  name: 'Nouveau nom'
});
```

###### `api.delete(url, options)`
Requête DELETE
```javascript
const response = await api.delete('/products/123');
```

#### 🔄 Intercepteurs

**Intercepteur de requête :**
```javascript
const requestInterceptor = (url, options) => {
  console.log("Requête envoyée:", options.method || "GET", url);
  return { url, options };
};
```

**Intercepteur de réponse :**
```javascript
const responseInterceptor = async (response) => {
  return response;
};
```

**Intercepteur d'erreur :**
```javascript
const errorInterceptor = (error) => {
  console.error("Erreur API:", error.message);
  throw error;
};
```

---

## 🛠️ Utilitaires

### csvParser.js

#### 📄 Fichier
`src/utils/csvParser.js`

#### 🎯 Description
Parse et valide les fichiers CSV pour l'import de produits, catégories, etc.

#### 📚 API

##### `parseCSVGeneric(csvText)`
Parse générique de CSV

```javascript
const { headers, data, lines, rawData } = parseCSVGeneric(csvText);
```

**Paramètres :**
- `csvText` (string) : Contenu du fichier CSV

**Retour :**
```javascript
{
  headers: ['date_availability_produit', 'nom', 'reference', ...],
  data: [{ nom: 'Produit', reference: 'SKU001', ... }, ...],
  lines: [...],
  rawData: [{ rowData: {...}, lineNumber: 2 }, ...]
}
```

##### `parseFile1Products(csvText)`
Parse les produits du fichier 1

**Format CSV attendu :**
```
date_availability_produit,nom,reference,prix_ttc,Taxe,categorie,prix_achat
01/01/2024,Produit 1,SKU001,29.99,20,Électronique,15.00
```

**Colonnes requises :**
- `date_availability_produit` : Format DD/MM/YYYY
- `nom` : Nom du produit
- `reference` : Code unique
- `prix_ttc` : Prix TTC
- `Taxe` : Taux de taxe
- `categorie` : Catégorie
- `prix_achat` : Prix d'achat

**Validations :**
- Format de date DD/MM/YYYY
- Prix >= 0
- Colonnes manquantes détectées
- Numéro de ligne indiqué en cas d'erreur

**Exemple :**
```javascript
try {
  const { headers, data, rawData } = parseFile1Products(csvContent);
  console.log(`${data.length} produits chargés`);
} catch (error) {
  console.error('Erreur parsing:', error.message);
  // Ex: "Ligne 5 (colonne prix_ttc) - Le prix ne peut pas être négatif"
}
```

##### Fonctions utilitaires
```javascript
parseFrenchNumber(value)   // Convertit "1,50" en 1.5
formatPrice(value)          // Formate un prix en nombre
```

#### 📊 Structure des données retournées
```javascript
{
  headers: ['nom', 'reference', 'prix_ttc', ...],
  data: [
    {
      nom: 'Produit 1',
      reference: 'SKU001',
      prix_ttc: '29.99',
      ...
    },
    ...
  ],
  rawData: [
    { 
      rowData: {...}, 
      lineNumber: 2
    },
    ...
  ]
}
```

---

### ParserXml.js

#### 📄 Fichier
`src/utils/ParserXml.js`

#### 🎯 Description
Parse les réponses XML de PrestaShop en objets JavaScript.

#### 📚 API

##### `parsePrestashopXML(xmlData)`
Parse l'XML PrestaShop

```javascript
const parsed = await parsePrestashopXML(xmlResponse);
```

**Paramètres :**
- `xmlData` : Response objet, string XML, ou objet JavaScript

**Retour :**
Objet JavaScript avec structure PrestaShop
```javascript
{
  prestashop: {
    product: [
      {
        id: { '#cdata': '123' },
        name: { language: { '@_id': '1', '#cdata': 'Nom' } },
        ...
      }
    ]
  }
}
```

#### ⚙️ Configuration du parser
```javascript
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "#cdata",
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  removeNSPrefix: true,
  numberParseOptions: {
    leadingZeros: false,
    hex: true,
  },
});
```

#### 📖 Exemple
```javascript
import { parsePrestashopXML } from '../utils/ParserXml';

const response = await fetch('http://api/products');
const parsed = await parsePrestashopXML(response);
console.log(parsed.prestashop.product);
```

---

### BuilderXml.js

#### 📄 Fichier
`src/utils/BuilderXml.js`

#### 🎯 Description
Construit des requêtes XML pour envoyer à PrestaShop.

#### 📚 API

##### `convertToPrestashopXML(data, rootTag, useLanguageWrapper, languageId, fieldWithLangue)`
Convertit un objet JavaScript en XML PrestaShop

```javascript
const xml = convertToPrestashopXML(
  { prestashop: { product: { name: 'Produit', price: '29.99' } } },
  'prestashop',
  true,
  1,
  ['name']
);
```

**Paramètres :**
| Nom | Type | Par défaut | Description |
|-----|------|-----------|-------------|
| `data` | Object | - | Données à convertir |
| `rootTag` | string | "prestashop" | Tag racine |
| `useLanguageWrapper` | boolean | true | Envelopper les champs multilingues |
| `languageId` | number | 1 | ID de langue (1=FR) |
| `fieldWithLangue` | Array | [] | Noms des champs multilingues |

**Retour :**
Chaîne XML formatée

```xml
<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
  <product>
    <name>
      <language id="1"><![CDATA[Produit]]></language>
    </name>
    <price><![CDATA[29.99]]></price>
  </product>
</prestashop>
```

#### 📖 Exemple complet
```javascript
import { convertToPrestashopXML } from '../utils/BuilderXml';

const productData = {
  prestashop: {
    product: {
      name: 'Nouveau produit',
      reference: 'SKU001',
      price: '29.99',
      active: '1'
    }
  }
};

const xml = convertToPrestashopXML(
  productData,
  'prestashop',
  true,
  1,
  ['name']  // Les champs multilingues
);

const response = await fetch('http://api/products?ws_key=XXX', {
  method: 'POST',
  headers: { 'Content-Type': 'application/xml' },
  body: xml
});
```

---

### dataImporter.js

#### 📄 Fichier
`src/utils/dataImporter.js`

#### 🎯 Description
Orchestration complète de l'import de données CSV vers PrestaShop.

#### 📚 API

##### `importCategories(categories, options)`
Import des catégories

```javascript
const results = await importCategories(
  ['Électronique', 'Vêtements'],
  options
);
```

**Paramètres :**
- `categories` (Array) : Noms des catégories
- `options` (Object) : Options d'import

**Retour :**
```javascript
{
  success: [
    { name: 'Électronique', id: 5, cached: false },
    { name: 'Vêtements', id: 6, cached: true }
  ],
  errors: [
    { name: 'Invalide', error: 'Erreur...' }
  ]
}
```

##### `importProducts(products, options)`
Import complet des produits avec combinaisons

```javascript
const results = await importProducts(products, options);
```

**Structure attendue :**
```javascript
[
  {
    nom: 'Produit 1',
    reference: 'SKU001',
    prix_ttc: 29.99,
    prix_achat: 15.00,
    categorie: 'Électronique',
    combinaisons: [
      { nom_option: 'Taille', valeur: 'M', prix_modif: 0 }
    ]
  }
]
```

#### 💾 Caching
Le module utilise un cache pour éviter les requêtes redondantes

```javascript
const entityCache = {
  categories: new Map(),       // nom_categorie -> id
  products: new Map(),         // reference -> { id, combinations: Map(...) }
  taxes: new Map(),
  // ... autres caches
};
```

#### 📊 Résultats d'import
```javascript
{
  success: [
    { name: 'Product1', id: 123, cached: false },
    ...
  ],
  errors: [
    { name: 'Product2', error: 'Erreur création' },
    ...
  ]
}
```

---

### categoryImporter.js

#### 📄 Fichier
`src/utils/categoryImporter.js`

#### 🎯 Description
Importation spécifique et gestion des catégories.

#### 📚 API

##### `importCategories(categoryList, addCategory, defaultParentId)`
Import liste de catégories

```javascript
const results = await importCategories(
  [
    { id: 2, nom: 'Racine' },
    { id: 5, nom: 'Électronique', parent_id: 2 }
  ],
  addCategory,
  2
);
```

**Structure d'une catégorie :**
```javascript
{
  id: 5,
  nom: 'Électronique',
  parent_id: 2,
  description: '...',
  active: 1
}
```

**Retour :**
```javascript
{
  success: [ { nom: '...', id: 5 }, ... ],
  errors: [ { nom: '...', error: 'Erreur...' }, ... ]
}
```

---

## 🔄 Exemple d'utilisation complet

### Import de produits complet
```javascript
import { parseFile1Products } from '../utils/csvParser';
import { importCategories, importProducts } from '../utils/dataImporter';

async function handleImportFile(csvFile) {
  try {
    // 1. Parser le CSV
    const csvText = await csvFile.text();
    const { data } = parseFile1Products(csvText);
    
    // 2. Extraire les catégories uniques
    const categories = [...new Set(data.map(p => p.categorie))];
    
    // 3. Importer les catégories
    await importCategories(categories);
    
    // 4. Importer les produits
    const results = await importProducts(data);
    
    // 5. Afficher les résultats
    console.log(`${results.success.length} produits créés`);
    console.log(`${results.errors.length} erreurs`);
    
  } catch (error) {
    console.error('Erreur import:', error.message);
  }
}
```

---

## ⚠️ Points d'attention

### Encodage
- CSV : UTF-8 recommandé
- XML : Utilise UTF-8
- Accents gérés automatiquement via CDATA

### Format des prix
- Séparateur décimal : `.` (point)
- Format français `,` converties en `.`

### Validation
- Les erreurs incluent le numéro de ligne
- Les validations s'arrêtent à la première erreur grave
- Le cache empêche les doublons

### Performance
- Les requêtes sont séquentielles (pas de parallélisation)
- Le caching accélère les imports répétés
- Utile pour les imports volumineux

---

**Fichiers sources** : `src/services/api.jsx`, `src/utils/*.js`

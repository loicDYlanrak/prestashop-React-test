# TODO - Application React + API Prestashop 8 (XML)

## Objectif du projet

Créer une application React connectée à l’API Prestashop 8 en utilisant uniquement les échanges XML.

L’application devra permettre :
- la connexion utilisateur (login)
- l’affichage des données Prestashop
- l’import de fichiers
- la réinitialisation des données
- la compréhension des modules et entités Prestashop
- la gestion des appels API XML

---

# 1. Initialisation du projet

## Frontend React

### Tâches
- [X] Vérifier que le projet React fonctionne
- [X] Organiser les dossiers du projet
- [X] Installer React Router
- [X] Installer Axios
- [X] Installer un framework UI (optionnel)
- [X] Créer le système de routes

### Structure recommandée

```bash
src/
│
├── api/
├── components/
├── pages/
├── services/
├── layouts/
├── context/
├── utils/
├── styles/
└── assets/
```

---

# 2. Comprendre Prestashop 8

## Étudier les entités principales

### Catalogue
- [X] Products
- [X] Categories
- [X] Images
- [X] Features
- [X] Attributes
- [X] Manufacturers
- [X] Suppliers

### Clients
- [X] Customers
- [X] Addresses
- [X] Groups

### Commandes
- [X] Orders
- [X] Order Details
- [X] Carts
- [X] Payments

### Stock
- [X] Stock Available
- [X] Warehouses

### CMS
- [X] CMS Pages
- [X] CMS Categories

---

# 3. Comprendre l’API Prestashop XML

## Documentation à étudier

### Tâches
- [X] Comprendre les endpoints
- [X] Comprendre les méthodes HTTP
- [X] Comprendre la structure XML
- [X] Tester les appels API avec Postman

---

# 4. Créer le module API React

## Objectif

Créer un service unique pour discuter avec Prestashop.

### Tâches
- [X] Créer un fichier apiClient.js
- [X] Configurer Axios
- [X] Ajouter l’authentification API Key
- [X] Configurer les headers XML

---

# 5. Gestion des appels XML

## Fonctions à créer

### GET
- [X] Récupérer les produits
- [X] Récupérer les catégories
- [X] Récupérer les commandes
- [X] Récupérer les clients

### POST
- [ ] Ajouter un produit
- [ ] Ajouter un client

### PUT
- [ ] Modifier un produit
- [ ] Modifier un client

### DELETE
- [ ] Supprimer un produit
- [ ] Supprimer une catégorie

---

# 6. Gestion XML

## Objectif

Manipuler correctement les réponses XML.

### Tâches
- [ ] Installer xml2js
- [ ] Convertir XML vers JSON
- [ ] Convertir JSON vers XML
- [ ] Créer des helpers XML

---

# 7. Authentification (Login)

## Fonctionnalités

### Tâches
- [ ] Créer une page Login
- [ ] Gérer le token utilisateur
- [ ] Sauvegarder la session
- [ ] Ajouter la déconnexion
- [ ] Créer des routes protégées

---

# 8. Interface React

## Dashboard

### Tâches
- [ ] Créer un layout principal
- [ ] Ajouter une sidebar
- [ ] Ajouter une navbar
- [ ] Ajouter un dashboard

---

# 9. Listing des données

## Produits

### Tâches
- [ ] Afficher les produits
- [ ] Ajouter pagination
- [ ] Ajouter recherche
- [ ] Ajouter filtre

## Clients
- [ ] Afficher la liste des clients

## Commandes
- [ ] Afficher les commandes

---

# 10. Import de fichiers

## Objectif

Importer des données dans Prestashop.

### Formats
- [ ] CSV
- [ ] Excel

### Tâches
- [ ] Créer formulaire upload
- [ ] Lire le fichier
- [ ] Mapper les colonnes
- [ ] Convertir vers XML
- [ ] Envoyer à Prestashop
- [ ] Gérer les erreurs

---

# 11. Bouton Réinitialisation des données

## Fonctionnalité

Permettre de nettoyer les données de test.

### Tâches
- [ ] Créer bouton Reset
- [ ] Ajouter popup confirmation
- [ ] Supprimer produits tests
- [ ] Supprimer clients tests
- [ ] Réinitialiser les imports

---

# 12. Gestion des erreurs

### Tâches
- [ ] Gérer erreurs API
- [ ] Afficher messages utilisateur
- [ ] Logger les erreurs
- [ ] Ajouter retry API

---

# 13. Sécurité

### Tâches
- [ ] Sécuriser les clés API
- [ ] Utiliser .env
- [ ] Bloquer routes privées
- [ ] Gérer permissions utilisateur

---

# 14. Optimisation

### Tâches
- [ ] Ajouter loading spinner
- [ ] Ajouter cache API
- [ ] Optimiser les appels API
- [ ] Ajouter lazy loading

---

# 15. Tests

### Tâches
- [ ] Tester API Prestashop
- [ ] Tester login
- [ ] Tester upload fichiers
- [ ] Tester reset données

---

# 16. Déploiement

### Tâches
- [ ] Préparer build React
- [ ] Configurer serveur
- [ ] Configurer variables d’environnement
- [ ] Déployer application

---

# 17. Bonus

## Fonctionnalités supplémentaires

- [ ] Dashboard statistiques
- [ ] Graphiques
- [ ] Historique imports
- [ ] Logs API
- [ ] Notifications
- [ ] Dark mode

---

# Exemple Architecture API

```bash
src/api/
│
├── authApi.js
├── productApi.js
├── customerApi.js
├── orderApi.js
└── xmlParser.js
```

---

# Exemple Flux XML

## GET Product

```xml
<prestashop>
    <product>
        <id>1</id>
        <name>
            <language id="1">Produit Test</language>
        </name>
    </product>
</prestashop>
```

---

# Exemple Upload CSV

```bash
CSV -> Parser -> JSON -> XML -> API Prestashop
```

---

# Priorités recommandées

## Phase 1
- Login
- Connexion API
- Listing produits

## Phase 2
- CRUD produits
- Gestion XML
- Upload fichiers

## Phase 3
- Reset données
- Dashboard
- Optimisation

---

# Technologies recommandées

## Frontend
- React
- React Router
- Axios
- TailwindCSS

## XML
- xml2js
- fast-xml-parser

## Upload
- react-dropzone
- papaparse

---

# Résultat attendu

Une application React permettant :
- de communiquer avec Prestashop 8 en XML
- d’explorer les entités Prestashop
- d’importer des données
- d’afficher les listings
- de gérer les utilisateurs
- de réinitialiser les données

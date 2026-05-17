/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
//Formater une date (JJ/MM/AAAA)

const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Utilisation
{formatDate('2025-03-15')} // 15/03/2025

//Ajouter / retirer des jours

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Exemple : +7 jours
const newDate = addDays(new Date(), 7);

//Différence en jours entre deux dates

const daysBetween = (date1, date2) => {
  const diffTime = Math.abs(new Date(date2) - new Date(date1));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Exemple
daysBetween('2025-01-01', '2025-01-10'); // 9

// Vérifier si une date est valide
const isValidDate = (date) => {
  return !isNaN(new Date(date).getTime());
};

isValidDate('2025-02-30'); // false (fevrier n'a pas 30 jours)

//Extraire année / mois / jour
const dateParts = (date) => {
  const d = new Date(date);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,  // +1 car getMonth() commence à 0
    day: d.getDate(),
    dayOfWeek: d.getDay() // 0 = dimanche, 1 = lundi...
  };
};

//Manipulation des tableaux (Array)

// Filtrer (supprimer éléments selon condition)
const items = [1, 2, 3, 4, 5];
const filtered = items.filter(item => item > 3); // [4, 5]
//Cas concret : supprimer un élément par son id
const newList = oldList.filter(item => item.id !== idToDelete);

//Trier (sort)
// Nombres (croissant)
const numbers = [3, 1, 4, 1, 5];
numbers.sort((a, b) => a - b); // [1, 1, 3, 4, 5]

// Objets par propriété
const users = [{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }];
users.sort((a, b) => a.age - b.age); // Bob puis Alice

// Par chaîne de caractères
users.sort((a, b) => a.name.localeCompare(b.name));

//Chercher un élément
// find() → retourne l'élément (ou undefined)
const user = users.find(u => u.id === 42);

// some() → vérifie si au moins un élément correspond
const hasUnder18 = users.some(u => u.age < 18);

// every() → vérifie si TOUS les éléments correspondent
const allAdults = users.every(u => u.age >= 18);

//Transformer (map)
const ids = users.map(user => user.id);
const namesUpper = users.map(user => user.name.toUpperCase());

//Réduire (calculer une somme, moyenne, etc.)
// Somme des âges
const totalAge = users.reduce((sum, user) => sum + user.age, 0);

// Grouper par propriété (ex: par âge)
const groupByAge = users.reduce((acc, user) => {
  if (!acc[user.age]) acc[user.age] = [];
  acc[user.age].push(user);
  return acc;
}, {});

//Supprimer les doublons
const withDuplicates = [1, 2, 2, 3, 3, 4];
const unique = [...new Set(withDuplicates)]; // [1, 2, 3, 4]

// Pour objets (par id)
const uniqueById = Array.from(
  new Map(arr.map(item => [item.id, item])).values()
);


//Paginer un tableau (slice)
const paginate = (array, pageNumber, pageSize) => {
  const start = (pageNumber - 1) * pageSize;
  return array.slice(start, start + pageSize);
};

// Exemple : page 2, 10 éléments par page
const page2 = paginate(myArray, 2, 10);
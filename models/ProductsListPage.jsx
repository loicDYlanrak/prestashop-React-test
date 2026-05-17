import { useState, useEffect } from 'react';

export default function ProductListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulation d'un appel API
    fetch('https://api.example.com/products')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="page-container">
      <h1>Liste des Produits</h1>
      <div className="grid-layout">
        {items.map(item => (
          <div key={item.id} className="card">
            <h3>{item.name}</h3>
            <p>{item.price} €</p>
            <button onClick={() => alert(`Achat de ${item.name}`)}>Voir</button>
          </div>
        ))}
      </div>
    </div>
  );
}
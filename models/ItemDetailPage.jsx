import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ItemDetailPage() {
  const { id } = useParams(); // Récupère l'ID depuis l'URL
  const navigate = useNavigate();
  const [item, setItem] = useState(null);

  useEffect(() => {
    // Fetch des détails via l'ID
    fetch(`https://api.example.com/items/${id}`)
      .then(res => res.json())
      .then(data => setItem(data));
  }, [id]);

  if (!item) return <p>Élément introuvable...</p>;

  return (
    <div className="detail-page">
      <button onClick={() => navigate(-1)}>Retour</button>
      <h1>{item.title}</h1>
      <img src={item.imageUrl} alt={item.title} />
      <p>{item.description}</p>
    </div>
  );
}
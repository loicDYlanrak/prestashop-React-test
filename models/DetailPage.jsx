import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function DetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    fetch(`https://api.example.com/items/${id}`)
      .then((res) => res.json())
      .then(setItem);
  }, [id]);

  if (!item) return <p>Chargement...</p>;

  return (
    <div>
      <h1>{item.name}</h1>
      <p>{item.description}</p>
    </div>
  );
}
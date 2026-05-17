import { useState } from 'react';

export default function CreateItemPage() {
  const [formData, setFormData] = useState({ title: '', content: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Données envoyées :', formData);
    // Ici, tu mets ton appel POST (axios ou fetch)
  };

  return (
    <div className="form-page">
      <h2>Créer un nouvel article</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Titre :</label>
          <input 
            type="text" 
            name="title" 
            value={formData.title} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Contenu :</label>
          <textarea 
            name="content" 
            value={formData.content} 
            onChange={handleChange} 
          />
        </div>
        <button type="submit">Enregistrer</button>
      </form>
    </div>
  );
}
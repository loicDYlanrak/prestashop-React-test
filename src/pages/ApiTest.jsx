import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ApiTest() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newPost, setNewPost] = useState({ title: '', body: '' });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/posts?_limit=5');
      setPosts(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/posts', {
        title: newPost.title,
        body: newPost.body,
        userId: 1,
      });
      setPosts([response.data, ...posts]);
      setNewPost({ title: '', body: '' });
      alert('Post créé avec succès !');
    } catch (err) {
      setError(err.message);
    }
  };

  const deletePost = async (id) => {
    try {
      await api.delete(`/posts/${id}`);
      setPosts(posts.filter(post => post.id !== id));
      alert('Post supprimé !');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>📡 Test API - Axios</h1>
      
      {/* Affichage des erreurs */}
      {error && (
        <div style={{ color: 'red', padding: '10px', background: '#ffeeee', borderRadius: '5px' }}>
          ❌ Erreur : {error}
        </div>
      )}

      {/* Formulaire de création */}
      <form onSubmit={createPost} style={{ marginBottom: '30px', padding: '20px', background: '#f0f0f0', borderRadius: '10px' }}>
        <h3>➕ Créer un nouveau post</h3>
        <input
          type="text"
          placeholder="Titre"
          value={newPost.title}
          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          required
        />
        <textarea
          placeholder="Contenu"
          value={newPost.body}
          onChange={(e) => setNewPost({ ...newPost, body: e.target.value })}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          required
        />
        <button type="submit" style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>
          Créer
        </button>
      </form>

      {/* Liste des posts */}
      <h3>📝 Liste des posts (API)</h3>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {posts.map(post => (
            <li key={post.id} style={{ marginBottom: '15px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
              <h4>{post.title}</h4>
              <p>{post.body}</p>
              <button 
                onClick={() => deletePost(post.id)}
                style={{ padding: '5px 10px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '3px' }}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
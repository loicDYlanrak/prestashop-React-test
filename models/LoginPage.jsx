import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Logique d'authentification (ex: dispatch vers Context ou Redux)
    console.log('Login avec :', email, password);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Connexion</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Mot de passe" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit">Se connecter</button>
        </form>
      </div>
    </div>
  );
}
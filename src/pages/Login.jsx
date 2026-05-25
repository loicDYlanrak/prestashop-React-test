import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('loicrakotoarivony07@gmail.com')
  const [password, setPassword] = useState('06avril07')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = () => {
    
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const ok = login(email, password)
    if (ok) navigate('/admin/dashboard')
    else setError('Email ou mot de passe invalide.')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <strong>PRESTASHOP</strong>
          <span className="auth-version">8.2.6</span>
        </div>
        <h2 className="auth-title">Connexion à votre boutique</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Adresse email</label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={handleChange}
              onClick={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={handleChange}

              onClick={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full">
            Connexion
          </button>
        </form>

        <div className="auth-links">
          <span>Pas encore de compte ?</span>
          <Link to="/register">Créer un compte</Link>
        </div>
      </div>
    </div>
  )
}
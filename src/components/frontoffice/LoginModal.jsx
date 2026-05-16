import { useState } from 'react'
import './LoginModal.css'

// eslint-disable-next-line react/prop-types
export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Simulation d'appel API - À remplacer par votre véritable endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Validation simple
      if (email && password) {
        onLoginSuccess({ name: email.split('@')[0], email })
      } else {
        setError('Email et mot de passe requis')
      }
    } catch (err) {
      setError('Erreur de connexion'+ err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔐 Connexion</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          
          <p className="register-link">
            Pas encore de compte ? <a href="/admin/register">S&apos;inscrire</a>
          </p>
        </form>
      </div>
    </div>
  )
}
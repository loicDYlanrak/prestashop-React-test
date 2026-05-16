import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Header.css'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <header className="header">
      <div className="header-left">
        <span className="header-logo-text">
          <strong>PRESTASHOP-API-REACT</strong>
          <span className="header-version">8.2.6</span>
        </span>
      </div>
      <div className="header-right">
        <div className="header-user-info">
          <span className="header-user-name">{user?.name || 'Admin'}</span>
          <button onClick={handleLogout} className="btn-logout" title="Déconnexion">
            <div className="header-user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="logout-text">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  )
}
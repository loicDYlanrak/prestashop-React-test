import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// eslint-disable-next-line react/prop-types
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ps_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = (email, password) => {
    if (email && password) {
      const userData = { email, name: email.split('@')[0] }
      localStorage.setItem('ps_user', JSON.stringify(userData))
      setUser(userData)
      return true
    }
    return false
  }

  const register = (name, email, password) => {
    if (name && email && password) {
      const userData = { email, name }
      localStorage.setItem('ps_user', JSON.stringify(userData))
      setUser(userData)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem('ps_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
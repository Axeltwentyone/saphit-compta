import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'
import { setDevise } from '../utils/dashboardStats'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('saphir_token')
    if (!token) {
      setLoading(false)
      return
    }

    api
      .get('/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('saphir_token'))
      .finally(() => setLoading(false))

    api.get('/parametres').then((res) => setDevise(res.data.devise)).catch(() => {})
  }, [])

  async function login(email, password) {
    const res = await api.post('/login', { email, password })
    localStorage.setItem('saphir_token', res.data.token)
    setUser(res.data.user)
    api.get('/parametres').then((res) => setDevise(res.data.devise)).catch(() => {})
  }

  async function logout() {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('saphir_token')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

import { useState, useEffect } from 'react'

const ADMIN_SESSION_KEY = 'cha_casa_nova_admin'

export function useAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY)
    if (session === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  function login(password: string): boolean {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || '121720'
    if (password.trim() === adminPassword.trim()) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  function logout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    setIsAuthenticated(false)
  }

  return { isAuthenticated, login, logout }
}

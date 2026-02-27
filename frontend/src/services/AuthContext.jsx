import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('mizuka_user')
    return stored ? JSON.parse(stored) : null
  })

  const [token, setToken] = useState(() => localStorage.getItem('mizuka_token') || null)

  function login(userData, tokenValue) {
    setUser(userData)
    setToken(tokenValue)
    localStorage.setItem('mizuka_user', JSON.stringify(userData))
    localStorage.setItem('mizuka_token', tokenValue)
  }

  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem('mizuka_user')
    localStorage.removeItem('mizuka_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

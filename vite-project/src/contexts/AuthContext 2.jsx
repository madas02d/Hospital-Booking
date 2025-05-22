import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Here you would typically check for an existing session
    // For now, we'll just set loading to false
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // Here you would typically make an API call to authenticate
    // For now, we'll just set the user
    setUser({ email })
  }

  const register = async (email, password, name) => {
    // Here you would typically make an API call to register
    // For now, we'll just set the user
    setUser({ email, name })
  }

  const logout = async () => {
    // Here you would typically make an API call to logout
    // For now, we'll just clear the user
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 
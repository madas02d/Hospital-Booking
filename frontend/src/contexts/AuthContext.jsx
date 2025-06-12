import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get('/api/auth/me')
        .then(res => setCurrentUser(res.data.user))
        .catch(() => setCurrentUser(null))
    }
  }, [])

  const signup = async (name, email, password) => {
    try {
      const res = await api.post('/api/auth/register', { name, email, password })
      const token = res.data.token
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setCurrentUser(res.data.user)
      return res.data
    } catch (error) {
      console.error('Signup error:', error.response?.data || error.message)
      throw error.response?.data || error
    }
  }

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password })
      const token = res.data.token
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setCurrentUser(res.data.user)
      return res.data
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message)
      throw error.response?.data || error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setCurrentUser(null)
  }

  const value = {
    currentUser,
    signup,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 
import { createContext, useContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'

const AuthContext = createContext(null)

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Function to check and restore authentication
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const response = await api.get('/auth/me')
        // Handle both response structures
        const userData = response.data.data || response.data
        setCurrentUser(userData)
      } else {
      }
    } catch (error) {
      console.error('AuthContext: Auth check error:', error)
      // If token is invalid, clear it
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      setCurrentUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Check authentication on mount and when token changes
  useEffect(() => {
    checkAuth()
  }, [])

  const signup = async (firstName, lastName, email, password) => {
    try {
      const res = await api.post('/auth/register', { firstName, lastName, email, password })
      const token = res.data.token
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Handle both response structures
      const userData = res.data.user || res.data.data
      setCurrentUser(userData)
      return res.data
    } catch (error) {
      console.error('Signup error:', error.response?.data || error.message)
      throw error.response?.data || error
    }
  }

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      const token = res.data.token
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Handle both response structures
      const userData = res.data.user || res.data.data
      setCurrentUser(userData)
      return res.data
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message)
      throw error.response?.data || error
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      setCurrentUser(null)
    }
  }

  const updateProfile = async (updates) => {
    try {
      
      const res = await api.put('/auth/profile', updates)
      
      if (res.data.success) {
        // Update the current user state with the new data
        const updatedUser = { ...currentUser, ...res.data.user }
        setCurrentUser(updatedUser)
        return updatedUser
      } else {
        throw new Error('Profile update failed')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      // Don't clear the user on profile update errors
      throw error
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.put('/auth/change-password', { currentPassword, newPassword })
    return res.data
  }

  const value = {
    currentUser,
    user: currentUser,
    loading,
    signup,
    login,
    logout,
    updateProfile,
    changePassword
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.node
}

export const useAuth = () => useContext(AuthContext) 
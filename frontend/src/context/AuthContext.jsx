import { createContext, useContext, useState, useEffect } from 'react'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '../config/firebase'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get the Firebase ID token
        const token = await firebaseUser.getIdToken()
        
        // Get user data from MongoDB
        try {
          const response = await axios.get('http://localhost:5000/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          setUser({ ...firebaseUser, ...response.data.data })
        } catch (error) {
          console.error('Error fetching user data:', error)
          setUser(firebaseUser)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signup = async (email, password, name) => {
    try {
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await firebaseUpdateProfile(userCredential.user, {
        displayName: name
      })

      // Get the Firebase ID token
      const token = await userCredential.user.getIdToken()

      // Create user in MongoDB
      await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        firebaseUid: userCredential.user.uid
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      return userCredential.user
    } catch (error) {
      throw new Error(error.message)
    }
  }

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()

      // Get user data from MongoDB
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setUser({ ...userCredential.user, ...response.data.data })
      return userCredential.user
    } catch (error) {
      throw new Error(error.message)
    }
  }

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const token = await userCredential.user.getIdToken()

      // Get or create user in MongoDB
      const response = await axios.post('http://localhost:5000/api/auth/google', {
        googleId: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setUser({ ...userCredential.user, ...response.data.data })
      return userCredential.user
    } catch (error) {
      throw new Error(error.message)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
    } catch (error) {
      throw new Error(error.message)
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (auth.currentUser) {
        await firebaseUpdateProfile(auth.currentUser, updates)
        const token = await auth.currentUser.getIdToken()

        // Update user in MongoDB
        await axios.patch('http://localhost:5000/api/auth/profile', updates, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        setUser(prev => ({
          ...prev,
          ...updates,
          photoURL: updates.photoURL || prev?.photoURL
        }))
      }
    } catch (error) {
      throw new Error(error.message)
    }
  }

  const value = {
    user,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
const rawStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET

// Normalize storage bucket: ensure it targets <projectId>.appspot.com
const storageBucket = rawStorageBucket && rawStorageBucket.endsWith('appspot.com')
  ? rawStorageBucket
  : (projectId ? `${projectId}.appspot.com` : undefined)

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (projectId ? `${projectId}.firebaseapp.com` : undefined),
  projectId,
  storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app 
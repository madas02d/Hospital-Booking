import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "doctor-appointment-app-37ba7.firebaseapp.com",
  projectId: "doctor-appointment-app-37ba7",
  storageBucket: "doctor-appointment-app-37ba7.appspot.com",
  messagingSenderId: "1043072081034",
  appId: "1:1043072081034:web:XXXXXXXXXXXXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

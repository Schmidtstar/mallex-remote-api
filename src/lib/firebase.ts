import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDqZv3qF_tH4Y8K8K8K8K8K8K8K8K8K8K8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mallex-1b745.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mallex-1b745",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mallex-1b745.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "461634733593",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:461634733593:web:033d22b5c9c677209b4c88",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SQW96VK7S9"
}

console.log('🔧 Firebase Config:', {
  ...firebaseConfig,
  apiKey: '[HIDDEN]'
})

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

// Connect to emulators in development
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    console.log('🔧 Auth Emulator connected')
  } catch (error) {
    console.log('Auth Emulator already connected or not available')
  }

  try {
    connectFirestoreEmulator(db, 'localhost', 8080)
    console.log('🔧 Firestore Emulator connected')
  } catch (error) {
    console.log('Firestore Emulator already connected or not available')
  }
}

// Clean exports
export { auth as firebaseAuth }
export { db as firestore }

export default { auth, db }

console.log('🔥 Firebase ready')
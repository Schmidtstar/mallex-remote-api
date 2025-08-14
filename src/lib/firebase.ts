import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Singleton pattern for Firebase app
let app: any = null;
let db: any = null;
let auth: any = null;
let functions: any = null;

export function initializeFirebase() {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      functions = getFunctions(app);

      // Connect to emulators in development
      if (import.meta.env.DEV) {
        try {
          connectFirestoreEmulator(db, 'localhost', 8080);
          connectAuthEmulator(auth, 'http://localhost:9099');
          connectFunctionsEmulator(functions, 'localhost', 5001);
        } catch (error) {
          console.log('Emulators not available, using production Firebase');
        }
      }

      console.log('🔥 Firebase ready');
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      throw error;
    }
  }

  return { app, db, auth, functions };
}

export const firebase = initializeFirebase();
export const { db: firestore, auth: firebaseAuth, functions: firebaseFunctions } = firebase;
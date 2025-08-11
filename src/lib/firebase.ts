import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Debug: Log der Config
console.log('Firebase Config:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasAppId: !!firebaseConfig.appId
});

// Prüfe ob alle nötigen Config-Werte vorhanden sind
const hasRequiredConfig = firebaseConfig.apiKey && 
                         firebaseConfig.authDomain && 
                         firebaseConfig.projectId && 
                         firebaseConfig.appId;

if (!hasRequiredConfig) {
  console.error('Firebase config is incomplete! Check your environment variables.');
  console.log('Missing values:', {
    apiKey: !firebaseConfig.apiKey ? 'MISSING' : 'OK',
    authDomain: !firebaseConfig.authDomain ? 'MISSING' : 'OK', 
    projectId: !firebaseConfig.projectId ? 'MISSING' : 'OK',
    appId: !firebaseConfig.appId ? 'MISSING' : 'OK'
  });
}

// Einmalige Initialisierung (HMR-sicher)
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
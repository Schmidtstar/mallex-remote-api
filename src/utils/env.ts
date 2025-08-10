
export type FirebaseEnv = {
  apiKey?: string; authDomain?: string; projectId?: string;
  appId?: string; messagingSenderId?: string; storageBucket?: string;
  measurementId?: string;
}

export function readFirebaseEnv(): FirebaseEnv {
  const e = import.meta.env
  return {
    apiKey: e.VITE_FIREBASE_API_KEY,
    authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: e.VITE_FIREBASE_PROJECT_ID,
    appId: e.VITE_FIREBASE_APP_ID,
    messagingSenderId: e.VITE_FIREBASE_MESSAGING_SENDER_ID,
    storageBucket: e.VITE_FIREBASE_STORAGE_BUCKET,
    measurementId: e.VITE_FIREBASE_MEASUREMENT_ID
  }
}

export function hasAuthEnv(env: FirebaseEnv) {
  return !!(env.apiKey && env.authDomain && env.projectId && env.appId)
}

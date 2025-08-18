import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut, updateProfile, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ensureUserProfile } from '@/lib/userApi';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

// Assuming db is initialized elsewhere, e.g., in firebase.ts
const db = getFirestore(auth.app); // Initialize db here if not already

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;
    let initializationAttempted = false;

    const initializeAuth = async () => {
      // Verhindere mehrfache Initialisierung
      if (initializationAttempted) return;
      initializationAttempted = true;

      try {
        // Prüfe Firebase-Verfügbarkeit mit Timeout
        const firebaseTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase timeout')), 3000)
        );

        const firebaseCheck = new Promise((resolve) => {
          if (!auth) {
            resolve(false);
          } else {
            resolve(true);
          }
        });

        const isFirebaseAvailable = await Promise.race([firebaseCheck, firebaseTimeout])
          .catch(() => false);

        if (!isFirebaseAvailable) {
          console.warn('🟡 Firebase not available - Guest mode activated');
          if (isMounted) {
            setLoading(false);
            setUser(null);
            setIsAdmin(false);
          }
          return;
        }

        // Einmaliger Auth-Listener ohne Rekursion
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!isMounted) return;

          try {
            if (firebaseUser) {
              setUser(firebaseUser);
              setIsAdmin(false); // Standard-Wert

              // Async Operations ohne Blockierung
              Promise.all([
                // Profile sicherstellen
                ensureUserProfile(firebaseUser.uid, {
                  email: firebaseUser.email ?? undefined,
                  displayName: firebaseUser.displayName ?? undefined,
                }).catch(() => console.warn('Profile creation skipped')),
                
                // Admin-Check mit Timeout - EINMALIG
                getDoc(doc(db, 'admins', firebaseUser.uid))
                  .then((adminDoc) => {
                    if (isMounted && adminDoc?.exists()) {
                      setIsAdmin(true);
                      console.log('👑 Admin user detected');
                    } else if (isMounted) {
                      setIsAdmin(false);
                    }
                  })
                  .catch(() => {
                    if (isMounted) setIsAdmin(false);
                  })
              ]);

            } else {
              setUser(null);
              setIsAdmin(false);
            }
          } catch (error) {
            console.warn('Auth processing error:', error);
            if (isMounted) {
              setUser(null);
              setIsAdmin(false);
            }
          } finally {
            if (isMounted) setLoading(false);
          }
        }, (error) => {
          console.warn('Auth listener error:', error);
          if (isMounted) {
            setLoading(false);
            setUser(null);
            setIsAdmin(false);
          }
        });

        console.log('🔐 Auth listener initialized successfully');

      } catch (error) {
        console.warn('Auth initialization failed - Guest mode:', error);
        if (isMounted) {
          setLoading(false);
          setUser(null);
          setIsAdmin(false);
        }
      }
    };

    // Verzögerter Start für bessere Stabilität
    const initTimer = setTimeout(initializeAuth, 100);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  }, []); // Leere Dependencies - nur einmal ausführen

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (credential.user && displayName) {
      await updateProfile(credential.user, { displayName });
    }
  };

  const loginAnonymously = async () => {
    await signInAnonymously(auth);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    login,
    register,
    loginAnonymously,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook mit konsistentem Export für Fast Refresh
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
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

    const initializeAuth = () => {
      try {
        // Schnelle Firebase-Verfügbarkeit prüfen
        if (!auth) {
          console.warn('🟡 Firebase Auth not available - Guest mode');
          if (isMounted) {
            setLoading(false);
            setUser(null);
            setIsAdmin(false);
          }
          return;
        }

        // Direkter Auth-Listener ohne Verzögerung
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (!isMounted) return;

          if (firebaseUser) {
            console.log('✅ User authenticated:', firebaseUser.uid);
            setUser(firebaseUser);
            setLoading(false); // SOFORT entsperren

            // Non-blocking Background-Tasks
            setTimeout(() => {
              if (!isMounted) return;
              
              // Profile-Erstellung (non-blocking)
              ensureUserProfile(firebaseUser.uid, {
                email: firebaseUser.email ?? undefined,
                displayName: firebaseUser.displayName ?? undefined,
              }).catch(() => console.warn('Profile creation skipped'));

              // Admin-Check (non-blocking, mit Timeout)
              if (db) {
                const adminCheckTimeout = setTimeout(() => {
                  console.warn('Admin check timeout - assuming non-admin');
                  if (isMounted) setIsAdmin(false);
                }, 2000);

                getDoc(doc(db, 'admins', firebaseUser.uid))
                  .then((adminDoc) => {
                    clearTimeout(adminCheckTimeout);
                    if (isMounted) {
                      const isUserAdmin = adminDoc?.exists();
                      setIsAdmin(isUserAdmin);
                      if (isUserAdmin) console.log('👑 Admin detected');
                    }
                  })
                  .catch(() => {
                    clearTimeout(adminCheckTimeout);
                    if (isMounted) setIsAdmin(false);
                  });
              } else {
                setIsAdmin(false);
              }
            }, 50); // Minimal delay für bessere UX

          } else {
            console.log('🔓 User signed out');
            setUser(null);
            setIsAdmin(false);
            setLoading(false);
          }
        }, (error) => {
          console.error('🚨 Auth listener error:', error);
          if (isMounted) {
            setLoading(false);
            setUser(null);
            setIsAdmin(false);
          }
        });

        console.log('🔐 Auth initialized');

      } catch (error) {
        console.error('🚨 Auth initialization failed:', error);
        if (isMounted) {
          setLoading(false);
          setUser(null);
          setIsAdmin(false);
        }
      }
    };

    // Sofortiger Start ohne Verzögerung
    initializeAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  }, []); // Einmaliger Effect

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
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

    const initializeAuth = async () => {
      try {
        // Firebase Verfügbarkeitstest mit kurzer Timeout
        if (!auth) {
          console.warn('🟡 Firebase not available - Guest mode');
          if (isMounted) {
            setLoading(false);
            setUser(null);
            setIsAdmin(false);
          }
          return;
        }

        // Single auth state listener - verhindert loops
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!isMounted) return;

          try {
            if (firebaseUser) {
              setUser(firebaseUser);

              // Profile sicherstellen (non-blocking)
              ensureUserProfile(firebaseUser.uid, {
                email: firebaseUser.email ?? undefined,
                displayName: firebaseUser.displayName ?? undefined,
              }).catch(error => {
                console.warn('Profile creation failed (non-critical):', error);
              });

              // Admin-Check (non-blocking)
              getDoc(doc(db, 'admins', firebaseUser.uid))
                .then(adminDoc => {
                  if (isMounted) {
                    const userIsAdmin = adminDoc.exists();
                    setIsAdmin(userIsAdmin);
                    console.log(userIsAdmin ? '👑 Admin user' : '👤 Regular user');
                  }
                })
                .catch(error => {
                  console.warn('Admin check failed:', error);
                  if (isMounted) setIsAdmin(false);
                });

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
        });

        console.log('🔐 Auth listener initialized');

      } catch (error) {
        console.warn('Auth initialization failed:', error);
        if (isMounted) {
          setLoading(false);
          setUser(null);
          setIsAdmin(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Empty dependency array - run once

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
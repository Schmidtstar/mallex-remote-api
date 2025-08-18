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
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      console.warn('🔐 Auth not available - offline mode')
      setLoading(false)
      return
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            console.log('✅ User authenticated:', firebaseUser.uid)
            setUser(firebaseUser)
            
            // Ensure user profile exists
            try {
              await ensureUserProfile(firebaseUser.uid, {
                email: firebaseUser.email ?? undefined,
                displayName: firebaseUser.displayName ?? undefined
              })
            } catch (profileError) {
              console.warn('Profile creation failed (non-critical):', profileError)
            }

            // Check admin status with comprehensive error handling
            try {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
              if (userDoc.exists()) {
                const userData = userDoc.data()
                setIsAdmin(userData.isAdmin === true)
                console.log('✅ Admin status checked successfully')
              } else {
                setIsAdmin(false)
                console.log('🔐 User document not found - not admin')
              }
            } catch (error: any) {
              setIsAdmin(false)
              // Silent handling for expected permission errors
              if (error.code === 'permission-denied') {
                // This is expected for normal users
              } else if (error.code === 'unavailable') {
                console.log('🔐 Admin check skipped (Firebase unavailable)')
              } else {
                console.warn('🔐 Admin check failed (non-critical):', error?.code || 'unknown')
              }
            }
          } else {
            console.log('🔓 User signed out')
            setUser(null)
            setIsAdmin(false)
          }
        } catch (error: any) {
          console.warn('Auth state change error:', error?.message)
        } finally {
          setLoading(false)
        }
      }, (error) => {
        console.warn('Auth state listener error:', error?.message)
        setLoading(false)
      })

      return unsubscribe
    } catch (error: any) {
      console.warn('Failed to setup auth listener:', error?.message)
      setLoading(false)
      return () => {}
    }
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
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
    // Teste Firebase-Verfügbarkeit mit Timeout
    const testFirebaseConnection = async () => {
      try {
        if (!auth) {
          console.warn('Firebase auth not initialized - switching to guest mode');
          setLoading(false);
          setUser(null);
          // setAdmin(false); // Removed unused call
          return false;
        }

        // Quick connection test mit Timeout (verlängert für Replit)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 5000)
        );

        await Promise.race([
          new Promise(resolve => {
            const unsubscribe = onAuthStateChanged(auth, () => {
              unsubscribe();
              resolve(true);
            });
          }),
          timeoutPromise
        ]);

        return true;
      } catch (error) {
        console.warn('Firebase connection test failed - switching to guest mode:', error);
        setLoading(false);
        setUser(null);
        return false;
      }
    };

    testFirebaseConnection().then(isOnline => {
      if (!isOnline) {
        console.log('🟡 App running in GUEST MODE (Firebase offline)');
        return;
      }

      console.log('🟢 Firebase online - normal auth mode');
      let isMounted = true;
      let authTimeout: NodeJS.Timeout;
      
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!isMounted) return;
        
        // Clear any existing timeout
        if (authTimeout) clearTimeout(authTimeout);
        
        setLoading(true);
        try {
          if (user) {
            setUser(user);

            // Versuche Profil zu laden, aber lass es nicht die App crashen
            try {
              await ensureUserProfile(user.uid, {
                email: user.email ?? undefined,
                displayName: user.displayName ?? undefined,
              });
            } catch (profileError) {
              console.warn('Could not ensure user profile (offline?):', profileError);
            }

            // **ZENTRALE ADMIN-PRÜFUNG BEIM LOGIN**
            try {
              const adminDoc = await getDoc(doc(db, 'admins', user.uid));
              const userIsAdmin = adminDoc.exists();
              setIsAdmin(userIsAdmin);
              console.log(userIsAdmin ? '👑 ADMIN LOGIN' : '👤 Normal user login');
            } catch (adminError) {
              console.warn('Admin check failed:', adminError);
              setIsAdmin(false);
            }
          } else {
            setUser(null);
            setIsAdmin(false); // Reset admin status on logout
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          // Bei Firebase-Verbindungsproblemen: in Gastmodus wechseln
          if ((error as any)?.code === 'unavailable') {
            console.warn('🟡 Firebase became unavailable - switching to guest mode');
            setUser(null);
            setIsAdmin(false); // Also reset admin status in this case
          } else {
            setUser(null);
            setIsAdmin(false); // Reset admin status in case of other errors
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    });
  }, []);

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
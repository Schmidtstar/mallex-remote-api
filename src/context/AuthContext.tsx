import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut, updateProfile, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ensureUserProfile } from '@/lib/userApi';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Teste Firebase-Verfügbarkeit mit Timeout
    const testFirebaseConnection = async () => {
      try {
        if (!auth) {
          console.warn('Firebase auth not initialized - switching to guest mode');
          setLoading(false);
          setUser(null);
          setAdmin(false);
          return false;
        }

        // Quick connection test mit Timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 3000)
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
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          // Bei Firebase-Verbindungsproblemen: in Gastmodus wechseln
          if ((error as any)?.code === 'unavailable') {
            console.warn('🟡 Firebase became unavailable - switching to guest mode');
            setUser(null);
          } else {
            setUser(null);
          }
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribe();
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
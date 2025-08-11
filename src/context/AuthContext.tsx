import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut, updateProfile, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ensureUserProfile } from '@/lib/userApi';
import { isEmailAdmin } from '@/lib/adminApi';

interface AuthContextType {
  user: User | null;
  admin: boolean | 'loading';
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<boolean | 'loading'>('loading');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      try {
        if (user) {
          setUser(user);
          
          // Versuche Profil und Admin-Status zu laden, aber lass es nicht die App crashen
          try {
            await ensureUserProfile(user.uid, {
              email: user.email ?? undefined,
              displayName: user.displayName ?? undefined,
            });
          } catch (profileError) {
            console.warn('Could not ensure user profile (offline?):', profileError);
          }

          try {
            const isAdmin = await isEmailAdmin(user.email);
            setAdmin(isAdmin);
          } catch (adminError) {
            console.warn('Could not check admin status (offline?):', adminError);
            setAdmin(false);
          }
        } else {
          setAdmin(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        // Bei Firebase-Verbindungsproblemen: trotzdem weitermachen
        if (error?.code === 'unavailable') {
          console.warn('Firebase offline, setting user to null');
          setUser(null);
          setAdmin(false);
        } else {
          setAdmin(false);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
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
    admin,
    loading,
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
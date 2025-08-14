import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth as firebaseAuth } from '../lib/firebase';
import { apiService } from '../lib/api';
import { where } from 'firebase/firestore';

interface AdminSettings {
  maxTasksPerCategory: number;
  allowUserSuggestions: boolean;
  moderationEnabled: boolean;
  pointsPerTask: number;
}

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  settings: AdminSettings | null;
  updateSettings: (newSettings: Partial<AdminSettings>) => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
}

const defaultSettings: AdminSettings = {
  maxTasksPerCategory: 10,
  allowUserSuggestions: true,
  moderationEnabled: true,
  pointsPerTask: 10,
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  const checkAdminStatus = async (): Promise<boolean> => {
    const user = firebaseAuth.currentUser;
    if (!user) {
      setIsAdmin(false);
      return false;
    }

    try {
      const result = await apiService.getCollection('admins', [
        where('email', '==', user.email)
      ]);

      const adminStatus = result.success && result.data && result.data.length > 0;
      setIsAdmin(adminStatus || false);
    } catch (error) {
      console.error('Admin-Status Fehler:', error);
      setIsAdmin(false);
    }

    return isAdmin;
  };

  const loadSettings = async () => {
    try {
      const result = await apiService.getDocument<AdminSettings>('settings', 'admin');

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        console.log('📋 Admin settings not accessible - using defaults');
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
      setSettings(defaultSettings);
    }
  };

  const updateSettings = async (newSettings: Partial<AdminSettings>) => {
    if (!isAdmin) {
      throw new Error('Nur Admins können Einstellungen ändern');
    }

    try {
      const updatedSettings = { ...settings, ...newSettings };
      const result = await apiService.setDocument('settings', 'admin', updatedSettings);

      if (result.success) {
        setSettings(updatedSettings as AdminSettings);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeAdmin = async () => {
      setIsLoading(true);
      await checkAdminStatus();
      await loadSettings();
      setIsLoading(false);
    };

    const unsubscribe = firebaseAuth.onAuthStateChanged(() => {
      initializeAdmin();
    });

    return () => unsubscribe();
  }, []);

  const value: AdminContextType = {
    isAdmin,
    isLoading,
    settings,
    updateSettings,
    checkAdminStatus,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin muss innerhalb von AdminProvider verwendet werden');
  }
  return context;
}

export function useIsAdmin() {
  const { isAdmin } = useAdmin();
  return isAdmin;
}
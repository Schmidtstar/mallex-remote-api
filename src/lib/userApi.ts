import { apiService } from './api';
import { firebaseAuth } from './firebase';
import { db } from './firebase'; // Assuming db is exported from firebase.ts
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'; // Import necessary Firestore functions

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: any;
  lastLogin?: any;
  isAdmin?: boolean;
  points: number;
  level: number;
  completedTasks: string[];
  lastActive: Date;
}

export async function ensureUserProfile(user: any): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const profile: UserProfile = {
      id: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: new Date(),
      lastLogin: new Date(),
      isAdmin: false,
      points: 0,
      level: 1,
      completedTasks: [],
      lastActive: new Date()
    };
    await setDoc(userRef, profile);
    return profile;
  }

  // Update last active when ensuring profile
  await updateDoc(userRef, { lastActive: new Date() });
  return userDoc.data() as UserProfile;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data() as UserProfile : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { ...updates, lastActive: new Date() });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export const userApi = {
  async ensureUserProfile(userId: string, userData: Partial<UserProfile>) {
    // This function is now replaced by the standalone ensureUserProfile
    // Keeping it here for now to avoid breaking if it's used elsewhere,
    // but ideally it should be refactored or removed if not needed.
    const existingUser = await getUserProfile(userId); // Use the new getUserProfile

    if (!existingUser) {
      const newUser: Omit<UserProfile, 'id'> = {
        displayName: userData.displayName || 'Unbekannt',
        email: userData.email || '',
        points: 0,
        level: 1,
        completedTasks: [],
        createdAt: new Date(),
        lastActive: new Date(),
        ...userData
      };

      // Ensure the standalone ensureUserProfile is called with the correct user object structure
      // This might require adapting the user object format or calling the standalone function directly
      // For now, let's assume we need to create a mock user object if the standalone function expects it.
      const mockUser = { uid: userId, email: userData.email, displayName: userData.displayName };
      return ensureUserProfile(mockUser);
    }

    // Update last active
    return updateUserProfile(userId, {
      lastActive: new Date()
    });
  },

  async getUserProfile(userId: string) {
    return getUserProfile(userId); // Use the new standalone function
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    return updateUserProfile(userId, updates); // Use the new standalone function
  },

  async addPoints(userId: string, points: number) {
    const user = await this.getUserProfile(userId);
    if (user) { // Check if user is not null
      const newPoints = user.points + points;
      const newLevel = Math.floor(newPoints / 100) + 1;

      return this.updateUserProfile(userId, {
        points: newPoints,
        level: newLevel
      });
    }
    return Promise.resolve({ success: false, error: 'Benutzer nicht gefunden' }); // Return a promise to match the original return type
  },

  async completeTask(userId: string, taskId: string, points: number) {
    const user = await this.getUserProfile(userId);
    if (user) { // Check if user is not null
      const completedTasks = [...user.completedTasks, taskId];
      const newPoints = user.points + points;
      const newLevel = Math.floor(newPoints / 100) + 1;

      return this.updateUserProfile(userId, {
        completedTasks,
        points: newPoints,
        level: newLevel
      });
    }
    return Promise.resolve({ success: false, error: 'Benutzer nicht gefunden' }); // Return a promise to match the original return type
  },

  getCurrentUser() {
    return firebaseAuth.currentUser;
  }
};
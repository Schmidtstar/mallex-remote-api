
import { apiService } from './api';
import { firebaseAuth } from './firebase';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  points: number;
  level: number;
  completedTasks: string[];
  createdAt: Date;
  lastActive: Date;
}

export const userApi = {
  async ensureUserProfile(userId: string, userData: Partial<UserProfile>) {
    const existingUser = await apiService.getDocument<UserProfile>('users', userId);
    
    if (!existingUser.success) {
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
      
      return apiService.setDocument<UserProfile>('users', userId, newUser);
    }
    
    // Update last active
    return apiService.updateDocument<UserProfile>('users', userId, { 
      lastActive: new Date() 
    });
  },

  async getUserProfile(userId: string) {
    return apiService.getDocument<UserProfile>('users', userId);
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    return apiService.updateDocument<UserProfile>('users', userId, {
      ...updates,
      lastActive: new Date()
    });
  },

  async addPoints(userId: string, points: number) {
    const user = await this.getUserProfile(userId);
    if (user.success && user.data) {
      const newPoints = user.data.points + points;
      const newLevel = Math.floor(newPoints / 100) + 1;
      
      return this.updateUserProfile(userId, { 
        points: newPoints, 
        level: newLevel 
      });
    }
    return { success: false, error: 'Benutzer nicht gefunden' };
  },

  async completeTask(userId: string, taskId: string, points: number) {
    const user = await this.getUserProfile(userId);
    if (user.success && user.data) {
      const completedTasks = [...user.data.completedTasks, taskId];
      const newPoints = user.data.points + points;
      const newLevel = Math.floor(newPoints / 100) + 1;
      
      return this.updateUserProfile(userId, { 
        completedTasks,
        points: newPoints,
        level: newLevel
      });
    }
    return { success: false, error: 'Benutzer nicht gefunden' };
  },

  getCurrentUser() {
    return firebaseAuth.currentUser;
  }
};

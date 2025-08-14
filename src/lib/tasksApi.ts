import { apiService } from './api';
import { where, orderBy, collection, query, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase'; // Annahme: db ist hier exportiert

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  points: number;
  createdAt: Date;
  isActive: boolean;
}

export interface TaskSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  suggestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

// Neue Schnittstelle und Funktionen basierend auf der Analyse
export interface Task {
  id: string;
  category: string;
  description: string;
  text: string; // Legacy field für Kompatibilität
  approved: boolean;
  createdAt: Date | any; // Für Firebase Timestamp
  createdBy?: string;
}

export type CategoryKey = string;

export async function listApprovedTasks(): Promise<Task[]> {
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('approved', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      text: doc.data().description || doc.data().text // Fallback
    } as Task));
  } catch (error) {
    console.error('Error listing approved tasks:', error);
    return [];
  }
}

export async function createTaskApproved(task: Omit<Task, 'id' | 'createdAt'>): Promise<string> {
  try {
    const tasksRef = collection(db, 'tasks');
    const docRef = await addDoc(tasksRef, {
      ...task,
      createdAt: new Date(),
      approved: true
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating approved task:', error);
    throw error;
  }
}

// Bestehende apiService-Funktionen
export const tasksApi = {
  async getTasks(category?: string) {
    const conditions = [
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    ];

    if (category) {
      conditions.unshift(where('category', '==', category));
    }

    return apiService.getCollection<Task>('tasks', conditions);
  },

  async getTasksByCategory(category: string) {
    return this.getTasks(category);
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt'>) {
    const newTask = {
      ...task,
      createdAt: new Date(),
    };

    const taskId = `task_${Date.now()}`;
    return apiService.setDocument<Task>('tasks', taskId, newTask);
  },

  async updateTask(taskId: string, updates: Partial<Task>) {
    return apiService.updateDocument<Task>('tasks', taskId, updates);
  },

  async deleteTask(taskId: string) {
    return apiService.updateDocument<Task>('tasks', taskId, { isActive: false });
  },

  async getSuggestions() {
    const conditions = [orderBy('createdAt', 'desc')];
    return apiService.getCollection<TaskSuggestion>('taskSuggestions', conditions);
  },

  async createSuggestion(suggestion: Omit<TaskSuggestion, 'id' | 'createdAt'>) {
    const newSuggestion = {
      ...suggestion,
      createdAt: new Date(),
      status: 'pending' as const,
    };

    const suggestionId = `suggestion_${Date.now()}`;
    return apiService.setDocument<TaskSuggestion>('taskSuggestions', suggestionId, newSuggestion);
  },

  async updateSuggestion(suggestionId: string, updates: Partial<TaskSuggestion>) {
    return apiService.updateDocument<TaskSuggestion>('taskSuggestions', suggestionId, updates);
  },

  subscribeToTasks(callback: (tasks: Task[]) => void, category?: string) {
    const conditions = [
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    ];

    if (category) {
      conditions.unshift(where('category', '==', category));
    }

    return apiService.subscribeToCollection<Task>('tasks', callback, conditions);
  },

  subscribeToSuggestions(callback: (suggestions: TaskSuggestion[]) => void) {
    const conditions = [orderBy('createdAt', 'desc')];
    return apiService.subscribeToCollection<TaskSuggestion>('taskSuggestions', callback, conditions);
  }
};
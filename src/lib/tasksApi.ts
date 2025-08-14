
import { apiService } from './api';
import { where, orderBy } from 'firebase/firestore';

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

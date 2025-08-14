import { firestore, firebaseAuth } from './firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private handleError(error: any): string {
    console.error('API Error:', error);

    if (error.code === 'permission-denied') {
      return 'Zugriff verweigert. Bitte überprüfen Sie Ihre Berechtigung.';
    }
    if (error.code === 'failed-precondition') {
      return 'Firestore-Regeln verhindern diese Aktion.';
    }
    if (error.code === 'unavailable') {
      return 'Service temporär nicht verfügbar.';
    }

    return error.message || 'Ein unbekannter Fehler ist aufgetreten.';
  }

  async getCollection<T>(collectionName: string, conditions?: any[]): Promise<ApiResponse<T[]>> {
    try {
      let q = collection(firestore, collectionName);

      if (conditions) {
        conditions.forEach(condition => {
          q = query(q, condition);
        });
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);

      return { success: true, data };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  async getDocument<T>(collectionName: string, docId: string): Promise<ApiResponse<T>> {
    try {
      const docRef = doc(firestore, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: false, error: 'Dokument nicht gefunden' };
      }

      const data = { id: docSnap.id, ...docSnap.data() } as T;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  async setDocument<T>(collectionName: string, docId: string, data: Partial<T>): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(firestore, collectionName, docId);
      await setDoc(docRef, data, { merge: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  async updateDocument<T>(collectionName: string, docId: string, data: Partial<T>): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(firestore, collectionName, docId);
      await updateDoc(docRef, data);
      return { success: true };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  async deleteDocument(collectionName: string, docId: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(firestore, collectionName, docId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  subscribeToCollection<T>(
    collectionName: string, 
    callback: (data: T[]) => void,
    conditions?: any[]
  ): () => void {
    let q = collection(firestore, collectionName);

    if (conditions) {
      conditions.forEach(condition => {
        q = query(q, condition);
      });
    }

    return onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
        callback(data);
      },
      (error) => {
        console.error(`Error in ${collectionName} subscription:`, error);
      }
    );
  }
}

export const apiService = new ApiService();
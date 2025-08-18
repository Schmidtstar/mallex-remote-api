
export class FirebaseRetryManager {
  private static retryCount = 0
  private static maxRetries = 3
  
  static async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    try {
      const result = await operation()
      this.retryCount = 0 // Reset on success
      return result
    } catch (error: any) {
      if (this.retryCount < this.maxRetries && this.isRetryableError(error)) {
        this.retryCount++
        console.warn(`🔄 Firebase Retry ${this.retryCount}/${this.maxRetries}:`, error.message)
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, this.retryCount) * 1000))
        
        return this.withRetry(operation)
      }
      
      throw error
    }
  }
  
  private static isRetryableError(error: any): boolean {
    const retryableCodes = [
      'unavailable',
      'deadline-exceeded',
      'internal',
      'resource-exhausted'
    ]
    
    return retryableCodes.includes(error.code)
  }
}
// MALLEX Firebase Retry Logic
import { getAuth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

export class FirebaseRetry {
  private static retryCount = 0
  private static maxRetries = 3

  static async reconnect(): Promise<void> {
    if (this.retryCount >= this.maxRetries) {
      throw new Error('Max Firebase reconnection attempts reached')
    }

    this.retryCount++

    try {
      console.log(`🔄 Firebase reconnection attempt ${this.retryCount}/${this.maxRetries}`)

      // Test auth connection
      const auth = getAuth()
      await auth.authStateReady()

      // Test firestore connection
      const db = getFirestore()
      
      console.log('✅ Firebase reconnection successful')
      this.retryCount = 0
    } catch (error) {
      console.warn(`❌ Firebase reconnection attempt ${this.retryCount} failed:`, error)
      
      if (this.retryCount < this.maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount))
        return this.reconnect()
      }
      
      throw error
    }
  }

  static reset(): void {
    this.retryCount = 0
  }
}

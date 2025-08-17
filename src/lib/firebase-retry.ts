
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

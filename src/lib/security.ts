
export class SecurityManager {
  // Input Sanitization
  static sanitizeUserInput(input: string): string {
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove dangerous characters
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/data:/gi, '') // Remove data: protocols
      .substring(0, 50) // Limit length
  }
  
  // XSS Protection
  static isSecureInput(input: string): boolean {
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /onclick/i,
      /onerror/i,
      /onload/i,
      /eval\(/i,
      /expression\(/i,
      /vbscript:/i,
      /data:text\/html/i
    ]
    
    return !dangerousPatterns.some(pattern => pattern.test(input))
  }
  
  // Rate Limiting für User Actions
  private static actionTimestamps = new Map<string, number[]>()
  
  static isRateLimited(action: string, maxActions = 10, windowMs = 60000): boolean {
    const now = Date.now()
    const timestamps = this.actionTimestamps.get(action) || []
    
    // Filter recent actions
    const recentTimestamps = timestamps.filter(ts => now - ts < windowMs)
    
    if (recentTimestamps.length >= maxActions) {
      return true
    }
    
    recentTimestamps.push(now)
    this.actionTimestamps.set(action, recentTimestamps)
    return false
  }
  
  // Content Security Policy Headers (für Production)
  static getCSPHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://www.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'"
      ].join('; ')
    }
  }
}

// Error Boundary für Security Events
export const securityLogger = {
  logSecurityEvent: (event: string, details: any) => {
    if (import.meta.env.PROD) {
      // In Production: Send to monitoring service
      console.warn(`🔒 Security Event: ${event}`, details)
    } else {
      console.log(`🔒 Security Event (DEV): ${event}`, details)
    }
  },
  
  logSuspiciousActivity: (activity: string, userAgent?: string) => {
    securityLogger.logSecurityEvent('suspicious_activity', {
      activity,
      userAgent: userAgent || navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    })
  }
}

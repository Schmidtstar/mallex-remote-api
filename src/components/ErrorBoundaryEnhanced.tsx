import React, { Component, ReactNode } from 'react'
import { performanceMonitor } from '../lib/performance-monitor'
import styles from './ErrorBoundaryEnhanced.module.css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  showReportDialog?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: any
  errorId: string
  retryCount: number
  lastErrorTime: number
}

export class ErrorBoundaryEnhanced extends Component<Props, State> {
  private maxRetries = 3
  private retryDelay = 1000

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      lastErrorTime: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      hasError: true,
      error,
      errorId,
      lastErrorTime: Date.now()
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 Error Boundary caught error:', error, errorInfo)

    // Defensive error tracking
    try {
      const { performanceMonitor } = require('../lib/performance-monitor')
      performanceMonitor?.trackError?.({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId
      })
    } catch (e) {
      console.warn('[ErrorBoundary] trackError unavailable:', e)
    }

    // Log to external service if available
    this.logErrorToService(error, errorInfo)

    this.setState({
      error,
      errorInfo
    })
  }

  private async logErrorToService(error: Error, errorInfo: any) {
    try {
      // Could integrate with services like Sentry, LogRocket, etc.
      console.log('📤 Logging error to external service')
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  private handleRetry = () => {
    const now = Date.now()
    const timeSinceLastError = now - this.state.lastErrorTime

    // Prevent retry spam
    if (timeSinceLastError < this.retryDelay) {
      console.log('⏱️ Please wait before retrying')
      return
    }

    if (this.state.retryCount >= this.maxRetries) {
      console.log('❌ Maximum retry attempts reached')
      return
    }

    console.log(`🔄 Retrying... (${this.state.retryCount + 1}/${this.maxRetries})`)

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      errorId: ''
    }))
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReportBug = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }

    // Copy to clipboard for easy reporting
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
    alert('Fehlerbericht wurde in die Zwischenablage kopiert!')
  }

  private getErrorType(): string {
    if (!this.state.error) return 'unknown'

    const message = this.state.error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      return 'network'
    } else if (message.includes('chunk') || message.includes('loading')) {
      return 'loading'
    } else if (message.includes('permission')) {
      return 'permission'
    }

    return 'runtime'
  }

  private getErrorSuggestion(): string {
    const errorType = this.getErrorType()

    switch (errorType) {
      case 'network':
        return 'Bitte überprüfen Sie Ihre Internetverbindung'
      case 'loading':
        return 'Ein Teil der App konnte nicht geladen werden'
      case 'permission':
        return 'Zugriffsberechtigung erforderlich'
      default:
        return 'Ein unerwarteter Fehler ist aufgetreten'
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const canRetry = this.state.retryCount < this.maxRetries
      const errorType = this.getErrorType()
      const suggestion = this.getErrorSuggestion()

      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>
              {errorType === 'network' ? '🌐' : 
               errorType === 'loading' ? '⏳' : 
               errorType === 'permission' ? '🔒' : '⚠️'}
            </div>

            <h2 className={styles.errorTitle}>
              Oops! Etwas ist schiefgegangen
            </h2>

            <p className={styles.errorMessage}>
              {suggestion}
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className={styles.errorDetails}>
                <summary>Technische Details (Development)</summary>
                <pre>{this.state.error?.stack}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}

            <div className={styles.errorActions}>
              {canRetry && (
                <button 
                  onClick={this.handleRetry}
                  className={styles.retryButton}
                >
                  🔄 Erneut versuchen ({this.maxRetries - this.state.retryCount} verbleibend)
                </button>
              )}

              <button 
                onClick={this.handleReload}
                className={styles.reloadButton}
              >
                🔃 Seite neu laden
              </button>

              {this.props.showReportDialog && (
                <button 
                  onClick={this.handleReportBug}
                  className={styles.reportButton}
                >
                  🐛 Fehler melden
                </button>
              )}
            </div>

            <div className={styles.errorId}>
              Fehler-ID: {this.state.errorId}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundaryEnhanced
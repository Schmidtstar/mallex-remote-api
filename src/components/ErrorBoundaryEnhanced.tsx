
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { CriticalErrorHandler, ErrorContext } from '../lib/error-handler'
import { MonitoringService } from '../lib/monitoring'
import s from './ErrorBoundaryEnhanced.module.css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  context?: Partial<ErrorContext>
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string | null
  isRecovering: boolean
  recoveryMessage: string
  retryCount: number
}

export class ErrorBoundaryEnhanced extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      isRecovering: false,
      recoveryMessage: '',
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context: ErrorContext = {
      severity: 'high',
      component: 'ErrorBoundary',
      action: 'react_error',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      },
      ...this.props.context
    }

    // Handle error through our system
    const recovery = await CriticalErrorHandler.handleError(error, context)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Attempt recovery if possible
    if (recovery.canRecover && this.state.retryCount < this.maxRetries) {
      this.setState({
        isRecovering: true,
        recoveryMessage: recovery.userMessage || 'Wird wiederhergestellt...'
      })

      try {
        if (recovery.recoveryAction) {
          await recovery.recoveryAction()
        }
        
        // Auto-retry after recovery
        setTimeout(() => {
          this.setState(prevState => ({
            hasError: false,
            error: null,
            isRecovering: false,
            recoveryMessage: '',
            retryCount: prevState.retryCount + 1
          }))
        }, 2000)

      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError)
        this.setState({
          isRecovering: false,
          recoveryMessage: 'Wiederherstellung fehlgeschlagen'
        })
      }
    }
  }

  handleManualRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      window.location.reload()
      return
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorId: null,
      isRecovering: false,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleReportError = async () => {
    if (!this.state.error || !this.state.errorId) return

    try {
      await MonitoringService.trackUserAction('error_reported_manually', {
        errorId: this.state.errorId,
        errorMessage: this.state.error.message,
        userAgent: navigator.userAgent
      })

      alert('✅ Fehler wurde gemeldet. Vielen Dank!')
    } catch (error) {
      console.error('Failed to report error:', error)
      alert('❌ Fehler konnte nicht gemeldet werden.')
    }
  }

  render() {
    if (this.state.hasError) {
      // Recovery in progress
      if (this.state.isRecovering) {
        return (
          <div className={s.container}>
            <div className={s.recovery}>
              <div className={s.spinner}></div>
              <h3>🔄 {this.state.recoveryMessage}</h3>
              <p>Bitte warten...</p>
            </div>
          </div>
        )
      }

      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className={s.container}>
          <div className={s.errorCard}>
            <div className={s.errorIcon}>💥</div>
            
            <h2>Ups! Etwas ist schiefgelaufen</h2>
            
            <div className={s.errorDetails}>
              <p><strong>Fehler-ID:</strong> {this.state.errorId}</p>
              <p><strong>Nachricht:</strong> {this.state.error?.message}</p>
              <p><strong>Versuche:</strong> {this.state.retryCount} / {this.maxRetries}</p>
            </div>

            <div className={s.actions}>
              <button 
                onClick={this.handleManualRetry}
                className={s.retryButton}
                disabled={this.state.retryCount >= this.maxRetries}
              >
                {this.state.retryCount >= this.maxRetries ? '🔄 Seite neu laden' : '🔄 Erneut versuchen'}
              </button>
              
              <button 
                onClick={this.handleReportError}
                className={s.reportButton}
              >
                📧 Fehler melden
              </button>
            </div>

            <details className={s.technicalDetails}>
              <summary>🔧 Technische Details</summary>
              <pre>{this.state.error?.stack}</pre>
            </details>

            <div className={s.helpText}>
              <p>💡 <strong>Was du tun kannst:</strong></p>
              <ul>
                <li>🔄 Versuche es in ein paar Sekunden erneut</li>
                <li>📶 Prüfe deine Internetverbindung</li>
                <li>🧹 Leere den Browser-Cache</li>
                <li>📱 Lade die Seite neu</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundaryEnhanced

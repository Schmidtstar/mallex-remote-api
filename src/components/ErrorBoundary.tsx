import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error | null
  errorId?: string
  retryCount: number; // Added retryCount to state
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    // Initialize retryCount to 0
    this.state = { hasError: false, retryCount: 0 }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0 // Reset retryCount when an error occurs
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error Boundary caught error:', error, errorInfo)

    // Special handling for lazy loading errors
    if (error.message.includes('No default value') || error.message.includes('Loading chunk')) {
      console.log('🔄 Lazy loading error detected - will attempt retry')
      // Reset state after a delay to allow retry
      setTimeout(() => {
        this.setState({ hasError: false, error: null })
      }, 1000)
    }

    // Track error with monitoring
    if (typeof window !== 'undefined') {
      import('../lib/monitoring').then(({ MonitoringService }) => {
        MonitoringService.trackError('error_boundary', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          isLazyLoadingError: error.message.includes('No default value')
        })
      }).catch(() => {
        console.warn('Monitoring service not available')
      })
    }
  }

  // Modified retry method to increment retryCount
  retry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined, retryCount: this.state.retryCount + 1 })
  }

  render() {
    if (this.state.hasError) {
      const isLazyError = this.state.error?.message.includes('No default value') ||
                         this.state.error?.message.includes('Loading chunk')

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '20px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(139,125,107,0.1), rgba(205,127,50,0.1))',
          borderRadius: 'var(--radius)',
          border: '2px solid var(--ancient-bronze)',
          margin: '20px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚱️</div>

          <h2 style={{
            color: 'var(--ancient-gold)',
            marginBottom: '1rem',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            🏛️ {isLazyError ? 'Komponente konnte nicht geladen werden' : 'Die Götter sind erzürnt!'} 🏛️
          </h2>

          <p style={{
            color: 'var(--ancient-bronze)',
            marginBottom: '2rem',
            fontSize: '1.1rem',
            lineHeight: '1.5',
            maxWidth: '400px'
          }}>
            {isLazyError ? 'Ein Problem beim Laden der Komponente ist aufgetreten.' : 'Ein unerwarteter Fehler ist aufgetreten. Die olympischen Geister arbeiten bereits an einer Lösung.'}
          </p>

          {import.meta.env.DEV && this.state.error && (
            <details style={{
              background: 'rgba(139,125,107,0.1)',
              padding: '1rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--ancient-stone)',
              marginBottom: '2rem',
              maxWidth: '600px',
              fontSize: '0.85rem',
              color: 'var(--ancient-stone)'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                🔍 Debug-Info (Development)
              </summary>
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                marginTop: '1rem',
                fontSize: '0.8rem'
              }}>
                {this.state.error.stack}
              </pre>
              <p style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                Error ID: {this.state.errorId}
              </p>
            </details>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={this.retry}
              style={{
                padding: '12px 24px',
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, var(--olympic-flame), var(--ancient-gold))',
                color: 'var(--ancient-night)',
                border: '2px solid var(--olympic-victory)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                boxShadow: '0 5px 15px rgba(255,107,53,0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,107,53,0.5)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(255,107,53,0.3)'
              }}
            >
              ⚡ Erneut versuchen ⚡
            </button>

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #4CAF50, #8BC34A)',
                color: 'white',
                border: '2px solid #388E3C',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                boxShadow: '0 5px 15px rgba(76,175,80,0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(76,175,80,0.5)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(76,175,80,0.3)'
              }}
            >
              🔄 Seite neu laden
            </button>
          </div>

          <p style={{
            marginTop: '1rem',
            fontSize: '0.9rem',
            color: 'var(--ancient-stone)',
            fontStyle: 'italic'
          }}>
            Falls das Problem bestehen bleibt, nutze die "Seite neu laden"-Option.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary }
export default ErrorBoundary
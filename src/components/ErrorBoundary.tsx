import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error caught by boundary:', error, errorInfo)

    // Additional error logging for Firebase/Firestore errors
    if (error.message.includes('permission-denied')) {
      console.error('🔒 Firebase permission error - check Firestore rules')
    }
    if (error.message.includes('Firebase')) {
      console.error('🔥 Firebase error detected - check configuration')
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div>
            <h2 style={{ margin: '0 0 1rem 0' }}>
              ⚠️ Fehler aufgetreten
            </h2>
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                borderRadius: '4px',
                border: '1px solid #ccc',
                background: '#f5f5f5'
              }}
            >
              Seite neu laden
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
import React, { Component, ReactNode } from 'react'

// Assuming styles are defined elsewhere, e.g., in a CSS module
// import styles from './ErrorBoundary.module.css'; 
// For demonstration, using inline styles similar to the original.

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
      // Mocking styles for demonstration, as they were not provided in the original snippet
      const styles = {
        container: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        },
        icon: {
          fontSize: '3rem',
          marginBottom: '1rem'
        },
        h2: {
          margin: '0 0 1rem 0'
        },
        button: {
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          borderRadius: '4px',
          border: '1px solid #ccc',
          background: '#f5f5f5',
          marginTop: '1rem'
        }
      };

      // Original error handling for ChunkLoadError
      if (error.name === 'ChunkLoadError') {
        return (
          <div style={styles.container}>
            <div style={styles.icon}>🔄</div>
            <h2 style={styles.h2}>App wird aktualisiert...</h2>
            <p>Bitte lade die Seite neu.</p>
            <button onClick={() => window.location.reload()} style={styles.button}>
              Neu laden
            </button>
          </div>
        )
      }

      // Firebase connection errors
      if (error.message?.includes('Firebase') || error.message?.includes('firestore')) {
        return (
          <div style={styles.container}>
            <div style={styles.icon}>🔥</div>
            <h2 style={styles.h2}>Verbindungsproblem</h2>
            <p>Firebase-Verbindung unterbrochen. App läuft im Offline-Modus.</p>
            <button onClick={() => window.location.reload()} style={styles.button}>
              Erneut versuchen
            </button>
          </div>
        )
      }

      // Default error fallback
      return (
        <div style={styles.container}>
          <div style={styles.icon}>⚠️</div>
          <h2 style={styles.h2}>Ein Fehler ist aufgetreten</h2>
          <p>Etwas ist schiefgelaufen. Bitte lade die Seite neu.</p>
          <button onClick={this.handleReload} style={styles.button}>
            Seite neu laden
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
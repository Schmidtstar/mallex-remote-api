
import React from 'react'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message = 'Laden...' 
}) => {
  const sizeClasses = {
    small: '24px',
    medium: '48px', 
    large: '72px'
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
      fontSize: '1rem',
      color: '#666',
      gap: '10px'
    }}>
      <div 
        style={{ 
          fontSize: sizeClasses[size],
          animation: 'pulse 1.5s ease-in-out infinite'
        }}
      >
        ⚡
      </div>
      <div>{message}</div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner

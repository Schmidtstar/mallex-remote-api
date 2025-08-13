
import React, { Suspense } from 'react'

interface LazyLoaderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const DefaultFallback = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '40vh',
    fontSize: '1rem',
    color: '#666',
    gap: '10px'
  }}>
    <div style={{ fontSize: '2rem' }}>⚡</div>
    <div>Laden...</div>
  </div>
)

export const LazyLoader: React.FC<LazyLoaderProps> = ({ 
  children, 
  fallback = <DefaultFallback /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}

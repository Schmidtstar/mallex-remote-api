import React from 'react'
import { SoundManager } from '../lib/sound-manager'

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
  skipSound?: boolean
}

export function ModernButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  children,
  disabled,
  className = '',
  skipSound = false,
  ...props
}: ModernButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' && `btn-${size}`,
    fullWidth && 'btn-full',
    loading && 'btn-loading',
    className
  ].filter(Boolean).join(' ')

  const handleClick = () => {
    if (!disabled) {
      if (!skipSound) {
        SoundManager.playButtonClick()
      }
      props.onClick?.()
    }
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {icon && !loading && <span className="btn-icon">{icon}</span>}
      {!loading && children}
      {loading && <span>Lädt...</span>}
    </button>
  )
}
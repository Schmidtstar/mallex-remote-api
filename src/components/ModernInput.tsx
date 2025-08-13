
import React, { useState } from 'react'

interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  icon?: React.ReactNode
  onValidate?: (value: string) => string | undefined
}

export function ModernInput({
  label,
  error,
  success,
  icon,
  onValidate,
  className = '',
  onChange,
  ...props
}: ModernInputProps) {
  const [localError, setLocalError] = useState<string>()
  const [touched, setTouched] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (onValidate && touched) {
      setLocalError(onValidate(value))
    }
    onChange?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true)
    if (onValidate) {
      setLocalError(onValidate(e.target.value))
    }
    props.onBlur?.(e)
  }

  const displayError = error || localError
  const hasError = Boolean(displayError)
  const hasSuccess = Boolean(success && !hasError)

  const inputClasses = [
    'form-input',
    hasError && 'error',
    hasSuccess && 'success',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className="input-wrapper" style={{ position: 'relative' }}>
        <input
          className={inputClasses}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />
        {icon && (
          <span 
            className="input-icon" 
            style={{
              position: 'absolute',
              right: 'var(--space-4)',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--ancient-gold)'
            }}
          >
            {icon}
          </span>
        )}
      </div>
      {displayError && <div className="form-error">{displayError}</div>}
      {success && !hasError && <div className="form-success">{success}</div>}
    </div>
  )
}

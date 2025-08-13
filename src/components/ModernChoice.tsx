
import React from 'react'

interface ChoiceOption {
  value: string
  label: string
  description?: string
  icon?: string
}

interface ModernChoiceProps {
  options: ChoiceOption[]
  value: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  horizontal?: boolean
  name: string
  label?: string
}

export function ModernChoice({
  options,
  value,
  onChange,
  multiple = false,
  horizontal = false,
  name,
  label
}: ModernChoiceProps) {
  const handleOptionClick = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue]
      onChange(newValues)
    } else {
      onChange(optionValue)
    }
  }

  const isSelected = (optionValue: string) => {
    return multiple 
      ? Array.isArray(value) && value.includes(optionValue)
      : value === optionValue
  }

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className={`choice-group ${horizontal ? 'horizontal' : ''}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`choice-button ${isSelected(option.value) ? 'selected' : ''}`}
          >
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={name}
              value={option.value}
              checked={isSelected(option.value)}
              onChange={() => handleOptionClick(option.value)}
            />
            <div className={`choice-indicator ${!multiple ? 'radio' : ''}`}>
              {isSelected(option.value) && (multiple ? '✓' : '●')}
            </div>
            <div className="choice-content">
              <div className="choice-label">
                {option.icon && <span className="choice-icon">{option.icon}</span>}
                {option.label}
              </div>
              {option.description && (
                <div className="choice-description">{option.description}</div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}


import React from 'react'
import styles from './BurgerButton.module.css'

interface BurgerButtonProps {
  isOpen: boolean
  onClick: () => void
}

export default function BurgerButton({ isOpen, onClick }: BurgerButtonProps) {
  return (
    <button 
      className={styles.burgerButton}
      onClick={onClick}
      aria-label={isOpen ? "Menü schließen" : "Menü öffnen"}
    >
      <span className={`${styles.line} ${isOpen ? styles.open : ''}`}></span>
      <span className={`${styles.line} ${isOpen ? styles.open : ''}`}></span>
      <span className={`${styles.line} ${isOpen ? styles.open : ''}`}></span>
    </button>
  )
}

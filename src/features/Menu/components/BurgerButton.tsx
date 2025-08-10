import React from 'react';
import { useUI } from '../../../context/UIContext';
import styles from './BurgerButton.module.css';

interface BurgerButtonProps {
  className?: string;
}

export function BurgerButton({ className }: BurgerButtonProps) {
  const { toggleDrawer } = useUI();

  return (
    <button
      className={`${styles.burgerButton} ${className || ''}`}
      onClick={toggleDrawer}
      aria-label="Open menu"
    >
      <span className={styles.burgerLine}></span>
      <span className={styles.burgerLine}></span>
      <span className={styles.burgerLine}></span>
    </button>
  );
};
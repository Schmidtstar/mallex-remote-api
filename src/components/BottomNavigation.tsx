// src/components/BottomNavigation.tsx
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useRef, useState } from 'react';
import { HamburgerMenu } from './HamburgerMenu'
import { NotificationCenter } from './NotificationCenter'
import { useAuth } from '../context/AuthContext'
import styles from "./BottomNavigation.module.css";

type Props = { openMenu: () => void };

export default function BottomNavigation({ openMenu }: Props) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();


  const goArena = useCallback(() => nav("/arena"), [nav]);
  const goLegends = useCallback(() => nav("/legends"), [nav]);
  const open = useCallback(() => openMenu(), [openMenu]);

  return (
    <nav className={styles.nav}>
      <button
        className={styles.item}
        data-active={pathname.startsWith("/arena") || undefined}
        onClick={goArena}
        aria-label="Olympische Arena"
      >
        <span className={styles.icon}>⚔️</span>
        <span className={styles.label}>Arena</span>
      </button>

      <button
        className={styles.item}
        data-active={pathname.startsWith("/legends") || undefined}
        onClick={goLegends}
        aria-label="Halle der Legenden"
      >
        <span className={styles.icon}>🏆</span>
        <span className={styles.label}>Legenden</span>
      </button>

      <div className={styles.rightSection}>
          <NotificationCenter />
          <button
            ref={hamburgerRef}
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t('menu.toggle')}
            aria-expanded={menuOpen}
          >
            ☰
          </button>
        </div>
    </nav>
  );
}
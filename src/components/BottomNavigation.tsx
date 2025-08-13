// src/components/BottomNavigation.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback } from "react";
import styles from "./BottomNavigation.module.css";

type Props = { openMenu: () => void };

export default function BottomNavigation({ openMenu }: Props) {
  const nav = useNavigate();
  const { pathname } = useLocation();


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

      <button
        className={styles.item}
        onClick={open}
        aria-label="Tempel-Menü öffnen"
      >
        <span className={styles.icon}>🏛️</span>
        <span className={styles.label}>Tempel</span>
      </button>
    </nav>
  );
}
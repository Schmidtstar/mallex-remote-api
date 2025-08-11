import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./HamburgerMenu.module.css";
// zentrale Menü-Konfiguration (bereits vorhanden)
import { menuItems } from "../config/menuItems";

export default function HamburgerMenu({
  isOpen,
  onClose,
  anchorLabel = "Open menu",
}: {
  isOpen: boolean;
  onClose: () => void;
  anchorLabel?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Refs für Fokus-Management
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Body-Scroll sperren/entsperren
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow || "";
    }
    return () => {
      document.body.style.overflow = originalOverflow || "";
    };
  }, [isOpen]);

  // Fokus rein/raus + Trap
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusables = drawer.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    // Öffnen → Fokus auf ersten Fokusziel
    (first || drawer).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && focusables.length > 0) {
        // Fokus-Trap
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Fokus zurück zum Trigger
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  // Route-Wechsel → Drawer schließen
  useEffect(() => {
    if (isOpen) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleNavigate = useCallback(
    (to: string | undefined, action?: () => void) => {
      if (action) action(); // z.B. Logout
      if (to) navigate(to);
      onClose();
    },
    [navigate, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className={styles.root}
      aria-hidden={!isOpen}
      data-open={isOpen ? "true" : "false"}
    >
      <button
        className={styles.backdrop}
        aria-label={t("menu.close") ?? "Close menu"}
        onClick={onClose}
      />
      <div
        ref={drawerRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-title"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id="menu-title" className={styles.title}>
            {t("menu.title") ?? "Menü"}
          </h2>
          <button
            className={styles.close}
            onClick={onClose}
            aria-label={t("menu.close") ?? "Close"}
          >
            ×
          </button>
        </div>

        <nav className={styles.nav} aria-label={t("menu.title") ?? "Menu"}>
          {menuItems.map((group) => (
            <div key={group.key} className={styles.group}>
              {group.items.map((item) => {
                // gating (z. B. admin/guest) kann bereits in menuItems berechnet sein
                if (item.hidden) return null;

                return (
                  <button
                    key={item.key}
                    className={styles.item}
                    onClick={() => handleNavigate(item.to, item.onClick)}
                  >
                    <span className={styles.icon} aria-hidden="true">
                      {item.icon ?? "•"}
                    </span>
                    <span className={styles.label}>
                      {t(item.labelKey) ?? item.fallbackLabel ?? item.key}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
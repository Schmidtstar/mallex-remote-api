import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { menuItems, type MenuItem } from '../config/menuItems';
import styles from './AppDrawer.module.css';

export const AppDrawer: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDrawerOpen, closeDrawer } = useUI();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  const getUserRole = () => {
    if (isAdmin) return 'admin';
    if (user) return 'user';
    return 'guest';
  };

  const userRole = getUserRole();

  const filteredMenuItems = menuItems.filter((item: MenuItem) => {
    // If no roles specified, show to everyone
    if (!item.roles || item.roles.length === 0) return true;

    // If visible is explicitly set to false, hide item
    if (item.visible === false) return false;

    // Check if user role is in allowed roles
    return item.roles.includes(userRole);
  });

  const handleItemClick = (route: string) => {
    navigate(route);
    closeDrawer();
  };

  const handleOverlayClick = () => {
    closeDrawer();
  };

  if (!isDrawerOpen) {
    return null;
  }

  return (
    <div className={styles.drawerOverlay} onClick={handleOverlayClick}>
      <div 
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>{t('navigation.menu')}</h2>
          <button 
            className={styles.closeButton}
            onClick={closeDrawer}
            aria-label={t('navigation.close')}
          >
            ✕
          </button>
        </div>

        <nav className={styles.drawerContent}>
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              className={styles.menuItem}
              onClick={() => handleItemClick(item.route)}
            >
              {item.icon && (
                <span className={styles.menuIcon}>{item.icon}</span>
              )}
              <span className={styles.menuLabel}>
                {t(item.labelKey)}
              </span>
            </button>
          ))}
        </nav>

        {user && (
          <div className={styles.drawerFooter}>
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>
                {user.email || t('auth.anonymous')}
              </span>
              {isAdmin && (
                <span className={styles.adminBadge}>
                  {t('navigation.admin.badge')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
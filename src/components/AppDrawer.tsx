
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { menuItems, MenuItem } from '../features/Menu/menuItems';
import styles from './AppDrawer.module.css';

export const AppDrawer: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDrawerOpen, closeDrawer } = useUI();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  const filteredMenuItems = menuItems.filter((item: MenuItem) => {
    if (item.roles.includes('admin') && !isAdmin) {
      return false;
    }
    return true;
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

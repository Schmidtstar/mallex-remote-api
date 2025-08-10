
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../context/AdminContext';
import SettingsTab from './tabs/SettingsTab';
import ProfileTab from './tabs/ProfileTab';
import TasksTab from './tabs/TasksTab';
import SuggestTab from './tabs/SuggestTab';
import AdminTab from './tabs/AdminTab';

type TabId = 'settings' | 'profile' | 'tasks' | 'suggest' | 'admin';

interface TabConfig {
  id: TabId;
  labelKey: string;
  component: React.ComponentType;
  adminOnly?: boolean;
}

export default function MenuScreen() {
  const { t } = useTranslation();
  const { isAdmin, localAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState<TabId>('settings');

  const tabs: TabConfig[] = [
    { id: 'settings', labelKey: 'menu.tabs.settings', component: SettingsTab },
    { id: 'profile', labelKey: 'menu.tabs.profile', component: ProfileTab },
    { id: 'tasks', labelKey: 'menu.tabs.tasks', component: TasksTab },
    { id: 'suggest', labelKey: 'menu.tabs.suggest', component: SuggestTab },
    { id: 'admin', labelKey: 'menu.tabs.admin', component: AdminTab, adminOnly: true },
  ];

  const visibleTabs = tabs.filter(tab => 
    !tab.adminOnly || isAdmin || localAdmin
  );

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SettingsTab;

  return (
    <div className="menu-screen">
      <header className="menu-header">
        <h1>{t('menu.title')}</h1>
      </header>

      <nav className="menu-tabs">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </nav>

      <main className="menu-content">
        <ActiveComponent />
      </main>

      <style jsx>{`
        .menu-screen {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 600px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .menu-header {
          text-align: center;
          padding: 1rem 0;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .menu-header h1 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: bold;
        }

        .menu-tabs {
          display: flex;
          background: var(--background-secondary, #f8f9fa);
          border-radius: 8px;
          padding: 4px;
          margin: 1rem 0;
          overflow-x: auto;
        }

        .tab-button {
          flex: 1;
          min-width: 80px;
          padding: 0.75rem 1rem;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          font-size: 0.9rem;
        }

        .tab-button:hover {
          background: var(--background-hover, #e9ecef);
        }

        .tab-button.active {
          background: var(--primary-color, #007bff);
          color: white;
        }

        .menu-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 0;
        }
      `}</style>
    </div>
  );
}

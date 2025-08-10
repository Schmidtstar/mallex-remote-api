import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdmin } from '../../context/AdminContext'

import SettingsTab from './tabs/SettingsTab'
import ProfileTab from './tabs/ProfileTab'
import TasksTab from './tabs/TasksTab'
import SuggestTab from './tabs/SuggestTab'
import AdminTab from './tabs/AdminTab'

type TabKey = 'settings' | 'profile' | 'tasks' | 'suggest' | 'admin'

export default function MenuScreen() {
  const { t } = useTranslation()
  const { isAdmin } = useAdmin()
  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  const tabs: Array<{ key: TabKey; label: string; component: React.ReactNode; adminOnly?: boolean }> = [
    { key: 'settings', label: t('menu.tabs.settings'), component: <SettingsTab /> },
    { key: 'profile', label: t('menu.tabs.profile'), component: <ProfileTab /> },
    { key: 'tasks', label: t('menu.tabs.tasks'), component: <TasksTab /> },
    { key: 'suggest', label: t('menu.tabs.suggest'), component: <SuggestTab /> },
    { key: 'admin', label: t('menu.tabs.admin'), component: <AdminTab />, adminOnly: true },
  ]

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || isAdmin)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Tab navigation */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--glass)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--stroke)',
        overflowX: 'auto'
      }}>
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: '1 1 auto',
              minWidth: 'fit-content',
              padding: '12px 16px',
              backgroundColor: activeTab === tab.key ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.key ? 'var(--bg)' : 'var(--fg)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? 600 : 400,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {visibleTabs.find(tab => tab.key === activeTab)?.component}
      </div>
    </div>
  )
}
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdmin } from '../../context/AdminContext'
import { useTaskSuggestions } from '../../context/TaskSuggestionsContext'
import { ProfileTab } from './tabs/ProfileTab'
import { SettingsTab } from './tabs/SettingsTab'
import { TasksTab } from './tabs/TasksTab'
import { SuggestTab } from './tabs/SuggestTab'
import { AdminTab } from './tabs/AdminTab'

export function MenuScreen() {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const { localAdmin } = useTaskSuggestions();
  const [activeTab, setActiveTab] = useState<'settings' | 'profile' | 'tasks' | 'suggest' | 'admin' | 'leaderboard' | 'rules' | 'about' | 'dev'>('settings')

  const menuTabs = [
    { id: 'settings', label: t('menu.tabs.settings'), icon: '⚙️' },
    { id: 'profile', label: t('menu.tabs.profile'), icon: '👤' },
    { id: 'tasks', label: t('menu.tabs.tasks'), icon: '✅' },
    { id: 'suggest', label: t('menu.tabs.suggest'), icon: '💡' },
    ...(isAdmin ? [{ id: 'admin', label: t('menu.tabs.admin'), icon: '🛠️' }] : []),
    { id: 'leaderboard', label: t('menu.tabs.leaderboard'), icon: '🏆' },
    { id: 'rules', label: t('menu.tabs.rules'), icon: '📋' },
    { id: 'about', label: t('menu.tabs.about'), icon: 'ℹ️' },
    ...(localAdmin ? [{ id: 'dev', label: t('menu.tabs.dev'), icon: '🔧' }] : [])
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return <SettingsTab />
      case 'profile':
        return <ProfileTab />
      case 'tasks':
        return <TasksTab />
      case 'suggest':
        return <SuggestTab />
      case 'admin':
        return isAdmin ? <AdminTab /> : null
      case 'leaderboard':
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--fg)' }}>
          {t('menu.tabs.leaderboard')} - Coming Soon
        </div>
      case 'rules':
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--fg)' }}>
          {t('menu.tabs.rules')} - Coming Soon
        </div>
      case 'about':
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--fg)' }}>
          {t('menu.tabs.about')} - Coming Soon
        </div>
      case 'dev':
        return localAdmin ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--fg)' }}>
          {t('menu.tabs.dev')} - Coming Soon
        </div> : null
      default:
        return <SettingsTab />
    }
  }

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '800px', 
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '10px'
      }}>
        {menuTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--fg)',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  )
}
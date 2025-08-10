import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdmin } from '../../context/AdminContext'
import { useTaskSuggestions } from '../../context/TaskSuggestionsContext'
import ProfileTab from './tabs/ProfileTab'
import SettingsTab from './tabs/SettingsTab'
import TasksTab from './tabs/TasksTab'
import SuggestTab from './tabs/SuggestTab'
import AdminTab from './tabs/AdminTab'

export default function MenuScreen() {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const { localAdmin } = useTaskSuggestions();
  const [activeTab, setActiveTab] = useState<'settings' | 'profile' | 'tasks' | 'suggest' | 'admin' | 'leaderboard' | 'rules' | 'about' | 'dev'>('settings')

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
      <h1 style={{ 
        fontSize: '2rem', 
        color: 'var(--fg)',
        margin: 0,
        marginBottom: '2rem'
      }}>
        {t('menu.title') || 'Menü'}
      </h1>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  )
}
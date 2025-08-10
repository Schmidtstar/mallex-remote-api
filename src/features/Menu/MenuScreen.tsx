import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdmin } from '../../context/AdminContext'
import { useTaskSuggestions } from '../../context/TaskSuggestionsContext'
import ProfileTab from './tabs/ProfileTab'
import SettingsTab from './tabs/SettingsTab'
import TasksTab from './tabs/TasksTab'
import SuggestTab from './tabs/SuggestTab'
import AdminTab from './tabs/AdminTab'
import BurgerButton from './components/BurgerButton'
import MobileDrawer, { NavItem } from './components/MobileDrawer'

export default function MenuScreen() {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const { localAdmin } = useTaskSuggestions();
  const [activeTab, setActiveTab] = useState<'settings' | 'profile' | 'tasks' | 'suggest' | 'admin' | 'leaderboard' | 'rules' | 'about' | 'dev'>('settings')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navItems: NavItem[] = useMemo(() => [
    {
      key: 'settings',
      labelKey: 'menu.tabs.settings',
      onClick: () => { setActiveTab('settings'); setDrawerOpen(false) }
    },
    {
      key: 'profile',
      labelKey: 'menu.tabs.profile',
      onClick: () => { setActiveTab('profile'); setDrawerOpen(false) }
    },
    {
      key: 'tasks',
      labelKey: 'menu.tabs.tasks',
      onClick: () => { setActiveTab('tasks'); setDrawerOpen(false) }
    },
    {
      key: 'suggest',
      labelKey: 'menu.tabs.suggest',
      onClick: () => { setActiveTab('suggest'); setDrawerOpen(false) }
    },
    {
      key: 'leaderboard',
      labelKey: 'menu.tabs.leaderboard',
      onClick: () => { setActiveTab('leaderboard'); setDrawerOpen(false) }
    },
    {
      key: 'rules',
      labelKey: 'menu.tabs.rules',
      onClick: () => { setActiveTab('rules'); setDrawerOpen(false) }
    },
    {
      key: 'about',
      labelKey: 'menu.tabs.about',
      onClick: () => { setActiveTab('about'); setDrawerOpen(false) }
    },
    {
      key: 'dev',
      labelKey: 'menu.tabs.dev',
      onClick: () => { setActiveTab('dev'); setDrawerOpen(false) },
      visible: localAdmin
    },
    {
      key: 'admin',
      labelKey: 'menu.tabs.admin',
      onClick: () => { setActiveTab('admin'); setDrawerOpen(false) },
      visible: isAdmin
    }
  ], [isAdmin, localAdmin])

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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          color: 'var(--fg)',
          margin: 0
        }}>
          {t('menu.title', 'Menü')}
        </h1>

        {/* Mobile Burger Button */}
        <div>
          <BurgerButton 
            isOpen={drawerOpen}
            onClick={() => setDrawerOpen(!drawerOpen)}
          />
        </div>
      </div>

      

      {/* Mobile Drawer */}
      <MobileDrawer 
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={navItems}
      />

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  )
}
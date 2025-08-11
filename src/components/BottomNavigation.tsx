import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { menuGroups } from '../config/menuItems'

export function BottomNavigation() {
  const { t } = useTranslation()

  // Get main navigation items (Arena, Legends)
  const mainNavItems = menuGroups.flatMap(group => 
    group.items.filter(item => 
      ['arena', 'legends'].includes(item.key)
    )
  )

  return (
    <nav className="bottom-nav">
      {mainNavItems.map(item => (
        <NavLink key={item.key} to={item.path || '/'}>
          {t(`menu.${item.key}`)}
        </NavLink>
      ))}
      <NavLink to="/menu">{t('navigation.menu')}</NavLink>
    </nav>
  )
}
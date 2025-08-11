import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { menuGroups } from '../config/menuItems'

export function BottomNavigation() {
  const { t } = useTranslation()

  // Get main navigation items (Arena, Legends)
  const mainNavItems = menuGroups.flatMap(group => 
    group.items.filter(item => 
      ['arena', 'legends'].includes(item.id)
    )
  )

  return (
    <nav className="bottom-nav">
      {mainNavItems.map(item => (
        <NavLink key={item.id} to={item.route || '/'}>
          {t(item.labelKey)}
        </NavLink>
      ))}
      <NavLink to="/menu">{t('navigation.menu')}</NavLink>
    </nav>
  )
}
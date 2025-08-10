
<old_str>import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function BottomNavigation() {
  const { t } = useTranslation()
  return (
    <nav className="bottom-nav">
      <NavLink to="/arena">{t('tabs.arena')}</NavLink>
      <NavLink to="/legends">{t('tabs.legends')}</NavLink>
      <NavLink to="/menu">{t('tabs.menu')}</NavLink>
    </nav>
  )
}</old_str>
<new_str>import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { menuItems } from '../config/menuItems'

export default function BottomNavigation() {
  const { t } = useTranslation()
  
  // Get main navigation items (Arena, Legends, Menu)
  const mainNavItems = menuItems.filter(item => 
    ['arena', 'legends'].includes(item.id)
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
}</new_str>

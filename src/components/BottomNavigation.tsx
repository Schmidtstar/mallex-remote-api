import React from 'react'
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
}

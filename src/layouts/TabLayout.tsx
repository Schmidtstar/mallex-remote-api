import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import { useSwipe } from '../hooks/useSwipe'

const tabs = ['/arena','/legends','/menu']

export default function TabLayout() {
  const nav = useNavigate()
  const loc = useLocation()
  const path = loc.pathname === '/' ? '/arena' : loc.pathname
  const idx = Math.max(0, tabs.indexOf(path))

  const swipe = useSwipe<HTMLDivElement>({
    onSwipeLeft: () => {
      const next = tabs[Math.min(tabs.length - 1, idx + 1)]
      if (next && next !== path) nav(next)
    },
    onSwipeRight: () => {
      const prev = tabs[Math.max(0, idx - 1)]
      if (prev && prev !== path) nav(prev)
    }
  })

  return (
    <div className="app-shell">
      <main className="app-content" {...swipe}>
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  )
}

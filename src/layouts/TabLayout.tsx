import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation'
import { useSwipe } from '../hooks/useSwipe'

const tabs = ['/arena','/legends','/menu']

export default function TabLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentIndex = tabs.indexOf(location.pathname)

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (isTransitioning) return

      const nextIndex = currentIndex + 1
      if (nextIndex < tabs.length) {
        setIsTransitioning(true)
        setTimeout(() => {
          navigate(tabs[nextIndex])
          setIsTransitioning(false)
        }, 150)
      }
    },
    onSwipeRight: () => {
      if (isTransitioning) return

      const prevIndex = currentIndex - 1
      if (prevIndex >= 0) {
        setIsTransitioning(true)
        setTimeout(() => {
          navigate(tabs[prevIndex])
          setIsTransitioning(false)
        }, 150)
      }
    }
  })

  return (
    <div {...swipeHandlers} style={styles.container}>
      <main style={{
        ...styles.main,
        opacity: isTransitioning ? 0.7 : 1,
        transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
        transition: 'all 0.15s ease-out'
      }}>
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  )
}

import { useCallback, useEffect } from 'react'

interface SwipeConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  minSwipeDistance?: number
}

export const useSwipe = ({ onSwipeLeft, onSwipeRight, minSwipeDistance = 50 }: SwipeConfig) => {
  let touchStartX = 0
  let touchEndX = 0

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX = e.changedTouches[0].screenX
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    touchEndX = e.changedTouches[0].screenX
    handleSwipe()
  }, [onSwipeLeft, onSwipeRight, minSwipeDistance])

  const handleSwipe = useCallback(() => {
    const swipeDistance = touchEndX - touchStartX
    
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (swipeDistance < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    }
  }, [onSwipeLeft, onSwipeRight, minSwipeDistance, touchStartX, touchEndX])

  const bindSwipe = useCallback(() => {
    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchEnd])

  return { bindSwipe }
}

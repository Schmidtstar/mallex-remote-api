
import { useRef, useState } from 'react'

type PullToRefreshOptions = {
  onRefresh: () => Promise<void> | void
  threshold?: number
  maxPullDistance?: number
}

export function usePullToRefresh<T extends HTMLElement>({ 
  onRefresh, 
  threshold = 80, 
  maxPullDistance = 120 
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef<number | null>(null)
  const isRefreshing = useRef(false)

  const handleTouchStart = (e: React.TouchEvent<T>) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent<T>) => {
    if (startY.current === null || window.scrollY > 0 || isRefreshing.current) return
    
    const currentY = e.touches[0].clientY
    const distance = Math.min(currentY - startY.current, maxPullDistance)
    
    if (distance > 0) {
      e.preventDefault()
      setPullDistance(distance)
      setIsPulling(distance > threshold)
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > threshold && !isRefreshing.current) {
      isRefreshing.current = true
      setIsPulling(true)
      try {
        await onRefresh()
      } finally {
        isRefreshing.current = false
      }
    }
    
    setIsPulling(false)
    setPullDistance(0)
    startY.current = null
  }

  return {
    pullToRefreshProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    isPulling,
    pullDistance
  }
}

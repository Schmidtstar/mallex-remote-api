import { useState, useEffect, useRef, TouchEvent } from 'react'

interface SwipeConfig {
  threshold: number
  velocity: number
  enableHaptics: boolean
  preventScroll: boolean
}

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeStart?: (e: TouchEvent) => void
  onSwipeMove?: (e: TouchEvent, deltaX: number, deltaY: number) => void
  onSwipeEnd?: () => void
}

interface SwipeState {
  isSwiping: boolean
  direction: 'left' | 'right' | 'up' | 'down' | null
  deltaX: number
  deltaY: number
  velocity: number
}

export function useSwipe(
  handlers: SwipeHandlers = {},
  config: Partial<SwipeConfig> = {}
) {
  const defaultConfig: SwipeConfig = {
    threshold: 50,
    velocity: 0.3,
    enableHaptics: true,
    preventScroll: false
  }

  const finalConfig = { ...defaultConfig, ...config }

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    deltaX: 0,
    deltaY: 0,
    velocity: 0
  })

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  // Haptic Feedback
  const triggerHapticFeedback = async (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!finalConfig.enableHaptics) return

    try {
      if ('vibrate' in navigator && navigator.vibrate) {
        const duration = { light: 50, medium: 100, heavy: 200 }[style]
        navigator.vibrate(duration)
      }
    } catch (error) {
      // Silent fail for haptic feedback
    }
  }

  // Touch event handlers
  const handleTouchStart = (e: TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    setSwipeState(prev => ({
      ...prev,
      isSwiping: true,
      direction: null,
      deltaX: 0,
      deltaY: 0
    }))

    if (handlers.onSwipeStart) {
      handlers.onSwipeStart(e)
    }

    if (finalConfig.preventScroll) {
      e.preventDefault()
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStartRef.current || !e.touches || e.touches.length === 0) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const timeElapsed = Date.now() - touchStartRef.current.time
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = timeElapsed > 0 ? distance / timeElapsed : 0

    let direction: SwipeState['direction'] = null
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left'
    } else {
      direction = deltaY > 0 ? 'down' : 'up'
    }

    setSwipeState(prev => ({
      ...prev,
      deltaX,
      deltaY,
      velocity,
      direction
    }))

    if (handlers.onSwipeMove) {
      handlers.onSwipeMove(e, deltaX, deltaY)
    }

    if (finalConfig.preventScroll && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStartRef.current) return

    const deltaX = swipeState.deltaX
    const deltaY = swipeState.deltaY
    const velocity = swipeState.velocity

    const isValidSwipe =
      (Math.abs(deltaX) > finalConfig.threshold || Math.abs(deltaY) > finalConfig.threshold) &&
      velocity > finalConfig.velocity

    if (isValidSwipe) {
      triggerHapticFeedback('light')

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight()
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft()
        }
      } else {
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown()
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp()
        }
      }
    }

    setSwipeState({
      isSwiping: false,
      direction: null,
      deltaX: 0,
      deltaY: 0,
      velocity: 0
    })

    touchStartRef.current = null

    if (handlers.onSwipeEnd) {
      handlers.onSwipeEnd()
    }
  }

  // Mouse event handlers for desktop compatibility
  const handleMouseDown = (e: MouseEvent) => {
    const touchEvent = {
      touches: [{ clientX: e.clientX, clientY: e.clientY }]
    } as TouchEvent
    handleTouchStart(touchEvent)
  }

  const handleMouseMove = (e: MouseEvent) => {
    const touchEvent = {
      touches: [{ clientX: e.clientX, clientY: e.clientY }]
    } as TouchEvent
    handleTouchMove(touchEvent)
  }

  const handleMouseUp = () => {
    const touchEvent = {} as TouchEvent
    handleTouchEnd(touchEvent)
  }

  // Event listeners setup
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Touch events
    element.addEventListener('touchstart', handleTouchStart as any, { passive: true })
    element.addEventListener('touchmove', handleTouchMove as any, { passive: false })
    element.addEventListener('touchend', handleTouchEnd as any, { passive: true })

    // Mouse events for desktop
    element.addEventListener('mousedown', handleMouseDown as any, { passive: true })
    element.addEventListener('mousemove', handleMouseMove as any, { passive: true })
    element.addEventListener('mouseup', handleMouseUp as any, { passive: true })
    element.addEventListener('mouseleave', handleMouseUp as any, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as any)
      element.removeEventListener('touchmove', handleTouchMove as any)
      element.removeEventListener('touchend', handleTouchEnd as any)
      element.removeEventListener('mousedown', handleMouseDown as any)
      element.removeEventListener('mousemove', handleMouseMove as any)
      element.removeEventListener('mouseup', handleMouseUp as any)
      element.removeEventListener('mouseleave', handleMouseUp as any)
    }
  }, [handlers, finalConfig])

  // Utility functions
  const bindSwipe = (element: HTMLElement | null) => {
    elementRef.current = element
  }

  const getSwipeTransform = () => {
    if (!swipeState.isSwiping) return 'translateX(0)'

    if (Math.abs(swipeState.deltaX) > Math.abs(swipeState.deltaY)) {
      return `translateX(${swipeState.deltaX}px)`
    } else {
      return `translateY(${swipeState.deltaY}px)`
    }
  }

  return {
    // Event handlers for direct use
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,

    // State and utilities
    swipeDirection: swipeState.direction,
    isSwipeActive: swipeState.isSwiping,
    swipeDistance: Math.abs(swipeState.deltaX),
    swipeTransform: getSwipeTransform(),

    // Helper functions
    bindSwipe,
    getSwipeProgress: () => {
      if (!swipeState.isSwiping) return 0
      const distance = Math.sqrt(swipeState.deltaX ** 2 + swipeState.deltaY ** 2)
      return Math.min(distance / finalConfig.threshold, 1)
    },
    triggerHaptic: () => triggerHapticFeedback()
  }
}

// Pull-to-refresh hook
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  const swipeHandlers = {
    onSwipeMove: (e: TouchEvent, deltaX: number, deltaY: number) => {
      if (window.scrollY === 0 && deltaY > 0) {
        setPullDistance(Math.min(deltaY, 120))
      }
    },

    onSwipeEnd: async () => {
      if (pullDistance > 80 && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
        }
      } else {
        setPullDistance(0)
      }
    }
  }

  const { bindSwipe } = useSwipe(swipeHandlers, {
    threshold: 80,
    preventScroll: false
  })

  return {
    bindSwipe,
    isRefreshing,
    pullDistance,
    isPulling: pullDistance > 0
  }
}

// Global type declarations
declare global {
  interface Window {
    Capacitor?: {
      Plugins: {
        Haptics?: {
          impact: (options: { style: 'light' | 'medium' | 'heavy' }) => Promise<void>
        }
      }
    }
  }
}
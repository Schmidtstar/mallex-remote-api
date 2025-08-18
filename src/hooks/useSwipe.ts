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

  // Haptic Feedback (für native Apps)
  const triggerHapticFeedback = async (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!finalConfig.enableHaptics) return

    // Capacitor Haptics (wenn verfügbar)
    if (window.Capacitor && window.Capacitor.Plugins.Haptics) {
      try {
        await window.Capacitor.Plugins.Haptics.impact({ style })
      } catch (error) {
        console.debug('Haptic feedback not available')
      }
    }

    // Web Vibration API Fallback
    if ('vibrate' in navigator) {
      const duration = { light: 50, medium: 100, heavy: 200 }[style]
      navigator.vibrate(duration)
    }
  }

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
    if (!touchStartRef.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const timeElapsed = Date.now() - touchStartRef.current.time
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = timeElapsed > 0 ? distance / timeElapsed : 0

    // Bestimme Swipe-Richtung
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

    // Verhindere Scroll bei horizontalen Swipes
    if (finalConfig.preventScroll && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStartRef.current) return

    const deltaX = swipeState.deltaX
    const deltaY = swipeState.deltaY
    const velocity = swipeState.velocity

    // Prüfe ob Swipe-Threshold erreicht wurde
    const isValidSwipe =
      (Math.abs(deltaX) > finalConfig.threshold || Math.abs(deltaY) > finalConfig.threshold) &&
      velocity > finalConfig.velocity

    if (isValidSwipe) {
      // Trigger Haptic Feedback
      triggerHapticFeedback('light')

      // Bestimme und trigger Swipe-Handler
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal Swipe
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight()
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft()
        }
      } else {
        // Vertical Swipe
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown()
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp()
        }
      }
    }

    // Reset state
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

  // Mouse event handlers (defined before useEffect)
  const handleMouseDown = (e: MouseEvent) => {
    const touch = {
      clientX: e.clientX,
      clientY: e.clientY
    }
    const touchEvent = { touches: [touch] } as TouchEvent
    handleTouchStart(touchEvent)
  }

  const handleMouseMove = (e: MouseEvent) => {
    const touch = {
      clientX: e.clientX,
      clientY: e.clientY
    }
    const touchEvent = { touches: [touch] } as TouchEvent
    handleTouchMove(touchEvent)
  }

  const handleMouseUp = (e: MouseEvent) => {
    const touchEvent = {} as TouchEvent
    handleTouchEnd(touchEvent)
  }

  // Event Listeners Setup
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Check if touch events are supported
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    if (!isTouchDevice) return

    // Touch handlers with passive option for better performance
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return

      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y

      // Prevent scrolling if horizontal swipe is detected
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartRef.current.time

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const velocity = deltaTime > 0 ? distance / deltaTime : 0 // Added check for deltaTime > 0

      // Swipe detection thresholds
      if (distance > finalConfig.threshold && velocity > finalConfig.velocity && deltaTime < 500) { // Adjusted deltaTime check
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > 0 && handlers.onSwipeRight) {
            handlers.onSwipeRight()
          } else if (deltaX < 0 && handlers.onSwipeLeft) {
            handlers.onSwipeLeft()
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && handlers.onSwipeDown) {
            handlers.onSwipeDown()
          } else if (deltaY < 0 && handlers.onSwipeUp) {
            handlers.onSwipeUp()
          }
        }
      }

      // Reset state
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

    // Check if touch events are supported
    if ('ontouchstart' in window) {
      // Add event listeners with proper options
      element.addEventListener('touchstart', handleTouchStart, { passive: true })
      element.addEventListener('touchmove', handleTouchMove, { passive: false })
      element.addEventListener('touchend', handleTouchEnd, { passive: true })

      return () => {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchmove', handleTouchMove)
        element.removeEventListener('touchend', handleTouchEnd)
      }
    }

    // Mouse Events for Web compatibility
    element.addEventListener('mousedown', handleMouseDown, { passive: !finalConfig.preventScroll })
    element.addEventListener('mousemove', handleMouseMove, { passive: !finalConfig.preventScroll })
    element.addEventListener('mouseup', handleMouseUp, { passive: true })

    return () => {
      element.removeEventListener('mousedown', handleMouseDown)
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handlers, finalConfig])

  // Utility Functions
  const bindSwipe = (element: HTMLElement | null) => {
    elementRef.current = element
  }

  const isSwipingInDirection = (direction: 'left' | 'right' | 'up' | 'down') => {
    return swipeState.isSwiping && swipeState.direction === direction
  }

  const getSwipeProgress = () => {
    if (!swipeState.isSwiping) return 0

    const distance = Math.sqrt(swipeState.deltaX ** 2 + swipeState.deltaY ** 2)
    return Math.min(distance / finalConfig.threshold, 1)
  }

  // Separate DOM event handlers from utility functions
  const eventHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
  }

  const swipeInfo = {
    isSwiping: swipeState.isSwiping,
    swipeDistance: swipeState.deltaX, // Assuming deltaX is the primary for this naming
    swipeState,
    bindSwipe,
    isSwipingInDirection,
    getSwipeProgress,
    triggerHapticFeedback
  }

  // Return separate objects to prevent DOM prop warnings
  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp
  }

  const swipeAPI = {
    swipeState: swipeState.direction,
    bindSwipe: () => swipeHandlers, // Return handlers as function to prevent direct spreading
    isSwipingInDirection: (direction: 'left' | 'right' | 'up' | 'down') => swipeState.isSwiping && swipeState.direction === direction,
    getSwipeProgress: () => {
      if (!swipeState.isSwiping) return 0
      const distance = Math.sqrt(swipeState.deltaX ** 2 + swipeState.deltaY ** 2)
      return Math.min(distance / finalConfig.threshold, 1)
    },
    triggerHapticFeedback: () => {
      try {
        if ('vibrate' in navigator && navigator.vibrate) {
          navigator.vibrate(50)
        }
      } catch (e) {
        // Ignore vibration errors
      }
    }
  }

  // Helper function to get transform for swipe animation
  const getSwipeTransform = () => {
    if (!swipeState.isSwiping) return 'translateX(0)'

    const transformX = swipeState.deltaX
    const transformY = swipeState.deltaY

    // Prioritize horizontal swipe for transform if it's the dominant direction
    if (Math.abs(transformX) > Math.abs(transformY)) {
      return `translateX(${transformX}px)`
    } else {
      return `translateY(${transformY}px)`
    }
  }

  return {
    // DOM event handlers only
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,

    // Helper methods (not DOM props)
    swipeDirection: swipeState.direction,
    isSwipeActive: swipeState.isSwiping,
    swipeDistance: Math.abs(swipeState.deltaX),
    swipeTransform: getSwipeTransform(),

    // Utility functions
    getSwipeProgress: () => getSwipeProgress(),
    triggerHaptic: () => triggerHapticFeedback()
  }
}

// React Hook für Pull-to-Refresh
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  const swipeHandlers = {
    onSwipeMove: (e: TouchEvent, deltaX: number, deltaY: number) => {
      // Nur bei Scroll-Position 0 und nach unten ziehen
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

// Global Type Declaration für Capacitor
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
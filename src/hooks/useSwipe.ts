import { useRef } from 'react'

type Opts = { threshold?: number, onSwipeLeft?: ()=>void, onSwipeRight?: ()=>void, stopPropagation?: boolean }
export function useSwipe<T extends HTMLElement>({ threshold = 48, onSwipeLeft, onSwipeRight, stopPropagation = false }: Opts) {
  const startX = useRef<number | null>(null)

  function onTouchStart(e: React.TouchEvent<T>) {
    if (stopPropagation) e.stopPropagation()
    startX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent<T>) {
    if (stopPropagation) e.stopPropagation()
    if (startX.current == null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (dx <= -threshold) onSwipeLeft?.()
    else if (dx >= threshold) onSwipeRight?.()
    startX.current = null
  }
  return { onTouchStart, onTouchEnd }
}

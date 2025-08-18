
import { useEffect, useRef } from 'react'

export function useMemoryOptimization() {
  const cleanupFunctions = useRef<(() => void)[]>([])

  const addCleanup = (cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup)
  }

  useEffect(() => {
    return () => {
      // Cleanup alle registrierten Funktionen
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.warn('Cleanup error:', error)
        }
      })
      cleanupFunctions.current = []
    }
  }, [])

  return { addCleanup }
}

export function useImageOptimization() {
  const imageCache = useRef(new Map<string, HTMLImageElement>())

  const preloadImage = (src: string): Promise<HTMLImageElement> => {
    if (imageCache.current.has(src)) {
      return Promise.resolve(imageCache.current.get(src)!)
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        imageCache.current.set(src, img)
        resolve(img)
      }
      img.onerror = reject
      img.src = src
    })
  }

  const clearImageCache = () => {
    imageCache.current.clear()
  }

  return { preloadImage, clearImageCache }
}

export function useAnimationOptimization() {
  const animationFrames = useRef<number[]>([])

  const requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const id = window.requestAnimationFrame(callback)
    animationFrames.current.push(id)
    return id
  }

  const cancelAnimationFrame = (id: number) => {
    window.cancelAnimationFrame(id)
    animationFrames.current = animationFrames.current.filter(frameId => frameId !== id)
  }

  const cancelAllAnimations = () => {
    animationFrames.current.forEach(id => window.cancelAnimationFrame(id))
    animationFrames.current = []
  }

  useEffect(() => {
    return () => {
      cancelAllAnimations()
    }
  }, [])

  return { requestAnimationFrame, cancelAnimationFrame, cancelAllAnimations }
}

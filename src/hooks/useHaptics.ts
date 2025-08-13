
export function useHaptics() {
  const vibrate = (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const lightTap = () => vibrate(25)
  const mediumTap = () => vibrate(50)
  const strongTap = () => vibrate([100, 50, 100])
  const success = () => vibrate([50, 25, 50])
  const error = () => vibrate([100, 50, 100, 50, 100])

  return {
    vibrate,
    lightTap,
    mediumTap,
    strongTap,
    success,
    error
  }
}

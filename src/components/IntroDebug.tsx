export const IntroDebug = () => {
  const checkStyles = () => {
    const introElement = document.querySelector('.intro-container')
    const computedStyle = introElement ? window.getComputedStyle(introElement) : null

    console.log('🎬 Intro Debug:', {
      introElement: !!introElement,
      background: computedStyle?.background,
      zIndex: computedStyle?.zIndex,
      position: computedStyle?.position,
      display: computedStyle?.display
    })

    // Check alle CSS-Klassen
    const allIntroClasses = document.querySelectorAll('[class*="intro-"], [class*="loading-"], [class*="logo-"], [class*="temple-"], [class*="features-"], [class*="enter-"]')
    console.log('🎨 Gefundene Intro-Klassen:', allIntroClasses.length)

    allIntroClasses.forEach((el, i) => {
      if (i < 5) { // Nur die ersten 5 für Performance
        console.log(`Element ${i}:`, el.className, window.getComputedStyle(el).display)
      }
    })
  }

  React.useEffect(() => {
    const timer = setTimeout(checkStyles, 1000)
    return () => clearTimeout(timer)
  }, [])

  return null
}
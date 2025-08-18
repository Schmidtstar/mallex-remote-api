
export function trapFocus(e: React.KeyboardEvent, root: HTMLElement | null) {
  if (!root) return;
  const focusables = root.querySelectorAll<HTMLElement>(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); 
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); 
    first.focus();
  }
}
// MALLEX Accessibility Utilities
export class AccessibilityManager {
  private static focusStack: HTMLElement[] = []
  private static reducedMotionEnabled = false

  static init() {
    // Check for reduced motion preference
    this.reducedMotionEnabled = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    // Listen for preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotionEnabled = e.matches
      this.updateAnimationSettings()
    })

    // High contrast mode detection
    this.detectHighContrastMode()

    console.log('♿ Accessibility Manager initialized')
  }

  static updateAnimationSettings() {
    if (this.reducedMotionEnabled) {
      document.body.classList.add('reduced-motion')
      console.log('♿ Reduced motion activated')
    } else {
      document.body.classList.remove('reduced-motion')
    }
  }

  static detectHighContrastMode() {
    const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    if (isHighContrast) {
      document.body.classList.add('high-contrast')
      console.log('♿ High contrast mode detected')
    }
  }

  // Focus Management für Modals/Dialogs
  static trapFocus(element: HTMLElement) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    })

    firstElement?.focus()
  }

  static pushFocus(element: HTMLElement) {
    this.focusStack.push(document.activeElement as HTMLElement)
    element.focus()
  }

  static popFocus() {
    const previousElement = this.focusStack.pop()
    previousElement?.focus()
  }

  // Announcement-System für Screen Reader
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.style.position = 'absolute'
    announcer.style.left = '-9999px'
    announcer.style.width = '1px'
    announcer.style.height = '1px'
    announcer.textContent = message

    document.body.appendChild(announcer)

    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  }

  // Keyboard Navigation Helper
  static addArrowKeyNavigation(container: HTMLElement, selector: string) {
    const items = container.querySelectorAll(selector) as NodeListOf<HTMLElement>
    
    container.addEventListener('keydown', (e) => {
      const currentIndex = Array.from(items).indexOf(document.activeElement as HTMLElement)
      
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault()
          const nextIndex = (currentIndex + 1) % items.length
          items[nextIndex].focus()
          break
          
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          const prevIndex = (currentIndex - 1 + items.length) % items.length
          items[prevIndex].focus()
          break
          
        case 'Home':
          e.preventDefault()
          items[0].focus()
          break
          
        case 'End':
          e.preventDefault()
          items[items.length - 1].focus()
          break
      }
    })
  }

  // Color Contrast Checker
  static checkColorContrast(foreground: string, background: string): number {
    // Simplified contrast ratio calculation
    const getLuminance = (hex: string) => {
      const rgb = parseInt(hex.slice(1), 16)
      const r = (rgb >> 16) & 0xff
      const g = (rgb >> 8) & 0xff
      const b = (rgb >> 0) & 0xff
      
      const srgb = [r, g, b].map(c => {
        c = c / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      
      return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
    }

    const l1 = getLuminance(foreground)
    const l2 = getLuminance(background)
    
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }

  // Skip Links Helper
  static addSkipLinks() {
    const skipNav = document.createElement('a')
    skipNav.href = '#main-content'
    skipNav.textContent = 'Zum Hauptinhalt springen'
    skipNav.className = 'skip-link'
    skipNav.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 100000;
      transition: top 0.3s;
    `

    skipNav.addEventListener('focus', () => {
      skipNav.style.top = '6px'
    })

    skipNav.addEventListener('blur', () => {
      skipNav.style.top = '-40px'
    })

    document.body.insertBefore(skipNav, document.body.firstChild)
  }

  static getPreferences() {
    return {
      reducedMotion: this.reducedMotionEnabled,
      highContrast: document.body.classList.contains('high-contrast'),
      screenReader: this.detectScreenReader()
    }
  }

  private static detectScreenReader(): boolean {
    // Basic screen reader detection
    return !!(
      navigator.userAgent.match(/NVDA|JAWS|SAPI|VoiceOver/i) ||
      window.speechSynthesis ||
      window.navigator.userAgent.includes('Talkback')
    )
  }
}

// CSS Classes für Accessibility
export const A11Y_CLASSES = {
  SCREEN_READER_ONLY: 'sr-only',
  REDUCED_MOTION: 'reduced-motion',
  HIGH_CONTRAST: 'high-contrast',
  FOCUS_VISIBLE: 'focus-visible',
  SKIP_LINK: 'skip-link'
}

// ARIA Helpers
export const AriaHelpers = {
  setLiveRegion: (element: HTMLElement, type: 'polite' | 'assertive' = 'polite') => {
    element.setAttribute('aria-live', type)
    element.setAttribute('aria-atomic', 'true')
  },

  setExpanded: (element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', expanded.toString())
  },

  setSelected: (element: HTMLElement, selected: boolean) => {
    element.setAttribute('aria-selected', selected.toString())
  },

  setHidden: (element: HTMLElement, hidden: boolean) => {
    if (hidden) {
      element.setAttribute('aria-hidden', 'true')
    } else {
      element.removeAttribute('aria-hidden')
    }
  },

  setRole: (element: HTMLElement, role: string) => {
    element.setAttribute('role', role)
  },

  setLabel: (element: HTMLElement, label: string) => {
    element.setAttribute('aria-label', label)
  },

  setLabelledBy: (element: HTMLElement, labelId: string) => {
    element.setAttribute('aria-labelledby', labelId)
  },

  setDescribedBy: (element: HTMLElement, descriptionId: string) => {
    element.setAttribute('aria-describedby', descriptionId)
  }
}

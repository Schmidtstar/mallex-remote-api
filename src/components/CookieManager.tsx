
import React, { useState, useEffect } from 'react'
import { PrivacyManager } from '../lib/privacy-manager'
import styles from './CookieManager.module.css'

interface CookieManagerProps {
  onConsentChange?: (consents: CookieConsents) => void
}

interface CookieConsents {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

export default function CookieManager({ onConsentChange }: CookieManagerProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consents, setConsents] = useState<CookieConsents>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    // Check if user has already given consent
    const consentGiven = PrivacyManager.getCookie('mallex-cookie-consent')
    if (!consentGiven) {
      setShowBanner(true)
    } else {
      // Load saved preferences
      const savedConsents = JSON.parse(consentGiven)
      setConsents(savedConsents)
    }
  }, [])

  const handleAcceptAll = () => {
    const allConsents = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    }
    saveConsents(allConsents)
  }

  const handleAcceptSelected = () => {
    saveConsents(consents)
  }

  const handleRejectAll = () => {
    const minimalConsents = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    }
    saveConsents(minimalConsents)
  }

  const saveConsents = (newConsents: CookieConsents) => {
    setConsents(newConsents)
    PrivacyManager.setCookie('mallex-cookie-consent', JSON.stringify(newConsents), 365)
    setShowBanner(false)
    setShowDetails(false)
    onConsentChange?.(newConsents)

    // Apply consent settings
    if (!newConsents.analytics) {
      // Disable analytics tracking
      PrivacyManager.deleteCookie('_ga')
      PrivacyManager.deleteCookie('_gid')
    }
  }

  const handleConsentChange = (type: keyof CookieConsents, value: boolean) => {
    if (type === 'necessary') return // Always required
    setConsents(prev => ({ ...prev, [type]: value }))
  }

  if (!showBanner) return null

  return (
    <div className={styles.cookieBanner}>
      <div className={styles.bannerContent}>
        <div className={styles.bannerText}>
          <h3>🍪 Diese Website verwendet Cookies</h3>
          <p>
            Wir verwenden Cookies, um Ihnen die beste Erfahrung auf unserer Website zu bieten. 
            Notwendige Cookies sind für das Funktionieren der Website erforderlich.
          </p>
        </div>

        {!showDetails ? (
          <div className={styles.bannerActions}>
            <button 
              className={styles.acceptAll}
              onClick={handleAcceptAll}
            >
              Alle akzeptieren
            </button>
            <button 
              className={styles.rejectAll}
              onClick={handleRejectAll}
            >
              Nur notwendige
            </button>
            <button 
              className={styles.customize}
              onClick={() => setShowDetails(true)}
            >
              Anpassen
            </button>
          </div>
        ) : (
          <div className={styles.detailsPanel}>
            <div className={styles.cookieOptions}>
              <div className={styles.cookieOption}>
                <label>
                  <input
                    type="checkbox"
                    checked={consents.necessary}
                    disabled
                  />
                  <span className={styles.cookieLabel}>
                    <strong>Notwendige Cookies</strong>
                    <small>Für Grundfunktionen der Website erforderlich</small>
                  </span>
                </label>
              </div>

              <div className={styles.cookieOption}>
                <label>
                  <input
                    type="checkbox"
                    checked={consents.functional}
                    onChange={(e) => handleConsentChange('functional', e.target.checked)}
                  />
                  <span className={styles.cookieLabel}>
                    <strong>Funktionale Cookies</strong>
                    <small>Verbessern die Benutzererfahrung und Personalisierung</small>
                  </span>
                </label>
              </div>

              <div className={styles.cookieOption}>
                <label>
                  <input
                    type="checkbox"
                    checked={consents.analytics}
                    onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                  />
                  <span className={styles.cookieLabel}>
                    <strong>Analytics Cookies</strong>
                    <small>Helfen uns zu verstehen, wie die Website genutzt wird</small>
                  </span>
                </label>
              </div>

              <div className={styles.cookieOption}>
                <label>
                  <input
                    type="checkbox"
                    checked={consents.marketing}
                    onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                  />
                  <span className={styles.cookieLabel}>
                    <strong>Marketing Cookies</strong>
                    <small>Für personalisierte Werbung und Inhalte</small>
                  </span>
                </label>
              </div>
            </div>

            <div className={styles.detailsActions}>
              <button 
                className={styles.acceptSelected}
                onClick={handleAcceptSelected}
              >
                Auswahl speichern
              </button>
              <button 
                className={styles.back}
                onClick={() => setShowDetails(false)}
              >
                Zurück
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

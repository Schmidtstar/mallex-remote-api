
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { PrivacyManager, PrivacySettings } from '../lib/privacy-manager'
import { MonitoringService } from '../lib/monitoring'
import s from './PrivacyBanner.module.css'

interface PrivacyBannerProps {
  onAccept?: (settings: PrivacySettings) => void
  onDecline?: () => void
}

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ onAccept, onDecline }) => {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<Partial<PrivacySettings>>({
    analytics: false,
    marketing: false,
    performance: false,
    necessary: true
  })

  useEffect(() => {
    checkConsentStatus()
  }, [user])

  const checkConsentStatus = async () => {
    try {
      if (!user) {
        // Gast-Benutzer - Banner anzeigen
        setIsVisible(true)
        return
      }

      const hasConsent = await PrivacyManager.hasValidConsent(user.uid)
      setIsVisible(!hasConsent)

      if (hasConsent) {
        const existingSettings = await PrivacyManager.getPrivacySettings(user.uid)
        if (existingSettings) {
          setSettings(existingSettings)
        }
      }
    } catch (error) {
      console.warn('Consent-Status konnte nicht geladen werden:', error)
      setIsVisible(true)
    }
  }

  const handleAcceptAll = async () => {
    setLoading(true)
    try {
      const allSettings: Partial<PrivacySettings> = {
        analytics: true,
        marketing: true,
        performance: true,
        necessary: true
      }

      await saveSettings(allSettings)
      setIsVisible(false)
      onAccept?.(allSettings as PrivacySettings)
    } catch (error) {
      console.error('Fehler beim Akzeptieren:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptSelected = async () => {
    setLoading(true)
    try {
      await saveSettings(settings)
      setIsVisible(false)
      onAccept?.(settings as PrivacySettings)
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeclineAll = async () => {
    setLoading(true)
    try {
      const minimalSettings: Partial<PrivacySettings> = {
        analytics: false,
        marketing: false,
        performance: false,
        necessary: true
      }

      await saveSettings(minimalSettings)
      setIsVisible(false)
      onDecline?.()
    } catch (error) {
      console.error('Fehler beim Ablehnen:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (settingsToSave: Partial<PrivacySettings>) => {
    if (user) {
      await PrivacyManager.savePrivacySettings(user.uid, settingsToSave)
    } else {
      // Gast-Einstellungen lokal speichern
      localStorage.setItem('mallex-privacy-settings', JSON.stringify({
        ...settingsToSave,
        timestamp: Date.now()
      }))
    }

    MonitoringService.trackUserAction('privacy_consent_given', { 
      settings: settingsToSave,
      userType: user ? 'authenticated' : 'guest'
    })
  }

  const updateSetting = (key: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (!isVisible) return null

  return (
    <div className={s.overlay}>
      <div className={s.banner}>
        <div className={s.header}>
          <h3>🏛️ MALLEX respektiert Ihre Privatsphäre</h3>
          <p>
            Wir verwenden Cookies und ähnliche Technologien, um Ihre Erfahrung zu verbessern, 
            die App-Performance zu analysieren und personalisierte Inhalte anzubieten.
          </p>
        </div>

        {!showDetails ? (
          <div className={s.quickActions}>
            <button 
              className={s.acceptAll}
              onClick={handleAcceptAll}
              disabled={loading}
            >
              {loading ? '⏳' : '✅'} Alle akzeptieren
            </button>
            
            <button 
              className={s.customize}
              onClick={() => setShowDetails(true)}
            >
              ⚙️ Anpassen
            </button>
            
            <button 
              className={s.declineAll}
              onClick={handleDeclineAll}
              disabled={loading}
            >
              {loading ? '⏳' : '❌'} Alle ablehnen
            </button>
          </div>
        ) : (
          <div className={s.detailSettings}>
            <div className={s.settingGroup}>
              <div className={s.setting}>
                <div className={s.settingInfo}>
                  <strong>🔧 Notwendige Cookies</strong>
                  <p>Für grundlegende Funktionen der App erforderlich.</p>
                </div>
                <label className={s.toggle}>
                  <input 
                    type="checkbox" 
                    checked={true}
                    disabled={true}
                  />
                  <span className={s.slider}></span>
                </label>
              </div>

              <div className={s.setting}>
                <div className={s.settingInfo}>
                  <strong>📊 Performance & Analytics</strong>
                  <p>Helfen uns, die App-Performance zu verstehen und zu verbessern.</p>
                </div>
                <label className={s.toggle}>
                  <input 
                    type="checkbox" 
                    checked={settings.performance || false}
                    onChange={(e) => updateSetting('performance', e.target.checked)}
                  />
                  <span className={s.slider}></span>
                </label>
              </div>

              <div className={s.setting}>
                <div className={s.settingInfo}>
                  <strong>📈 Analytics</strong>
                  <p>Anonyme Nutzungsstatistiken zur Verbesserung der App.</p>
                </div>
                <label className={s.toggle}>
                  <input 
                    type="checkbox" 
                    checked={settings.analytics || false}
                    onChange={(e) => updateSetting('analytics', e.target.checked)}
                  />
                  <span className={s.slider}></span>
                </label>
              </div>

              <div className={s.setting}>
                <div className={s.settingInfo}>
                  <strong>🎯 Marketing</strong>
                  <p>Personalisierte Inhalte und Empfehlungen.</p>
                </div>
                <label className={s.toggle}>
                  <input 
                    type="checkbox" 
                    checked={settings.marketing || false}
                    onChange={(e) => updateSetting('marketing', e.target.checked)}
                  />
                  <span className={s.slider}></span>
                </label>
              </div>
            </div>

            <div className={s.detailActions}>
              <button 
                className={s.save}
                onClick={handleAcceptSelected}
                disabled={loading}
              >
                {loading ? '⏳ Speichern...' : '💾 Einstellungen speichern'}
              </button>
              
              <button 
                className={s.back}
                onClick={() => setShowDetails(false)}
              >
                ← Zurück
              </button>
            </div>
          </div>
        )}

        <div className={s.footer}>
          <p>
            📋 <a href="/privacy" target="_blank">Datenschutzerklärung</a> | 
            📜 <a href="/terms" target="_blank">Nutzungsbedingungen</a> | 
            🛡️ <a href="/gdpr" target="_blank">GDPR-Rechte</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PrivacyBanner

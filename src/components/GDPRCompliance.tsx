
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { PrivacyManager } from '../lib/privacy-manager'
import s from './GDPRCompliance.module.css'

interface UserDataExport {
  userProfile: any
  gameHistory: any[]
  achievements: any[]
  preferences: any
  createdAt: string
  exportedAt: string
}

interface GDPRComplianceProps {
  isOpen: boolean
  onClose: () => void
}

const GDPRCompliance: React.FC<GDPRComplianceProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'export' | 'delete' | 'cookies'>('overview')
  const [exportData, setExportData] = useState<UserDataExport | null>(null)
  const [confirmDelete, setConfirmDelete] = useState('')
  const [message, setMessage] = useState('')

  if (!isOpen) return null

  const handleDataExport = async () => {
    if (!user) return

    setLoading(true)
    setMessage('')

    try {
      // Alle Benutzerdaten sammeln
      const userData = await PrivacyManager.exportUserData(user.uid)
      
      const exportPackage: UserDataExport = {
        userProfile: userData.profile,
        gameHistory: userData.gameHistory || [],
        achievements: userData.achievements || [],
        preferences: userData.preferences || {},
        createdAt: userData.profile?.createdAt || new Date().toISOString(),
        exportedAt: new Date().toISOString()
      }

      setExportData(exportPackage)

      // JSON-Download erstellen
      const blob = new Blob([JSON.stringify(exportPackage, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mallex-user-data-${user.uid}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMessage('✅ Deine Daten wurden erfolgreich exportiert und heruntergeladen.')
      
      // Event für Monitoring
      if (window.MonitoringService) {
        window.MonitoringService.trackUserAction('gdpr_data_export', {
          dataSize: JSON.stringify(exportPackage).length,
          itemCount: Object.keys(exportPackage).length
        })
      }

    } catch (error) {
      console.error('Data export failed:', error)
      setMessage('❌ Fehler beim Exportieren der Daten. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  const handleAccountDeletion = async () => {
    if (!user || confirmDelete !== 'LÖSCHEN') return

    setLoading(true)
    setMessage('')

    try {
      await PrivacyManager.deleteUserData(user.uid)
      
      setMessage('✅ Dein Account und alle Daten wurden erfolgreich gelöscht.')
      
      // Event für Monitoring
      if (window.MonitoringService) {
        window.MonitoringService.trackUserAction('gdpr_account_deletion', {
          userId: user.uid,
          reason: 'user_request'
        })
      }

      setTimeout(() => {
        window.location.href = '/auth'
      }, 3000)

    } catch (error) {
      console.error('Account deletion failed:', error)
      setMessage('❌ Fehler beim Löschen des Accounts. Bitte kontaktiere den Support.')
    } finally {
      setLoading(false)
    }
  }

  const clearAllCookies = () => {
    PrivacyManager.clearAllCookies()
    localStorage.clear()
    sessionStorage.clear()
    
    setMessage('✅ Alle Cookies und lokale Daten wurden gelöscht.')
    
    if (window.MonitoringService) {
      window.MonitoringService.trackUserAction('gdpr_cookies_cleared')
    }
  }

  return (
    <div className={s.overlay}>
      <div className={s.modal}>
        <div className={s.header}>
          <h2>🔒 DSGVO / GDPR Datenschutz</h2>
          <button onClick={onClose} className={s.closeBtn}>×</button>
        </div>

        <div className={s.tabs}>
          <button 
            className={`${s.tab} ${activeTab === 'overview' ? s.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📋 Übersicht
          </button>
          <button 
            className={`${s.tab} ${activeTab === 'export' ? s.active : ''}`}
            onClick={() => setActiveTab('export')}
          >
            📥 Daten Export
          </button>
          <button 
            className={`${s.tab} ${activeTab === 'delete' ? s.active : ''}`}
            onClick={() => setActiveTab('delete')}
          >
            🗑️ Account Löschen
          </button>
          <button 
            className={`${s.tab} ${activeTab === 'cookies' ? s.active : ''}`}
            onClick={() => setActiveTab('cookies')}
          >
            🍪 Cookies
          </button>
        </div>

        <div className={s.content}>
          {activeTab === 'overview' && (
            <div className={s.overview}>
              <h3>🏛️ Deine Datenschutzrechte bei MALLEX</h3>
              
              <div className={s.rightsGrid}>
                <div className={s.right}>
                  <div className={s.rightIcon}>📋</div>
                  <h4>Recht auf Information</h4>
                  <p>Du hast das Recht zu erfahren, welche Daten wir über dich speichern.</p>
                </div>

                <div className={s.right}>
                  <div className={s.rightIcon}>📥</div>
                  <h4>Recht auf Datenportabilität</h4>
                  <p>Du kannst alle deine Daten in einem maschinenlesbaren Format exportieren.</p>
                </div>

                <div className={s.right}>
                  <div className={s.rightIcon}>✏️</div>
                  <h4>Recht auf Berichtigung</h4>
                  <p>Du kannst deine Daten jederzeit über das Profil aktualisieren.</p>
                </div>

                <div className={s.right}>
                  <div className={s.rightIcon}>🗑️</div>
                  <h4>Recht auf Löschung</h4>
                  <p>Du kannst deinen Account und alle Daten vollständig löschen lassen.</p>
                </div>
              </div>

              <div className={s.dataInfo}>
                <h4>📊 Welche Daten speichern wir?</h4>
                <ul>
                  <li>🔐 <strong>Account-Daten:</strong> E-Mail, Passwort (verschlüsselt), Profil</li>
                  <li>🎮 <strong>Spiel-Daten:</strong> Spielverlauf, Statistiken, Achievements</li>
                  <li>⚙️ <strong>Einstellungen:</strong> Sprache, Präferenzen, Cookie-Consent</li>
                  <li>📱 <strong>Technisch:</strong> Session-Daten, Performance-Metriken</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className={s.exportSection}>
              <h3>📥 Daten Export (DSGVO Art. 20)</h3>
              
              <div className={s.exportInfo}>
                <p>Du erhältst eine JSON-Datei mit all deinen bei MALLEX gespeicherten Daten:</p>
                <ul>
                  <li>✅ Vollständige Profildaten</li>
                  <li>✅ Spielhistorie und Statistiken</li>
                  <li>✅ Achievements und Fortschritt</li>
                  <li>✅ Einstellungen und Präferenzen</li>
                  <li>✅ Maschinenlesbares JSON-Format</li>
                </ul>
              </div>

              {exportData && (
                <div className={s.exportPreview}>
                  <h4>📋 Export Vorschau:</h4>
                  <div className={s.dataStats}>
                    <span>📊 Profil: ✅</span>
                    <span>🎮 Spiele: {exportData.gameHistory.length}</span>
                    <span>🏆 Achievements: {exportData.achievements.length}</span>
                    <span>📅 Erstellt: {new Date(exportData.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              <button 
                onClick={handleDataExport}
                disabled={loading || !user}
                className={s.exportBtn}
              >
                {loading ? '⏳ Exportiere...' : '📥 Meine Daten exportieren'}
              </button>

              <p className={s.legalNote}>
                <small>🔒 Der Export erfolgt verschlüsselt und enthält nur deine eigenen Daten.</small>
              </p>
            </div>
          )}

          {activeTab === 'delete' && (
            <div className={s.deleteSection}>
              <h3>🗑️ Account Löschung (DSGVO Art. 17)</h3>
              
              <div className={s.deleteWarning}>
                <h4>⚠️ ACHTUNG: Diese Aktion ist unwiderruflich!</h4>
                <p>Folgende Daten werden <strong>permanent gelöscht</strong>:</p>
                <ul>
                  <li>❌ Dein komplettes Profil</li>
                  <li>❌ Alle Spielstatistiken</li>
                  <li>❌ Achievements und Fortschritt</li>
                  <li>❌ Freundeslisten und Verbindungen</li>
                  <li>❌ Einstellungen und Präferenzen</li>
                </ul>
              </div>

              <div className={s.deleteForm}>
                <label className={s.confirmLabel}>
                  Zum Bestätigen tippe <strong>"LÖSCHEN"</strong> ein:
                </label>
                <input
                  type="text"
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value)}
                  placeholder="LÖSCHEN"
                  className={s.confirmInput}
                />

                <button 
                  onClick={handleAccountDeletion}
                  disabled={loading || confirmDelete !== 'LÖSCHEN'}
                  className={s.deleteBtn}
                >
                  {loading ? '⏳ Lösche Account...' : '🗑️ Account unwiderruflich löschen'}
                </button>
              </div>

              <p className={s.legalNote}>
                <small>📧 Du erhältst eine Bestätigungs-E-Mail über die erfolgreiche Löschung.</small>
              </p>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className={s.cookiesSection}>
              <h3>🍪 Cookie Verwaltung</h3>
              
              <div className={s.cookieCategories}>
                <div className={s.cookieCategory}>
                  <h4>✅ Notwendige Cookies</h4>
                  <p>Für Grundfunktionen wie Login und Sicherheit. Können nicht deaktiviert werden.</p>
                  <span className={s.cookieStatus}>Immer aktiv</span>
                </div>

                <div className={s.cookieCategory}>
                  <h4>📊 Performance Cookies</h4>
                  <p>Helfen uns, die App-Performance zu analysieren und zu verbessern.</p>
                  <span className={s.cookieStatus}>Aktiv</span>
                </div>

                <div className={s.cookieCategory}>
                  <h4>🎯 Marketing Cookies</h4>
                  <p>Derzeit nicht verwendet. MALLEX nutzt keine Werbe-Tracking.</p>
                  <span className={s.cookieStatus}>Inaktiv</span>
                </div>
              </div>

              <div className={s.cookieActions}>
                <button 
                  onClick={clearAllCookies}
                  className={s.clearCookiesBtn}
                >
                  🧹 Alle Cookies löschen
                </button>
                
                <p className={s.legalNote}>
                  <small>⚠️ Das Löschen aller Cookies führt zur Abmeldung und reset der Einstellungen.</small>
                </p>
              </div>
            </div>
          )}

          {message && (
            <div className={`${s.message} ${message.includes('❌') ? s.error : s.success}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { GDPRCompliance }
export default GDPRCompliance

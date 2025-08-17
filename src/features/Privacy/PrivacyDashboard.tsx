
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { PrivacyManager, UserDataExport, PrivacySettings } from '../../lib/privacy-manager'
import { MonitoringService } from '../../lib/monitoring'
import s from './PrivacyDashboard.module.css'

const PrivacyDashboard: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null)
  const [exportData, setExportData] = useState<UserDataExport | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    loadPrivacySettings()
  }, [user])

  const loadPrivacySettings = async () => {
    if (!user) return

    try {
      const settings = await PrivacyManager.getPrivacySettings(user.uid)
      setPrivacySettings(settings)
    } catch (error) {
      console.error('Fehler beim Laden der Privacy-Einstellungen:', error)
    }
  }

  const handleExportData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await PrivacyManager.exportUserData(user.uid)
      setExportData(data)
      
      // Auto-Download starten
      PrivacyManager.downloadUserData(data)
      
      MonitoringService.trackUserAction('gdpr_data_export_requested')
    } catch (error) {
      console.error('Datenexport fehlgeschlagen:', error)
      alert('Datenexport fehlgeschlagen. Bitte versuchen Sie es später erneut.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePrivacySettings = async (newSettings: Partial<PrivacySettings>) => {
    if (!user) return

    setLoading(true)
    try {
      await PrivacyManager.savePrivacySettings(user.uid, newSettings)
      await loadPrivacySettings()
      MonitoringService.trackUserAction('privacy_settings_updated_dashboard')
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Einstellungen:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'LÖSCHEN') return

    setLoading(true)
    try {
      await PrivacyManager.deleteUserData(user.uid, true)
      MonitoringService.trackUserAction('gdpr_account_deletion_completed')
      
      alert('Ihr Account wurde erfolgreich gelöscht. Sie werden zur Startseite weitergeleitet.')
      window.location.href = '/'
    } catch (error) {
      console.error('Account-Löschung fehlgeschlagen:', error)
      alert('Account-Löschung fehlgeschlagen. Bitte kontaktieren Sie den Support.')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }

  const handleAnonymizeAccount = async () => {
    if (!user) return

    const confirmed = window.confirm(
      'Möchten Sie Ihre Daten anonymisieren? Dies kann nicht rückgängig gemacht werden. ' +
      'Ihre Spielergebnisse bleiben erhalten, aber alle persönlichen Daten werden entfernt.'
    )

    if (!confirmed) return

    setLoading(true)
    try {
      await PrivacyManager.anonymizeUserData(user.uid)
      MonitoringService.trackUserAction('gdpr_account_anonymization_completed')
      
      alert('Ihr Account wurde erfolgreich anonymisiert.')
      window.location.reload()
    } catch (error) {
      console.error('Account-Anonymisierung fehlgeschlagen:', error)
      alert('Account-Anonymisierung fehlgeschlagen. Bitte versuchen Sie es später erneut.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className={s.container}>
        <div className={s.notLoggedIn}>
          <h2>🔒 Privacy Dashboard</h2>
          <p>Bitte loggen Sie sich ein, um Ihre Datenschutz-Einstellungen zu verwalten.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h1>🛡️ Datenschutz & GDPR</h1>
        <p>Verwalten Sie Ihre persönlichen Daten und Datenschutz-Einstellungen</p>
      </div>

      {/* Privacy Settings */}
      <section className={s.section}>
        <h2>⚙️ Cookie & Tracking-Einstellungen</h2>
        {privacySettings ? (
          <div className={s.settingsGrid}>
            <div className={s.setting}>
              <div className={s.settingInfo}>
                <strong>📊 Performance & Analytics</strong>
                <p>Anonyme Nutzungsstatistiken zur App-Verbesserung</p>
              </div>
              <label className={s.toggle}>
                <input
                  type="checkbox"
                  checked={privacySettings.performance}
                  onChange={(e) => handleUpdatePrivacySettings({ performance: e.target.checked })}
                  disabled={loading}
                />
                <span className={s.slider}></span>
              </label>
            </div>

            <div className={s.setting}>
              <div className={s.settingInfo}>
                <strong>📈 Analytics</strong>
                <p>Detaillierte Nutzungsanalyse für bessere Features</p>
              </div>
              <label className={s.toggle}>
                <input
                  type="checkbox"
                  checked={privacySettings.analytics}
                  onChange={(e) => handleUpdatePrivacySettings({ analytics: e.target.checked })}
                  disabled={loading}
                />
                <span className={s.slider}></span>
              </label>
            </div>

            <div className={s.setting}>
              <div className={s.settingInfo}>
                <strong>🎯 Marketing</strong>
                <p>Personalisierte Inhalte und Empfehlungen</p>
              </div>
              <label className={s.toggle}>
                <input
                  type="checkbox"
                  checked={privacySettings.marketing}
                  onChange={(e) => handleUpdatePrivacySettings({ marketing: e.target.checked })}
                  disabled={loading}
                />
                <span className={s.slider}></span>
              </label>
            </div>

            <div className={s.settingInfo}>
              <small>
                Letzte Aktualisierung: {privacySettings.lastUpdated?.toLocaleString() || 'Unbekannt'} | 
                Version: {privacySettings.consentVersion}
              </small>
            </div>
          </div>
        ) : (
          <p>Keine Datenschutz-Einstellungen gefunden. Bitte akzeptieren Sie zunächst die Cookie-Richtlinien.</p>
        )}
      </section>

      {/* Data Export */}
      <section className={s.section}>
        <h2>📥 Datenexport (GDPR Artikel 15)</h2>
        <p>
          Sie haben das Recht, eine Kopie aller Ihrer gespeicherten persönlichen Daten zu erhalten.
        </p>
        
        <button 
          className={s.exportButton}
          onClick={handleExportData}
          disabled={loading}
        >
          {loading ? '⏳ Exportiere...' : '💾 Meine Daten exportieren'}
        </button>

        {exportData && (
          <div className={s.exportInfo}>
            <h3>✅ Export erfolgreich</h3>
            <div className={s.exportStats}>
              <div className={s.stat}>
                <strong>Export-Datum:</strong> {exportData.exportDate}
              </div>
              <div className={s.stat}>
                <strong>Spielerdaten:</strong> {exportData.playerData ? 'Vorhanden' : 'Keine'}
              </div>
              <div className={s.stat}>
                <strong>Spiel-Verlauf:</strong> {exportData.gameHistory.length} Einträge
              </div>
              <div className={s.stat}>
                <strong>Vorschläge:</strong> {exportData.suggestions.length} Einträge
              </div>
              <div className={s.stat}>
                <strong>GDPR-konform:</strong> {exportData.gdprCompliance ? '✅ Ja' : '❌ Nein'}
              </div>
            </div>
            <button 
              className={s.downloadButton}
              onClick={() => PrivacyManager.downloadUserData(exportData)}
            >
              📥 Erneut herunterladen
            </button>
          </div>
        )}
      </section>

      {/* Data Management */}
      <section className={s.section}>
        <h2>🗑️ Datenverwaltung</h2>
        
        <div className={s.actionGrid}>
          <div className={s.actionCard}>
            <h3>🎭 Account anonymisieren</h3>
            <p>
              Ihre persönlichen Daten werden entfernt, aber Ihre Spielergebnisse bleiben 
              für Statistiken erhalten (anonymisiert).
            </p>
            <button 
              className={s.anonymizeButton}
              onClick={handleAnonymizeAccount}
              disabled={loading}
            >
              {loading ? '⏳' : '🎭'} Anonymisieren
            </button>
          </div>

          <div className={s.actionCard}>
            <h3>🗑️ Account komplett löschen</h3>
            <p>
              <strong>WARNUNG:</strong> Alle Ihre Daten werden unwiderruflich gelöscht. 
              Dies kann nicht rückgängig gemacht werden.
            </p>
            <button 
              className={s.deleteButton}
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
            >
              🗑️ Account löschen
            </button>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={s.modal}>
          <div className={s.modalContent}>
            <h2>⚠️ Account löschen bestätigen</h2>
            <p>
              <strong>ACHTUNG:</strong> Diese Aktion kann nicht rückgängig gemacht werden!
            </p>
            <p>
              Alle Ihre Daten, einschließlich Spielergebnisse, Vorschläge und 
              persönliche Informationen werden permanent gelöscht.
            </p>
            <p>
              Geben Sie <strong>"LÖSCHEN"</strong> ein, um zu bestätigen:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="LÖSCHEN"
              className={s.confirmInput}
            />
            <div className={s.modalActions}>
              <button 
                className={s.confirmDelete}
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmText !== 'LÖSCHEN'}
              >
                {loading ? '⏳ Lösche...' : '🗑️ Endgültig löschen'}
              </button>
              <button 
                className={s.cancelDelete}
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                disabled={loading}
              >
                ❌ Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Links */}
      <section className={s.legalSection}>
        <h2>📋 Rechtliche Informationen</h2>
        <div className={s.legalLinks}>
          <a href="/privacy-policy" target="_blank">📋 Datenschutzerklärung</a>
          <a href="/terms-of-service" target="_blank">📜 Nutzungsbedingungen</a>
          <a href="/gdpr-info" target="_blank">🛡️ GDPR-Rechte</a>
          <a href="/contact" target="_blank">📧 Datenschutz-Kontakt</a>
        </div>
      </section>
    </div>
  )
}

export default PrivacyDashboard
export { PrivacyDashboard }

export default PrivacyDashboard

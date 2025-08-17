
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
      MonitoringService.trackUserAction('privacy_settings_updated')
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Privacy-Einstellungen:', error)
      alert('Einstellungen konnten nicht gespeichert werden.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteData = async () => {
    if (!user || deleteConfirmText !== 'LÖSCHEN') return

    setLoading(true)
    try {
      await PrivacyManager.deleteUserData(user.uid, true)
      MonitoringService.trackUserAction('gdpr_account_deleted')
      alert('Ihr Account wurde erfolgreich gelöscht.')
    } catch (error) {
      console.error('Fehler beim Löschen der Daten:', error)
      alert('Datenlöschung fehlgeschlagen.')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }

  if (!user) {
    return (
      <div className={s.container}>
        <h2>Privacy Dashboard</h2>
        <p>Bitte melden Sie sich an, um Ihre Privacy-Einstellungen zu verwalten.</p>
      </div>
    )
  }

  return (
    <div className={s.container}>
      <h2>Privacy Dashboard</h2>
      
      {/* Privacy Settings */}
      <section className={s.section}>
        <h3>Cookie-Einstellungen</h3>
        <div className={s.settingsGrid}>
          <label className={s.settingItem}>
            <input
              type="checkbox"
              checked={privacySettings?.analytics ?? false}
              onChange={(e) => handleUpdatePrivacySettings({ analytics: e.target.checked })}
              disabled={loading}
            />
            <span>Analytics Cookies</span>
          </label>
          
          <label className={s.settingItem}>
            <input
              type="checkbox"
              checked={privacySettings?.marketing ?? false}
              onChange={(e) => handleUpdatePrivacySettings({ marketing: e.target.checked })}
              disabled={loading}
            />
            <span>Marketing Cookies</span>
          </label>
          
          <label className={s.settingItem}>
            <input
              type="checkbox"
              checked={privacySettings?.performance ?? false}
              onChange={(e) => handleUpdatePrivacySettings({ performance: e.target.checked })}
              disabled={loading}
            />
            <span>Performance Cookies</span>
          </label>
          
          <label className={s.settingItem}>
            <input
              type="checkbox"
              checked={true}
              disabled={true}
            />
            <span>Notwendige Cookies (erforderlich)</span>
          </label>
        </div>
      </section>

      {/* Data Export */}
      <section className={s.section}>
        <h3>Datenexport (GDPR)</h3>
        <p>Laden Sie alle Ihre gespeicherten Daten herunter.</p>
        <button
          onClick={handleExportData}
          disabled={loading}
          className={s.exportButton}
        >
          {loading ? 'Exportiere...' : 'Daten exportieren'}
        </button>
      </section>

      {/* Data Deletion */}
      <section className={s.section}>
        <h3>Account löschen</h3>
        <p className={s.warning}>
          ⚠️ Diese Aktion kann nicht rückgängig gemacht werden!
        </p>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={s.deleteButton}
          >
            Account dauerhaft löschen
          </button>
        ) : (
          <div className={s.deleteConfirm}>
            <p>Geben Sie "LÖSCHEN" ein, um zu bestätigen:</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="LÖSCHEN"
              className={s.confirmInput}
            />
            <div className={s.confirmButtons}>
              <button
                onClick={handleDeleteData}
                disabled={deleteConfirmText !== 'LÖSCHEN' || loading}
                className={s.confirmDelete}
              >
                {loading ? 'Lösche...' : 'Endgültig löschen'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className={s.cancelDelete}
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Privacy Info */}
      <section className={s.section}>
        <h3>Privacy-Informationen</h3>
        <div className={s.privacyInfo}>
          <p><strong>Letzte Aktualisierung:</strong> {privacySettings?.lastUpdated?.toLocaleDateString() || 'Unbekannt'}</p>
          <p><strong>Consent-Version:</strong> {privacySettings?.consentVersion || 'Unbekannt'}</p>
          <p><strong>GDPR-konform:</strong> {privacySettings?.gdprCompliant ? '✅ Ja' : '❌ Nein'}</p>
        </div>
      </section>
    </div>
  )
}

export default PrivacyDashboard
export { PrivacyDashboard }

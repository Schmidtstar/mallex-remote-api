
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useIsAdmin } from '../../context/AdminContext'
import { useAuth } from '../../context/AuthContext'
import { useAdminSettings } from '../../context/AdminSettingsContext'
import styles from './AdminDashboard.module.css'

type AdminTab = 'overview' | 'users' | 'settings' | 'admins' | 'notifications'

export function AdminDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = useIsAdmin()
  const {
    appSettings,
    userManagement,
    loading,
    updateAppSettings,
    banUser,
    unbanUser,
    suspendUser,
    promoteToModerator,
    demoteFromModerator,
    sendSystemNotification,
    refreshUsers,
    promoteToAdmin,
    revokeAdmin,
    getAdminList
  } = useAdminSettings()

  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [notificationMessage, setNotificationMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [adminList, setAdminList] = useState<any[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState('')

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <h1 className={styles.title}>🔧 Admin Dashboard</h1>
          <div className={styles.adminInfo}>
            🔄 Lädt Admin-Daten...
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.loadingMessage}>
            Lade Einstellungen und Benutzerdaten...
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/arena" replace />
  }

  const filteredUsers = (userManagement?.users || []).filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid.includes(searchTerm)
  )

  const handleSettingChange = async (key: keyof typeof appSettings, value: any) => {
    try {
      await updateAppSettings({ [key]: value })
    } catch (error) {
      console.error('Failed to update setting:', error)
    }
  }

  const handleBulkAction = async (action: 'ban' | 'suspend' | 'promote' | 'notify') => {
    const userIds = Array.from(selectedUsers)
    
    try {
      for (const uid of userIds) {
        switch (action) {
          case 'ban':
            await banUser(uid, 'Bulk admin action')
            break
          case 'suspend':
            await suspendUser(uid, 'Bulk admin action')
            break
          case 'promote':
            await promoteToModerator(uid)
            break
          case 'notify':
            if (notificationMessage.trim()) {
              await sendSystemNotification(uid, notificationMessage)
            }
            break
        }
      }
      setSelectedUsers(new Set())
      setNotificationMessage('')
    } catch (error) {
      console.error('Bulk action failed:', error)
    }
  }

  const toggleUserSelection = (uid: string) => {
    const newSelection = new Set(selectedUsers)
    if (newSelection.has(uid)) {
      newSelection.delete(uid)
    } else {
      newSelection.add(uid)
    }
    setSelectedUsers(newSelection)
  }

  const loadAdminList = async () => {
    try {
      const admins = await getAdminList()
      setAdminList(admins)
    } catch (error) {
      console.error('Failed to load admin list:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'admins') {
      loadAdminList()
    }
  }, [activeTab])

  const handlePromoteToAdmin = async () => {
    if (!newAdminEmail.trim()) return
    
    try {
      await promoteToAdmin(newAdminEmail.trim())
      setNewAdminEmail('')
      await loadAdminList()
    } catch (error) {
      console.error('Failed to promote to admin:', error)
    }
  }

  const handleRevokeAdmin = async (userIdOrEmail: string) => {
    if (!confirm('Admin-Berechtigung wirklich entziehen?')) return
    
    try {
      await revokeAdmin(userIdOrEmail)
      await loadAdminList()
    } catch (error) {
      console.error('Failed to revoke admin:', error)
    }
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>🔧 Admin Dashboard</h1>
        <div className={styles.adminInfo}>
          👤 {user?.email} | 👥 {userManagement?.users?.length || 0} Users
        </div>
      </div>

      <div className={styles.tabs}>
        {['overview', 'users', 'settings', 'admins', 'notifications'].map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab as AdminTab)}
          >
            {tab === 'admins' ? '👑 Admins' : t(`admin.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {userManagement?.error && (
        <div className={styles.errorBanner}>
          ⚠️ {userManagement.error}
          <button 
            onClick={() => refreshUsers()}
            className={styles.retryButton}
          >
            🔄 Erneut versuchen
          </button>
        </div>
      )}

      <div className={styles.content}>
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>👥 Benutzer gesamt</h3>
                <div className={styles.statValue}>{userManagement?.users?.length || 0}</div>
              </div>
              <div className={styles.statCard}>
                <h3>🚫 Gesperrte Benutzer</h3>
                <div className={styles.statValue}>{userManagement?.bannedUsers?.size || 0}</div>
              </div>
              <div className={styles.statCard}>
                <h3>👮 Moderatoren</h3>
                <div className={styles.statValue}>{userManagement?.moderators?.size || 0}</div>
              </div>
              <div className={styles.statCard}>
                <h3>🔧 Wartungsmodus</h3>
                <div className={styles.statValue}>
                  {appSettings.maintenanceMode ? '🔴 AN' : '🟢 AUS'}
                </div>
              </div>
            </div>

            <div className={styles.quickActions}>
              <h3>Schnellaktionen</h3>
              <div className={styles.actionButtons}>
                <button
                  className={styles.actionButton}
                  onClick={() => handleSettingChange('maintenanceMode', !appSettings.maintenanceMode)}
                >
                  {appSettings.maintenanceMode ? '🟢 Wartung beenden' : '🔴 Wartung aktivieren'}
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => refreshUsers()}
                >
                  🔄 Benutzer aktualisieren
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => sendSystemNotification('all', 'Systembwartung ist für heute Nacht geplant.')}
                >
                  📢 Globale Benachrichtigung
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className={styles.userManagement}>
            <div className={styles.userControls}>
              <input
                type="text"
                placeholder="Benutzer suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              
              {selectedUsers.size > 0 && (
                <div className={styles.bulkActions}>
                  <span>{selectedUsers.size} ausgewählt</span>
                  <button onClick={() => handleBulkAction('ban')} className={styles.banButton}>
                    Ausgewählte sperren
                  </button>
                  <button onClick={() => handleBulkAction('suspend')} className={styles.suspendButton}>
                    Ausgewählte suspendieren
                  </button>
                  <button onClick={() => handleBulkAction('promote')} className={styles.promoteButton}>
                    Ausgewählte befördern
                  </button>
                </div>
              )}
            </div>

            <div className={styles.userList}>
              {filteredUsers.map(targetUser => (
                <div key={targetUser.uid} className={styles.userCard}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(targetUser.uid)}
                    onChange={() => toggleUserSelection(targetUser.uid)}
                  />
                  
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>
                      {targetUser.displayName || targetUser.email || 'Anonymous'}
                    </div>
                    <div className={styles.userDetails}>
                      {targetUser.email} | {targetUser.tasksCompleted} Aufgaben | Rang #{targetUser.rank}
                    </div>
                    <div className={styles.userMeta}>
                      Status: {targetUser.status} | 
                      Rollen: {targetUser.roles.join(', ')} |
                      Erstellt: {targetUser.createdAt?.toDate?.()?.toLocaleDateString() || 'Unbekannt'}
                    </div>
                  </div>

                  <div className={styles.userActions}>
                    {userManagement?.bannedUsers?.has(targetUser.uid) ? (
                      <button
                        onClick={() => unbanUser(targetUser.uid)}
                        className={styles.unbanButton}
                      >
                        Entsperren
                      </button>
                    ) : (
                      <button
                        onClick={() => banUser(targetUser.uid)}
                        className={styles.banButton}
                      >
                        Sperren
                      </button>
                    )}

                    {userManagement?.moderators?.has(targetUser.uid) ? (
                      <button
                        onClick={() => demoteFromModerator(targetUser.uid)}
                        className={styles.demoteButton}
                      >
                        Degradieren
                      </button>
                    ) : (
                      <button
                        onClick={() => promoteToModerator(targetUser.uid)}
                        className={styles.promoteButton}
                      >
                        Befördern
                      </button>
                    )}

                    <button
                      onClick={() => sendSystemNotification(targetUser.uid, 'Admin-Nachricht für Sie')}
                      className={styles.notifyButton}
                    >
                      Benachrichtigen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settings}>
            <div className={styles.settingsGrid}>
              <div className={styles.settingGroup}>
                <h3>App-Konfiguration</h3>
                
                <label className={styles.settingItem}>
                  <input
                    type="checkbox"
                    checked={appSettings.maintenanceMode}
                    onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                  />
                  Wartungsmodus
                </label>

                <label className={styles.settingItem}>
                  <input
                    type="checkbox"
                    checked={appSettings.registrationEnabled}
                    onChange={(e) => handleSettingChange('registrationEnabled', e.target.checked)}
                  />
                  Registrierung aktiviert
                </label>

                <label className={styles.settingItem}>
                  <input
                    type="checkbox"
                    checked={appSettings.guestAccessEnabled}
                    onChange={(e) => handleSettingChange('guestAccessEnabled', e.target.checked)}
                  />
                  Gastzugang aktiviert
                </label>

                <label className={styles.settingItem}>
                  Max. Aufgaben pro Benutzer:
                  <input
                    type="number"
                    value={appSettings.maxTasksPerUser}
                    onChange={(e) => handleSettingChange('maxTasksPerUser', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </label>

                <label className={styles.settingItem}>
                  Aufgaben-Abklingzeit (Minuten):
                  <input
                    type="number"
                    value={appSettings.taskCooldownMinutes}
                    onChange={(e) => handleSettingChange('taskCooldownMinutes', parseInt(e.target.value))}
                    min="0"
                    max="60"
                  />
                </label>
              </div>

              <div className={styles.settingGroup}>
                <h3>Funktionen</h3>
                
                {Object.entries(appSettings.featuresEnabled).map(([feature, enabled]) => (
                  <label key={feature} className={styles.settingItem}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handleSettingChange('featuresEnabled', {
                        ...appSettings.featuresEnabled,
                        [feature]: e.target.checked
                      })}
                    />
                    {feature.charAt(0).toUpperCase() + feature.slice(1)} aktiviert
                  </label>
                ))}
              </div>

              <div className={styles.settingGroup}>
                <h3>Ankündigung</h3>
                
                <label className={styles.settingItem}>
                  <input
                    type="checkbox"
                    checked={appSettings.announcementActive}
                    onChange={(e) => handleSettingChange('announcementActive', e.target.checked)}
                  />
                  Ankündigung anzeigen
                </label>

                <textarea
                  value={appSettings.announcementText}
                  onChange={(e) => handleSettingChange('announcementText', e.target.value)}
                  placeholder="Ankündigungstext eingeben..."
                  className={styles.announcementText}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className={styles.adminManagement}>
            <div className={styles.adminControls}>
              <h3>👑 Admin Management</h3>
              
              <div className={styles.addAdmin}>
                <div className={styles.addAdminForm}>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="E-Mail-Adresse eingeben..."
                    className={styles.emailInput}
                  />
                  <button
                    onClick={handlePromoteToAdmin}
                    className={styles.promoteButton}
                    disabled={!newAdminEmail.trim()}
                  >
                    🔼 Zu Admin ernennen
                  </button>
                </div>
                <div className={styles.adminHint}>
                  💡 E-Mail-Adresse eingeben, um Benutzer zum Admin zu ernennen
                </div>
              </div>
            </div>

            <div className={styles.adminList}>
              <h4>Aktuelle Admins ({adminList.length})</h4>
              {adminList.length === 0 ? (
                <div className={styles.noAdmins}>
                  Keine Admins gefunden. Lade Admin-Liste...
                </div>
              ) : (
                adminList.map((admin, index) => (
                  <div key={admin.id || index} className={styles.adminCard}>
                    <div className={styles.adminInfo}>
                      <div className={styles.adminEmail}>
                        📧 {admin.email || admin.id}
                      </div>
                      <div className={styles.adminMeta}>
                        {admin.displayName && (
                          <span>👤 {admin.displayName} | </span>
                        )}
                        <span>📅 {admin.promotedAt?.toDate?.()?.toLocaleDateString() || 'Unbekannt'}</span>
                        {admin.type && (
                          <span> | 🏷️ {admin.type}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.adminActions}>
                      <button
                        onClick={() => handleRevokeAdmin(admin.id)}
                        className={styles.revokeButton}
                        disabled={admin.id === user?.uid}
                      >
                        {admin.id === user?.uid ? '🔒 Selbst' : '❌ Entziehen'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className={styles.notifications}>
            <div className={styles.notificationSender}>
              <h3>System-Benachrichtigung senden</h3>
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Benachrichtigungstext eingeben..."
                className={styles.messageInput}
                rows={4}
              />
              <div className={styles.notificationActions}>
                <button
                  onClick={() => sendSystemNotification('all', notificationMessage)}
                  className={styles.sendAllButton}
                  disabled={!notificationMessage.trim()}
                >
                  An alle Benutzer senden
                </button>
                <button
                  onClick={() => handleBulkAction('notify')}
                  className={styles.sendSelectedButton}
                  disabled={!notificationMessage.trim() || selectedUsers.size === 0}
                >
                  An Ausgewählte senden ({selectedUsers.size})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

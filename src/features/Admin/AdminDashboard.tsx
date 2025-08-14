
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useIsAdmin } from '../../context/AdminContext'
import { useAuth } from '../../context/AuthContext'
import AdminSettingsProvider, { useAdminSettings } from '../../context/AdminSettingsContext'
import styles from './AdminDashboard.module.css'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'

type AdminTab = 'overview' | 'users' | 'settings' | 'admins' | 'notifications'

// Separate the main dashboard content into its own component
function AdminDashboardContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = useIsAdmin()
  const location = useLocation()
  const navigate = useNavigate()

  // Determine initial tab from URL path
  const getInitialTab = (): AdminTab => {
    const path = location.pathname
    if (path.includes('/admin/users')) return 'users'
    if (path.includes('/admin/dashboard')) return 'overview'
    if (path.includes('/admin/settings')) return 'settings'
    if (path.includes('/admin/admins')) return 'admins'
    if (path.includes('/admin/notifications')) return 'notifications'
    return 'overview'
  }

  // ALL STATE VARIABLES FIRST
  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialTab())
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [notificationMessage, setNotificationMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [adminList, setAdminList] = useState<any[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([])
  const [userStats, setUserStats] = useState({
    total: 0,
    online: 0,
    admins: 0
  })

  // Now we can safely use useAdminSettings here because we're inside the provider
  const { settings: appSettings, loading, error: settingsError, updateSettings: updateAppSettings, resetToDefaults } = useAdminSettings()

  // THEN ALL FUNCTIONS
  const loadRegisteredUsers = async () => {
    try {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)

      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastLoginAt: doc.data().lastLoginAt?.toDate?.() || null
      }))

      setRegisteredUsers(usersList)
      // Count admins from the admin list
      const adminCount = adminList.length

      setUserStats({
        total: usersList.length,
        online: usersList.filter(u => {
          const lastLogin = u.lastLoginAt
          return lastLogin && (Date.now() - lastLogin.getTime()) < 30 * 60 * 1000 // 30 min
        }).length,
        admins: adminCount
      })
    } catch (error: any) {
      if (error.code !== 'permission-denied') {
        console.error('Error loading registered users:', error)
      } else {
        console.log('📋 Registered users not accessible - using defaults')
      }
      setRegisteredUsers([])
    }
  }

  const loadAdminList = async () => {
    try {
      const admins = await getAdminList()
      setAdminList(admins)
    } catch (error: any) {
      if (error.code !== 'permission-denied') {
        console.error('Failed to load admin list:', error)
      } else {
        console.log('📋 Admin list not accessible - using local fallback')
      }
    }
  }

  const loadUsers = async () => {
    await loadRegisteredUsers()
  }

  const getAdminList = async () => {
    console.log('Get admin list')
    // TODO: Implement admin list functionality
    return []
  }

  const banUser = async (uid: string, reason?: string) => {
    console.log('Ban user:', uid, reason)
    // TODO: Implement ban functionality
  }

  const unbanUser = async (uid: string) => {
    console.log('Unban user:', uid)
    // TODO: Implement unban functionality
  }

  const suspendUser = async (uid: string, reason?: string) => {
    console.log('Suspend user:', uid, reason)
    // TODO: Implement suspend functionality
  }

  const promoteToModerator = async (uid: string) => {
    console.log('Promote to moderator:', uid)
    // TODO: Implement promotion functionality
  }

  const demoteFromModerator = async (uid: string) => {
    console.log('Demote from moderator:', uid)
    // TODO: Implement demotion functionality
  }

  const sendSystemNotification = async (uid: string, message: string) => {
    console.log('Send notification:', uid, message)
    // TODO: Implement notification functionality
  }

  const refreshUsers = async () => {
    console.log('Refresh users')
    await loadRegisteredUsers()
  }

  const promoteToAdmin = async (email: string) => {
    console.log('Promote to admin:', email)
    // TODO: Implement admin promotion functionality
  }

  const revokeAdmin = async (userIdOrEmail: string) => {
    console.log('Revoke admin:', userIdOrEmail)
    // TODO: Implement admin revocation functionality
  }

  // Mock user management object
  const userManagement = {
    users: registeredUsers,
    bannedUsers: new Set(),
    moderators: new Set(),
    error: null
  }

  const error = settingsError

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/arena" replace />
  }

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

  if (!appSettings) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <h1 className={styles.title}>🔧 Admin Dashboard</h1>
        </div>
        <div className={styles.content}>
          <div className={styles.errorBanner}>
            ⚠️ Fehler beim Laden der Admin-Einstellungen
          </div>
        </div>
      </div>
    )
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

  const loadSettings = async () => {
    try {
      // Admin settings are already loaded via useAdminSettings hook
      console.log('Admin settings loaded via context')
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
      loadAdminList()
      loadRegisteredUsers()
    }
  }, [isAdmin])

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
            onClick={() => {
              setActiveTab(tab as AdminTab)
              // Update URL to match tab
              const newPath = tab === 'overview' ? '/admin' : `/admin/${tab}`
              navigate(newPath, { replace: true })
            }}
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
                  {appSettings?.maintenanceMode ? '🔴 AN' : '🟢 AUS'}
                </div>
              </div>
            </div>

            <div className={styles.quickActions}>
              <h3>Schnellaktionen</h3>
              <div className={styles.actionButtons}>
                <button
                  className={styles.actionButton}
                  onClick={() => handleSettingChange('maintenanceMode', !appSettings?.maintenanceMode)}
                >
                  {appSettings?.maintenanceMode ? '🟢 Wartung beenden' : '🔴 Wartung aktivieren'}
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

            <div className={styles.section}>
              <h3>👥 Angemeldete Benutzer ({userStats.total})</h3>
              <div className={styles.userStats}>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{userStats.total}</span>
                  <span className={styles.statLabel}>Gesamt registriert</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{userStats.online}</span>
                  <span className={styles.statLabel}>Online (30min)</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{userStats.admins}</span>
                  <span className={styles.statLabel}>Admins</span>
                </div>
              </div>

              <div className={styles.usersList}>
                {registeredUsers.map(user => (
                  <div key={user.id} className={styles.userCard}>
                    <span className={styles.userName}>
                      {user.displayName || user.email || 'Unbekannt'}
                    </span>
                    <span className={styles.userEmail}>{user.email}</span>
                    <span className={styles.userLastLogin}>
                      {user.lastLoginAt ? 
                        `Zuletzt: ${user.lastLoginAt.toLocaleDateString('de-DE')}` : 
                        'Nie angemeldet'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h3>🔧 System Administration</h3>
              <div className={styles.actionButtons}>
                <button className={styles.actionButton} onClick={loadRegisteredUsers}>
                  User-Liste aktualisieren
                </button>
                <button className={styles.actionButton} onClick={() => window.location.reload()}>
                  System neustarten
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
                    checked={appSettings?.moderationEnabled || false}
                    onChange={(e) => handleSettingChange('moderationEnabled', e.target.checked)}
                  />
                  Moderation aktiviert
                </label>

                <label className={styles.settingItem}>
                  <input
                    type="checkbox"
                    checked={appSettings?.autoApproveFromTrustedUsers || false}
                    onChange={(e) => handleSettingChange('autoApproveFromTrustedUsers', e.target.checked)}
                  />
                  Auto-Genehmigung für vertrauenswürdige Benutzer
                </label>

                <label className={styles.settingItem}>
                  <input
                    type="checkbox"
                    checked={appSettings?.allowAnonymousSubmissions || false}
                    onChange={(e) => handleSettingChange('allowAnonymousSubmissions', e.target.checked)}
                  />
                  Anonyme Einreichungen erlauben
                </label>

                <label className={styles.settingItem}>
                  Max. Aufgaben pro Benutzer:
                  <input
                    type="number"
                    value={appSettings?.maxTasksPerUser || 5}
                    onChange={(e) => handleSettingChange('maxTasksPerUser', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </label>

                <label className={styles.settingItem}>
                  Punkte pro Aufgabe:
                  <input
                    type="number"
                    value={appSettings?.pointsPerTask || 10}
                    onChange={(e) => handleSettingChange('pointsPerTask', parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                </label>
              </div>

              <div className={styles.settingGroup}>
                <h3>Benachrichtigungen</h3>

                <label className={styles.settingItem}>
                  <input
                    type="checkbox"
                    checked={appSettings?.notificationSettings?.newTaskSubmissions || false}
                    onChange={(e) => handleSettingChange('notificationSettings', {
                      ...appSettings?.notificationSettings,
                      newTaskSubmissions: e.target.checked
                    })}
                  />
                  Neue Aufgaben-Einreichungen
                </label>

                <label className={styles.settingItem}>
                  <input
                    type="checkbox"
                    checked={appSettings?.notificationSettings?.userReports || false}
                    onChange={(e) => handleSettingChange('notificationSettings', {
                      ...appSettings?.notificationSettings,
                      userReports: e.target.checked
                    })}
                  />
                  Benutzer-Meldungen
                </label>

                <label className={styles.settingItem}>
                  <input
                    type="checkbox"
                    checked={appSettings?.notificationSettings?.systemAlerts || false}
                    onChange={(e) => handleSettingChange('notificationSettings', {
                      ...appSettings?.notificationSettings,
                      systemAlerts: e.target.checked
                    })}
                  />
                  System-Warnungen
                </label>
              </div>

              <div className={styles.settingGroup}>
                <h3>Aufgaben-Beschränkungen</h3>

                <label className={styles.settingItem}>
                  Tägliches Aufgaben-Limit:
                  <input
                    type="number"
                    value={appSettings?.dailyTaskLimit || 3}
                    onChange={(e) => handleSettingChange('dailyTaskLimit', parseInt(e.target.value))}
                    min="1"
                    max="50"
                  />
                </label>

                <label className={styles.settingItem}>
                  Wöchentliches Aufgaben-Limit:
                  <input
                    type="number"
                    value={appSettings?.weeklyTaskLimit || 15}
                    onChange={(e) => handleSettingChange('weeklyTaskLimit', parseInt(e.target.value))}
                    min="1"
                    max="200"
                  />
                </label>

                <label className={styles.settingItem}>
                  <input
                    type="checkbox"
                    checked={appSettings?.requireImageForTasks || false}
                    onChange={(e) => handleSettingChange('requireImageForTasks', e.target.checked)}
                  />
                  Bild für Aufgaben erforderlich
                </label>
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

// Main component that provides the AdminSettings context
export default function AdminDashboard() {
  return (
    <AdminSettingsProvider>
      <AdminDashboardContent />
    </AdminSettingsProvider>
  )
}

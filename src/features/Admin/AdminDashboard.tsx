import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AdminSettingsProvider, { useAdminSettings } from '../../context/AdminSettingsContext'
import { collection, getDocs, doc, getDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import styles from './AdminDashboard.module.css'

type AdminTab = 'overview' | 'users' | 'settings' | 'admins'

interface UserData {
  id: string
  email: string
  displayName?: string
  lastLoginAt?: Date
  createdAt?: Date
}

interface AdminData {
  id: string
  email: string
  displayName?: string
  promotedAt?: Date
}

function AdminDashboardContent() {
  const { t } = useTranslation()
  const { user, isAdmin } = useAuth()
  const { appSettings, updateAppSettings, loading, error } = useAdminSettings()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [users, setUsers] = useState<UserData[]>([])
  const [admins, setAdmins] = useState<AdminData[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [userStats, setUserStats] = useState({
    total: 0,
    online: 0,
    admins: 0
  })

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/arena" replace />
  }

  // Load data
  useEffect(() => {
    if (!isAdmin) return

    const loadData = async () => {
      try {
        // Load users
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const usersList: UserData[] = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.data().email || '',
          displayName: doc.data().displayName,
          lastLoginAt: doc.data().lastLoginAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate()
        }))
        setUsers(usersList)

        // Load admins
        const adminsSnapshot = await getDocs(collection(db, 'admins'))
        const adminsList: AdminData[] = adminsSnapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.data().email || doc.id,
          displayName: doc.data().displayName,
          promotedAt: doc.data().promotedAt?.toDate()
        }))
        setAdmins(adminsList)

        // Calculate stats
        const now = Date.now()
        const onlineUsers = usersList.filter(u => {
          if (!u.lastLoginAt) return false
          return (now - u.lastLoginAt.getTime()) < 30 * 60 * 1000 // 30 min
        })

        setUserStats({
          total: usersList.length,
          online: onlineUsers.length,
          admins: adminsList.length
        })

        console.log('✅ Admin data loaded:', {
          users: usersList.length,
          admins: adminsList.length,
          online: onlineUsers.length
        })

      } catch (error: any) {
        console.error('Admin data load failed:', error?.code || error?.message)
      }
    }

    loadData()
  }, [isAdmin])

  const handleSettingChange = async (key: string, value: any) => {
    try {
      await updateAppSettings({ [key]: value })
    } catch (error) {
      console.error('Setting update failed:', error)
    }
  }

  const promoteToAdmin = async () => {
    if (!newAdminEmail.trim()) return

    try {
      // Find user by email
      const userFound = users.find(u => u.email === newAdminEmail.trim())
      if (!userFound) {
        alert('Benutzer mit dieser E-Mail nicht gefunden')
        return
      }

      // Add to admins collection
      await addDoc(collection(db, 'admins'), {
        email: newAdminEmail.trim(),
        displayName: userFound.displayName,
        promotedAt: serverTimestamp(),
        promotedBy: user?.uid
      })

      setNewAdminEmail('')

      // Reload admins
      const adminsSnapshot = await getDocs(collection(db, 'admins'))
      const adminsList: AdminData[] = adminsSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || doc.id,
        displayName: doc.data().displayName,
        promotedAt: doc.data().promotedAt?.toDate()
      }))
      setAdmins(adminsList)

      console.log('✅ User promoted to admin:', newAdminEmail)
    } catch (error) {
      console.error('Promotion failed:', error)
      alert('Fehler beim Ernennen zum Admin')
    }
  }

  const revokeAdmin = async (adminId: string) => {
    if (!confirm('Admin-Berechtigung wirklich entziehen?')) return
    if (adminId === user?.uid) {
      alert('Du kannst dich nicht selbst degradieren!')
      return
    }

    try {
      await deleteDoc(doc(db, 'admins', adminId))

      // Reload admins
      const adminsSnapshot = await getDocs(collection(db, 'admins'))
      const adminsList: AdminData[] = adminsSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || doc.id,
        displayName: doc.data().displayName,
        promotedAt: doc.data().promotedAt?.toDate()
      }))
      setAdmins(adminsList)

      console.log('✅ Admin revoked:', adminId)
    } catch (error) {
      console.error('Revoke failed:', error)
      alert('Fehler beim Entziehen der Admin-Berechtigung')
    }
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
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>🔧 Admin Dashboard</h1>
        <div className={styles.adminInfo}>
          👑 {user?.email} | 👥 {userStats.total} Users | 🛡️ {userStats.admins} Admins
        </div>
      </div>

      <div className={styles.tabs}>
        {['overview', 'users', 'settings', 'admins'].map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab as AdminTab)}
          >
            {tab === 'overview' && '📊 Übersicht'}
            {tab === 'users' && '👥 Benutzer'}
            {tab === 'settings' && '⚙️ Einstellungen'}
            {tab === 'admins' && '👑 Admins'}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>👥 Benutzer gesamt</h3>
                <div className={styles.statValue}>{userStats.total}</div>
              </div>
              <div className={styles.statCard}>
                <h3>🟢 Online (30min)</h3>
                <div className={styles.statValue}>{userStats.online}</div>
              </div>
              <div className={styles.statCard}>
                <h3>👑 Admins</h3>
                <div className={styles.statValue}>{userStats.admins}</div>
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
                  onClick={() => navigate('/admin/tasks')}
                >
                  🎯 Tasks verwalten
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => window.location.reload()}
                >
                  🔄 Dashboard neu laden
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className={styles.userManagement}>
            <div className={styles.usersList}>
              {users.map(user => (
                <div key={user.id} className={styles.userCard}>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>
                      {user.displayName || user.email}
                    </div>
                    <div className={styles.userEmail}>{user.email}</div>
                    <div className={styles.userMeta}>
                      Zuletzt online: {user.lastLoginAt ? 
                        user.lastLoginAt.toLocaleDateString('de-DE') : 
                        'Nie'
                      }
                    </div>
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
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className={styles.adminManagement}>
            <div className={styles.addAdmin}>
              <h3>👑 Admin ernennen</h3>
              <div className={styles.addAdminForm}>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="E-Mail-Adresse eingeben..."
                  className={styles.emailInput}
                />
                <button
                  onClick={promoteToAdmin}
                  className={styles.promoteButton}
                  disabled={!newAdminEmail.trim()}
                >
                  🔼 Ernennen
                </button>
              </div>
            </div>

            <div className={styles.adminList}>
              <h4>Aktuelle Admins ({admins.length})</h4>
              {admins.map(admin => (
                <div key={admin.id} className={styles.adminCard}>
                  <div className={styles.adminInfo}>
                    <div className={styles.adminEmail}>📧 {admin.email}</div>
                    {admin.displayName && (
                      <div className={styles.adminName}>👤 {admin.displayName}</div>
                    )}
                    <div className={styles.adminMeta}>
                      📅 {admin.promotedAt?.toLocaleDateString('de-DE') || 'Unbekannt'}
                    </div>
                  </div>
                  <div className={styles.adminActions}>
                    <button
                      onClick={() => revokeAdmin(admin.id)}
                      className={styles.revokeButton}
                      disabled={admin.id === user?.uid}
                    >
                      {admin.id === user?.uid ? '🔒 Du' : '❌ Entziehen'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <AdminSettingsProvider>
      <AdminDashboardContent />
    </AdminSettingsProvider>
  )
}
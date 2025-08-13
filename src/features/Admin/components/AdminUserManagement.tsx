
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminSettings } from '../../../context/AdminSettingsContext'
import styles from './AdminUserManagement.module.css'

interface AdminUser {
  uid: string
  email?: string
  displayName?: string
  createdAt?: any
  lastActive?: any
  tasksCompleted?: number
  rank?: number
  status: 'active' | 'banned' | 'suspended'
  roles: string[]
}

export function AdminUserManagement() {
  const { t } = useTranslation()
  const {
    userManagement,
    banUser,
    unbanUser,
    suspendUser,
    promoteToModerator,
    demoteFromModerator,
    sendSystemNotification
  } = useAdminSettings()

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned' | 'suspended' | 'moderators'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created' | 'tasks' | 'rank'>('created')
  const [bulkMessage, setBulkMessage] = useState('')
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Filter users based on search and status
  const filteredUsers = userManagement.users
    .filter(user => {
      const matchesSearch = 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.uid.includes(searchTerm)

      const matchesFilter = (() => {
        switch (filterStatus) {
          case 'banned': return userManagement.bannedUsers.has(user.uid)
          case 'suspended': return user.status === 'suspended'
          case 'moderators': return userManagement.moderators.has(user.uid)
          case 'active': return user.status === 'active' && !userManagement.bannedUsers.has(user.uid)
          default: return true
        }
      })()

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': 
          return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '')
        case 'email': 
          return (a.email || '').localeCompare(b.email || '')
        case 'tasks': 
          return (b.tasksCompleted || 0) - (a.tasksCompleted || 0)
        case 'rank': 
          return (a.rank || 999) - (b.rank || 999)
        case 'created': 
        default:
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      }
    })

  const toggleUserSelection = (uid: string) => {
    const newSelection = new Set(selectedUsers)
    if (newSelection.has(uid)) {
      newSelection.delete(uid)
    } else {
      newSelection.add(uid)
    }
    setSelectedUsers(newSelection)
  }

  const selectAllVisible = () => {
    setSelectedUsers(new Set(filteredUsers.map(user => user.uid)))
  }

  const clearSelection = () => {
    setSelectedUsers(new Set())
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
            if (bulkMessage.trim()) {
              await sendSystemNotification(uid, bulkMessage)
            }
            break
        }
      }
      setSelectedUsers(new Set())
      setBulkMessage('')
      setShowBulkActions(false)
    } catch (error) {
      console.error('Bulk action failed:', error)
    }
  }

  const getUserStatusBadge = (user: AdminUser) => {
    if (userManagement.bannedUsers.has(user.uid)) {
      return <span className={`${styles.badge} ${styles.badgeBanned}`}>🚫 Banned</span>
    }
    if (user.status === 'suspended') {
      return <span className={`${styles.badge} ${styles.badgeSuspended}`}>⏸️ Suspended</span>
    }
    if (userManagement.moderators.has(user.uid)) {
      return <span className={`${styles.badge} ${styles.badgeModerator}`}>👮 Moderator</span>
    }
    return <span className={`${styles.badge} ${styles.badgeActive}`}>✅ Active</span>
  }

  return (
    <div className={styles.userManagement}>
      <div className={styles.controls}>
        <div className={styles.searchAndFilter}>
          <input
            type="text"
            placeholder="🔍 Search users by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="all">All Users ({userManagement.users.length})</option>
            <option value="active">Active ({userManagement.users.length - userManagement.bannedUsers.size})</option>
            <option value="banned">Banned ({userManagement.bannedUsers.size})</option>
            <option value="suspended">Suspended</option>
            <option value="moderators">Moderators ({userManagement.moderators.size})</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={styles.sortSelect}
          >
            <option value="created">📅 By Created Date</option>
            <option value="name">📝 By Name</option>
            <option value="email">📧 By Email</option>
            <option value="tasks">🎯 By Tasks</option>
            <option value="rank">🏆 By Rank</option>
          </select>
        </div>

        {selectedUsers.size > 0 && (
          <div className={styles.bulkControls}>
            <div className={styles.selectionInfo}>
              <span className={styles.selectedCount}>
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </span>
              <button onClick={selectAllVisible} className={styles.selectAllBtn}>
                Select All Visible ({filteredUsers.length})
              </button>
              <button onClick={clearSelection} className={styles.clearBtn}>
                Clear Selection
              </button>
            </div>

            <div className={styles.bulkActions}>
              <button
                onClick={() => handleBulkAction('ban')}
                className={`${styles.bulkButton} ${styles.banButton}`}
              >
                🚫 Ban Selected
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className={`${styles.bulkButton} ${styles.suspendButton}`}
              >
                ⏸️ Suspend Selected
              </button>
              <button
                onClick={() => handleBulkAction('promote')}
                className={`${styles.bulkButton} ${styles.promoteButton}`}
              >
                👮 Promote Selected
              </button>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className={`${styles.bulkButton} ${styles.notifyButton}`}
              >
                📧 Message Selected
              </button>
            </div>

            {showBulkActions && (
              <div className={styles.bulkMessageBox}>
                <textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="Enter message for selected users..."
                  className={styles.bulkTextarea}
                  rows={3}
                />
                <div className={styles.bulkMessageActions}>
                  <button
                    onClick={() => handleBulkAction('notify')}
                    className={styles.sendButton}
                    disabled={!bulkMessage.trim()}
                  >
                    Send Message
                  </button>
                  <button
                    onClick={() => setShowBulkActions(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.resultsInfo}>
        Showing {filteredUsers.length} of {userManagement.users.length} users
      </div>

      <div className={styles.userList}>
        {filteredUsers.map(user => (
          <div key={user.uid} className={styles.userCard}>
            <div className={styles.userSelect}>
              <input
                type="checkbox"
                checked={selectedUsers.has(user.uid)}
                onChange={() => toggleUserSelection(user.uid)}
                className={styles.checkbox}
              />
            </div>

            <div className={styles.userInfo}>
              <div className={styles.userHeader}>
                <div className={styles.userName}>
                  {user.displayName || user.email || 'Anonymous User'}
                </div>
                <div className={styles.userBadges}>
                  {getUserStatusBadge(user)}
                </div>
              </div>

              <div className={styles.userDetails}>
                <div className={styles.userEmail}>📧 {user.email || 'No email'}</div>
                <div className={styles.userStats}>
                  🎯 {user.tasksCompleted || 0} tasks | 🏆 Rank #{user.rank || '∞'}
                </div>
                <div className={styles.userMeta}>
                  📅 Joined: {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'} |
                  👥 Roles: {user.roles.join(', ')}
                </div>
              </div>
            </div>

            <div className={styles.userActions}>
              {userManagement.bannedUsers.has(user.uid) ? (
                <button
                  onClick={() => unbanUser(user.uid)}
                  className={`${styles.actionButton} ${styles.unbanButton}`}
                  title="Unban user"
                >
                  🔓 Unban
                </button>
              ) : (
                <button
                  onClick={() => banUser(user.uid)}
                  className={`${styles.actionButton} ${styles.banButton}`}
                  title="Ban user"
                >
                  🚫 Ban
                </button>
              )}

              {userManagement.moderators.has(user.uid) ? (
                <button
                  onClick={() => demoteFromModerator(user.uid)}
                  className={`${styles.actionButton} ${styles.demoteButton}`}
                  title="Remove moderator privileges"
                >
                  👤 Demote
                </button>
              ) : (
                <button
                  onClick={() => promoteToModerator(user.uid)}
                  className={`${styles.actionButton} ${styles.promoteButton}`}
                  title="Give moderator privileges"
                >
                  👮 Promote
                </button>
              )}

              <button
                onClick={() => sendSystemNotification(user.uid, 'Admin message for you')}
                className={`${styles.actionButton} ${styles.messageButton}`}
                title="Send private message"
              >
                📨 Message
              </button>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👥</div>
            <div className={styles.emptyText}>
              {searchTerm ? 'No users found matching your search' : 'No users to display'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

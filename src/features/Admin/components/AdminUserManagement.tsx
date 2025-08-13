
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminSettings } from '../../../context/AdminSettingsContext'
import styles from './AdminUserManagement.module.css'

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
  const [notificationMessage, setNotificationMessage] = useState('')

  const filteredUsers = userManagement.users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid.includes(searchTerm)
  )

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

  return (
    <div className={styles.userManagement}>
      <div className={styles.userControls}>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        
        {selectedUsers.size > 0 && (
          <div className={styles.bulkActions}>
            <span>{selectedUsers.size} selected</span>
            <button onClick={() => handleBulkAction('ban')} className={styles.banButton}>
              Ban Selected
            </button>
            <button onClick={() => handleBulkAction('suspend')} className={styles.suspendButton}>
              Suspend Selected
            </button>
            <button onClick={() => handleBulkAction('promote')} className={styles.promoteButton}>
              Promote Selected
            </button>
          </div>
        )}
      </div>

      {selectedUsers.size > 0 && (
        <div className={styles.bulkNotification}>
          <textarea
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            placeholder="Message for selected users..."
            className={styles.messageInput}
            rows={2}
          />
          <button
            onClick={() => handleBulkAction('notify')}
            className={styles.notifyButton}
            disabled={!notificationMessage.trim()}
          >
            Send to Selected ({selectedUsers.size})
          </button>
        </div>
      )}

      <div className={styles.userList}>
        {filteredUsers.map(targetUser => (
          <div key={targetUser.uid} className={styles.userCard}>
            <input
              type="checkbox"
              checked={selectedUsers.has(targetUser.uid)}
              onChange={() => toggleUserSelection(targetUser.uid)}
              className={styles.userCheckbox}
            />
            
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {targetUser.displayName || targetUser.email || 'Anonymous'}
              </div>
              <div className={styles.userDetails}>
                {targetUser.email} | {targetUser.tasksCompleted || 0} tasks | Rank #{targetUser.rank || '?'}
              </div>
              <div className={styles.userMeta}>
                Status: {targetUser.status || 'active'} | 
                Roles: {targetUser.roles?.join(', ') || 'user'} |
                Created: {targetUser.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
              </div>
            </div>

            <div className={styles.userActions}>
              {userManagement.bannedUsers.has(targetUser.uid) ? (
                <button
                  onClick={() => unbanUser(targetUser.uid)}
                  className={styles.unbanButton}
                >
                  Unban
                </button>
              ) : (
                <button
                  onClick={() => banUser(targetUser.uid, 'Admin action')}
                  className={styles.banButton}
                >
                  Ban
                </button>
              )}

              {userManagement.moderators.has(targetUser.uid) ? (
                <button
                  onClick={() => demoteFromModerator(targetUser.uid)}
                  className={styles.demoteButton}
                >
                  Demote
                </button>
              ) : (
                <button
                  onClick={() => promoteToModerator(targetUser.uid)}
                  className={styles.promoteButton}
                >
                  Promote
                </button>
              )}

              <button
                onClick={() => sendSystemNotification(targetUser.uid, 'Admin message for you')}
                className={styles.notifyButton}
              >
                Notify
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className={styles.emptyState}>
          {searchTerm ? `No users found for "${searchTerm}"` : 'No users found'}
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import styles from './NotificationCenter.module.css'

interface Notification {
  id: string
  message: string
  timestamp: any
  type: 'system' | 'admin' | 'achievement' | 'welcome'
  read: boolean
  fromAdmin?: string
  userId?: string
}

function NotificationCenter() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true) // Added loading state

  useEffect(() => {
    if (!user?.uid) return

    const loadNotifications = async () => {
      try {
        // Check if welcome message exists
        const welcomeQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          where('type', '==', 'welcome')
        )
        const welcomeSnap = await getDocs(welcomeQuery)

        // Create welcome message if it doesn't exist
        if (welcomeSnap.empty) {
          const welcomeNotification = {
            userId: user.uid,
            message: `Willkommen ${user.displayName || user.email}! 🎉 Dies ist dein persönliches Postfach. Hier erhältst du wichtige Nachrichten und Updates.`,
            timestamp: serverTimestamp(),
            type: 'welcome' as const,
            read: false,
            fromAdmin: 'System'
          }
          await setDoc(doc(db, 'notifications', `welcome_${user.uid}`), welcomeNotification)
        }

        // Listen for all notifications
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        )

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
          const notificationsData: Notification[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            notificationsData.push({
              id: doc.id,
              userId: data.userId,
              message: data.message,
              timestamp: data.timestamp?.toDate() || new Date(),
              type: data.type || 'system',
              read: data.read || false,
              fromAdmin: data.fromAdmin
            })
          })
          setNotifications(notificationsData)
          setLoading(false)
        }, (error) => {
          // Only log unexpected errors, not permission-denied which is normal
        if (error.code !== 'failed-precondition' && error.code !== 'permission-denied') {
          console.error('Fehler beim Laden der Benachrichtigungen:', error)
        } else {
          console.log('📋 Benachrichtigungen nicht verfügbar - Firebase Regeln oder Offline-Modus')
        }
        })

        return unsubscribe
      } catch (error) {
        console.error('Failed to setup notifications:', error)
        setLoading(false)
      }
    }

    const cleanup = loadNotifications()
    return () => {
      cleanup.then(unsubscribe => unsubscribe?.())
    }
  }, [user?.uid])

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read)
      await Promise.all(
        unreadNotifs.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }))
      )
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const openPostfach = () => {
    navigate('/postfach')
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Gerade eben'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system': return '🔧'
      case 'admin': return '👤' 
      case 'achievement': return '🏆'
      case 'welcome': return '🎉'
      default: return '📢'
    }
  }

  // Calculate unread count here
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);


  return (
    <button 
      className={styles.notificationButton}
      onClick={openPostfach}
    >
      <span className={styles.itemIcon}>📬</span>
      <span className={styles.itemLabel}>Postfach</span>
      {unreadCount > 0 && (
        <span className={styles.badge}>{unreadCount}</span>
      )}
    </button>
  )
}

// Separate Postfach Screen Component
const PostfachScreenComponent: React.FC = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true) // Added loading state

  useEffect(() => {
    if (!user?.uid) return

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData: Notification[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        notificationsData.push({
          id: doc.id,
          userId: data.userId,
          message: data.message,
          timestamp: data.timestamp?.toDate() || new Date(),
          type: data.type || 'system',
          read: data.read || false,
          fromAdmin: data.fromAdmin
        })
      })
      setNotifications(notificationsData)
      setLoading(false)
    }, (error) => {
      console.error('Fehler beim Laden der Benachrichtigungen:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Gerade eben'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system': return '🔧'
      case 'admin': return '👤' 
      case 'achievement': return '🏆'
      case 'welcome': return '🎉'
      default: return '📢'
    }
  }

  return (
    <div className={styles.postfachContainer}>
      <header className={styles.postfachHeader}>
        <h1>📬 Postfach</h1>
        <p>Deine Nachrichten und Benachrichtigungen</p>
      </header>

      <div className={styles.postfachContent}>
        {loading ? (
          <div className={styles.loading}>
            <p>Lade Benachrichtigungen...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📪</span>
            <h3>Postfach ist leer</h3>
            <p>Du hast noch keine Nachrichten erhalten.</p>
          </div>
        ) : (
          <div className={styles.messageList}>
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`${styles.messageItem} ${!notification.read ? styles.unread : ''}`}
              >
                <div className={styles.messageIcon}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className={styles.messageContent}>
                  <div className={styles.messageText}>
                    {notification.message}
                  </div>
                  <div className={styles.messageMeta}>
                    {formatTime(notification.timestamp)}
                    {notification.fromAdmin && (
                      <span className={styles.fromAdmin}>
                        • von {notification.fromAdmin}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.messageActions}>
                  {!notification.read && (
                    <button 
                      onClick={() => markAsRead(notification.id)}
                      className={styles.readButton}
                      title="Als gelesen markieren"
                    >
                      ✓
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(notification.id)}
                    className={styles.deleteButton}
                    title="Nachricht löschen"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { NotificationCenter, PostfachScreenComponent as PostfachScreen }
export default PostfachScreenComponent
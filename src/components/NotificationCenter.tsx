
import React, { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore'
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

export function NotificationCenter() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    // Firebase Listener für Benachrichtigungen
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [user.uid, 'all']),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = []
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification)
      })
      
      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.read).length)

      // Willkommensnachricht für neue Nutzer erstellen
      createWelcomeMessage(user.uid, notifs)
    })

    return () => unsubscribe()
  }, [user])

  const createWelcomeMessage = async (userId: string, existingNotifications: Notification[]) => {
    try {
      // Prüfen ob bereits eine Willkommensnachricht existiert
      const hasWelcomeMessage = existingNotifications.some(n => 
        n.type === 'welcome' && n.userId === userId
      )

      if (!hasWelcomeMessage) {
        // Willkommensnachricht erstellen
        await addDoc(collection(db, 'notifications'), {
          userId: userId,
          message: '🎉 Willkommen bei MALLEX! Hier erhältst du wichtige Nachrichten und Updates. Viel Spaß beim Spielen!',
          timestamp: serverTimestamp(),
          type: 'welcome',
          read: false,
          fromAdmin: 'System'
        })
      }
    } catch (error) {
      console.error('Failed to create welcome message:', error)
    }
  }

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
export function PostfachScreen() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [user.uid, 'all']),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = []
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification)
      })
      setNotifications(notifs)
    })

    return () => unsubscribe()
  }, [user])

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
        {notifications.length === 0 ? (
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

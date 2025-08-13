
import React, { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import styles from './NotificationCenter.module.css'

interface Notification {
  id: string
  message: string
  timestamp: any
  type: 'system' | 'admin' | 'achievement'
  read: boolean
  fromAdmin?: string
}

export function NotificationCenter() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
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
      default: return '📢'
    }
  }

  return (
    <div className={styles.notificationCenter}>
      <button 
        className={styles.notificationButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        📬
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.notificationPanel}>
          <div className={styles.header}>
            <h3>📨 Benachrichtigungen</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className={styles.markAllRead}
              >
                Alle gelesen
              </button>
            )}
          </div>

          <div className={styles.notificationList}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                Keine Benachrichtigungen vorhanden
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`${styles.notification} ${!notification.read ? styles.unread : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className={styles.notificationContent}>
                    <div className={styles.message}>
                      {notification.message}
                    </div>
                    <div className={styles.meta}>
                      {formatTime(notification.timestamp)}
                      {notification.fromAdmin && (
                        <span className={styles.fromAdmin}>
                          • von {notification.fromAdmin}
                        </span>
                      )}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className={styles.unreadDot}></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}


# 🔍 MALLEX - Detaillierte Datei-Erklärungen

## 🏠 Root-Level Dateien

### 📄 `index.html`
**Zweck:** HTML-Einstiegspunkt der Webanwendung
```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/generated-icon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#DAA520" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="manifest" href="/manifest.json" />
    <!-- Performance hints -->
    <link rel="preconnect" href="https://firestore.googleapis.com">
    <link rel="preconnect" href="https://identitytoolkit.googleapis.com">
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <!-- Critical CSS inline -->
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
      #root { min-height: 100vh; }
    </style>
    <title>MALLEX</title>
    <!-- Service Worker Registration -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered:', reg))
            .catch(err => console.log('SW registration failed:', err))
        })
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
**Funktionen:**
- PWA-Konfiguration mit Manifest und Service Worker
- Performance-Optimierung durch DNS-Prefetch
- Mobile-optimierte Meta-Tags
- Lädt React App über `main.tsx`

---

## 🎯 Haupt-Einstiegspunkte

### 📄 `src/main.tsx`
**Zweck:** React-App Initialisierung und Context-Provider Setup
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './router'
import { AuthProvider } from './context/AuthContext'
import { PlayersProvider } from './context/PlayersContext'
import { AdminProvider } from './context/AdminContext'
import { AdminSettingsProvider } from './context/AdminSettingsContext'
import { TaskSuggestionsProvider } from './context/TaskSuggestionsContext'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/index.css'

// Intro komplett entfernt - direkt die App laden
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <PlayersProvider>
            <AdminProvider>
              <AdminSettingsProvider>
                <TaskSuggestionsProvider>
                  <App />
                </TaskSuggestionsProvider>
              </AdminSettingsProvider>
            </AdminProvider>
          </PlayersProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
```
**Funktionen:**
- Wraps App in alle notwendigen Context Provider
- HashRouter für Replit-Kompatibilität
- ErrorBoundary für Fehlerbehandlung
- React.StrictMode für Entwicklung

### 📄 `src/router.tsx`
**Zweck:** Routing-Logik und Route-Definitionen
```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import LazyLoader from './components/LazyLoader'
import RequireAdmin from './routes/guards/RequireAdmin'
import { useAuth } from './context/AuthContext'

// Lazy Loading für bessere Performance
const MenuScreen = lazy(() => import('./features/Menu/MenuScreen'))
const ArenaScreen = lazy(() => import('./features/Arena/ArenaScreen'))
const LeaderboardScreen = lazy(() => import('./features/Leaderboard/LeaderboardScreen'))
const LegendsScreen = lazy(() => import('./features/Legends/LegendsScreen'))
const AuthScreen = lazy(() => import('./features/Auth/AuthScreen'))
const AdminDashboard = lazy(() => import('./features/Admin/AdminDashboard'))
const AdminTasksScreen = lazy(() => import('./features/Tasks/AdminTasksScreen'))
const TasksOverviewScreen = lazy(() => import('./features/Tasks/TasksOverviewScreen'))
const SuggestTaskScreen = lazy(() => import('./features/Tasks/SuggestTaskScreen'))
const AdminSuggestionsScreen = lazy(() => import('./features/Admin/AdminSuggestionsScreen'))

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <LazyLoader />

  return (
    <Suspense fallback={<LazyLoader />}>
      <Routes>
        {/* Öffentliche Routen */}
        <Route path="/auth" element={<AuthScreen />} />
        
        {/* Geschützte Routen */}
        <Route path="/menu" element={user ? <MenuScreen /> : <Navigate to="/auth" />} />
        <Route path="/arena" element={user ? <ArenaScreen /> : <Navigate to="/auth" />} />
        <Route path="/leaderboard" element={user ? <LeaderboardScreen /> : <Navigate to="/auth" />} />
        <Route path="/legends" element={user ? <LegendsScreen /> : <Navigate to="/auth" />} />
        <Route path="/tasks" element={user ? <TasksOverviewScreen /> : <Navigate to="/auth" />} />
        <Route path="/suggest-task" element={user ? <SuggestTaskScreen /> : <Navigate to="/auth" />} />
        
        {/* Admin-Routen */}
        <Route path="/admin" element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        } />
        <Route path="/admin/tasks" element={
          <RequireAdmin>
            <AdminTasksScreen />
          </RequireAdmin>
        } />
        <Route path="/admin/suggestions" element={
          <RequireAdmin>
            <AdminSuggestionsScreen />
          </RequireAdmin>
        } />
        
        {/* Default Redirect */}
        <Route path="/" element={<Navigate to={user ? "/menu" : "/auth"} />} />
        <Route path="*" element={<Navigate to={user ? "/menu" : "/auth"} />} />
      </Routes>
    </Suspense>
  )
}
```
**Funktionen:**
- Lazy Loading aller Screens für Performance
- Route Guards für Authentication
- Admin-Route Protection
- Automatische Redirects basierend auf Auth-Status

---

## 📱 Core Features

### 📄 `src/features/Arena/ArenaScreen.tsx`
**Zweck:** Hauptspiel-Interface - Das Herz der App
```tsx
// Vereinfachte Struktur der Arena
const ArenaScreen = () => {
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [currentChallenge, setCurrentChallenge] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  
  // Spiellogik
  const spinWheel = () => {
    setIsSpinning(true)
    const randomPlayer = getRandomPlayer()
    const randomChallenge = getRandomChallenge()
    
    setTimeout(() => {
      setCurrentPlayer(randomPlayer)
      setCurrentChallenge(randomChallenge)
      setIsSpinning(false)
    }, 2000)
  }
  
  // UI mit Orakel-Animation
  return (
    <div className="arena">
      <h1>⚡🏛️⚡ MALLEX ARENA ⚡🏛️⚡</h1>
      {/* Gladiatoren Anzeige */}
      <div className="gladiators">
        {players.map(player => (
          <div key={player.id} className={`gladiator ${currentPlayer?.id === player.id ? 'active' : ''}`}>
            {player.name}
          </div>
        ))}
      </div>
      
      {/* Orakel Spin Button */}
      <button onClick={spinWheel} disabled={isSpinning}>
        {isSpinning ? '🔮 Das Orakel entscheidet...' : '⚔️ IN DIE ARENA! ⚔️'}
      </button>
      
      {/* Challenge Display */}
      {currentChallenge && (
        <div className="challenge-card">
          <h3>{currentChallenge.category}</h3>
          <p>{currentChallenge.task}</p>
          <div className="verdict-buttons">
            <button onClick={() => handleVerdict('triumph')}>🏆 TRIUMPH</button>
            <button onClick={() => handleVerdict('defeat')}>💀 NIEDERLAGE</button>
          </div>
        </div>
      )}
    </div>
  )
}
```
**Funktionen:**
- Zufällige Spieler- und Aufgabenauswahl
- Orakel-Animation mit Spinning-Effekt
- Triumph/Niederlage Bewertungssystem
- Punkte- und Schluck-Vergabe

### 📄 `src/features/Arena/challenges.ts`
**Zweck:** Aufgaben-Datenbank mit 5 Kategorien
```typescript
export interface Challenge {
  id: string
  category: 'Schicksal' | 'Schande' | 'Verführung' | 'Eskalation' | 'Beichte'
  task: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export const challenges: Challenge[] = [
  // Schicksal - Zufalls-Aufgaben
  {
    id: 'fate_1',
    category: 'Schicksal',
    task: 'Das Orakel bestimmt: Du trinkst für alle anderen mit! 2 Schlücke.',
    difficulty: 'medium'
  },
  
  // Schande - Peinliche Aufgaben  
  {
    id: 'shame_1',
    category: 'Schande', 
    task: 'Tanze 30 Sekunden zu einem Song deiner Wahl - aber stumm!',
    difficulty: 'medium'
  },
  
  // Verführung - Flirt/Charm Aufgaben
  {
    id: 'seduce_1',
    category: 'Verführung',
    task: 'Flirte mit der Person rechts von dir für 1 Minute.',
    difficulty: 'hard'
  },
  
  // Eskalation - Wilde/Crazy Aufgaben
  {
    id: 'escalate_1', 
    category: 'Eskalation',
    task: 'Rufe den letzten Kontakt in deinem Handy an und sag "Ich vermisse dich".',
    difficulty: 'hard'
  },
  
  // Beichte - Wahrheit/Geständnisse
  {
    id: 'confess_1',
    category: 'Beichte',
    task: 'Erzähle dein peinlichstes Erlebnis der letzten Woche.',
    difficulty: 'easy'
  }
]

export const getRandomChallenge = (): Challenge => {
  const randomIndex = Math.floor(Math.random() * challenges.length)
  return challenges[randomIndex]
}

export const getChallengesByCategory = (category: string): Challenge[] => {
  return challenges.filter(challenge => challenge.category === category)
}
```

---

## 🎨 UI Components

### 📄 `src/components/BottomNavigation.tsx`
**Zweck:** Tab-Navigation für mobile App-Experience
```tsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './BottomNavigation.module.css'

export default function BottomNavigation() {
  const { user } = useAuth()
  
  if (!user) return null

  const navItems = [
    { path: '/menu', icon: '🏛️', label: 'Menü' },
    { path: '/arena', icon: '⚔️', label: 'Arena' },
    { path: '/leaderboard', icon: '🏆', label: 'Rang' },
    { path: '/legends', icon: '👑', label: 'Legends' }
  ]

  return (
    <nav className={styles.bottomNav}>
      {navItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => 
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
```

### 📄 `src/components/ModernButton.tsx`
**Zweck:** Wiederverwendbare Button-Komponente mit Design-System
```tsx
import { ButtonHTMLAttributes } from 'react'

interface ModernButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
}

export default function ModernButton({
  children,
  variant = 'primary',
  size = 'medium', 
  loading = false,
  className = '',
  disabled,
  ...props
}: ModernButtonProps) {
  const baseStyles = 'btn-modern transition-all duration-200'
  const variantStyles = {
    primary: 'bg-olympic-gold hover:bg-gold-600 text-ancient-bronze',
    secondary: 'bg-ancient-bronze hover:bg-bronze-600 text-olympic-gold',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white'
  }
  const sizeStyles = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? '⏳' : children}
    </button>
  )
}
```

---

## 🔥 Firebase Integration

### 📄 `src/lib/firebase.ts`
**Zweck:** Firebase Konfiguration und Initialisierung
```typescript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase Konfiguration aus Umgebungsvariablen
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Firebase App initialisieren
const app = initializeApp(firebaseConfig)

// Services exportieren
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
```

### 📄 `src/context/AuthContext.tsx`
**Zweck:** Authentication State Management
```tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth'
import { auth } from '../lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInAsGuest: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  const signInAsGuest = async () => {
    await signInAnonymously(auth)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading, 
      signIn,
      signUp,
      signOut,
      signInAsGuest
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

---

## 🎨 Styling System

### 📄 `src/styles/tokens.css`
**Zweck:** Design-System Token und CSS-Variablen
```css
:root {
  /* Olympic Theme Colors */
  --olympic-gold: #DAA520;
  --ancient-bronze: #CD7F32;
  --marble-white: #F8F8FF;
  --temple-stone: #696969;
  --olympian-blue: #4682B4;
  --flame-red: #DC143C;
  --victory-green: #228B22;
  
  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  
  /* Border Radius */
  --radius-sm: 0.125rem;
  --radius: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
  
  /* Z-Index */
  --z-dropdown: 1000;
  --z-modal: 1001;
  --z-toast: 1002;
  

  /* Performance optimized */
  --mobile-padding: var(--space-5);
  --desktop-padding: var(--space-8);
  
  /* Animation */
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease;
  --transition-slow: 500ms ease;
}
```

---

## 📊 State Management

### 📄 `src/context/PlayersContext.tsx`
**Zweck:** Spieler-Verwaltung mit Firestore Sync
```tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc, 
  doc,
  onSnapshot,
  query,
  orderBy 
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'

interface Player {
  id: string
  name: string
  arenaPoints: number
  totalGames: number
  wins: number
  losses: number
  createdAt: Date
  userId: string
}

interface PlayersContextType {
  players: Player[]
  loading: boolean
  addPlayer: (name: string) => Promise<void>
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>
  deletePlayer: (id: string) => Promise<void>
  getPlayerById: (id: string) => Player | undefined
}

const PlayersContext = createContext<PlayersContextType | null>(null)

export function PlayersProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setPlayers([])
      setLoading(false)
      return
    }

    // Real-time Firestore listener
    const playersQuery = query(
      collection(db, 'players'),
      orderBy('arenaPoints', 'desc')
    )
    
    const unsubscribe = onSnapshot(playersQuery, (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Player[]
      
      setPlayers(playersData)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const addPlayer = async (name: string) => {
    if (!user) return
    
    await addDoc(collection(db, 'players'), {
      name,
      arenaPoints: 0,
      totalGames: 0,
      wins: 0,
      losses: 0,
      createdAt: new Date(),
      userId: user.uid
    })
  }

  const updatePlayer = async (id: string, updates: Partial<Player>) => {
    await updateDoc(doc(db, 'players', id), updates)
  }

  const deletePlayer = async (id: string) => {
    await deleteDoc(doc(db, 'players', id))
  }

  const getPlayerById = (id: string): Player | undefined => {
    return players.find(player => player.id === id)
  }

  return (
    <PlayersContext.Provider value={{
      players,
      loading,
      addPlayer,
      updatePlayer, 
      deletePlayer,
      getPlayerById
    }}>
      {children}
    </PlayersContext.Provider>
  )
}

export const usePlayers = () => {
  const context = useContext(PlayersContext)
  if (!context) {
    throw new Error('usePlayers must be used within PlayersProvider')
  }
  return context
}
```

---

## 🔒 Security & Admin

### 📄 `src/routes/guards/RequireAdmin.tsx`
**Zweck:** Admin-Route Protection
```tsx
import { useAuth } from '../../context/AuthContext'
import { useAdmin } from '../../context/AdminContext'
import LazyLoader from '../../components/LazyLoader'
import { Navigate } from 'react-router-dom'

interface RequireAdminProps {
  children: React.ReactNode
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()

  if (authLoading || adminLoading) {
    return <LazyLoader />
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/menu" replace />
  }

  return <>{children}</>
}
```

### 📄 `firestore.rules`
**Zweck:** Firestore Sicherheitsregeln
```javascript
rules_version = '2'

service cloud.firestore {
  match /databases/{database}/documents {
    // Benutzer können nur ihre eigenen Daten lesen/schreiben
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId
    }
    
    // Spieler - alle authentifizierten Benutzer können lesen, aber nur erstellen/ändern eigene
    match /players/{playerId} {
      allow read: if request.auth != null
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.userId
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId
    }
    
    // Aufgaben - Admins können alles, andere nur lesen und Vorschläge erstellen  
    match /tasks/{taskId} {
      allow read: if request.auth != null
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true
    }
    
    match /taskSuggestions/{suggestionId} {
      allow read, create: if request.auth != null
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.submittedBy || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true)
    }
    
    // Benachrichtigungen - Benutzer können nur ihre eigenen lesen
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId
    }
  }
}
```

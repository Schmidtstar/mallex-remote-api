

# 🔍 MALLEX - Detaillierte Datei-Erklärungen

## 🏠 Root-Level Dateien

### 📄 `index.html`
**Zweck:** HTML-Einstiegspunkt der PWA-Trinkspiel-App
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
    <!-- Performance optimizations -->
    <link rel="preconnect" href="https://firestore.googleapis.com">
    <link rel="preconnect" href="https://identitytoolkit.googleapis.com">
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <!-- Critical CSS inline -->
    <style>
      body { 
        margin: 0; 
        font-family: system-ui, -apple-system, sans-serif;
        background: linear-gradient(#0b1327, #0b0f1b);
      }
      #root { min-height: 100vh; }
    </style>
    <title>MALLEX - Die Olympischen Saufspiele</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
**Funktionen:**
- PWA-Manifest für App-Installation auf Handys
- Olympisches Farbschema (`#DAA520` = Gold)
- Performance-Optimierung durch DNS-Prefetch
- Mobile-optimierte Meta-Tags für Trinkspiel-Umgebung

---

## 🎯 Haupt-Einstiegspunkte

### 📄 `src/main.tsx`
**Zweck:** React-App Initialisierung mit vollständigem Context-Setup
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
- Verschachtelte Context Provider für komplettes State Management
- HashRouter für Replit-Kompatibilität
- ErrorBoundary für robuste Fehlerbehandlung
- Olympisches CSS-Design-System geladen

### 📄 `src/router.tsx`
**Zweck:** Erweiterte Routing-Logik mit Auth-Guards
```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import LazyLoader from './components/LazyLoader'
import RequireAdmin from './routes/guards/RequireAdmin'
import { useAuth } from './context/AuthContext'

// Performance-optimiertes Lazy Loading
const MenuScreen = lazy(() => import('./features/Menu/MenuScreen'))
const ArenaScreen = lazy(() => import('./features/Arena/ArenaScreen'))
const LeaderboardScreen = lazy(() => import('./features/Leaderboard/LeaderboardScreen'))
const LegendsScreen = lazy(() => import('./features/Legends/LegendsScreen'))
const AuthScreen = lazy(() => import('./features/Auth/AuthScreen'))
const AdminDashboard = lazy(() => import('./features/Admin/AdminDashboard'))
const AdminTasksScreen = lazy(() => import('./features/Tasks/AdminTasksScreen'))
const TasksOverviewScreen = lazy(() => import('./features/Tasks/TasksOverviewScreen'))
const SuggestTaskScreen = lazy(() => import('./features/Tasks/SuggestTaskScreen'))

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <LazyLoader />

  return (
    <Suspense fallback={<LazyLoader />}>
      <Routes>
        {/* Öffentliche Routen */}
        <Route path="/auth" element={<AuthScreen />} />
        
        {/* Authentifizierte Routen */}
        <Route path="/menu" element={user ? <MenuScreen /> : <Navigate to="/auth" />} />
        <Route path="/arena" element={user ? <ArenaScreen /> : <Navigate to="/auth" />} />
        <Route path="/leaderboard" element={user ? <LeaderboardScreen /> : <Navigate to="/auth" />} />
        <Route path="/legends" element={user ? <LegendsScreen /> : <Navigate to="/auth" />} />
        <Route path="/tasks" element={user ? <TasksOverviewScreen /> : <Navigate to="/auth" />} />
        <Route path="/suggest-task" element={user ? <SuggestTaskScreen /> : <Navigate to="/auth" />} />
        
        {/* Admin-Routen mit Guard */}
        <Route path="/admin/*" element={
          <RequireAdmin>
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="tasks" element={<AdminTasksScreen />} />
              <Route path="suggestions" element={<AdminSuggestionsScreen />} />
            </Routes>
          </RequireAdmin>
        } />
        
        {/* Smart Redirects */}
        <Route path="/" element={<Navigate to={user ? "/menu" : "/auth"} />} />
        <Route path="*" element={<Navigate to={user ? "/menu" : "/auth"} />} />
      </Routes>
    </Suspense>
  )
}
```

---

## 🏛️ Olympisches Intro-System

### 📄 `src/components/AppIntro.tsx`
**Zweck:** Epische Olympische Intro-Animation mit Tempel
```tsx
import React, { useState } from "react";
import s from "./AppIntro.module.css";

interface AppIntroProps {
  onComplete?: () => void;
}

function AppIntro({ onComplete }: AppIntroProps) {
  const [phase, setPhase] = useState<"wait"|"idle"|"reveal"|"text">("wait");
  const [doorsOpen, setDoorsOpen] = useState(false);

  const startIntro = () => {
    setPhase("idle");

    // t=1.2s - Olympische Türen öffnen sich majestätisch
    setTimeout(() => {
      setPhase("reveal");
      setDoorsOpen(true);
    }, 1200);

    // t=2.5s - Text emerges aus der Dunkelheit der Götter
    setTimeout(() => {
      setPhase("text");
    }, 2500);

    // t=8s - Intro beendet, zu den Spielen!
    setTimeout(() => {
      onComplete?.();
    }, 8000);
  };

  return (
    <section className={s.stage}>
      {phase==="wait" && (
        <div className={s.clickOverlay} onClick={startIntro}>
          <p>Tippe, um die Spiele zu beginnen…</p>
        </div>
      )}

      {/* Olympischer Himmel + Marmor-Tempel */}
      <div className={s.sky}/>
      <div className={s.clouds}/>
      <div className={s.temple}>
        <div className={s.pediment}>
          <div className={s.frieze}/>
          <div className={s.title}>MALLEX</div>
        </div>

        {/* Olympische Säulen-Türen */}
        <div className={`${s.door} ${s.left} ${doorsOpen ? s.open : ""}`}/>
        <div className={`${s.door} ${s.right} ${doorsOpen ? s.open : ""}`}/>
        
        {/* Emergierender Text mit 3D-Effekt */}
        {phase === "text" && (
          <div className={s.emergingText}>
            <h1>DIE OLYMPISCHEN SAUFSPIELE</h1>
            <h2>ZEIGE MUT, EHRE UND TRINKE WIE EINE LEGENDE</h2>
            <h3>LASS DIE SPIELE BEGINNEN</h3>
          </div>
        )}
      </div>
    </section>
  );
}

export { AppIntro };
export default AppIntro;
```
**Funktionen:**
- **Phase 1:** User-Tap zum Starten
- **Phase 2:** Olympische Türen öffnen sich (1.2s)
- **Phase 3:** Text emerged aus Dunkelheit (2.5s)  
- **Phase 4:** Auto-Weiterleitung nach 8s
- Vollständig responsives olympisches Design

### 📄 `src/components/AppIntro.module.css`
**Zweck:** Olympisches Intro-Styling mit 3D-Effekten
```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;900&family=Dancing+Script:wght@400;500;600;700&display=swap');

:root{
  --navy:#0f1c33;
  --gold:#ffd166;
  --marble:#f1f2f4;
  --shadow:0 10px 40px rgba(0,0,0,.45);
}

/* Olympische Bühne */
.stage{
  position:fixed;
  inset:0;
  background:linear-gradient(#0b1327,#0b0f1b);
  overflow:hidden;
  z-index:9999;
}

/* Himmlischer Hintergrund */
.sky{
  position:absolute;
  inset:0;
  background:
    radial-gradient(1200px 600px at 50% 10%,rgba(255,209,102,.08),transparent 60%),
    linear-gradient(180deg,#14264a 0%, #0b1220 70%);
}

/* Driftende Wolken */
.clouds{
  position:absolute;
  inset:-20% -10%;
  background:
    radial-gradient(50% 20% at 20% 20%,rgba(255,255,255,.06),transparent 70%),
    radial-gradient(50% 20% at 70% 30%,rgba(255,255,255,.05),transparent 70%);
  animation: drift 40s linear infinite;
}

/* Marmor-Tempel */
.temple{
  position:absolute;
  left:50%;
  top:52%;
  transform:translate(-50%,-50%);
  width:min(960px,94vw);
  height:min(600px,86vh);
  filter:drop-shadow(0 10px 60px rgba(0,0,0,.35));
  perspective:1000px;
}

/* Olympische Türen mit 3D-Effekt */
.door{
  position:absolute;
  top:18%;
  bottom:0;
  width:50%;
  background:
    linear-gradient(180deg,rgba(0,0,0,.06),transparent 30%),
    repeating-linear-gradient(90deg,transparent 0 22px, rgba(0,0,0,.05) 22px 24px),
    linear-gradient(#f6f7f8,#e7eaee);
  box-shadow: 
    inset 0 0 0 1px rgba(0,0,0,.08), 
    inset 0 -10px 25px rgba(0,0,0,.12);
  transition: transform 1.1s cubic-bezier(.25,.8,.25,1);
}

.door.open.left{
  transform: perspective(1000px) rotateY(-65deg) !important;
}
.door.open.right{
  transform: perspective(1000px) rotateY(65deg) !important;
}

/* Emergierender Text mit olympischen Schriften */
.emergingText{
  position:absolute;
  left:50%;
  top:60%;
  transform:translate(-50%, -50%);
  text-align:center;
  color:#fff;
  font-family:"Dancing Script", cursive;
  z-index:10;
  animation: emerge 5s ease-out forwards;
}

.emergingText h1{
  font-size:clamp(2.2rem, 6vw, 3.8rem);
  font-weight:700;
  background:linear-gradient(135deg,var(--gold),#fff,var(--gold));
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;
  text-shadow:0 0 20px rgba(255,209,102,.8);
  font-family:"Dancing Script", cursive;
  font-style:italic;
}

@keyframes emerge{
  0%{
    opacity:0;
    transform:translate(-50%, -50%) scale(0.1) translateZ(-500px);
    filter:blur(15px);
  }
  100%{
    opacity:1;
    transform:translate(-50%, -50%) scale(1) translateZ(0px);
    filter:blur(0px);
  }
}
```

---

## ⚔️ Arena-System (Erweitert)

### 📄 `src/features/Arena/ArenaScreen.tsx`
**Zweck:** Hauptspiel mit Orakel-System und 5 Kategorien
```tsx
import React, { useState, useCallback } from 'react'
import { usePlayers } from '../../context/PlayersContext'
import { getRandomChallenge, Challenge } from './challenges'
import styles from './ArenaScreen.module.css'

interface ArenaState {
  currentPlayer: Player | null
  currentChallenge: Challenge | null
  isSpinning: boolean
  gamePhase: 'waiting' | 'spinning' | 'challenge' | 'verdict'
}

export default function ArenaScreen() {
  const { players, updatePlayer } = usePlayers()
  const [arena, setArena] = useState<ArenaState>({
    currentPlayer: null,
    currentChallenge: null,
    isSpinning: false,
    gamePhase: 'waiting'
  })

  // Orakel-System: Das Schicksal entscheidet
  const invokeOracle = useCallback(() => {
    if (players.length === 0) return
    
    setArena(prev => ({ ...prev, isSpinning: true, gamePhase: 'spinning' }))
    
    // 2s Orakel-Animation für Spannung
    setTimeout(() => {
      const randomPlayer = players[Math.floor(Math.random() * players.length)]
      const randomChallenge = getRandomChallenge()
      
      setArena({
        currentPlayer: randomPlayer,
        currentChallenge: randomChallenge,
        isSpinning: false,
        gamePhase: 'challenge'
      })
    }, 2000)
  }, [players])

  // Triumph/Niederlage Bewertung
  const handleVerdict = async (verdict: 'triumph' | 'defeat') => {
    if (!arena.currentPlayer) return
    
    const pointsChange = verdict === 'triumph' ? 3 : -1
    
    await updatePlayer(arena.currentPlayer.id, {
      arenaPoints: arena.currentPlayer.arenaPoints + pointsChange,
      totalGames: arena.currentPlayer.totalGames + 1,
      [verdict === 'triumph' ? 'wins' : 'losses']: 
        arena.currentPlayer[verdict === 'triumph' ? 'wins' : 'losses'] + 1
    })
    
    setArena({
      currentPlayer: null,
      currentChallenge: null,
      isSpinning: false,
      gamePhase: 'waiting'
    })
  }

  return (
    <div className={styles.arena}>
      <header className={styles.arenaHeader}>
        <h1>⚡🏛️⚡ MALLEX ARENA ⚡🏛️⚡</h1>
        <p>Das Orakel der Götter entscheidet euer Schicksal</p>
      </header>

      {/* Gladiatoren-Amphitheater */}
      <section className={styles.gladiators}>
        <h2>🏺 GLADIATOREN IM AMPHITHEATER 🏺</h2>
        <div className={styles.gladiatorsGrid}>
          {players.map(player => (
            <div 
              key={player.id} 
              className={`${styles.gladiator} ${
                arena.currentPlayer?.id === player.id ? styles.chosen : ''
              }`}
            >
              <div className={styles.gladiatorName}>{player.name}</div>
              <div className={styles.gladiatorPoints}>
                {player.arenaPoints} ⚔️
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Orakel-Sektion */}
      <section className={styles.oracleSection}>
        {arena.gamePhase === 'waiting' && (
          <button 
            className={styles.oracleButton}
            onClick={invokeOracle}
            disabled={players.length === 0}
          >
            ⚔️ IN DIE ARENA! ⚔️
          </button>
        )}

        {arena.isSpinning && (
          <div className={styles.oracleSpinning}>
            <div className={styles.spinner}>🔮</div>
            <p>Das Orakel entscheidet über euer Schicksal...</p>
          </div>
        )}

        {arena.gamePhase === 'challenge' && arena.currentChallenge && (
          <div className={styles.challengeCard}>
            <div className={styles.challengeHeader}>
              <h3>{arena.currentChallenge.category}</h3>
              <span className={styles.difficulty}>
                {arena.currentChallenge.difficulty}
              </span>
            </div>
            <p className={styles.challengeTask}>
              {arena.currentChallenge.task}
            </p>
            <div className={styles.verdictButtons}>
              <button 
                className={styles.triumphButton}
                onClick={() => handleVerdict('triumph')}
              >
                🏆 TRIUMPH
              </button>
              <button 
                className={styles.defeatButton}
                onClick={() => handleVerdict('defeat')}
              >
                💀 NIEDERLAGE
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
```

### 📄 `src/features/Arena/challenges.ts`
**Zweck:** Erweiterte Aufgaben-Datenbank mit 5 olympischen Kategorien
```typescript
export interface Challenge {
  id: string
  category: 'Schicksal' | 'Schande' | 'Verführung' | 'Eskalation' | 'Beichte'
  task: string
  difficulty: 'easy' | 'medium' | 'hard'
  sips: number  // Anzahl Schlücke bei Niederlage
}

// 🎭 SCHICKSAL - Zufälliges Schicksal der Götter
const fateQuests: Challenge[] = [
  {
    id: 'fate_coin',
    category: 'Schicksal',
    task: '🪙 Wirf die Münze des Schicksals - Die Götter entscheiden über Triumph oder Tribut!',
    difficulty: 'medium',
    sips: 2
  },
  {
    id: 'fate_oracle',
    category: 'Schicksal', 
    task: '👑 Der Orakel-Sprecher zu deiner Rechten verkündet dein Schicksal!',
    difficulty: 'easy',
    sips: 1
  },
  {
    id: 'fate_silence',
    category: 'Schicksal',
    task: '🤐 Du wirst von den Musen mit Stummheit geschlagen - bis zur nächsten Prüfung!',
    difficulty: 'hard',
    sips: 3
  }
]

// 🔥 SCHANDE - Prüfungen der Schande
const shameQuests: Challenge[] = [
  {
    id: 'shame_dance',
    category: 'Schande',
    task: '💃 Führe den Tanz der Bacchantinnen 30 Sekunden lang auf!',
    difficulty: 'medium',
    sips: 2
  },
  {
    id: 'shame_strength',
    category: 'Schande',
    task: '💪 Beweise deine Stärke wie ein Gladiator - 10 Liegestütze oder 2 Opfergaben!',
    difficulty: 'hard',
    sips: 2
  },
  {
    id: 'shame_poetry',
    category: 'Schande',
    task: '🎨 Sprich 3 Runden lang nur in Versen eines antiken Dichters!',
    difficulty: 'hard',
    sips: 3
  }
]

// 💘 VERFÜHRUNG - Künste der Venus
const seductionQuests: Challenge[] = [
  {
    id: 'seduce_whisper',
    category: 'Verführung',
    task: '💋 Flüstere der Person links von dir etwas Verführerisches ins Ohr.',
    difficulty: 'medium',
    sips: 2
  },
  {
    id: 'seduce_compliment',
    category: 'Verführung',
    task: '🌹 Mache jemandem ein sinnliches Kompliment, das die Götter erröten lässt.',
    difficulty: 'easy',
    sips: 1
  },
  {
    id: 'seduce_fantasy',
    category: 'Verführung',
    task: '🔥 Teile deine wildeste Fantasie mit der Gruppe - die Götter lauschen!',
    difficulty: 'hard',
    sips: 3
  }
]

// ⚡ ESKALATION - Rausch des Bacchus  
const escalationQuests: Challenge[] = [
  {
    id: 'escalate_call',
    category: 'Eskalation',
    task: '📞 Rufe den letzten Kontakt in deinem Handy an und sage "Ich vermisse dich".',
    difficulty: 'hard',
    sips: 3
  },
  {
    id: 'escalate_story',
    category: 'Eskalation',
    task: '🍷 Erzähle die verrückteste Geschichte aus deiner Trinkvergangenheit!',
    difficulty: 'medium',
    sips: 2
  },
  {
    id: 'escalate_dare',
    category: 'Eskalation',
    task: '🎭 Wage ein Wagnis, das selbst Dionysos beeindrucken würde!',
    difficulty: 'hard',
    sips: 3
  }
]

// 🗿 BEICHTE - Bekenntnisse der Wahrheit
const confessionQuests: Challenge[] = [
  {
    id: 'confess_shame',
    category: 'Beichte',
    task: '😳 Erzähle dein peinlichstes Erlebnis der letzten Woche.',
    difficulty: 'easy',
    sips: 1
  },
  {
    id: 'confess_secret',
    category: 'Beichte',
    task: '🤫 Verrate ein Geheimnis, das niemand von dir weiß.',
    difficulty: 'medium',
    sips: 2
  },
  {
    id: 'confess_crush',
    category: 'Beichte',
    task: '💕 Gestehe, in wen du zuletzt heimlich verliebt warst.',
    difficulty: 'hard',
    sips: 2
  }
]

// Kombinierte Aufgaben-Datenbank
export const challenges: Challenge[] = [
  ...fateQuests,
  ...shameQuests, 
  ...seductionQuests,
  ...escalationQuests,
  ...confessionQuests
]

// Orakel-Funktionen
export const getRandomChallenge = (): Challenge => {
  const randomIndex = Math.floor(Math.random() * challenges.length)
  return challenges[randomIndex]
}

export const getChallengesByCategory = (category: Challenge['category']): Challenge[] => {
  return challenges.filter(challenge => challenge.category === category)
}

export const getChallengesByDifficulty = (difficulty: Challenge['difficulty']): Challenge[] => {
  return challenges.filter(challenge => challenge.difficulty === difficulty)
}
```

---

## 🌍 Internationalisierung

### 📄 `src/i18n/de.json` (Hauptsprache)
**Zweck:** Deutsche olympische Begriffe und Aufgaben
```json
{
  "common": {
    "loading": "Die Götter bereiten sich vor...",
    "error": "Die Götter sind erzürnt",
    "triumph": "🏆 TRIUMPH",
    "defeat": "💀 NIEDERLAGE",
    "arena": "Arena",
    "gladiators": "Gladiatoren"
  },
  "arena": {
    "title": "⚡🏛️⚡ MALLEX ARENA ⚡🏛️⚡",
    "subtitle": "Das Orakel der Götter entscheidet euer Schicksal",
    "enterArena": "⚔️ IN DIE ARENA! ⚔️",
    "oracleDecides": "Das Orakel entscheidet über euer Schicksal...",
    "categories": {
      "fate": "🎭 Schicksal - Das Wirken der Götter",
      "shame": "🔥 Schande - Prüfung der Ehre", 
      "seduce": "💘 Verführung - Künste der Venus",
      "escalate": "⚡ Eskalation - Rausch des Bacchus",
      "confess": "🗿 Beichte - Wahrheit vor den Göttern"
    }
  },
  "menu": {
    "title": "🏛️ OLYMPISCHES HAUPTQUARTIER",
    "welcome": "Willkommen in den olympischen Saufspielen!",
    "chooseDestiny": "Wähle dein Schicksal, tapferer Gladiator!"
  },
  "players": {
    "gladiators": "🏺 GLADIATOREN IM AMPHITHEATER 🏺",
    "addGladiator": "Neuer Gladiator",
    "arenaPoints": "Arena-Punkte",
    "totalGames": "Kämpfe",
    "winRate": "Triumph-Rate"
  }
}
```

---

## 🔥 Firebase Integration (Erweitert)

### 📄 `src/context/PlayersContext.tsx`
**Zweck:** Erweiterte Spielerverwaltung mit Real-time Firestore
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
  orderBy,
  increment,
  where
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
  favoriteCategory?: string
  achievements: string[]
  createdAt: Date
  lastGame?: Date
  userId: string
}

interface PlayersContextType {
  players: Player[]
  loading: boolean
  addPlayer: (name: string) => Promise<string>
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>
  deletePlayer: (id: string) => Promise<void>
  getPlayerById: (id: string) => Player | undefined
  getLeaderboard: () => Player[]
  getPlayerStats: (id: string) => PlayerStats | null
}

interface PlayerStats {
  rank: number
  winRate: number
  averagePoints: number
  gamesThisWeek: number
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

    // Real-time Firestore Query mit Sortierung
    const playersQuery = query(
      collection(db, 'players'),
      orderBy('arenaPoints', 'desc'),
      orderBy('createdAt', 'asc')
    )
    
    const unsubscribe = onSnapshot(playersQuery, (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastGame: doc.data().lastGame?.toDate()
      })) as Player[]
      
      setPlayers(playersData)
      setLoading(false)
    }, (error) => {
      console.error('Fehler beim Laden der Spieler:', error)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const addPlayer = async (name: string): Promise<string> => {
    if (!user) throw new Error('Nicht authentifiziert')
    
    const newPlayerRef = await addDoc(collection(db, 'players'), {
      name,
      arenaPoints: 0,
      totalGames: 0,
      wins: 0,
      losses: 0,
      achievements: [],
      createdAt: new Date(),
      userId: user.uid
    })
    
    return newPlayerRef.id
  }

  const updatePlayer = async (id: string, updates: Partial<Player>) => {
    const playerRef = doc(db, 'players', id)
    
    // Spezielle Behandlung für Punkt-Updates
    if ('arenaPoints' in updates) {
      await updateDoc(playerRef, {
        ...updates,
        arenaPoints: increment(updates.arenaPoints!),
        lastGame: new Date()
      })
    } else {
      await updateDoc(playerRef, updates)
    }
  }

  const deletePlayer = async (id: string) => {
    await deleteDoc(doc(db, 'players', id))
  }

  const getPlayerById = (id: string): Player | undefined => {
    return players.find(player => player.id === id)
  }

  const getLeaderboard = (): Player[] => {
    return [...players].sort((a, b) => {
      if (a.arenaPoints !== b.arenaPoints) {
        return b.arenaPoints - a.arenaPoints
      }
      return b.wins - a.wins
    })
  }

  const getPlayerStats = (id: string): PlayerStats | null => {
    const player = getPlayerById(id)
    if (!player) return null
    
    const leaderboard = getLeaderboard()
    const rank = leaderboard.findIndex(p => p.id === id) + 1
    const winRate = player.totalGames > 0 ? (player.wins / player.totalGames) * 100 : 0
    const averagePoints = player.totalGames > 0 ? player.arenaPoints / player.totalGames : 0
    
    // Games this week calculation
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const gamesThisWeek = player.lastGame && player.lastGame > oneWeekAgo ? 1 : 0 // Simplified
    
    return {
      rank,
      winRate: Math.round(winRate),
      averagePoints: Math.round(averagePoints * 10) / 10,
      gamesThisWeek
    }
  }

  return (
    <PlayersContext.Provider value={{
      players,
      loading,
      addPlayer,
      updatePlayer, 
      deletePlayer,
      getPlayerById,
      getLeaderboard,
      getPlayerStats
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

## 🎨 Design-System Components

### 📄 `src/components/ModernButton.tsx`
**Zweck:** Olympisches Button-System mit Design-Token
```tsx
import { ButtonHTMLAttributes, forwardRef } from 'react'
import styles from './ModernButton.module.css'

interface ModernButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'triumph' | 'defeat' | 'oracle'
  size?: 'small' | 'medium' | 'large' | 'epic'
  loading?: boolean
  icon?: string
  fullWidth?: boolean
}

const ModernButton = forwardRef<HTMLButtonElement, ModernButtonProps>(({
  children,
  variant = 'primary',
  size = 'medium', 
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}, ref) => {
  const buttonClasses = [
    styles.modernButton,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className={styles.spinner}>⏳</span>}
      {icon && !loading && <span className={styles.icon}>{icon}</span>}
      <span className={styles.content}>{children}</span>
    </button>
  )
})

ModernButton.displayName = 'ModernButton'

export default ModernButton
```

### 📄 `src/styles/tokens.css`
**Zweck:** Erweiterte olympische Design-Token
```css
:root {
  /* 🏛️ Olympische Hauptfarben */
  --olympic-gold: #DAA520;
  --ancient-bronze: #CD7F32;
  --marble-white: #F8F8FF;
  --temple-stone: #696969;
  --olympian-blue: #4682B4;
  --flame-red: #DC143C;
  --victory-green: #228B22;
  --shadow-purple: #8A2BE2;

  /* 🎭 Kategorien-Farben */
  --fate-gradient: linear-gradient(135deg, #8A2BE2, #9932CC);
  --shame-gradient: linear-gradient(135deg, #DC143C, #B22222);
  --seduce-gradient: linear-gradient(135deg, #FF69B4, #FF1493);
  --escalate-gradient: linear-gradient(135deg, #FF4500, #FF6347);
  --confess-gradient: linear-gradient(135deg, #4169E1, #1E90FF);

  /* 📐 Goldener Schnitt Abstände */
  --golden-ratio: 1.618;
  --space-xs: calc(0.25rem);
  --space-sm: calc(0.25rem * var(--golden-ratio));
  --space-md: calc(0.25rem * var(--golden-ratio) * var(--golden-ratio));
  --space-lg: calc(0.25rem * var(--golden-ratio) * var(--golden-ratio) * var(--golden-ratio));
  --space-xl: calc(0.25rem * var(--golden-ratio) * var(--golden-ratio) * var(--golden-ratio) * var(--golden-ratio));

  /* 🎨 Olympische Schatten */
  --shadow-temple: 0 10px 40px rgba(0, 0, 0, 0.3);
  --shadow-gold: 0 0 20px rgba(218, 165, 32, 0.5);
  --shadow-marble: 0 4px 20px rgba(255, 255, 255, 0.1);
  
  /* ⚡ Performance-optimierte Transitionen */
  --transition-swift: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-graceful: 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
  --transition-epic: 800ms cubic-bezier(0.175, 0.885, 0.32, 1.275);

  /* 📱 Responsive Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;

  /* 🏛️ Olympische Typografie */
  --font-display: "Dancing Script", "Cinzel", cursive;
  --font-body: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
  
  /* 📊 Z-Index Hierarchie */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-modal: 1100;
  --z-toast: 1200;
  --z-intro: 9999;
}

/* 🌙 Dark Mode Anpassungen */
@media (prefers-color-scheme: dark) {
  :root {
    --marble-white: #1a1a1a;
    --temple-stone: #e5e5e5;
    --shadow-temple: 0 10px 40px rgba(0, 0, 0, 0.6);
  }
}

/* 🔥 Performance-optimierte Animationen */
@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-swift: 0ms;
    --transition-graceful: 0ms;
    --transition-epic: 0ms;
  }
  
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Diese detaillierte Dokumentation zeigt die vollständige olympische Architektur von MALLEX mit allen erweiterten Features! 🏛️⚔️🏆


import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import styles from './AuthScreen.module.css'

export default function AuthScreen() {
  const { signInEmail, signUpEmail, signInGuest, mode } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const nav = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    try {
      if (isSignup) await signUpEmail(email, password)
      else await signInEmail(email, password)
      nav('/arena')
    } catch (e: any) {
      setErr(e.message ?? 'Anmeldung fehlgeschlagen')
    }
  }

  async function onGuest() {
    setErr(null)
    try {
      await signInGuest()
      nav('/arena')
    } catch (e: any) { setErr(e.message ?? 'Gastzugang fehlgeschlagen') }
  }

  return (
    <section style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1>{isSignup ? 'Konto erstellen' : 'Anmelden'}</h1>
      {mode === 'guest' && <p style={{opacity:.8}}>Firebase ENV nicht gefunden – nutze lokalen Gastmodus.</p>}
      <form onSubmit={onSubmit} className="card glass" style={{ display:'grid', gap:12 }}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-Mail" type="email" required />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Passwort" type="password" required />
        <button type="submit">{isSignup ? 'Registrieren' : 'Einloggen'}</button>
        <button type="button" onClick={()=>setIsSignup(s=>!s)} style={{opacity:.8}}>
          {isSignup ? 'Schon ein Konto? Einloggen' : 'Neu hier? Registrieren'}
        </button>
      </form>
      <div style={{ marginTop: 16 }}>
        <button onClick={onGuest}>Als Gast fortfahren</button>
      </div>
      {err && <p style={{ color: '#ff8a8a' }}>{err}</p>}
    </section>
  )
}
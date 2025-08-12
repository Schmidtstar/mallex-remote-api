import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePlayersContext } from '@/context/PlayersContext'
import { useAuth } from '@/context/AuthContext'
import styles from './LegendsScreen.module.css'

export function LegendsScreen() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { players, addPlayer, removePlayer, mode, loading } = usePlayersContext()
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const validatePlayerName = (name: string): string | null => {
    const trimmed = name.trim()
    if (!trimmed) return t('legends.validation.required') || 'Legendenname ist erforderlich'
    if (trimmed.length < 2) return t('legends.validation.tooShort') || 'Mindestens 2 Zeichen erforderlich'
    if (trimmed.length > 50) return t('legends.validation.tooLong') || 'Maximal 50 Zeichen erlaubt'
    if (players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      return t('legends.validation.duplicate') || 'Diese Legende existiert bereits'
    }
    return null
  }

  const handleAddPlayer = async () => {
    if (isAdding) return

    const validationError = validatePlayerName(newPlayerName)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsAdding(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await addPlayer(newPlayerName.trim())
      setNewPlayerName('')
      setSuccessMessage(t('legends.addSuccess') || 'Legende erfolgreich hinzugefügt!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Failed to add player:', error)
      setError(t('legends.addError') || 'Fehler beim Hinzufügen der Legende')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemovePlayer = async (id: string) => {
    try {
      await removePlayer(id)
    } catch (error) {
      console.error('Failed to remove player:', error)
      alert(t('legends.removeError') || 'Fehler beim Entfernen der Legende')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleAddPlayer()
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        {t('common.loading')}...
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
        <h1 className={styles.title}>
          <span style={{ marginRight: '1rem' }}>⚜️</span>
          {t('legends.title')}
          <span style={{ marginLeft: '1rem' }}>⚜️</span>
        </h1>
        <div style={{ 
          color: 'var(--ancient-gold)', 
          fontSize: '1.1rem',
          fontStyle: 'italic',
          margin: '1rem 0' 
        }}>
          🌿 "Nur die Würdigsten betreten diese heiligen Hallen" 🌿
        </div>
      </div>

      {!user ? (
        <div className={styles.messageBoxInfo}>
          <p>{t('legends.loginRequired') || 'Melde dich an, um deine Legenden zu speichern.'}</p>
        </div>
      ) : user.isAnonymous ? (
        <div className={styles.messageBoxWarning}>
          <p>{t('legends.guestMode') || 'Gast-Modus: Legenden werden nur lokal gespeichert.'}</p>
        </div>
      ) : null}

      {error && (
        <div className={styles.messageBoxError}>
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className={styles.messageBoxSuccess}>
          <p>{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.addPlayerForm}>
        <div className={styles.addPlayerInputGroup}>
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder={t('legends.playerNamePlaceholder') || 'Legendenname eingeben'}
            className={styles.inputField}
            disabled={isAdding}
            maxLength={50}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="submit"
            disabled={!newPlayerName.trim() || isAdding}
            className={`${styles.addButton} ${isAdding ? styles.loading : ''}`}
          >
            {isAdding ? (
              <>
                <span className={styles.spinner}></span>
                {t('common.adding') || 'Hinzufügen...'}
              </>
            ) : (
              <>
                <span className={styles.addIcon}>+</span>
                {t('legends.addPlayer') || 'Hinzufügen'}
              </>
            )}
          </button>
        </div>
        {newPlayerName.trim() && (
          <div className={styles.preview}>
            <span className={styles.previewLabel}>Vorschau:</span>
            <span className={styles.previewName}>{newPlayerName.trim()}</span>
          </div>
        )}
      </form>

      {players.length === 0 ? (
        <div className={styles.noPlayersMessage}>
          {t('legends.noPlayers') || 'Noch keine Legenden hinzugefügt'}
        </div>
      ) : (
        <div>
          <h2 className={styles.playersListTitle}>{t('legends.playersList') || 'Legenden'} ({players.length})</h2>
          <div className={styles.playersGrid}>
            {players.map((player) => (
              <div
                key={player.id}
                className={styles.playerItem}
              >
                <span className={styles.playerName}>
                  {player.name}
                </span>
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className={styles.removeButton}
                  title={t('legends.removePlayer') || 'Legende entfernen'}
                >
                  {t('common.remove') || 'Entfernen'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
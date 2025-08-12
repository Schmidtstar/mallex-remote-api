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

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim() || isAdding) return

    setIsAdding(true)
    try {
      await addPlayer(newPlayerName.trim())
      setNewPlayerName('')
    } catch (error) {
      console.error('Failed to add player:', error)
      alert(t('legends.addError') || 'Fehler beim Hinzufügen des Spielers')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemovePlayer = async (id: string) => {
    try {
      await removePlayer(id)
    } catch (error) {
      console.error('Failed to remove player:', error)
      alert(t('legends.removeError') || 'Fehler beim Entfernen des Spielers')
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
      <h1 className={styles.title}>{t('legends.title')}</h1>

      {!user ? (
        <div className={styles.messageBoxInfo}>
          <p>{t('legends.loginRequired') || 'Melde dich an, um deine Spieler zu speichern.'}</p>
        </div>
      ) : user.isAnonymous ? (
        <div className={styles.messageBoxWarning}>
          <p>{t('legends.guestMode') || 'Gast-Modus: Spieler werden nur lokal gespeichert.'}</p>
        </div>
      ) : (
        <div className={styles.messageBoxSuccess}>
          <p>
            {t('legends.syncMode') || 'Spieler werden in deinem Profil gespeichert.'} 
            {mode === 'firebase' ? ' ✓' : ' (localStorage fallback)'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.addPlayerForm}>
        <div className={styles.addPlayerInputGroup}>
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder={t('legends.playerNamePlaceholder') || 'Spielername eingeben'}
            className={styles.inputField}
            disabled={isAdding}
          />
          <button
            type="submit"
            disabled={!newPlayerName.trim() || isAdding}
            className={styles.addButton}
          >
            {isAdding ? t('common.adding') || 'Hinzufügen...' : t('legends.addPlayer') || 'Hinzufügen'}
          </button>
        </div>
      </form>

      {players.length === 0 ? (
        <div className={styles.noPlayersMessage}>
          {t('legends.noPlayers') || 'Noch keine Spieler hinzugefügt'}
        </div>
      ) : (
        <div>
          <h2 className={styles.playersListTitle}>{t('legends.playersList') || 'Spieler'} ({players.length})</h2>
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
                  title={t('legends.removePlayer') || 'Spieler entfernen'}
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
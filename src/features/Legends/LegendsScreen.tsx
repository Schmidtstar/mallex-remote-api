import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePlayersContext } from '@/context/PlayersContext'
import { useAuth } from '@/context/AuthContext'
import { useSwipe } from '@/hooks/useSwipe'
import styles from './LegendsScreen.module.css'

export function LegendsScreen() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { players, addPlayer, removePlayer, loading } = usePlayersContext()
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Delete confirmation state
  const [playerToDelete, setPlayerToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleAddPlayer()
  }

  const handleSwipeDelete = (playerId: string, playerName: string) => {
    setPlayerToDelete({ id: playerId, name: playerName })
  }

  const confirmDelete = async () => {
    if (!playerToDelete) return

    setIsDeleting(true)
    setError(null)

    try {
      await removePlayer(playerToDelete.id)
      setSuccessMessage(`${playerToDelete.name} wurde aus der Halle der Legenden entfernt`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
      setError('Fehler beim Entfernen des Spielers')
    } finally {
      setIsDeleting(false)
      setPlayerToDelete(null)
    }
  }

  const cancelDelete = () => {
    setPlayerToDelete(null)
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
          Halle der Legenden
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
              <PlayerItem
                key={player.id}
                player={player}
                onSwipeDelete={handleSwipeDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {playerToDelete && (
        <div className={styles.deleteConfirmationOverlay}>
          <div className={styles.deleteConfirmationModal}>
            <h3 className={styles.deleteConfirmationTitle}>
              🗑️ Spieler entfernen
            </h3>
            <p className={styles.deleteConfirmationMessage}>
              Möchtest du <span className={styles.deleteConfirmationPlayerName}>{playerToDelete.name}</span> wirklich aus der Halle der Legenden entfernen?
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--ancient-bronze)', marginBottom: '1.5rem' }}>
              ⚠️ Alle Arena-Punkte und Statistiken gehen verloren!
            </p>
            <div className={styles.deleteConfirmationButtons}>
              <button
                className={`${styles.deleteConfirmationButton} ${styles.deleteConfirmationButtonCancel}`}
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Abbrechen
              </button>
              <button
                className={`${styles.deleteConfirmationButton} ${styles.deleteConfirmationButtonConfirm}`}
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '🗑️ Entfernen...' : '🗑️ Entfernen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Separate PlayerItem component with swipe functionality
interface PlayerItemProps {
  player: { id: string; name: string; arenaPoints: number }
  onSwipeDelete: (playerId: string, playerName: string) => void
}

function PlayerItem({ player, onSwipeDelete }: PlayerItemProps) {
  const [swipeTransform, setSwipeTransform] = useState(0)
  const [showDeleteIndicator, setShowDeleteIndicator] = useState(false)

  const swipeHandlers = useSwipe({
      onSwipeLeft: () => onSwipeDelete(player.id, player.name),
      onSwipeRight: () => {}, // Placeholder for potential right swipe action, currently unused
      threshold: 50,
      preventDefaultTouchmove: true
    })

    // Filter out non-DOM props to avoid React warnings
    const {
      swipeState,
      bindSwipe,
      isSwipingInDirection,
      getSwipeProgress,
      triggerHapticFeedback,
      ...validDOMProps
    } = swipeHandlers

  // Visual feedback during swipe
  React.useEffect(() => {
    // Ensure swipeHandlers.swipeDistance is only used when swiping is active
    if (swipeHandlers.isSwiping && swipeHandlers.swipeDistance !== undefined) {
      const transform = Math.min(Math.abs(swipeHandlers.swipeDistance), 100)
      setSwipeTransform(-transform)
      setShowDeleteIndicator(transform > 30)
    } else if (!swipeHandlers.isSwiping) {
      // Reset on swipe end
      setSwipeTransform(0)
      setShowDeleteIndicator(false)
    }
  }, [swipeHandlers.isSwiping, swipeHandlers.swipeDistance])


  return (
    <div
      key={player.id}
      className={`${styles.playerItem} ${swipeHandlers.swipeState === 'left' ? styles.swipeLeft : ''} ${swipeHandlers.swipeState === 'right' ? styles.swipeRight : ''}`}
      onTouchStart={swipeHandlers.onTouchStart}
      onTouchMove={swipeHandlers.onTouchMove}
      onTouchEnd={swipeHandlers.onTouchEnd}
      onMouseDown={swipeHandlers.onMouseDown}
      onMouseMove={swipeHandlers.onMouseMove}
      onMouseUp={swipeHandlers.onMouseUp}
      style={{
        transform: `translateX(${swipeTransform}px)`
      }}
      aria-label={`Spieler ${player.name}`}
      {...validDOMProps}
    >
      <span className={styles.playerName}>
        {player.name}
      </span>

      <div className={styles.playerStats}>
        <span style={{ color: 'var(--ancient-gold)', fontSize: '0.9rem' }}>
          {player.arenaPoints || 0} Punkte
        </span>
      </div>

      <div className={`${styles.swipeDeleteIndicator} ${
        showDeleteIndicator ? styles.swipeDeleteIndicatorVisible : ''
      }`}>
        🗑️ Loslassen zum Löschen
      </div>
    </div>
  )
}
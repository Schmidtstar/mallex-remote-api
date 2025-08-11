
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePlayersContext } from '@/context/PlayersContext'
import { useAuth } from '@/context/AuthContext'

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
      <div style={{ padding: '20px', textAlign: 'center' }}>
        {t('common.loading')}...
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>{t('legends.title')}</h1>
      
      {!user ? (
        <div style={{ 
          background: '#f0f0f0', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <p>{t('legends.loginRequired') || 'Melde dich an, um deine Spieler zu speichern.'}</p>
        </div>
      ) : user.isAnonymous ? (
        <div style={{ 
          background: '#fff3cd', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          <p>{t('legends.guestMode') || 'Gast-Modus: Spieler werden nur lokal gespeichert.'}</p>
        </div>
      ) : (
        <div style={{ 
          background: '#d4edda', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          <p>
            {t('legends.syncMode') || 'Spieler werden in deinem Profil gespeichert.'} 
            {mode === 'firebase' ? ' ✓' : ' (localStorage fallback)'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder={t('legends.playerNamePlaceholder') || 'Spielername eingeben'}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px'
            }}
            disabled={isAdding}
          />
          <button
            type="submit"
            disabled={!newPlayerName.trim() || isAdding}
            style={{
              padding: '12px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: isAdding ? 'not-allowed' : 'pointer',
              opacity: (!newPlayerName.trim() || isAdding) ? 0.6 : 1
            }}
          >
            {isAdding ? t('common.adding') || 'Hinzufügen...' : t('legends.addPlayer') || 'Hinzufügen'}
          </button>
        </div>
      </form>

      {players.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#666', 
          fontStyle: 'italic',
          padding: '40px 0'
        }}>
          {t('legends.noPlayers') || 'Noch keine Spieler hinzugefügt'}
        </div>
      ) : (
        <div>
          <h2>{t('legends.playersList') || 'Spieler'} ({players.length})</h2>
          <div style={{ 
            display: 'grid', 
            gap: '10px',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
          }}>
            {players.map((player) => (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px'
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: '500' }}>
                  {player.name}
                </span>
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
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

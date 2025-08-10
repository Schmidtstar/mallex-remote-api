import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePlayers } from '../../context/PlayersContext'

export default function LegendsScreen() {
  const { t } = useTranslation()
  const { players, addPlayer, removePlayer } = usePlayers()
  const [newPlayerName, setNewPlayerName] = useState('')

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      addPlayer(newPlayerName.trim())
      setNewPlayerName('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPlayer()
    }
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🏛️ {t('legends.title')}</h1>

      {players.length === 0 ? (
        <div style={{ marginTop: '40px' }}>
          <p style={{ fontSize: '18px', marginBottom: '20px' }}>
            {t('legends.empty.description')}
          </p>
          <div style={{ marginTop: '30px' }}>
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('legends.input.placeholder')}
              style={{
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                marginRight: '10px',
                minWidth: '200px'
              }}
            />
            <button
              onClick={handleAddPlayer}
              style={{
                padding: '12px 20px',
                fontSize: '16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {t('legends.empty.cta')}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '30px' }}>
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('legends.input.placeholder')}
              style={{
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                marginRight: '10px',
                minWidth: '200px'
              }}
            />
            <button
              onClick={handleAddPlayer}
              style={{
                padding: '12px 20px',
                fontSize: '16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {t('legends.add')}
            </button>
          </div>

          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            {players.map((player) => (
              <div
                key={player}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 15px',
                  margin: '10px 0',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px'
                }}
              >
                <span style={{ fontSize: '16px' }}>{player}</span>
                <button
                  onClick={() => removePlayer(player)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {t('legends.remove')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
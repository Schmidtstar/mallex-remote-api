
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { categories } from '../Arena/categories'
import { challenges } from '../Arena/challenges'

type CategoryLike = { id: string; labelKey?: string; items?: string[] };

const toCategoryArray = (input: any): CategoryLike[] => {
  if (Array.isArray(input)) return input as CategoryLike[];
  if (input && typeof input === 'object') {
    return Object.keys(input).map((id) => ({
      id,
      labelKey: (input[id]?.labelKey ?? `categories.${id}`),
      items: Array.isArray(input[id]?.items) ? input[id].items : [],
    }));
  }
  return [];
};

const categoryList: CategoryLike[] = toCategoryArray(categories);

export default function MenuScreen() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>(
    categoryList[0]?.id ?? 'fate'
  )

  // Load category from URL params on mount
  useEffect(() => {
    const catFromUrl = searchParams.get('cat')
    if (catFromUrl && challenges[catFromUrl as keyof typeof challenges]) {
      setSelectedCategoryKey(catFromUrl)
    }
  }, [searchParams])

  // Update URL when category changes
  const handleCategoryChange = (categoryKey: string) => {
    setSelectedCategoryKey(categoryKey)
    setSearchParams({ cat: categoryKey })
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/auth')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const selectedChallenges = challenges[selectedCategoryKey as keyof typeof challenges] || []

  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '28px' }}>
        {t('menu.title')}
      </h1>

      {/* Category Selection */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px', textAlign: 'center' }}>
          {t('arena.selectCategory')}
        </h2>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          {categoryList.map(category => {
            const categoryTasks = challenges[category.id as keyof typeof challenges] || []
            const isActive = selectedCategoryKey === category.id
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: isActive ? '#4CAF50' : 'rgba(255,255,255,0.2)',
                  color: isActive ? 'white' : '#fff',
                  border: isActive ? '2px solid #4CAF50' : '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isActive ? 'bold' : 'normal',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{t(category.labelKey || `categories.${category.id}`)}</span>
                <span style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.4)',
                  borderRadius: '12px',
                  padding: '2px 6px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {categoryTasks.length}
                </span>
              </button>
            )
          })}</div>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '15px',
        padding: '20px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          marginBottom: '20px',
          textAlign: 'center',
          color: '#4CAF50'
        }}>
          {t(categoryList.find(cat => cat.id === selectedCategoryKey)?.labelKey || `categories.${selectedCategoryKey}`)} 
          <span style={{ color: '#fff', fontWeight: 'normal' }}>
            {' '}({selectedChallenges.length} {selectedChallenges.length === 1 ? 'Aufgabe' : 'Aufgaben'})
          </span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {selectedChallenges.map((challengeKey, index) => {
            const challengeText = t(challengeKey, { defaultValue: challengeKey })
            
            return (
              <div
                key={challengeKey}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '15px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(5px)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <span style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </span>
                  <span style={{
                    fontSize: '15px',
                    lineHeight: '1.4',
                    color: '#fff'
                  }}>
                    {challengeText}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Auth Section */}
      <div style={{
        marginTop: '30px',
        textAlign: 'center',
        padding: '20px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {user && !user.isAnonymous ? (
          <button
            onClick={handleLogout}
            style={{
              padding: '12px 25px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {t('actions.logout')}
          </button>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '12px 25px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {t('menu.register')}
          </button>
        )}
      </div>
    </div>
  )
}

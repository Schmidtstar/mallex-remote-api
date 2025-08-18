
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './LanguageSelector.module.css'

interface LanguageSelectorProps {
  onLanguageSelected: (language: string) => void
}

export function LanguageSelector({ onLanguageSelected }: LanguageSelectorProps) {
  const { i18n } = useTranslation()
  const [selectedLang, setSelectedLang] = useState('de')

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', description: 'Olympische Spiele auf Deutsch' },
    { code: 'en', name: 'English', flag: '🇺🇸', description: 'Olympic Games in English' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', description: 'Jeux Olympiques en Français' },
    { code: 'es', name: 'Español', flag: '🇪🇸', description: 'Juegos Olímpicos en Español' }
  ]

  const handleLanguageSelect = async (langCode: string) => {
    setSelectedLang(langCode)
    await i18n.changeLanguage(langCode)
    localStorage.setItem('mallex-language', langCode)
    
    setTimeout(() => {
      onLanguageSelected(langCode)
    }, 800)
  }

  return (
    <div className={styles.languageContainer}>
      <div className={styles.backgroundCanvas}>
        <div className={styles.starField}></div>
        <div className={styles.godRays}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.icon}>🌍</div>
          <h1 className={styles.title}>Wähle deine Sprache</h1>
          <h2 className={styles.subtitle}>Choose your Language</h2>
        </div>

        <div className={styles.languageGrid}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`${styles.languageCard} ${selectedLang === lang.code ? styles.selected : ''}`}
              onClick={() => handleLanguageSelect(lang.code)}
            >
              <div className={styles.flag}>{lang.flag}</div>
              <h3 className={styles.langName}>{lang.name}</h3>
              <p className={styles.langDescription}>{lang.description}</p>
              <div className={styles.selectIndicator}>
                {selectedLang === lang.code ? '✓' : ''}
              </div>
            </button>
          ))}
        </div>

        <div className={styles.continueHint}>
          <p>Sprache auswählen zum Fortfahren</p>
        </div>
      </div>
    </div>
  )
}

export default LanguageSelector

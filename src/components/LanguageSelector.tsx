import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './LanguageSelector.module.css'

interface LanguageSelectorProps {
  onComplete?: () => void
  onLanguageSelected?: (language: string) => void
  showSkip?: boolean
}

export default function LanguageSelector({ onComplete, onLanguageSelected, showSkip = false }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation()
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'de')

  // Die gleichen Sprachen wie im Menu-System verwenden
  const languages = [
    { 
      code: 'de', 
      name: t('language.german'), 
      flag: '🇩🇪', 
      description: 'Olympische Saufspiele auf Deutsch' 
    },
    { 
      code: 'en', 
      name: t('language.english'), 
      flag: '🇺🇸', 
      description: 'Olympic Drinking Games in English' 
    },
    { 
      code: 'fr', 
      name: t('language.french'), 
      flag: '🇫🇷', 
      description: 'Jeux Olympiques de Boisson en Français' 
    },
    { 
      code: 'es', 
      name: t('language.spanish'), 
      flag: '🇪🇸', 
      description: 'Juegos Olímpicos de Bebida en Español' 
    }
  ]

  const handleLanguageSelect = async (langCode: string) => {
    setSelectedLang(langCode)

    // Das gleiche System wie in MenuScreen verwenden
    await i18n.changeLanguage(langCode)
    localStorage.setItem('mallex-language', langCode)

    // Kurz warten für die Animation, dann weiterleiten
    setTimeout(() => {
      onLanguageSelected ? onLanguageSelected(langCode) : onComplete?.()
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
          <h1 className={styles.title}>
            {selectedLang === 'de' ? 'Wähle deine Sprache' : 
             selectedLang === 'en' ? 'Choose your Language' :
             selectedLang === 'fr' ? 'Choisissez votre langue' :
             'Elige tu idioma'}
          </h1>
          <h2 className={styles.subtitle}>
            {selectedLang === 'de' ? 'Choose your Language | Choisissez votre langue | Elige tu idioma' :
             selectedLang === 'en' ? 'Wähle deine Sprache | Choisissez votre langue | Elige tu idioma' :
             selectedLang === 'fr' ? 'Wähle deine Sprache | Choose your Language | Elige tu idioma' :
             'Wähle deine Sprache | Choose your Language | Choisissez votre langue'}
          </h2>
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
          <p>
            {selectedLang === 'de' ? 'Sprache auswählen zum Fortfahren' :
             selectedLang === 'en' ? 'Select language to continue' :
             selectedLang === 'fr' ? 'Sélectionner la langue pour continuer' :
             'Seleccionar idioma para continuar'}
          </p>
        </div>
      </div>
    </div>
  )
}
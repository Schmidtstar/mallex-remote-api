import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import de from './de.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'

// Browser language detection
const getBrowserLanguage = (): string => {
  const savedLanguage = localStorage.getItem('mallex-language')
  if (savedLanguage) return savedLanguage

  const browserLang = navigator.language.split('-')[0]
  const supportedLanguages = ['de', 'en', 'es', 'fr']

  return supportedLanguages.includes(browserLang) ? browserLang : 'de'
}

const resources = {
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr }
}

// Synchrone Initialisierung für sofortigen Zugriff
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getBrowserLanguage(),
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    },
    // Synchrone Initialisierung
    initImmediate: false,
    // Debug nur in Development
    debug: import.meta.env.DEV
  })

// Ensure i18n is ready immediately
if (!i18n.isInitialized) {
  console.warn('i18n not initialized, forcing sync init')
}

export default i18n
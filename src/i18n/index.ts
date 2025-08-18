import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Direkte Imports für bessere Performance
import de from './de.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'

// Performance-optimierte i18n-Konfiguration
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Alle Sprachen direkt laden für bessere Performance
    resources: {
      de: { translation: de },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr }
    },

    // Konfiguration
    lng: 'de',
    fallbackLng: 'de',

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'mallex-language'
    },

    interpolation: {
      escapeValue: false // React escaped bereits
    },

    // Performance-Optimierungen
    load: 'languageOnly',
    preload: ['de'], // Deutsch preloaden

    // Debugging nur in Development
    debug: import.meta.env.DEV
  })

export default i18n
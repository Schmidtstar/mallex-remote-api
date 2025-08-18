import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Direkte Imports für bessere Performance
import de from './de.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'

// Fallback-basierte Spracherkennung ohne externe Dependencies
const detectLanguage = (): string => {
  // 1. Gespeicherte Sprache prüfen
  const saved = localStorage.getItem('mallex-language')
  if (saved && ['de', 'en', 'es', 'fr'].includes(saved)) {
    return saved
  }

  // 2. Browser-Sprache erkennen
  const browserLang = navigator.language.split('-')[0]
  if (['de', 'en', 'es', 'fr'].includes(browserLang)) {
    return browserLang
  }

  // 3. HTML-Attribut prüfen
  const htmlLang = document.documentElement.lang?.split('-')[0]
  if (htmlLang && ['de', 'en', 'es', 'fr'].includes(htmlLang)) {
    return htmlLang
  }

  // 4. Fallback auf Deutsch
  return 'de'
}

// Performance-optimierte i18n-Konfiguration
i18n
  .use(initReactI18next)
  .init({
    // Alle Sprachen direkt laden für bessere Performance
    resources: {
      de: { translation: de },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr }
    },

    // Erkannte Sprache verwenden
    lng: detectLanguage(),
    fallbackLng: 'de',

    interpolation: {
      escapeValue: false // React escaped bereits
    },

    // Performance-Optimierungen
    load: 'languageOnly',
    preload: ['de'], // Deutsch preloaden

    // Debugging nur in Development
    debug: import.meta.env.DEV
  })

// Sprache ändern und speichern Helper
export const changeLanguage = async (language: string) => {
  await i18n.changeLanguage(language)
  localStorage.setItem('mallex-language', language)

  // HTML-Attribut aktualisieren für bessere Accessibility
  document.documentElement.lang = language
}

export default i18n
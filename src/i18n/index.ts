
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './de.json'
import en from './en.json'
import fr from './fr.json'
import es from './es.json'

i18n.use(initReactI18next).init({
  resources: { 
    de: { translation: de }, 
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es }
  },
  lng: 'de',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

// Safe translation function with fallback
export function safeT(key: string, fallback?: string): string {
  try {
    const result = i18n.t(key)
    // If translation key is returned unchanged, use fallback
    if (result === key && fallback) {
      return fallback
    }
    return result
  } catch (error) {
    console.warn(`Translation error for key '${key}':`, error)
    return fallback || key
  }
}

export default i18n

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import de from './de.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'

// Initialize i18n properly
const initI18n = async () => {
  if (!i18n.isInitialized) {
    await i18n
      .use(initReactI18next)
      .init({
        lng: 'de',
        fallbackLng: 'en',
        debug: import.meta.env.DEV,

        interpolation: {
          escapeValue: false,
        },

        resources: {
          de: { translation: de },
          en: { translation: en },
          es: { translation: es },
          fr: { translation: fr },
        },
      })
  }
  return i18n
}

// Initialize immediately
initI18n().catch(console.error)

export default i18n
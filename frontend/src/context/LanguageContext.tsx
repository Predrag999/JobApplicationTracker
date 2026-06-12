import { createContext, useContext, useState } from 'react'
import i18n from '@/i18n'

export type Language = 'en' | 'de' | 'bg'

interface LanguageContextValue {
  language: Language
  setLanguage: (l: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getInitialLanguage(): Language {
  const stored = localStorage.getItem('language') as Language | null
  if (stored === 'en' || stored === 'de' || stored === 'bg') return stored
  return 'en'
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  function setLanguage(lang: Language) {
    setLanguageState(lang)
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language } from './i18n'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: typeof translations.ko
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ko',
  setLang: () => {},
  t: translations.ko
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('wishpick_lang') as Language) || 'ko'
  })

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('wishpick_lang', newLang)
  }

  const t = translations[lang]

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
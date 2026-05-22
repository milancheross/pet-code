'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Lang, TKey } from './translations'

const LangContext = createContext<{
  lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string
}>({ lang: 'sr', setLang: () => {}, t: (k) => k })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('sr')
  useEffect(() => {
    const s = localStorage.getItem('pc_lang') as Lang
    if (s === 'en' || s === 'sr') setLangState(s)
  }, [])
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem('pc_lang', l) }
  const t = (k: TKey): string => translations[lang][k] ?? translations.sr[k] ?? k
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)

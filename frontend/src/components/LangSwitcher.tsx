'use client'
import { useLang } from '@/lib/i18n/LangContext'
export default function LangSwitcher({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useLang()
  const base = dark ? 'bg-white/10' : 'bg-navy/10'
  return (
    <div className={`flex items-center gap-1 ${base} rounded-full p-1`}>
      {(['sr','en'] as const).map(l => (
        <button key={l} onClick={() => setLang(l)}
          className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
            lang === l ? 'bg-teal text-white' : dark ? 'text-white/50 hover:text-white' : 'text-navy/40 hover:text-navy'
          }`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

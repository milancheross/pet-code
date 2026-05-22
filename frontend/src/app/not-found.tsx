'use client'
import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'
export default function NotFound() {
  const { t } = useLang()
  return (
    <div className="min-h-screen bg-[#f0fffe] flex items-center justify-center p-4">
      <div className="card text-center max-w-sm w-full py-12">
        <div className="text-6xl mb-4">🐾</div>
        <h1 className="text-2xl font-black text-navy mb-3">{t('not_found')}</h1>
        <Link href="/" className="btn-teal inline-block">{t('not_found_back')}</Link>
      </div>
    </div>
  )
}

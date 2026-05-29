'use client'
import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'
import HamburgerNav from '@/components/HamburgerNav'
import LangSwitcher from '@/components/LangSwitcher'
import { useLang } from '@/lib/i18n/LangContext'

export default function ProdavnicaPage() {
  const { t } = useLang()

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <nav className="bg-white border-b border-[#E2EAF0] px-5 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <Link href="/"><PetCodeLogo size="sm" /></Link>
        <div className="flex items-center gap-2">
          <LangSwitcher />
          <Link href="/naruci" className="hidden sm:block btn-primary text-sm px-5 py-2.5">{t('nav_order')}</Link>
          <HamburgerNav />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="section-label mb-3">// {t('products_label')}</div>
          <h1 className="text-4xl font-extrabold text-navy tracking-tight mb-3">{t('products_title')}</h1>
          <p className="text-gray-500 font-medium">{t('products_sub')}</p>
        </div>

        {/* Coming soon — ghost cards + frosted overlay */}
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pointer-events-none select-none" aria-hidden="true">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 rounded-3xl bg-gradient-to-b from-navy/8 to-navy/4 border border-[#E2EAF0]" />
            ))}
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-[6px] bg-[#F4F7FA]/75 rounded-3xl">
            <div className="flex flex-col items-center text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center mb-5 shadow-[0_12px_30px_rgba(11,31,59,0.22)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="#19B6B2" strokeWidth="1.8"/>
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#19B6B2" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1.5" fill="#19B6B2"/>
                </svg>
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-navy tracking-tight mb-2">{t('coming_soon')}</h2>
              <p className="text-gray-400 font-medium text-sm md:text-base max-w-xs leading-relaxed">
                {t('coming_soon_sub')}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-teal/10 rounded-full">
                <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                <span className="text-teal font-bold text-sm tracking-wide">{t('coming_soon_badge')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#E2EAF0] py-8 px-4 bg-white mt-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <PetCodeLogo size="sm" showTagline />
          <div className="text-xs text-gray-400 font-medium">© 2026 PetCode · Srbija · petcodeoffice@gmail.com</div>
          <div className="flex items-center gap-5">
            <Link href="/" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">{t('nav_home')}</Link>
            <Link href="/o-nama" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">{t('nav_about')}</Link>
            <Link href="/naruci" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">{t('nav_order')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

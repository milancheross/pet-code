'use client'
import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'
import HamburgerNav from '@/components/HamburgerNav'
import LangSwitcher from '@/components/LangSwitcher'
import { useLang } from '@/lib/i18n/LangContext'

export default function ONamaPage() {
  const { t } = useLang()

  const values = [
    { icon: '🛡️', titleKey: 'val_security_t', descKey: 'val_security_d', color: 'teal' },
    { icon: '⭐', titleKey: 'val_quality_t',   descKey: 'val_quality_d',   color: 'orange' },
    { icon: '🐾', titleKey: 'val_pets_t',      descKey: 'val_pets_d',      color: 'teal' },
    { icon: '🇷🇸', titleKey: 'val_local_t',   descKey: 'val_local_d',     color: 'navy' },
  ] as const

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

      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="section-label mb-3">// {t('about_label')}</div>
          <h1 className="text-4xl font-extrabold text-navy tracking-tight mb-4">{t('about_title')}</h1>
          <p className="text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">{t('about_sub')}</p>
        </div>

        {/* Naša priča */}
        <div className="bg-white rounded-3xl border border-[#E2EAF0] p-8 shadow-[0_4px_24px_rgba(11,31,59,0.06)] mb-8">
          <div className="section-label mb-3">// {t('about_story_label')}</div>
          <h2 className="text-2xl font-extrabold text-navy mb-4">{t('about_story_title')}</h2>
          <div className="text-gray-500 font-medium leading-relaxed space-y-4">
            <p>{t('about_story_p1')}</p>
            <p>{t('about_story_p2')}</p>
            <p>{t('about_story_p3')}</p>
          </div>
        </div>

        {/* Vrednosti */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="section-label mb-3">// {t('about_values_label')}</div>
            <h2 className="text-2xl font-extrabold text-navy">{t('about_values_title')}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {values.map(v => (
              <div key={v.titleKey} className="bg-white rounded-3xl border border-[#E2EAF0] p-6 shadow-[0_4px_24px_rgba(11,31,59,0.06)] flex gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl ${
                  v.color === 'teal' ? 'bg-teal/10' : v.color === 'orange' ? 'bg-orange/10' : 'bg-navy/5'
                }`}>{v.icon}</div>
                <div>
                  <h3 className="font-bold text-navy mb-1">{t(v.titleKey)}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">{t(v.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kontakt info */}
        <div className="bg-navy rounded-3xl p-8 shadow-[0_8px_32px_rgba(11,31,59,0.18)]">
          <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-5">{t('about_contact_us')}</div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Email', value: 'petcodeoffice@gmail.com', href: 'mailto:petcodeoffice@gmail.com' },
              { label: t('about_address'), value: 'Stevana Čolovića 53, Arilje', href: null },
              { label: t('about_hours'), value: t('about_hours_val'), href: null },
            ].map(c => (
              <div key={c.label}>
                <div className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-1">{c.label}</div>
                {c.href
                  ? <a href={c.href} className="text-white font-bold hover:text-teal transition-colors">{c.value}</a>
                  : <div className="text-white font-bold">{c.value}</div>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-[#E2EAF0] py-8 px-4 bg-white mt-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <PetCodeLogo size="sm" showTagline />
          <div className="text-xs text-gray-400 font-medium">© 2026 PetCode · Srbija · petcodeoffice@gmail.com</div>
          <div className="flex items-center gap-5">
            <Link href="/" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">{t('nav_home')}</Link>
            <Link href="/prodavnica" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">{t('nav_shop')}</Link>
            <Link href="/naruci" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">{t('nav_order')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

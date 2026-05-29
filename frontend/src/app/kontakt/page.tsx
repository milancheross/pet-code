'use client'
import { useState } from 'react'
import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'
import HamburgerNav from '@/components/HamburgerNav'
import LangSwitcher from '@/components/LangSwitcher'
import { useLang } from '@/lib/i18n/LangContext'

export default function KontaktPage() {
  const { t } = useLang()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setStatus('sending')
    try {
      const res = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'ok' : 'error')
      if (res.ok) setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

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

        {/* Header */}
        <div className="text-center mb-12">
          <div className="section-label mb-3">// {t('contact_label')}</div>
          <h1 className="text-4xl font-extrabold text-navy tracking-tight mb-3">{t('contact_title')}</h1>
          <p className="text-gray-500 font-medium">{t('contact_sub')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Left — info + map */}
          <div className="flex flex-col gap-4">

            {/* Address */}
            <div className="bg-white rounded-3xl border border-[#E2EAF0] p-6 shadow-[0_4px_24px_rgba(11,31,59,0.06)]">
              <div className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-2xl bg-teal/10 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 11a3 3 0 100-6 3 3 0 000 6z" stroke="#19B6B2" strokeWidth="1.8"/>
                    <path d="M10 18s-7-5-7-9a7 7 0 1114 0c0 4-7 9-7 9z" stroke="#19B6B2" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('contact_address')}</div>
                  <div className="font-bold text-navy">Stevana Čolovića 53</div>
                  <div className="text-gray-500 font-medium text-sm">31230 Arilje, Srbija</div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-3xl border border-[#E2EAF0] p-6 shadow-[0_4px_24px_rgba(11,31,59,0.06)]">
              <div className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-2xl bg-orange/10 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 4h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="#FF6B4A" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M2 6l8 6 8-6" stroke="#FF6B4A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email</div>
                  <a href="mailto:petcodeoffice@gmail.com" className="font-bold text-navy hover:text-teal transition-colors">
                    petcodeoffice@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Working hours */}
            <div className="bg-navy rounded-3xl p-6 shadow-[0_8px_32px_rgba(11,31,59,0.18)]">
              <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">{t('contact_hours')}</div>
              <div className="space-y-2">
                {([
                  [t('hours_weekdays'), '09:00 – 17:00'],
                  [t('hours_sat'), '10:00 – 14:00'],
                  [t('hours_sun'), t('hours_closed')],
                ] as [string, string][]).map(([day, hours]) => (
                  <div key={day} className="flex justify-between items-center">
                    <span className="text-white/60 text-sm font-medium">{day}</span>
                    <span className="text-white font-bold text-sm">{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href="https://maps.google.com/maps?q=Stevana+%C4%8Colovi%C4%87a+53%2C+31230+Arilje%2C+Srbija"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-center py-3.5 rounded-2xl font-bold text-sm"
            >
              {t('contact_open_maps')}
            </a>
          </div>

          {/* Right — contact form */}
          <div className="bg-white rounded-3xl border border-[#E2EAF0] p-8 shadow-[0_4px_24px_rgba(11,31,59,0.06)]">
            <div className="section-label mb-2">// {t('contact_label')}</div>
            <h2 className="text-xl font-extrabold text-navy mb-6">{t('contact_form_title')}</h2>

            {status === 'ok' ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L19 7" stroke="#19B6B2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-navy font-bold">{t('contact_form_success')}</p>
                <button onClick={() => setStatus('idle')} className="text-sm text-teal font-semibold hover:underline">
                  ← {t('not_found_back')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    {t('contact_form_name')} *
                  </label>
                  <input
                    className="input"
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    {t('contact_form_email')} *
                  </label>
                  <input
                    className="input"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    {t('contact_form_msg')} *
                  </label>
                  <textarea
                    className="input resize-none"
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    required
                  />
                </div>
                {status === 'error' && (
                  <p className="text-red-500 text-sm font-medium">{t('contact_form_error')}</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn-primary w-full py-3.5 disabled:opacity-50"
                >
                  {status === 'sending' ? t('contact_form_sending') : t('contact_form_submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-[#E2EAF0] py-8 px-4 bg-white mt-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
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

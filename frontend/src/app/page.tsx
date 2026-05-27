'use client'
import { useLang } from '@/lib/i18n/LangContext'
import LangSwitcher from '@/components/LangSwitcher'
import PetCodeLogo from '@/components/PetCodeLogo'
import HamburgerNav from '@/components/HamburgerNav'
import CartIconButton from '@/components/CartIconButton'
import Link from 'next/link'
import { useState } from 'react'
import { PRICE_PER_TAG } from '@/lib/types'

const FAQ_KEYS = [
  ['faq_q1','faq_a1'],['faq_q2','faq_a2'],['faq_q3','faq_a3'],['faq_q4','faq_a4'],
] as const

export default function HomePage() {
  const { t } = useLang()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#F4F7FA]" style={{ overflowX: 'hidden', maxWidth: '100vw' }}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2EAF0]"
        style={{ height: 64 }}
      >
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/"><PetCodeLogo size="sm" /></Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-7">
            <Link href="/prodavnica" className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">Prodavnica</Link>
            <Link href="/o-nama"     className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">O nama</Link>
            <Link href="/kontakt"    className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">Kontakt</Link>
            <Link href="/login"      className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">{t('nav_login')}</Link>
          </div>

          {/* Right side: lang + cart + order btn + hamburger */}
          <div className="flex items-center" style={{ gap: 8 }}>
            <LangSwitcher />
            <CartIconButton />
            <Link href="/naruci" className="hidden sm:block btn-primary text-sm px-5 py-2.5">{t('nav_order')}</Link>
            <HamburgerNav />
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section
        className="px-4 max-w-5xl mx-auto relative"
        style={{ paddingTop: 100, paddingBottom: 64, overflowX: 'visible' }}
      >
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ overflow: 'hidden' }}>
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(25,182,178,0.07) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(11,31,59,0.04) 0%, transparent 70%)' }} />
        </div>

        {/* On mobile: flex-col (mockup first, text second) | md+: 2-column grid */}
        <div className="relative flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-14 items-center">

          {/* Phone mockup — order-first on mobile, order-last on desktop */}
          <div className="order-first md:order-last flex justify-center w-full">
            <div style={{ position: 'relative', maxWidth: 260, width: '100%', margin: '0 auto' }}>
              {/* Phone shell */}
              <div
                className="mx-auto shadow-[0_32px_64px_rgba(11,31,59,0.25)]"
                style={{
                  width: 200,
                  height: 420,
                  background: '#0B1F3B',
                  borderRadius: 34,
                  padding: 10,
                }}
              >
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: '#fff',
                  borderRadius: 26,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {/* Pet header */}
                  <div style={{ background: '#0B1F3B', padding: '18px 14px 14px', textAlign: 'center' }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'rgba(25,182,178,0.2)',
                      border: '2px solid rgba(25,182,178,0.3)',
                      margin: '0 auto 8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 26,
                    }}>🐕</div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>Maks</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Labrador · 3 godine</div>
                  </div>

                  {/* Call / SMS */}
                  <div style={{ padding: '10px 10px 0', display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, background: '#19B6B2', borderRadius: 12, padding: '9px 0', textAlign: 'center', color: '#fff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>📞 Pozovi</div>
                    <div style={{ flex: 1, background: '#0B1F3B', borderRadius: 12, padding: '9px 0', textAlign: 'center', color: '#fff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>💬 SMS</div>
                  </div>

                  {/* Info rows */}
                  <div style={{ padding: '0 12px', flex: 1 }}>
                    {[['Vlasnik','Marko P.'],['Telefon','+381 64 ···'],['Alergije','⚠️ Piletina'],['Mikročip','✅ Da']].map(([l,v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ color: '#9ca3af', fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap' }}>{l}</span>
                        <span style={{ color: '#0B1F3B', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '10px 0', textAlign: 'center', fontSize: 9, color: '#d1d5db', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>pet-code.rs</div>
                </div>
              </div>

              {/* Floating badges — hidden on ≤480px via .float-badge CSS class */}
              <div
                className="float-badge"
                style={{
                  position: 'absolute',
                  right: -8,
                  top: 60,
                  background: '#fff',
                  borderRadius: 14,
                  boxShadow: '0 8px 24px rgba(11,31,59,0.12)',
                  padding: '9px 13px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#0B1F3B',
                  border: '1px solid #E2EAF0',
                  whiteSpace: 'nowrap',
                  animation: 'bounce 3s infinite',
                }}
              >
                <span style={{ width: 7, height: 7, background: '#4ade80', borderRadius: '50%', display: 'inline-block', marginRight: 6 }} />
                QR skeniran
              </div>
              <div
                className="float-badge"
                style={{
                  position: 'absolute',
                  left: -8,
                  bottom: 80,
                  background: '#FF6B4A',
                  borderRadius: 14,
                  boxShadow: '0 8px 24px rgba(255,107,74,0.35)',
                  padding: '9px 13px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                }}
              >
                🐾 Maks pronađen!
              </div>
            </div>
          </div>

          {/* Text content — order-last on mobile (below mockup), order-first on desktop */}
          <div className="order-last md:order-first text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-teal/10 text-teal text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
              <span className="w-2 h-2 bg-teal rounded-full animate-pulse" />
              Srbija · QR identifikacija
            </div>
            <h1
              className="font-extrabold text-navy leading-[1.08] tracking-tight mb-4"
              style={{ fontSize: 'clamp(28px, 8vw, 52px)' }}
            >
              {t('hero_title').replace('pronađen.', '')}
              <span className="text-teal">pronađen.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-500 leading-relaxed mb-7 font-medium max-w-md mx-auto md:mx-0">
              {t('hero_sub')}
            </p>
            <div className="flex gap-3 flex-wrap justify-center md:justify-start">
              <Link href="/naruci" className="btn-primary">{t('hero_cta')}</Link>
              <a href="#kako" className="btn-outline">{t('hero_cta2')}</a>
            </div>
            <div className="flex flex-wrap gap-4 mt-7 justify-center md:justify-start">
              {(['trust_steel','trust_noapp','trust_delivery','trust_cod'] as const).map(k => (
                <div key={k} className="flex items-center gap-2 text-sm font-semibold text-gray-400">
                  <span className="w-4 h-4 rounded-full bg-teal/15 flex items-center justify-center flex-shrink-0">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="#19B6B2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  {t(k)}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── PROMISE ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4 bg-white border-y border-[#E2EAF0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <p className="text-xl md:text-3xl font-extrabold text-navy tracking-tight">
              Skeniraj me. <span className="text-teal">Imam svoj dom.</span> <span className="text-orange">♥</span>
            </p>
            <p className="text-gray-400 font-medium mt-2 text-sm tracking-wide">Jednostavno. Brzo. Pouzdano.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2L4 5v5.5c0 4.5 3 8.5 7 9.5 4-1 7-5 7-9.5V5L11 2Z" stroke="#19B6B2" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                ),
                title: 'Siguran sam',
                desc: 'Vlasnik će odmah dobiti kontakt informacije i vašu lokaciju.',
                accent: 'teal',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 19s-7-5.5-7-10a7 7 0 0114 0c0 4.5-7 10-7 10Z" stroke="#FF6B4A" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="11" cy="9" r="2.5" stroke="#FF6B4A" strokeWidth="1.6"/></svg>
                ),
                title: 'Voljen sam',
                desc: 'Moj QR kod vodi me kući — bez aplikacije, bez registracije.',
                accent: 'orange',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3c-4.4 0-8 3.1-8 7 0 2.5 1.4 4.7 3.5 6L5 19l4.5-1.5c.5.1 1 .2 1.5.2 4.4 0 8-3.1 8-7s-3.6-7-8-7Z" stroke="#0B1F3B" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                ),
                title: 'Pripadam',
                desc: 'Svaki ljubimac zaslužuje da bude pronađen i vraćen kući.',
                accent: 'navy',
              },
            ].map(({ icon, title, desc, accent }) => (
              <div key={title} className="flex gap-4 p-5 rounded-3xl border border-[#E2EAF0] hover:-translate-y-1 transition-transform">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  accent === 'teal' ? 'bg-teal/10' : accent === 'orange' ? 'bg-orange/10' : 'bg-navy/6'
                }`}>
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-navy mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section id="kako" className="py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <div className="section-label mb-3">// {t('nav_how')}</div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-navy tracking-tight">{t('how_title')}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { n:'01', icon:(
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#19B6B2" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="#19B6B2" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="#19B6B2" strokeWidth="1.8"/><rect x="5" y="5" width="4" height="4" rx="0.5" fill="#19B6B2"/><rect x="15" y="5" width="4" height="4" rx="0.5" fill="#19B6B2"/><rect x="5" y="15" width="4" height="4" rx="0.5" fill="#19B6B2"/><path d="M13 13h2v2h-2zM17 13h4M17 17h4M15 21h2M19 19v2" stroke="#19B6B2" strokeWidth="1.6" strokeLinecap="round"/></svg>
              ), t: t('how_s1_t'), d: t('how_s1') },
              { n:'02', icon:(
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="3" stroke="#19B6B2" strokeWidth="1.8"/><circle cx="12" cy="8" r="3" stroke="#19B6B2" strokeWidth="1.6"/><path d="M8 15h8M8 18h5" stroke="#19B6B2" strokeWidth="1.6" strokeLinecap="round"/></svg>
              ), t: t('how_s2_t'), d: t('how_s2') },
              { n:'03', icon:(
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 22s-7-5.5-7-10a7 7 0 0114 0c0 4.5-7 10-7 10Z" stroke="#19B6B2" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="12" r="2.5" stroke="#19B6B2" strokeWidth="1.6"/></svg>
              ), t: t('how_s3_t'), d: t('how_s3') },
            ].map(s => (
              <div key={s.n} className="relative bg-white border border-[#E2EAF0] rounded-3xl p-6 hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(11,31,59,0.08)] transition-all">
                <div className="absolute top-5 right-5 text-5xl font-extrabold text-teal/8 select-none">{s.n}</div>
                <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center mb-4">{s.icon}</div>
                <h3 className="font-bold text-navy mb-2 text-[15px]">{s.t}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT SPECS ───────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-navy rounded-[28px] md:rounded-[32px] p-6 md:p-12 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div className="section-label text-teal mb-3">// privezak</div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4 tracking-tight">{t('spec_title')}</h2>
              <p className="text-white/45 leading-relaxed mb-6 font-medium text-sm md:text-base">
                Nerđajući čelik sa epoksi zaštitom. QR kod ostaje čitljiv godinama — kiša, blato, igra u parku.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  [t('spec_material'), 'Nerđajući čelik'],
                  [t('spec_size'), '29 mm'],
                  [t('spec_coating'), 'Epoxy premaz'],
                ].map(([l,v]) => (
                  <div key={l} className="bg-white/5 border border-white/8 rounded-2xl p-4">
                    <div className="text-[10px] text-white/30 font-medium uppercase tracking-widest mb-1">{l}</div>
                    <div className="text-white font-bold text-sm">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tag illustration */}
            <div className="flex justify-center">
              <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
                <div className="absolute inset-0 rounded-full border border-white/8" />
                <div className="absolute rounded-full border border-dashed border-teal/20 animate-spin"
                  style={{ width: 220, height: 220, animationDuration: '25s' }} />
                <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#0B1F3B] border-2 border-teal/40 flex items-center justify-center shadow-[0_4px_16px_rgba(25,182,178,0.2)]">
                    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="#19B6B2" strokeWidth="1.5"/>
                      <rect x="16" y="4" width="8" height="8" rx="1.5" stroke="#19B6B2" strokeWidth="1.5"/>
                      <rect x="4" y="16" width="8" height="8" rx="1.5" stroke="#19B6B2" strokeWidth="1.5"/>
                      <rect x="6" y="6" width="4" height="4" rx="0.5" fill="#19B6B2"/>
                      <rect x="18" y="6" width="4" height="4" rx="0.5" fill="#19B6B2"/>
                      <rect x="6" y="18" width="4" height="4" rx="0.5" fill="#19B6B2"/>
                      <path d="M16 16h3M21 16h3M16 20h3M16 23h6M22 20v6" stroke="#19B6B2" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-white/25 text-[8px] font-medium tracking-widest uppercase">pet-code.rs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────── */}
      <section id="cena" className="py-16 md:py-20 px-4 bg-white border-y border-[#E2EAF0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <div className="section-label mb-3">// cena</div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-navy tracking-tight">{t('price_title')}</h2>
          </div>
          <div className="max-w-sm mx-auto">
            <div className="bg-navy rounded-3xl p-7 md:p-8 border-2 border-navy shadow-[0_20px_50px_rgba(11,31,59,0.22)] relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-[0_4px_12px_rgba(255,107,74,0.4)] whitespace-nowrap">
                1 privezak
              </div>
              <div className="text-center mb-6 pt-2">
                <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Cena po privetku</div>
                <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                  {PRICE_PER_TAG.toLocaleString()}
                  <span className="text-xl md:text-2xl font-semibold ml-2">RSD</span>
                </div>
                <div className="text-white/30 text-sm font-medium mt-1">plaćanje pouzećem</div>
              </div>
              <ul className="space-y-3 mb-7 text-sm font-medium text-white/60">
                {['Doživotni profil ljubimca', 'QR privezak od nerđajućeg čelika', 'Prečnik 29mm', 'Besplatna dostava'].map(item => (
                  <li key={item} className="flex gap-3 items-center">
                    <span className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0">
                      <svg width="9" height="9" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="#19B6B2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/naruci" className="block text-center py-3.5 rounded-full font-bold text-sm bg-orange text-white hover:bg-orange2 transition-all shadow-[0_4px_16px_rgba(255,107,74,0.4)]">
                {t('hero_cta')} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <div className="section-label mb-3">// {t('faq_title')}</div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-navy tracking-tight">{t('faq_title')}</h2>
          </div>
          <div className="space-y-3">
            {FAQ_KEYS.map(([q, a], i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2EAF0] overflow-hidden hover:border-teal/30 transition-colors">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center p-5 text-left font-bold text-navy text-sm">
                  <span className="pr-3">{t(q)}</span>
                  <span className={`w-6 h-6 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="#19B6B2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed font-medium">{t(a)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-3xl mx-auto bg-navy rounded-[28px] md:rounded-[32px] p-8 md:p-10 text-center shadow-[0_24px_60px_rgba(11,31,59,0.2)]">
          <div className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">
            Mali privezak. <span className="text-teal">Velika sigurnost.</span>
          </div>
          <p className="text-white/50 font-medium mb-7 text-sm md:text-base">Zauvek uz vas.</p>
          <Link href="/naruci" className="inline-block btn-primary text-base px-7 py-4">
            {t('hero_cta')} →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E2EAF0] py-8 md:py-10 px-4 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <PetCodeLogo size="sm" showTagline />
          <div className="text-xs text-gray-400 font-medium text-center">© 2025 PetCode · Srbija · petcodeoffice@gmail.com</div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/prodavnica" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Prodavnica</Link>
            <Link href="/o-nama"     className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">O nama</Link>
            <Link href="/login"      className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">{t('nav_login')}</Link>
            <Link href="/kontakt"    className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Kontakt</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

'use client'
import { useLang } from '@/lib/i18n/LangContext'
import LangSwitcher from '@/components/LangSwitcher'
import PetCodeLogo from '@/components/PetCodeLogo'
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
    <div className="min-h-screen bg-[#F4F7FA]">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2EAF0]">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <PetCodeLogo size="sm" />
          <div className="hidden md:flex items-center gap-7">
            <a href="#kako" className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">{t('nav_how')}</a>
            <a href="#cena" className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">{t('nav_price')}</a>
            <Link href="/login" className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">{t('nav_login')}</Link>
          </div>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <Link href="/naruci" className="btn-primary text-sm px-5 py-2.5">{t('nav_order')}</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-24 px-4 max-w-5xl mx-auto relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(25,182,178,0.07) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(11,31,59,0.04) 0%, transparent 70%)' }} />
        </div>

        <div className="relative grid md:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal/10 text-teal text-xs font-bold px-4 py-2 rounded-full mb-7 uppercase tracking-widest">
              <span className="w-2 h-2 bg-teal rounded-full animate-pulse" />
              Srbija · QR identifikacija
            </div>
            <h1 className="text-[2.7rem] md:text-[3.2rem] font-extrabold text-navy leading-[1.08] tracking-tight mb-5">
              {t('hero_title').replace('pronađen.', '')}
              <span className="text-teal">pronađen.</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-9 font-medium max-w-md">{t('hero_sub')}</p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/naruci" className="btn-primary">{t('hero_cta')}</Link>
              <a href="#kako" className="btn-outline">{t('hero_cta2')}</a>
            </div>
            <div className="flex flex-wrap gap-5 mt-9">
              {(['trust_steel','trust_noapp','trust_delivery','trust_cod'] as const).map(k => (
                <div key={k} className="flex items-center gap-2 text-sm font-semibold text-gray-400">
                  <span className="w-4 h-4 rounded-full bg-teal/15 flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="#19B6B2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  {t(k)}
                </div>
              ))}
            </div>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-56 h-[470px] bg-navy rounded-[38px] p-3 shadow-[0_40px_80px_rgba(11,31,59,0.28)]">
                <div className="w-full h-full bg-white rounded-[28px] overflow-hidden flex flex-col">
                  <div className="bg-[#0B1F3B] py-5 px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-teal/20 mx-auto mb-2 flex items-center justify-center text-3xl border-2 border-teal/30">🐕</div>
                    <div className="text-white font-extrabold text-lg tracking-tight">Maks</div>
                    <div className="text-white/35 text-[10px] font-medium tracking-wider mt-0.5">Labrador · 3 godine</div>
                  </div>
                  <div className="p-3 flex gap-2">
                    <div className="flex-1 bg-teal rounded-xl py-2.5 text-white text-xs font-bold text-center shadow-[0_2px_8px_rgba(25,182,178,0.3)]">📞 Pozovi</div>
                    <div className="flex-1 bg-navy rounded-xl py-2.5 text-white text-xs font-bold text-center">💬 SMS</div>
                  </div>
                  <div className="px-4 flex-1">
                    {[['Vlasnik','Marko P.'],['Telefon','+381 64 ···'],['Alergije','⚠️ Piletina'],['Mikročip','✅ Da']].map(([l,v]) => (
                      <div key={l} className="flex justify-between py-2.5 border-b border-gray-100 text-[11px]">
                        <span className="text-gray-400 font-medium">{l}</span>
                        <span className="text-navy font-bold">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center text-[9px] text-gray-300 font-medium tracking-widest uppercase">petcode.rs</div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -right-10 top-20 bg-white rounded-2xl shadow-[0_8px_24px_rgba(11,31,59,0.12)] px-3.5 py-2.5 text-xs font-bold text-navy border border-[#E2EAF0] whitespace-nowrap animate-bounce" style={{animationDuration:'3s'}}>
                <span className="w-2 h-2 bg-green-400 rounded-full inline-block mr-1.5" />QR skeniran
              </div>
              <div className="absolute -left-12 bottom-28 bg-orange rounded-2xl shadow-[0_8px_24px_rgba(255,107,74,0.35)] px-3.5 py-2.5 text-xs font-bold text-white whitespace-nowrap">
                🐾 Maks pronađen!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROMISE — "Naše obećanje" */}
      <section className="py-20 px-4 bg-white border-y border-[#E2EAF0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <p className="text-2xl md:text-3xl font-extrabold text-navy tracking-tight">
              Skeniraj me. <span className="text-teal">Imam svoj dom.</span> <span className="text-orange">♥</span>
            </p>
            <p className="text-gray-400 font-medium mt-2 text-sm tracking-wide">Jednostavno. Brzo. Pouzdano.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mt-12">
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
              <div key={title} className="flex gap-4 p-6 rounded-3xl border border-[#E2EAF0] hover:-translate-y-1 transition-transform">
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

      {/* HOW IT WORKS */}
      <section id="kako" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="section-label mb-3">// {t('nav_how')}</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight">{t('how_title')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
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
              <div key={s.n} className="relative bg-white border border-[#E2EAF0] rounded-3xl p-7 hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(11,31,59,0.08)] transition-all">
                <div className="absolute top-5 right-6 text-5xl font-extrabold text-teal/8 select-none">{s.n}</div>
                <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center mb-5">{s.icon}</div>
                <h3 className="font-bold text-navy mb-2 text-[15px]">{s.t}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT SPECS */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-navy rounded-[32px] p-8 md:p-12 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="section-label text-teal mb-3">// privezak</div>
              <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">{t('spec_title')}</h2>
              <p className="text-white/45 leading-relaxed mb-8 font-medium">
                Nerđajući čelik sa epoksi zaštitom. QR kod ostaje čitljiv godinama — kiša, blato, igra u parku.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  [t('spec_material'), 'Nerđajući čelik'],
                  [t('spec_size'), '29 mm'],
                  [t('spec_coating'), 'Epoxy premaz'],
                  [t('spec_option'), 'QR + NFC'],
                ].map(([l,v]) => (
                  <div key={l} className="bg-white/5 border border-white/8 rounded-2xl p-4">
                    <div className="text-[10px] text-white/30 font-medium uppercase tracking-widest mb-1">{l}</div>
                    <div className="text-white font-bold text-sm">{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-52 h-52 flex items-center justify-center">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border border-white/8" />
                {/* Spinning dashed ring */}
                <div className="absolute w-64 h-64 rounded-full border border-dashed border-teal/20 animate-spin" style={{animationDuration:'25s'}} />
                {/* Inner circle */}
                <div className="w-36 h-36 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3">
                  {/* Mini tag render */}
                  <div className="w-16 h-16 rounded-full bg-[#0B1F3B] border-2 border-teal/40 flex items-center justify-center shadow-[0_4px_16px_rgba(25,182,178,0.2)]">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="#19B6B2" strokeWidth="1.5"/>
                      <rect x="16" y="4" width="8" height="8" rx="1.5" stroke="#19B6B2" strokeWidth="1.5"/>
                      <rect x="4" y="16" width="8" height="8" rx="1.5" stroke="#19B6B2" strokeWidth="1.5"/>
                      <rect x="6" y="6" width="4" height="4" rx="0.5" fill="#19B6B2"/>
                      <rect x="18" y="6" width="4" height="4" rx="0.5" fill="#19B6B2"/>
                      <rect x="6" y="18" width="4" height="4" rx="0.5" fill="#19B6B2"/>
                      <path d="M16 16h3M21 16h3M16 20h3M16 23h6M22 20v6" stroke="#19B6B2" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-white/25 text-[9px] font-medium tracking-widest uppercase">petcode.rs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="cena" className="py-20 px-4 bg-white border-y border-[#E2EAF0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="section-label mb-3">// cena</div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight">{t('price_title')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {[
              { label:'1 privezak', qty:1, featured: false },
              { label:'2 privezka', qty:2, featured: true, save:'290' },
              { label:'4 privezka', qty:4, featured: false, save:'980', badge: 'Best value' },
            ].map(p => (
              <div key={p.qty} className={`rounded-3xl p-7 border-2 relative ${p.featured ? 'bg-navy border-navy shadow-[0_20px_50px_rgba(11,31,59,0.22)] scale-[1.03]' : 'border-[#E2EAF0] bg-white hover:border-teal/40 transition-colors'}`}>
                {p.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-[0_4px_12px_rgba(255,107,74,0.4)]">
                    Najpopularnije
                  </div>
                )}
                {p.badge && !p.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                    {p.badge}
                  </div>
                )}
                <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${p.featured ? 'text-white/40' : 'text-gray-400'}`}>{p.label}</div>
                <div className={`text-3xl font-extrabold tracking-tight mb-1 ${p.featured ? 'text-white' : 'text-navy'}`}>
                  {(PRICE_PER_TAG * p.qty - (p.qty === 2 ? 290 : p.qty === 4 ? 980 : 0)).toLocaleString()} <span className="text-lg font-semibold">RSD</span>
                </div>
                {p.save
                  ? <div className="text-teal text-xs font-bold mb-5">Uštedi {p.save} RSD</div>
                  : <div className="mb-5" />
                }
                <ul className={`space-y-2.5 mb-6 text-sm font-medium ${p.featured ? 'text-white/60' : 'text-gray-400'}`}>
                  {['Doživotni profil','Besplatna dostava','Plaćanje pouzećem'].map(item => (
                    <li key={item} className="flex gap-2.5 items-center">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${p.featured ? 'bg-teal/20' : 'bg-teal/10'}`}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="#19B6B2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href={`/naruci?qty=${p.qty}`}
                  className={`block text-center py-3 rounded-full font-bold text-sm transition-all ${
                    p.featured
                      ? 'bg-orange text-white hover:bg-orange2 shadow-[0_4px_16px_rgba(255,107,74,0.4)]'
                      : 'border-2 border-[#E2EAF0] text-navy hover:border-teal hover:text-teal'
                  }`}>
                  {t('hero_cta')} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-label mb-3">// {t('faq_title')}</div>
            <h2 className="text-3xl font-extrabold text-navy tracking-tight">{t('faq_title')}</h2>
          </div>
          <div className="space-y-3">
            {FAQ_KEYS.map(([q, a], i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2EAF0] overflow-hidden hover:border-teal/30 transition-colors">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center p-5 text-left font-bold text-navy text-sm">
                  {t(q)}
                  <span className={`w-6 h-6 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 ml-4 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
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

      {/* CTA BANNER */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto bg-navy rounded-[32px] p-10 text-center shadow-[0_24px_60px_rgba(11,31,59,0.2)]">
          <div className="text-3xl font-extrabold text-white mb-3 tracking-tight">
            Mali privezak. <span className="text-teal">Velika sigurnost.</span>
          </div>
          <p className="text-white/50 font-medium mb-8">Zauvek uz vas.</p>
          <Link href="/naruci" className="inline-block btn-primary text-base px-8 py-4">
            {t('hero_cta')} →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#E2EAF0] py-10 px-4 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-5">
          <PetCodeLogo size="sm" showTagline />
          <div className="text-xs text-gray-400 font-medium">© 2025 PetCode · Srbija · info@petcode.rs</div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">{t('nav_login')}</Link>
            <a href="mailto:info@petcode.rs" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Kontakt</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

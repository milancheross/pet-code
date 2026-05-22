'use client'
import { useLang } from '@/lib/i18n/LangContext'
import LangSwitcher from '@/components/LangSwitcher'
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
    <div className="min-h-screen bg-[#f0fffe]">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-[#e2f0ef]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-black text-navy text-lg">
            pet<span className="text-teal">code</span>.rs
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#kako" className="text-sm font-bold text-gray-400 hover:text-navy transition-colors">{t('nav_how')}</a>
            <a href="#cena" className="text-sm font-bold text-gray-400 hover:text-navy transition-colors">{t('nav_price')}</a>
            <Link href="/login" className="text-sm font-bold text-gray-400 hover:text-navy transition-colors">{t('nav_login')}</Link>
          </div>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <Link href="/naruci" className="btn-teal text-sm px-4 py-2">{t('nav_order')}</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-4 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal/10 text-teal text-xs font-black px-4 py-2 rounded-full mb-6 uppercase tracking-wider">
              <span className="w-2 h-2 bg-teal rounded-full animate-pulse" />
              Srbija · QR identifikacija
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-navy leading-[1.1] tracking-tight mb-5">
              {t('hero_title').replace('pronađen.', '')}
              <span className="text-teal">pronađen.</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 font-medium">{t('hero_sub')}</p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/naruci" className="btn-teal">{t('hero_cta')}</Link>
              <a href="#kako" className="btn-outline">{t('hero_cta2')}</a>
            </div>
            <div className="flex flex-wrap gap-4 mt-8">
              {(['trust_steel','trust_noapp','trust_delivery','trust_cod'] as const).map(k => (
                <div key={k} className="flex items-center gap-2 text-sm font-bold text-gray-400">
                  <span className="text-teal font-black">✓</span>{t(k)}
                </div>
              ))}
            </div>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-56 h-[460px] bg-navy rounded-[36px] p-3 shadow-[0_32px_72px_rgba(26,45,74,0.25)]">
                <div className="w-full h-full bg-white rounded-[26px] overflow-hidden flex flex-col">
                  <div className="bg-navy py-5 px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-teal/20 mx-auto mb-2 flex items-center justify-center text-3xl">🐕</div>
                    <div className="text-white font-black text-lg">Maks</div>
                    <div className="text-white/40 text-[10px] font-mono">Labrador · 3 godine</div>
                  </div>
                  <div className="p-3 flex gap-2">
                    <div className="flex-1 bg-teal rounded-xl py-2.5 text-white text-xs font-black text-center">📞 Pozovi</div>
                    <div className="flex-1 bg-navy rounded-xl py-2.5 text-white text-xs font-black text-center">💬 SMS</div>
                  </div>
                  <div className="px-4 flex-1 space-y-0">
                    {[['Vlasnik','Marko P.'],['Telefon','+381 64 ···'],['Alergije','⚠️ Piletina'],['Mikročip','✅ Da']].map(([l,v]) => (
                      <div key={l} className="flex justify-between py-2 border-b border-gray-100 text-[11px]">
                        <span className="text-gray-400 font-semibold">{l}</span>
                        <span className="text-navy font-bold">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center text-[9px] text-gray-300 font-mono">petcode.rs</div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -right-8 top-20 bg-white rounded-2xl shadow-lg px-3 py-2 text-xs font-black text-navy border border-[#e2f0ef] whitespace-nowrap">
                <span className="w-2 h-2 bg-green-400 rounded-full inline-block mr-1" />QR skeniran
              </div>
              <div className="absolute -left-10 bottom-24 bg-navy rounded-2xl shadow-lg px-3 py-2 text-xs font-black text-white whitespace-nowrap">
                🐾 Maks pronađen!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="kako" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="section-label mb-3">// {t('nav_how')}</div>
            <h2 className="text-3xl md:text-4xl font-black text-navy tracking-tight">{t('how_title')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n:'01', icon:'📦', t: t('how_s1_t'), d: t('how_s1') },
              { n:'02', icon:'✏️', t: t('how_s2_t'), d: t('how_s2') },
              { n:'03', icon:'📲', t: t('how_s3_t'), d: t('how_s3') },
            ].map(s => (
              <div key={s.n} className="relative border border-[#e2f0ef] rounded-3xl p-6 hover:-translate-y-1 transition-transform">
                <div className="absolute top-4 right-5 text-5xl font-black text-teal/8">{s.n}</div>
                <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center text-2xl mb-4">{s.icon}</div>
                <h3 className="font-black text-navy mb-2">{s.t}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT SPECS */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-navy rounded-3xl p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="section-label text-teal mb-3">// privezak</div>
              <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{t('spec_title')}</h2>
              <p className="text-white/50 leading-relaxed mb-8 font-medium">
                Nerđajući čelik sa epoksi zaštitom. QR kod ostaje čitljiv godinama — kiša, blato, igra u parku.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  [t('spec_material'), 'Nerđajući čelik'],
                  [t('spec_size'), '29 mm'],
                  [t('spec_coating'), 'Epoxy premaz'],
                  [t('spec_option'), 'QR + NFC'],
                ].map(([l,v]) => (
                  <div key={l} className="bg-white/6 border border-white/10 rounded-2xl p-3">
                    <div className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-1">{l}</div>
                    <div className="text-white font-bold text-sm">{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-44 h-44 rounded-full border border-white/10 flex items-center justify-center relative">
                <div className="absolute w-56 h-56 rounded-full border border-dashed border-teal/20 animate-spin" style={{animationDuration:'20s'}} />
                <div className="w-32 h-32 rounded-full bg-white/6 flex flex-col items-center justify-center gap-1">
                  <span className="text-4xl">🐾</span>
                  <span className="text-white/30 text-[10px] font-mono">petcode.rs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="cena" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-label mb-3">// cena</div>
            <h2 className="text-3xl md:text-4xl font-black text-navy tracking-tight">{t('price_title')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {[
              { label:'1 privezak', qty:1, featured: false },
              { label:'2 privezka', qty:2, featured: true, save:'290' },
              { label:'4 privezka', qty:4, featured: false, save:'980' },
            ].map(p => (
              <div key={p.qty} className={`rounded-3xl p-6 border-2 ${p.featured ? 'bg-navy border-navy shadow-[0_12px_40px_rgba(26,45,74,0.25)]' : 'border-[#e2f0ef] bg-white'}`}>
                {p.featured && <div className="text-[10px] font-black text-teal uppercase tracking-widest mb-3">Najpopularnije</div>}
                <div className={`text-xs font-black uppercase tracking-widest mb-2 ${p.featured ? 'text-white/40' : 'text-gray-400'}`}>{p.label}</div>
                <div className={`text-3xl font-black tracking-tight mb-1 ${p.featured ? 'text-white' : 'text-navy'}`}>
                  {(PRICE_PER_TAG * p.qty - (p.qty === 2 ? 290 : p.qty === 4 ? 980 : 0)).toLocaleString()} <span className="text-lg font-semibold">RSD</span>
                </div>
                {p.save && <div className="text-teal text-xs font-black mb-4">Uštedi {p.save} RSD</div>}
                {!p.save && <div className="mb-4" />}
                <ul className={`space-y-2 mb-5 text-sm font-semibold ${p.featured ? 'text-white/60' : 'text-gray-400'}`}>
                  <li className="flex gap-2"><span className="text-teal">✓</span>Doživotni profil</li>
                  <li className="flex gap-2"><span className="text-teal">✓</span>Besplatna dostava</li>
                  <li className="flex gap-2"><span className="text-teal">✓</span>Plaćanje pouzećem</li>
                </ul>
                <Link href={`/naruci?qty=${p.qty}`}
                  className={`block text-center py-3 rounded-full font-black text-sm transition-all ${p.featured ? 'bg-teal text-white hover:bg-teal2' : 'border-2 border-[#e2f0ef] text-navy hover:border-teal hover:text-teal'}`}>
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
          </div>
          <div className="space-y-3">
            {FAQ_KEYS.map(([q, a], i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e2f0ef] overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center p-5 text-left font-bold text-navy text-sm">
                  {t(q)}
                  <span className={`text-teal transition-transform ml-4 flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}>↓</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed font-medium">{t(a)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#e2f0ef] py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-black text-navy">pet<span className="text-teal">code</span>.rs</div>
          <div className="text-xs text-gray-400 font-mono">© 2025 PetCode · Srbija · info@petcode.rs</div>
          <Link href="/login" className="text-xs text-gray-400 font-bold hover:text-teal">{t('nav_login')}</Link>
        </div>
      </footer>
    </div>
  )
}

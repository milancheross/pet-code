import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'
import HamburgerNav from '@/components/HamburgerNav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'O nama — PetCode.rs',
  description: 'Upoznajte tim iza PetCode — srpskog startapa za QR identifikaciju ljubimaca.',
}

export default function ONamaPage() {
  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <nav className="bg-white border-b border-[#E2EAF0] px-5 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <Link href="/"><PetCodeLogo size="sm" /></Link>
        <div className="flex items-center gap-3">
          <Link href="/naruci" className="hidden sm:block btn-primary text-sm px-5 py-2.5">Naruči</Link>
          <HamburgerNav />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="section-label mb-3">// o nama</div>
          <h1 className="text-4xl font-extrabold text-navy tracking-tight mb-4">Ko smo mi</h1>
          <p className="text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
            PetCode je srpski startup koji pomaže vlasnicima ljubimaca da se nikad više ne plaše gubitka svog ljubimca.
          </p>
        </div>

        {/* Naša priča */}
        <div className="bg-white rounded-3xl border border-[#E2EAF0] p-8 shadow-[0_4px_24px_rgba(11,31,59,0.06)] mb-8">
          <div className="section-label mb-3">// naša priča</div>
          <h2 className="text-2xl font-extrabold text-navy mb-4">Kako je PetCode nastao</h2>
          <div className="text-gray-500 font-medium leading-relaxed space-y-4">
            <p>
              Sve je počelo sa jednostavnom idejom — šta ako svaki ljubimac ima digitalni identitet dostupan svakome ko ga nađe? Bez aplikacije, bez registracije, samo jedan sken.
            </p>
            <p>
              PetCode je nastao u Arilju 2026. godine, iz ljubavi prema životinjama i vere da moderna tehnologija može da pomogne da se svaki izgubljeni ljubimac vrati kući.
            </p>
            <p>
              Danas pomažemo vlasnicima u celoj Srbiji da se osećaju sigurno — jer znaju da, bez obzira gde završi njihov ljubimac, pronalazač ima sve informacije potrebne za povratak.
            </p>
          </div>
        </div>

        {/* Naše vrednosti */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="section-label mb-3">// vrednosti</div>
            <h2 className="text-2xl font-extrabold text-navy">Naše vrednosti</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '🛡️', title: 'Sigurnost', desc: 'Svaki privezak je napravljen od nerđajućeg čelika sa epoksi zaštitom — traje godinama bez brisanja QR koda.', color: 'teal' },
              { icon: '⭐', title: 'Kvalitet', desc: 'Ne pravimo kompromise. Svaki QR privezak je testiran pre isporuke i garantovan za doživotnu upotrebu.', color: 'orange' },
              { icon: '🐾', title: 'Briga za ljubimce', desc: 'Svaka odluka koju donosimo počinje pitanjem: da li ovo pomaže ljubimcima i njihovim vlasnicima?', color: 'teal' },
              { icon: '🇷🇸', title: 'Lokalno', desc: 'Ponosni smo što smo srpski proizvod. Sve projektujemo, pakujemo i šaljemo iz Arilja, Srbija.', color: 'navy' },
            ].map(v => (
              <div key={v.title} className="bg-white rounded-3xl border border-[#E2EAF0] p-6 shadow-[0_4px_24px_rgba(11,31,59,0.06)] flex gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl ${
                  v.color === 'teal' ? 'bg-teal/10' : v.color === 'orange' ? 'bg-orange/10' : 'bg-navy/5'
                }`}>{v.icon}</div>
                <div>
                  <h3 className="font-bold text-navy mb-1">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kontakt info */}
        <div className="bg-navy rounded-3xl p-8 shadow-[0_8px_32px_rgba(11,31,59,0.18)]">
          <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-5">Kontaktirajte nas</div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Email', value: 'petcodeoffice@gmail.com', href: 'mailto:petcodeoffice@gmail.com' },
              { label: 'Adresa', value: 'Stevana Čolovića 53, Arilje', href: null },
              { label: 'Radno vreme', value: 'Pon–Pet 09–17h', href: null },
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
          <div className="text-xs text-gray-400 font-medium">© 2025 PetCode · Srbija · petcodeoffice@gmail.com</div>
          <div className="flex items-center gap-5">
            <Link href="/" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Početna</Link>
            <Link href="/prodavnica" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Prodavnica</Link>
            <Link href="/naruci" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Naruči</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

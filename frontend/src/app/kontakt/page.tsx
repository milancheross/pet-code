import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kontakt — PetCode.rs',
  description: 'Kontaktirajte nas — Stevana Čolovića 53, 31230 Arilje',
}

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-[#F4F7FA]">

      {/* NAV */}
      <nav className="bg-white border-b border-[#E2EAF0] px-5 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <Link href="/"><PetCodeLogo size="sm" /></Link>
        <Link href="/naruci" className="btn-primary text-sm px-5 py-2.5">Naruči</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="section-label mb-3">// kontakt</div>
          <h1 className="text-4xl font-extrabold text-navy tracking-tight mb-3">Pronađite nas</h1>
          <p className="text-gray-500 font-medium">Tu smo za sva vaša pitanja i sugestije.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Mapa */}
          <div className="bg-white rounded-3xl border border-[#E2EAF0] overflow-hidden shadow-[0_4px_24px_rgba(11,31,59,0.06)]">
            <iframe
              src="https://maps.google.com/maps?q=Stevana+%C4%8Colovi%C4%87a+53%2C+31230+Arilje%2C+Srbija&output=embed&z=15"
              width="100%"
              height="380"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="PetCode lokacija — Arilje"
            />
          </div>

          {/* Info kartice */}
          <div className="flex flex-col gap-4">

            <div className="bg-white rounded-3xl border border-[#E2EAF0] p-6 shadow-[0_4px_24px_rgba(11,31,59,0.06)]">
              <div className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-2xl bg-teal/10 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 11a3 3 0 100-6 3 3 0 000 6z" stroke="#19B6B2" strokeWidth="1.8"/>
                    <path d="M10 18s-7-5-7-9a7 7 0 1114 0c0 4-7 9-7 9z" stroke="#19B6B2" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="label mb-1">Adresa</div>
                  <div className="font-bold text-navy">Stevana Čolovića 53</div>
                  <div className="text-gray-500 font-medium text-sm">31230 Arilje, Srbija</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#E2EAF0] p-6 shadow-[0_4px_24px_rgba(11,31,59,0.06)]">
              <div className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-2xl bg-orange/10 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 4h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="#FF6B4A" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M2 6l8 6 8-6" stroke="#FF6B4A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="label mb-1">Email</div>
                  <a href="mailto:info@pet-code.rs" className="font-bold text-navy hover:text-teal transition-colors">
                    info@pet-code.rs
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-navy rounded-3xl p-6 shadow-[0_8px_32px_rgba(11,31,59,0.18)]">
              <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Radno vreme</div>
              <div className="space-y-2">
                {[
                  ['Ponedeljak – Petak', '09:00 – 17:00'],
                  ['Subota', '10:00 – 14:00'],
                  ['Nedеlja', 'Zatvoreno'],
                ].map(([day, hours]) => (
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
              className="btn-primary text-center py-3.5"
            >
              Otvori u Google Maps →
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E2EAF0] py-8 px-4 bg-white mt-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <PetCodeLogo size="sm" showTagline />
          <div className="text-xs text-gray-400 font-medium">© 2025 PetCode · Srbija · info@pet-code.rs</div>
          <div className="flex items-center gap-5">
            <Link href="/" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Početna</Link>
            <Link href="/naruci" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Naruči</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

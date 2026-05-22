'use client'
import { useLang } from '@/lib/i18n/LangContext'
import LangSwitcher from '@/components/LangSwitcher'
import Image from 'next/image'
import { useState } from 'react'
import type { PetFull } from '@/lib/types'
import { SPECIES_EMOJI } from '@/lib/types'

type LocationState = 'idle' | 'asking' | 'sending' | 'sent' | 'error' | 'denied'

export default function PetClient({ pet: p, isNew }: { pet: PetFull; isNew: boolean }) {
  const { t } = useLang()
  const emoji = SPECIES_EMOJI[p.species] ?? '🐾'
  const phone = p.owners?.phone?.replace(/[^0-9+]/g, '') || ''
  const [locState, setLocState] = useState<LocationState>('idle')
  const [mapsUrl, setMapsUrl] = useState('')

  const handleSendLocation = async () => {
    setLocState('asking')

    if (!navigator.geolocation) {
      setLocState('error')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocState('sending')
        try {
          const res = await fetch('/api/notify-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pet_id: p.id,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          setMapsUrl(data.mapsUrl)
          setLocState('sent')
        } catch {
          setLocState('error')
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setLocState('denied')
        else setLocState('error')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <>
      <style>{`body{background:#e8f5f4!important;margin:0;padding:0}`}</style>
      <div className="min-h-screen flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-sm bg-white rounded-[28px] overflow-hidden shadow-[0_24px_64px_rgba(26,45,74,0.18)]">

          {isNew && (
            <div className="bg-teal text-white text-center py-3 text-sm font-bold">
              🎉 Privezak aktiviran!
            </div>
          )}

          {/* Header */}
          <div className="bg-navy pb-6 pt-5 px-5 text-center relative">
            <div className="absolute top-4 right-4"><LangSwitcher dark /></div>
            <a href="/" className="font-mono text-[11px] text-white/25 tracking-widest uppercase mb-4 block">
              pet<span className="text-teal">code</span>.rs
            </a>
            <div className="w-24 h-24 rounded-full mx-auto mb-3 border-[3px] border-teal/30 overflow-hidden bg-teal/10 flex items-center justify-center text-5xl">
              {p.photo_url
                ? <Image src={p.photo_url} alt={p.name} width={96} height={96} className="w-full h-full object-cover" />
                : emoji}
            </div>
            <h1 className="text-white text-2xl font-black tracking-tight mb-1">{p.name}</h1>
            <p className="text-white/40 text-xs font-mono">{[p.breed, p.age, p.color].filter(Boolean).join(' · ')}</p>
            {p.is_lost && (
              <div className="inline-flex bg-red-500 text-white text-xs font-black px-4 py-1.5 rounded-full mt-3 animate-pulse">
                {t('prof_lost')}
              </div>
            )}
          </div>

          {/* CTA dugmad - poziv i SMS */}
          {p.owners?.phone && (
            <div className="bg-[#f0fffe] border-b border-[#e2f0ef] p-4 flex gap-3">
              <a href={`tel:${phone}`}
                className="flex-1 bg-teal text-white font-black text-sm rounded-2xl py-3.5 text-center shadow-[0_4px_16px_rgba(61,191,184,0.35)] hover:bg-teal2 active:scale-95 transition-all">
                {t('prof_call')}
              </a>
              <a href={`sms:${phone}`}
                className="flex-1 bg-navy text-white font-black text-sm rounded-2xl py-3.5 text-center hover:bg-[#243d5e] active:scale-95 transition-all">
                {t('prof_sms')}
              </a>
            </div>
          )}

          {/* LOKACIJA SEKCIJA */}
          <div className="mx-4 my-4">
            {locState === 'idle' && (
              <button
                onClick={handleSendLocation}
                className="w-full bg-amber-50 border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-100 active:scale-95 transition-all rounded-2xl py-4 px-4 text-center"
              >
                <div className="text-xl mb-1">📍</div>
                <div className="text-sm font-black text-amber-800">Pošalji lokaciju vlasniku</div>
                <div className="text-xs text-amber-600 font-semibold mt-1">
                  Obavestite vlasnika gde se {p.name} nalazi
                </div>
              </button>
            )}

            {locState === 'asking' && (
              <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-2xl py-4 px-4 text-center">
                <div className="text-xl mb-1">🔍</div>
                <div className="text-sm font-black text-blue-800">Tražim vašu lokaciju...</div>
                <div className="text-xs text-blue-600 font-semibold mt-1">
                  Dozvolite pristup lokaciji u browser-u
                </div>
              </div>
            )}

            {locState === 'sending' && (
              <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-2xl py-4 px-4 text-center">
                <div className="text-xl mb-1 animate-bounce">📨</div>
                <div className="text-sm font-black text-blue-800">Šaljem lokaciju vlasniku...</div>
              </div>
            )}

            {locState === 'sent' && (
              <div className="w-full bg-green-50 border-2 border-green-300 rounded-2xl py-4 px-4 text-center">
                <div className="text-xl mb-1">✅</div>
                <div className="text-sm font-black text-green-800">Lokacija poslata vlasniku!</div>
                <div className="text-xs text-green-600 font-semibold mt-1 mb-3">
                  Vlasnik je obavešten gde se {p.name} nalazi
                </div>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-black text-green-700 bg-green-100 px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors">
                    📍 Vidi na mapi →
                  </a>
                )}
              </div>
            )}

            {locState === 'denied' && (
              <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl py-4 px-4 text-center">
                <div className="text-xl mb-1">🚫</div>
                <div className="text-sm font-black text-red-800">Lokacija nije dozvoljena</div>
                <div className="text-xs text-red-600 font-semibold mt-1">
                  Molimo pozovite vlasnika direktno ili pokušajte u podešavanjima browser-a
                </div>
                <button onClick={() => setLocState('idle')} className="mt-2 text-xs text-red-500 font-bold underline">
                  Pokušaj ponovo
                </button>
              </div>
            )}

            {locState === 'error' && (
              <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl py-4 px-4 text-center">
                <div className="text-xl mb-1">⚠️</div>
                <div className="text-sm font-black text-red-800">Greška pri slanju lokacije</div>
                <div className="text-xs text-red-600 font-semibold mt-1">
                  Pozovite vlasnika direktno
                </div>
                <button onClick={() => setLocState('idle')} className="mt-2 text-xs text-red-500 font-bold underline">
                  Pokušaj ponovo
                </button>
              </div>
            )}
          </div>

          {/* Vlasnik */}
          {(p.owners?.name || p.owners?.phone) && (
            <Sec title={t('prof_owner')}>
              {p.owners?.name && <Row l={t('row_name')} v={p.owners.name} />}
              {p.owners?.phone && <Row l={t('row_phone')} v={p.owners.phone} c="teal" />}
            </Sec>
          )}

          {/* Ljubimac */}
          <Sec title={t('prof_pet')}>
            <Row l={t('row_species')} v={`${emoji} ${p.species}`} />
            {p.breed && <Row l={t('row_breed')} v={p.breed} />}
            {p.age && <Row l={t('row_age')} v={p.age} />}
            {p.color && <Row l={t('row_color')} v={p.color} />}
          </Sec>

          {/* Medicinski */}
          {(p.microchip || p.vaccinated !== null || p.allergies || p.medication || p.vet_info) && (
            <Sec title={t('prof_medical')}>
              {p.microchip && <Row l={t('row_chip')} v={p.microchip} c="ok" />}
              {p.vaccinated !== null && (
                <Row l={t('row_vacc')} v={p.vaccinated ? t('vacc_yes') : t('vacc_no')} c={p.vaccinated ? 'ok' : 'warn'} />
              )}
              {p.allergies && <Row l={t('row_allergies')} v={`⚠️ ${p.allergies}`} c="warn" />}
              {p.medication && <Row l={t('row_med')} v={p.medication} c="warn" />}
              {p.vet_info && <Row l={t('row_vet')} v={p.vet_info} />}
            </Sec>
          )}

          {/* Napomena */}
          {p.note && (
            <div className="mx-4 my-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-1.5">
                {t('prof_note')}
              </div>
              <div className="text-sm text-amber-900 leading-relaxed font-medium">{p.note}</div>
            </div>
          )}

          {/* Zdravstveni zapisi */}
          {p.health_records?.length > 0 && (
            <Sec title={t('prof_health')}>
              <div className="space-y-2 pt-1">
                {p.health_records.map(r => (
                  <div key={r.id} className="bg-[#f8fffd] border border-[#e2f0ef] rounded-xl p-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-sm">{r.title}</span>
                      <span className="text-xs text-gray-400 font-mono">{r.record_date}</span>
                    </div>
                    {r.vet_name && <div className="text-xs text-teal font-semibold mt-1">🏥 {r.vet_name}</div>}
                    {r.note && <div className="text-xs text-gray-500 mt-1">{r.note}</div>}
                  </div>
                ))}
              </div>
            </Sec>
          )}

          {/* Footer */}
          <div className="border-t border-[#e2f0ef] bg-[#f8fffd] py-4 text-center mt-4">
            <a href="/" className="text-xs text-gray-400 font-bold hover:text-teal">
              {t('prof_footer')} <span className="text-teal">petcode</span>.rs
            </a>
          </div>

        </div>
      </div>
    </>
  )
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 pt-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-black text-teal uppercase tracking-widest">{title}</span>
        <div className="flex-1 h-px bg-[#e2f0ef]" />
      </div>
      <div className="divide-y divide-[#e2f0ef]">{children}</div>
    </div>
  )
}

function Row({ l, v, c }: { l: string; v: string; c?: 'teal' | 'ok' | 'warn' }) {
  const cls = c === 'teal' ? 'text-teal' : c === 'ok' ? 'text-emerald-600' : c === 'warn' ? 'text-orange-500' : 'text-navy'
  return (
    <div className="flex justify-between items-start py-2.5 gap-3">
      <span className="text-xs font-semibold text-gray-400 min-w-[90px]">{l}</span>
      <span className={`text-sm font-bold text-right ${cls}`}>{v}</span>
    </div>
  )
}

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
  // Telefon u internacionalnom formatu za WhatsApp/Viber (srpski 06x → +381 6x)
  const intlPhone = phone.startsWith('+')
    ? phone
    : phone.startsWith('0')
    ? '+381' + phone.slice(1)
    : phone ? '+' + phone : ''
  const waPhone = intlPhone.replace('+', '') // WhatsApp bez +
  const ownerEmail = p.owners?.email ?? null
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
      <style>{`body{background:#EEF2F7!important;margin:0;padding:0}`}</style>
      <div className="min-h-screen flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-sm bg-white rounded-[28px] overflow-hidden shadow-[0_24px_64px_rgba(11,31,59,0.16)]">

          {isNew && (
            <div className="bg-teal text-white text-center py-3 text-sm font-bold">
              🎉 Privezak aktiviran!
            </div>
          )}

          {/* Header */}
          <div className="bg-[#0B1F3B] pb-6 pt-5 px-5 text-center relative">
            <div className="absolute top-4 right-4"><LangSwitcher dark /></div>
            <a href="/" className="font-mono text-[11px] text-white/25 tracking-widest uppercase mb-4 block">
              pet<span className="text-teal">code</span>.rs
            </a>
            <div className="w-24 h-24 rounded-full mx-auto mb-3 border-[3px] border-teal/30 overflow-hidden bg-teal/10 flex items-center justify-center text-5xl">
              {p.photo_url
                ? <Image src={p.photo_url} alt={p.name} width={96} height={96} className="w-full h-full object-cover" unoptimized />
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

          {/* CTA dugmad — kontakt */}
          {(p.owners?.phone || ownerEmail) && (
            <div className="bg-[#F4F7FA] border-b border-[#E2EAF0] px-4 pt-4 pb-3 space-y-2.5">

              {/* Broj telefona — vidljiv */}
              {p.owners?.phone && (
                <div className="text-center text-xs text-gray-400 font-mono tracking-wider pb-0.5">
                  📞 {p.owners.phone}
                </div>
              )}

              {/* Pozovi + SMS */}
              {p.owners?.phone && (
                <div className="flex gap-2">
                  <a href={`tel:${phone}`}
                    className="flex-1 bg-teal text-white font-bold text-sm rounded-2xl py-3 text-center shadow-[0_4px_14px_rgba(25,182,178,0.3)] hover:bg-teal2 active:scale-95 transition-all">
                    {t('prof_call')}
                  </a>
                  <a href={`sms:${phone}`}
                    className="flex-1 bg-[#0B1F3B] text-white font-bold text-sm rounded-2xl py-3 text-center hover:bg-[#162d52] active:scale-95 transition-all">
                    {t('prof_sms')}
                  </a>
                </div>
              )}

              {/* WhatsApp + Viber */}
              {intlPhone && (
                <div className="flex gap-2">
                  <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white font-bold text-sm rounded-2xl py-3 text-center hover:bg-[#1ebe5d] active:scale-95 transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    WhatsApp
                  </a>
                  <a href={`viber://chat?number=${intlPhone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#7360F2] text-white font-bold text-sm rounded-2xl py-3 text-center hover:bg-[#6351e0] active:scale-95 transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.398.002C8.865-.028 3.443.638 1.04 5.87c-1.17 2.562-1.26 5.9-1.26 8.7 0 2.73.088 5.7 1.24 8.29 1.3 2.77 3.67 4.5 7 4.94v.5a.4.4 0 00.4.4h4.36a.4.4 0 00.4-.4v-.48c3.17-.3 5.62-1.83 7-4.76 1.14-2.5 1.24-5.4 1.24-8.04 0-2.7-.1-5.5-1.24-8.06C18.06 2.26 14.84.04 11.4.002zm.5 2.08c1.94.03 5.93.68 7.52 4.28.94 2.1.92 5.1.92 7.5 0 2.38 0 5.32-.9 7.4-1.5 3.5-5.06 3.9-7.5 4v.5H8.6v-.46c-2.3-.3-5.2-1.2-6.4-4.06-.96-2.22-1.04-4.96-1.04-7.38 0-2.4.08-5.28 1.06-7.44C3.7 2.8 7.6 2.12 11 2.08h.9zm-1.5 3.44a6.6 6.6 0 00-2.5.5c-2.14.88-3.38 2.52-3.72 4.82-.28 1.86.06 3.56.96 5.14.72 1.26 1.68 2.38 2.84 3.3.58.46 1.18.88 1.82 1.24.24.14.5.2.78.2.38 0 .74-.14 1.02-.4.14-.12.28-.26.38-.42l.22-.38c.12-.2.12-.44 0-.64-.12-.2-.98-1.18-1.16-1.34a.72.72 0 00-.52-.22c-.18 0-.36.06-.5.18l-.32.24c-.14.1-.32.1-.46.02-.56-.36-1.06-.82-1.52-1.34-.46-.52-.84-1.1-1.12-1.72-.08-.18-.06-.4.06-.54l.24-.3c.14-.18.22-.4.2-.64-.02-.22-.88-1.5-1.04-1.76-.16-.26-.46-.32-.72-.18-.08.04-.14.1-.2.16-.56.56-.86 1.28-.88 2.04-.04 1.56.64 2.98 1.5 4.12a11.58 11.58 0 004.38 3.6c.82.38 1.68.64 2.56.76.2.04.42.06.64.06 1.12 0 2.2-.4 3.06-1.14.06-.06.12-.12.16-.2.14-.28.08-.62-.14-.82l-.38-.34c-.22-.2-.56-.2-.78 0-.56.5-1.26.76-2 .76-.18 0-.36-.02-.52-.04a8.98 8.98 0 01-2.06-.6 9.7 9.7 0 01-3.6-2.96c-.7-.9-1.24-1.96-1.2-3.08.02-.44.2-.84.5-1.14.1-.1.22-.1.32-.02.14.1.8 1.02.92 1.22.06.1.1.22.1.34 0 .1-.02.2-.08.28l-.22.28a.46.46 0 00-.02.56c.3.7.72 1.34 1.24 1.9.52.56 1.12 1.04 1.78 1.42.16.1.36.08.5-.04l.32-.26c.14-.12.24-.12.38-.02.2.18 1.08 1.18 1.2 1.4.06.1.1.22.1.34 0 .12-.04.24-.1.34l-.22.36c-.06.1-.14.18-.22.26a2.2 2.2 0 01-.7.28c-.16.04-.32.06-.48.06-.2 0-.38-.04-.56-.12a11.6 11.6 0 01-1.72-1.16 11.56 11.56 0 01-2.66-3.06c-.8-1.42-1.1-3-.84-4.68.28-1.84 1.3-3.2 3.02-3.9a5.1 5.1 0 011.9-.38c.2 0 .4.02.6.04.04 0 .06-.02.1-.02z"/></svg>
                    Viber
                  </a>
                </div>
              )}

              {/* Email */}
              {ownerEmail && (
                <a href={`mailto:${ownerEmail}`}
                  className="flex items-center justify-center gap-2 w-full bg-white border-2 border-[#E2EAF0] text-[#0B1F3B] font-bold text-sm rounded-2xl py-2.5 hover:border-teal hover:text-teal active:scale-95 transition-all">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {ownerEmail}
                </a>
              )}

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
              {p.owners?.name && <Row l={t('row_name')} v={p.owners.name as string} />}
              {p.owners?.phone && <Row l={t('row_phone')} v={p.owners.phone as string} c="teal" />}
              {ownerEmail && <Row l="Email" v={ownerEmail} c="teal" />}
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
          <div className="border-t border-[#E2EAF0] bg-[#F8FAFB] py-4 text-center mt-4">
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

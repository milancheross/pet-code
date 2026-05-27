'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/i18n/LangContext'
import LangSwitcher from '@/components/LangSwitcher'
import type { Species } from '@/lib/types'
import { formatBytes } from '@/lib/imageUtils'

const SPECIES: {v: Species, k: any}[] = [
  {v:'pas',k:'sp_pas'},{v:'macka',k:'sp_macka'},{v:'zec',k:'sp_zec'},{v:'ptica',k:'sp_ptica'},{v:'ostalo',k:'sp_ostalo'}
]

export default function ActivationPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const sb = createClient()
  const { t } = useLang()
  const [step, setStep] = useState<'auth'|'pet'>('auth')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email,setEmail]=useState(''); const [pass,setPass]=useState('')
  const [oName,setOName]=useState(''); const [oPhone,setOPhone]=useState('')
  const [name,setName]=useState(''); const [species,setSpecies]=useState<Species>('pas')
  const [breed,setBreed]=useState(''); const [photo,setPhoto]=useState<File|null>(null)
  const [preview,setPreview]=useState(''); const [color,setColor]=useState('')
  const [converting,setConverting]=useState(false); const [convertInfo,setConvertInfo]=useState('')
  const [age,setAge]=useState(''); const [chip,setChip]=useState('')
  const [vacc,setVacc]=useState<boolean|null>(null); const [allergy,setAllergy]=useState('')
  const [med,setMed]=useState(''); const [vet,setVet]=useState(''); const [note,setNote]=useState('')

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if(!f) return
    if (f.size > 20 * 1024 * 1024) { setError('Slika ne sme biti veća od 20MB'); return }
    setError(''); setPreview(URL.createObjectURL(f))
    setPhoto(f)
    setConvertInfo(`📷 ${formatBytes(f.size)} — optimizacija na serveru`)
  }

  const doAuth = async () => {
    setLoading(true); setError('')
    try {
      let userId: string

      // 1. Pokušaj prijavu (postojeći korisnik)
      const { data: loginData, error: loginErr } = await sb.auth.signInWithPassword({ email, password: pass })

      if (!loginErr && loginData.user) {
        // ✅ Uspešna prijava — postojeći korisnik dodaje novog ljubimca
        userId = loginData.user.id

      } else {
        // Prijava nije uspela — provjeri razlog
        const loginMsg = loginErr?.message?.toLowerCase() || ''

        if (loginMsg.includes('not confirmed') || loginMsg.includes('email not confirmed')) {
          throw new Error('Email adresa nije potvrđena. Proverite inbox i kliknite na link za potvrdu registracije.')
        }

        // Pokušaj registraciju (novi korisnik)
        const { data: signupData, error: signUpErr } = await sb.auth.signUp({
          email, password: pass, options: { data: { name: oName } }
        })

        if (signUpErr) {
          const msg = signUpErr.message.toLowerCase()
          if (msg.includes('already') || msg.includes('registered') || msg.includes('exists') || msg.includes('taken')) {
            // Email postoji u Auth, ali je lozinka pogrešna
            throw new Error('Ovaj email je već registrovan — unesite lozinku s kojom ste se prethodno prijavili. Možete dodati više ljubimaca na isti nalog.')
          }
          if (msg.includes('password') && msg.includes('short')) {
            throw new Error('Lozinka mora imati najmanje 6 karaktera.')
          }
          throw signUpErr
        }

        // Supabase ponekad vraća user bez identities (email već postoji, anti-enumeration zaštita)
        if (!signupData?.user || (signupData.user.identities && signupData.user.identities.length === 0)) {
          throw new Error('Ovaj email je već registrovan — unesite lozinku s kojom ste se prethodno prijavili.')
        }

        userId = signupData.user.id
      }

      // 2. Sačuvaj/ažuriraj vlasnika
      const { error: ownerErr } = await sb.from('owners').upsert(
        { id: userId, name: oName, phone: oPhone, email },
        { onConflict: 'id' }
      )
      if (ownerErr) console.warn('Owner upsert:', ownerErr.message)

      setStep('pet')
    } catch(e:any){ setError(e.message) } finally{ setLoading(false) }
  }

  const doPet = async () => {
    setLoading(true); setError('')
    try {
      const {data:{user}} = await sb.auth.getUser()
      if(!user) throw new Error('Not logged in')
      const {data:qr} = await sb.from('qr_codes').select('*').eq('code',params.code.toUpperCase()).single()
      if(!qr||qr.status!=='unused') throw new Error('QR kod je već iskorišćen ili ne postoji')
      let photoUrl=null
      if(photo){
        setConverting(true); setConvertInfo('Optimizujem sliku...')
        const fd = new FormData()
        fd.append('file', photo)
        fd.append('pet_id', qr.id)
        const photoRes = await fetch('/api/upload-pet-photo', { method: 'POST', body: fd })
        setConverting(false)
        if (!photoRes.ok) throw new Error('Greška pri uploadu slike')
        const photoData = await photoRes.json()
        photoUrl = photoData.url
        setConvertInfo(`✅ ${formatBytes(photoData.originalSize)} → ${formatBytes(photoData.newSize)}`)
      }
      const {data:pet,error:pe}=await sb.from('pets').insert({
        qr_code_id:qr.id,owner_id:user.id,name,species,
        breed:breed||null,photo_url:photoUrl,color:color||null,age:age||null,
        microchip:chip||null,vaccinated:vacc,allergies:allergy||null,
        medication:med||null,vet_info:vet||null,note:note||null,
      }).select().single()
      if(pe) throw pe
      await sb.from('qr_codes').update({status:'active',activated_at:new Date().toISOString()}).eq('id',qr.id)
      router.push(`/ljubimac/${pet.id}?novi=1`)
    } catch(e:any){setError(e.message)} finally{setLoading(false)}
  }

  return (
    <div className="min-h-screen bg-[#f0fffe] pb-16">
      <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-[#e2f0ef]">
        <span className="font-black text-navy text-sm font-mono">{params.code.toUpperCase()}</span>
        <LangSwitcher />
      </div>
      <div className="max-w-md mx-auto p-4 pt-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🐾</div>
          <h1 className="text-2xl font-black text-navy">{t('act_title')}</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">{step==='auth'?t('act_sub_auth'):t('act_sub_pet')}</p>
        </div>
        <div className="flex gap-2 mb-6">
          <div className="flex-1 h-1.5 rounded-full bg-teal" />
          <div className={`flex-1 h-1.5 rounded-full ${step==='pet'?'bg-teal':'bg-[#e2f0ef]'}`} />
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-4 text-sm font-semibold">⚠️ {error}</div>}

        {step==='auth' && (
          <div className="card space-y-4">
            <h2 className="font-black text-navy">{t('act_step1')}</h2>
            {/* Hint za korisnike koji već imaju nalog */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 font-semibold">
              💡 Već imate nalog? Unesite isti email i lozinku — jedan nalog može imati više ljubimaca.
            </div>
            <div><label className="label">{t('act_owner_name')}</label><input className="input" value={oName} onChange={e=>setOName(e.target.value)} placeholder="Marko Petrović" /></div>
            <div><label className="label">{t('act_phone')}</label><input className="input" type="tel" value={oPhone} onChange={e=>setOPhone(e.target.value)} placeholder="+381 64 123 456" /></div>
            <div><label className="label">{t('act_email')}</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div><label className="label">{t('act_pass')}</label><input className="input" type="password" placeholder={t('act_pass_ph')} value={pass} onChange={e=>setPass(e.target.value)} /></div>
            <button onClick={doAuth} disabled={loading||!email||!pass||!oName||!oPhone} className="btn-teal w-full">
              {loading?t('act_loading'):t('act_next')}
            </button>
          </div>
        )}

        {step==='pet' && (
          <div className="space-y-4">
            <div className="card space-y-4">
              <h2 className="font-black text-navy">{t('act_locked')}</h2>
              <div>
                <label className="label">{t('act_photo')}</label>
                <div onClick={()=>!converting&&document.getElementById('ph')?.click()}
                  className="w-full h-36 border-2 border-dashed border-[#e2f0ef] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-teal transition-colors overflow-hidden relative">
                  {preview?<img src={preview} className="w-full h-full object-cover object-top"/>:<><div className="text-3xl mb-1">📷</div><div className="text-sm text-gray-400 font-semibold">{t('act_photo_hint')}</div></>}
                  {converting && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-1">
                      <svg className="animate-spin w-5 h-5 text-teal" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      <span className="text-xs font-bold text-teal">Optimizujem sliku...</span>
                    </div>
                  )}
                </div>
                <input id="ph" type="file" accept="image/*" className="hidden" onChange={onPhoto}/>
                {convertInfo && <p className="text-xs font-semibold text-green-600 mt-1">{convertInfo}</p>}
              </div>
              <div><label className="label">{t('act_pet_name')}</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Maks" /></div>
              <div>
                <label className="label">{t('act_species')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {SPECIES.map(s=>(
                    <button key={s.v} type="button" onClick={()=>setSpecies(s.v)}
                      className={`py-2 rounded-xl border-2 text-xs font-bold transition-all ${species===s.v?'border-teal bg-teal/10 text-teal':'border-[#e2f0ef] text-gray-500'}`}>
                      {t(s.k)}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="label">{t('act_breed')}</label><input className="input" value={breed} onChange={e=>setBreed(e.target.value)} placeholder="Labrador" /></div>
            </div>

            <div className="card space-y-4">
              <h2 className="font-black text-navy">{t('act_editable')}</h2>
              <div><label className="label">{t('act_color')}</label><input className="input" value={color} onChange={e=>setColor(e.target.value)} /></div>
              <div><label className="label">{t('act_age')}</label><input className="input" value={age} onChange={e=>setAge(e.target.value)} placeholder="3 godine" /></div>
              <div><label className="label">{t('act_chip')}</label><input className="input" value={chip} onChange={e=>setChip(e.target.value)} /></div>
              <div>
                <label className="label">{t('act_vacc')}</label>
                <div className="flex gap-2">
                  {[true,false].map(v=>(
                    <button key={String(v)} type="button" onClick={()=>setVacc(v)}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${vacc===v?'border-teal bg-teal/10 text-teal':'border-[#e2f0ef] text-gray-500'}`}>
                      {v?`✅ ${t('act_yes')}`:`❌ ${t('act_no')}`}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="label">{t('act_allergies')}</label><input className="input" value={allergy} onChange={e=>setAllergy(e.target.value)} /></div>
              <div><label className="label">{t('act_med')}</label><input className="input" value={med} onChange={e=>setMed(e.target.value)} /></div>
              <div><label className="label">{t('act_vet')}</label><input className="input" value={vet} onChange={e=>setVet(e.target.value)} /></div>
              <div><label className="label">{t('act_note')}</label><textarea className="input resize-none h-20" value={note} onChange={e=>setNote(e.target.value)} /></div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 font-semibold">{t('act_warning')}</div>
            <button onClick={doPet} disabled={loading||!name} className="btn-teal w-full">
              {loading?t('act_saving'):t('act_submit')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

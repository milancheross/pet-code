'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n/LangContext'
import LangSwitcher from '@/components/LangSwitcher'
import Image from 'next/image'
import type { Pet, HealthRecord } from '@/lib/types'

export default function DashboardPage() {
  const sb = createClient(); const router = useRouter(); const { t } = useLang()
  const [pets, setPets] = useState<Pet[]>([])
  const [pet, setPet] = useState<Pet | null>(null)
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'info'|'health'>('info')
  const [saved, setSaved] = useState(false)

  // editable fields
  const [color,setColor]=useState(''); const [age,setAge]=useState('')
  const [chip,setChip]=useState(''); const [vacc,setVacc]=useState<boolean|null>(null)
  const [allergy,setAllergy]=useState(''); const [med,setMed]=useState('')
  const [vet,setVet]=useState(''); const [note,setNote]=useState('')
  const [lost,setLost]=useState(false)

  // health record form
  const [rTitle,setRTitle]=useState(''); const [rNote,setRNote]=useState('')
  const [rVet,setRVet]=useState(''); const [rDate,setRDate]=useState(new Date().toISOString().split('T')[0])

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await sb.from('pets').select('*').eq('owner_id', user.id)
    if (data?.length) { setPets(data); await selectPet(data[0]) }
    setLoading(false)
  }

  const selectPet = async (p: Pet) => {
    setPet(p); setColor(p.color||''); setAge(p.age||''); setChip(p.microchip||'')
    setVacc(p.vaccinated); setAllergy(p.allergies||''); setMed(p.medication||'')
    setVet(p.vet_info||''); setNote(p.note||''); setLost(p.is_lost||false)
    const { data } = await sb.from('health_records').select('*').eq('pet_id', p.id).order('record_date', { ascending: false })
    setRecords(data||[])
  }

  const save = async () => {
    if (!pet) return; setSaving(true)
    await sb.from('pets').update({ color:color||null, age:age||null, microchip:chip||null, vaccinated:vacc, allergies:allergy||null, medication:med||null, vet_info:vet||null, note:note||null, is_lost: lost }).eq('id', pet.id)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false), 2000)
  }

  const addRecord = async () => {
    if (!pet || !rTitle) return; setSaving(true)
    const { data } = await sb.from('health_records').insert({ pet_id: pet.id, title: rTitle, note: rNote||null, vet_name: rVet||null, record_date: rDate }).select().single()
    if (data) setRecords(p => [data, ...p])
    setRTitle(''); setRNote(''); setRVet(''); setSaving(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-teal font-black text-xl animate-pulse">...</div></div>

  return (
    <div className="min-h-screen bg-[#f0fffe]">
      <nav className="bg-white border-b border-[#e2f0ef] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-black text-navy">pet<span className="text-teal">code</span>.rs</span>
        <div className="flex gap-3 items-center">
          <LangSwitcher />
          <button onClick={async()=>{await sb.auth.signOut();router.push('/')}} className="text-xs text-gray-400 font-bold hover:text-navy">{t('dash_logout')}</button>
        </div>
      </nav>

      <div className="max-w-lg mx-auto p-4 pb-16">
        {pets.length === 0 ? (
          <div className="card text-center py-12 mt-8">
            <div className="text-5xl mb-4">🐾</div>
            <h2 className="font-black text-navy text-xl mb-2">{t('dash_no_pets')}</h2>
            <p className="text-gray-400 text-sm">{t('dash_no_pets_sub')}</p>
          </div>
        ) : (
          <>
            {pets.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {pets.map(p => (
                  <button key={p.id} onClick={()=>selectPet(p)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${pet?.id===p.id?'bg-teal border-teal text-white':'border-[#e2f0ef] text-gray-500'}`}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            {pet && (
              <>
                <div className="card mb-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                    {pet.photo_url ? <Image src={pet.photo_url} alt={pet.name} width={56} height={56} className="w-full h-full object-cover object-top rounded-2xl" /> : '🐾'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-navy text-lg">{pet.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      {pet.breed} · {pet.species}
                      <span className={`w-2 h-2 rounded-full ${lost?'bg-red-400 animate-pulse':'bg-emerald-400'}`} />
                      <span>{lost ? t('dash_lost_label') : t('dash_safe')}</span>
                    </div>
                  </div>
                  <a href={`/ljubimac/${pet.id}`} target="_blank" className="text-xs text-teal font-black hover:underline flex-shrink-0">{t('dash_view')}</a>
                </div>

                <div className="flex gap-2 mb-4">
                  {(['info','health'] as const).map(tab2 => (
                    <button key={tab2} onClick={()=>setTab(tab2)}
                      className={`flex-1 py-2.5 rounded-2xl text-sm font-black border-2 transition-all ${tab===tab2?'bg-navy border-navy text-white':'border-[#e2f0ef] text-gray-400 bg-white'}`}>
                      {tab2==='info'?t('dash_tab_info'):t('dash_tab_health')}
                    </button>
                  ))}
                </div>

                {tab==='info' && (
                  <div className="card space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-semibold">{t('dash_locked')}</div>
                    <div>
                      <label className="label">{t('dash_lost_label')}</label>
                      <div className="flex gap-2">
                        {[{v:true,k:'dash_lost_yes'},{v:false,k:'dash_lost_no'}].map((o:any) => (
                          <button key={String(o.v)} type="button" onClick={()=>setLost(o.v)}
                            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${lost===o.v?'border-teal bg-teal/10 text-teal':'border-[#e2f0ef] text-gray-400'}`}>
                            {t(o.k)}
                          </button>
                        ))}
                      </div>
                    </div>
                    {[
                      {l:'row_color',v:color,s:setColor,ph:'npr. Crni sa belom šapom'},
                      {l:'row_age',v:age,s:setAge,ph:'npr. 3 godine'},
                      {l:'row_chip',v:chip,s:setChip,ph:'broj mikročipa'},
                      {l:'row_allergies',v:allergy,s:setAllergy,ph:'npr. Piletina'},
                      {l:'row_med',v:med,s:setMed,ph:'redovna terapija'},
                      {l:'row_vet',v:vet,s:setVet,ph:'naziv i telefon'},
                    ].map((f:any) => (
                      <div key={f.l}><label className="label">{t(f.l)}</label><input className="input" value={f.v} onChange={(e:any)=>f.s(e.target.value)} placeholder={f.ph} /></div>
                    ))}
                    <div>
                      <label className="label">{t('act_vacc')}</label>
                      <div className="flex gap-2">
                        {[true,false].map(v=>(
                          <button key={String(v)} type="button" onClick={()=>setVacc(v)}
                            className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all ${vacc===v?'border-teal bg-teal/10 text-teal':'border-[#e2f0ef] text-gray-400'}`}>
                            {v?`✅ ${t('act_yes')}`:`❌ ${t('act_no')}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div><label className="label">{t('act_note')}</label><textarea className="input resize-none h-20" value={note} onChange={e=>setNote(e.target.value)} /></div>
                    <button onClick={save} disabled={saving} className="btn-teal w-full">
                      {saved ? t('dash_saved') : saving ? t('dash_saving') : t('dash_save')}
                    </button>
                  </div>
                )}

                {tab==='health' && (
                  <div className="space-y-4">
                    <div className="card space-y-4">
                      <h3 className="font-black text-navy">{t('dash_health_add')}</h3>
                      <div><label className="label">{t('dash_health_title')}</label><input className="input" value={rTitle} onChange={e=>setRTitle(e.target.value)} placeholder="npr. Vakcinacija" /></div>
                      <div><label className="label">{t('dash_health_date')}</label><input className="input" type="date" value={rDate} onChange={e=>setRDate(e.target.value)} /></div>
                      <div><label className="label">{t('dash_health_vet')}</label><input className="input" value={rVet} onChange={e=>setRVet(e.target.value)} /></div>
                      <div><label className="label">{t('dash_health_note')}</label><textarea className="input resize-none h-20" value={rNote} onChange={e=>setRNote(e.target.value)} /></div>
                      <button onClick={addRecord} disabled={saving||!rTitle} className="btn-teal w-full">{t('dash_health_add')}</button>
                    </div>
                    {records.length===0
                      ? <div className="card text-center py-8 text-gray-400 text-sm font-semibold">{t('dash_health_empty')}</div>
                      : records.map(r=>(
                        <div key={r.id} className="card py-3 px-4">
                          <div className="flex justify-between"><span className="font-black text-navy text-sm">{r.title}</span><span className="text-xs text-gray-400 font-mono">{r.record_date}</span></div>
                          {r.vet_name && <div className="text-xs text-teal font-bold mt-1">🏥 {r.vet_name}</div>}
                          {r.note && <div className="text-xs text-gray-500 mt-1">{r.note}</div>}
                        </div>
                      ))
                    }
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLang } from '@/lib/i18n/LangContext'
import LangSwitcher from '@/components/LangSwitcher'
import Link from 'next/link'
import { PRICE_PER_TAG } from '@/lib/types'

export default function OrderPage() {
  const { t } = useLang()
  const params = useSearchParams()
  const initQty = Number(params.get('qty')) || 1

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [qty, setQty] = useState(initQty)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const discount = qty === 2 ? 290 : qty >= 4 ? 980 : 0
  const total = PRICE_PER_TAG * qty - discount

  const handleSubmit = async () => {
    if (!name || !phone || !address || !city) { setError(t('order_required')); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: name, customer_phone: phone, customer_email: email || null, address, city, quantity: qty, note: note || null, total_rsd: total }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch { setError(t('order_error')) }
    finally { setLoading(false) }
  }

  if (success) return (
    <div className="min-h-screen bg-[#f0fffe] flex items-center justify-center p-4">
      <div className="card text-center max-w-sm w-full py-12">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-black text-navy mb-3">{t('order_success_t')}</h1>
        <p className="text-gray-500 font-medium mb-8">{t('order_success')}</p>
        <Link href="/" className="btn-teal block">{t('not_found_back')}</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f0fffe] pb-16">
      <nav className="bg-white border-b border-[#e2f0ef] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="font-black text-navy">pet<span className="text-teal">code</span>.rs</Link>
        <LangSwitcher />
      </nav>

      <div className="max-w-md mx-auto p-4 pt-8">
        <h1 className="text-2xl font-black text-navy mb-8 text-center">{t('order_title')}</h1>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-5 text-sm font-semibold">⚠️ {error}</div>}

        <div className="space-y-5">
          {/* Količina */}
          <div className="card">
            <label className="label">{t('order_qty')}</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[1,2,4].map(q => (
                <button key={q} onClick={() => setQty(q)}
                  className={`py-3 rounded-2xl border-2 font-black text-sm transition-all ${qty === q ? 'border-teal bg-teal/10 text-teal' : 'border-[#e2f0ef] text-gray-500'}`}>
                  {q}x
                  {q > 1 && <div className="text-[10px] font-semibold text-teal mt-0.5">-{q===2?'290':'980'} RSD</div>}
                </button>
              ))}
            </div>
            <div className="mt-4 bg-teal/8 rounded-2xl p-4 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500">{t('order_total')}</span>
              <span className="text-2xl font-black text-navy">{total.toLocaleString()} RSD</span>
            </div>
            <div className="text-center text-xs text-gray-400 font-semibold mt-2">💳 {t('order_cod')}</div>
          </div>

          {/* Podaci */}
          <div className="card space-y-4">
            <div><label className="label">{t('order_name')}</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Marko Petrović" /></div>
            <div><label className="label">{t('order_phone')}</label><input className="input" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+381 64 123 456" /></div>
            <div><label className="label">{t('order_email')}</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="opciono" /></div>
            <div><label className="label">{t('order_address')}</label><input className="input" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Knez Mihailova 1" /></div>
            <div><label className="label">{t('order_city')}</label><input className="input" value={city} onChange={e=>setCity(e.target.value)} placeholder="Beograd" /></div>
            <div><label className="label">{t('order_note')}</label><textarea className="input resize-none h-20" value={note} onChange={e=>setNote(e.target.value)} placeholder={t('order_note_ph')} /></div>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="btn-teal w-full text-base">
            {loading ? t('order_sending') : t('order_submit')}
          </button>

          <p className="text-center text-xs text-gray-400 font-medium">
            Plaćanje pouzećem · Post Express dostava · Bez registracije
          </p>
        </div>
      </div>
    </div>
  )
}

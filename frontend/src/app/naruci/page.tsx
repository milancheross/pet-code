'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLang } from '@/lib/i18n/LangContext'
import LangSwitcher from '@/components/LangSwitcher'
import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'
import { PRICE_PER_TAG } from '@/lib/types'

function OrderForm() {
  const { t } = useLang()
  const params = useSearchParams()
  const productSlug = params?.get('product') || null
  const variantId = params?.get('variant') || null
  const urlQty = parseInt(params?.get('qty') || '1', 10)
  const urlPrice = parseInt(params?.get('price') || '0', 10)

  const unitPrice = urlPrice > 0 ? urlPrice : PRICE_PER_TAG

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [note, setNote] = useState('')
  const [qty, setQty] = useState(Math.max(1, Math.min(99, urlQty)))
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const total = qty * unitPrice

  const handleSubmit = async () => {
    if (!name || !phone || !email || !address || !city) { setError(t('order_required')); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: name, customer_phone: phone, customer_email: email || null, address, city, quantity: qty, note: note || null, total_rsd: total, product_slug: productSlug, variant_id: variantId }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch { setError(t('order_error')) }
    finally { setLoading(false) }
  }

  if (success) return (
    <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center p-4">
      <div className="card text-center max-w-sm w-full py-12">
        <div className="w-16 h-16 rounded-full bg-orange/10 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14l6 6L23 8" stroke="#FF6B4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h1 className="text-2xl font-extrabold text-navy mb-3">{t('order_success_t')}</h1>
        <p className="text-gray-500 font-medium mb-8">{t('order_success')}</p>
        <Link href="/" className="btn-primary block">{t('not_found_back')}</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F4F7FA] pb-16">
      <nav className="bg-white border-b border-[#E2EAF0] px-5 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <Link href="/"><PetCodeLogo size="sm" /></Link>
        <LangSwitcher />
      </nav>

      <div className="max-w-md mx-auto p-4 pt-8">
        <h1 className="text-2xl font-extrabold text-navy mb-8 text-center">{t('order_title')}</h1>

        {productSlug && (
          <div className="bg-teal/10 border border-teal/20 rounded-2xl p-4 mb-5 flex items-center gap-3">
            <span className="text-2xl">🛍️</span>
            <div>
              <div className="text-xs font-bold text-teal uppercase tracking-widest mb-0.5">Narudžbina proizvoda</div>
              <div className="font-bold text-navy">
                {productSlug.replace(/-[a-z0-9]{6,}$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </div>
            </div>
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-5 text-sm font-semibold">⚠️ {error}</div>}

        <div className="space-y-5">
          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <span className="label mb-0">{t('order_qty')}</span>
              {/* Quantity stepper */}
              <div className="flex items-center gap-0 bg-[#F4F7FA] border-2 border-[#E2EAF0] rounded-full overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="w-9 h-9 flex items-center justify-center text-navy text-xl font-bold hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Smanji količinu"
                >
                  −
                </button>
                <span className="w-8 text-center text-base font-extrabold text-navy select-none">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(99, q + 1))}
                  disabled={qty >= 99}
                  className="w-9 h-9 flex items-center justify-center text-navy text-xl font-bold hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Povećaj količinu"
                >
                  +
                </button>
              </div>
            </div>

            {/* Unit price row (if qty > 1) */}
            {qty > 1 && (
              <div className="flex justify-between items-center text-sm text-gray-400 font-semibold mb-3">
                <span>Cena po komadu</span>
                <span>{unitPrice.toLocaleString()} RSD</span>
              </div>
            )}

            <div className="bg-navy rounded-2xl p-5 flex justify-between items-center">
              <span className="text-sm font-bold text-white/50">{t('order_total')}</span>
              <span className="text-3xl font-extrabold text-white tracking-tight">{total.toLocaleString()} <span className="text-lg font-semibold">RSD</span></span>
            </div>
            <div className="text-center text-xs text-gray-400 font-semibold mt-2">💳 {t('order_cod')}</div>
          </div>

          <div className="card space-y-4">
            <div><label className="label">{t('order_name')}</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Marko Petrović" /></div>
            <div><label className="label">{t('order_phone')}</label><input className="input" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+381 64 123 456" /></div>
            <div><label className="label">{t('order_email')} <span className="text-red-400">*</span></label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="marko@gmail.com" required /></div>
            <div><label className="label">{t('order_address')}</label><input className="input" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Knez Mihailova 1" /></div>
            <div><label className="label">{t('order_city')}</label><input className="input" value={city} onChange={e=>setCity(e.target.value)} placeholder="Beograd" /></div>
            <div><label className="label">{t('order_note')}</label><textarea className="input resize-none h-20" value={note} onChange={e=>setNote(e.target.value)} placeholder={t('order_note_ph')} /></div>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full text-base">
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

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA]">
        <div className="text-teal font-bold animate-pulse">Učitavanje...</div>
      </div>
    }>
      <OrderForm />
    </Suspense>
  )
}

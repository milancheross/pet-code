'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLang } from '@/lib/i18n/LangContext'
import LangSwitcher from '@/components/LangSwitcher'
import CartIconButton from '@/components/CartIconButton'
import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'
import { PRICE_PER_TAG } from '@/lib/types'
import { useCart } from '@/lib/cartStore'

/* ── Single-product (legacy) checkout form ── */
function DirectOrderForm() {
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
        body: JSON.stringify({
          customer_name: name, customer_phone: phone,
          customer_email: email || null,
          address, city, quantity: qty, note: note || null,
          total_rsd: total, product_slug: productSlug, variant_id: variantId,
        }),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch { setError(t('order_error')) }
    finally { setLoading(false) }
  }

  if (success) return <SuccessScreen />

  return (
    <FormLayout>
      {productSlug && (
        <div className="bg-teal/10 border border-teal/20 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <span className="text-2xl">🛍️</span>
          <div>
            <div className="text-xs font-bold text-teal uppercase tracking-widest mb-0.5">Narudžbina proizvoda</div>
            <div className="font-bold text-navy">
              {productSlug.replace(/-[a-z0-9]{6,}$/, '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
            </div>
          </div>
        </div>
      )}

      {error && <ErrorBox msg={error} />}

      <div className="space-y-5">
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <span className="label mb-0">{t('order_qty')}</span>
            <div className="flex items-center gap-0 bg-[#F4F7FA] border-2 border-[#E2EAF0] rounded-full overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}
                className="w-9 h-9 flex items-center justify-center text-navy text-xl font-bold hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed">−</button>
              <span className="w-8 text-center text-base font-extrabold text-navy select-none">{qty}</span>
              <button onClick={() => setQty(q => Math.min(99, q + 1))} disabled={qty >= 99}
                className="w-9 h-9 flex items-center justify-center text-navy text-xl font-bold hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed">+</button>
            </div>
          </div>
          {qty > 1 && (
            <div className="flex justify-between items-center text-sm text-gray-400 font-semibold mb-3">
              <span>Cena po komadu</span><span>{unitPrice.toLocaleString()} RSD</span>
            </div>
          )}
          <TotalBox total={total} />
        </div>

        <CustomerFields
          name={name} setName={setName}
          phone={phone} setPhone={setPhone}
          email={email} setEmail={setEmail}
          address={address} setAddress={setAddress}
          city={city} setCity={setCity}
          note={note} setNote={setNote}
        />

        <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full text-base">
          {loading ? t('order_sending') : t('order_submit')}
        </button>
        <FooterNote />
      </div>
    </FormLayout>
  )
}

/* ── Cart checkout form ── */
function CartCheckoutForm() {
  const { t } = useLang()
  const { items, cartTotal, clearCart } = useCart()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name || !phone || !email || !address || !city) { setError(t('order_required')); return }
    if (items.length === 0) { setError('Korpa je prazna'); return }
    setLoading(true); setError('')
    try {
      const orderItems = items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        variant: i.variant,
        slug: i.slug,
      }))
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name, customer_phone: phone,
          customer_email: email || null,
          address, city, note: note || null,
          items: orderItems,
          total_rsd: cartTotal,
        }),
      })
      if (!res.ok) throw new Error()
      clearCart()
      setSuccess(true)
    } catch { setError(t('order_error')) }
    finally { setLoading(false) }
  }

  if (success) return <SuccessScreen />

  if (items.length === 0) {
    return (
      <FormLayout>
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="font-extrabold text-navy text-xl mb-3">Korpa je prazna</h2>
          <p className="text-gray-400 font-medium mb-6">Dodajte proizvode i vratite se ovde.</p>
          <Link href="/prodavnica" className="btn-primary inline-block">Idi u prodavnicu →</Link>
        </div>
      </FormLayout>
    )
  }

  return (
    <FormLayout>
      {/* Cart summary */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🛒</span>
          <h2 className="font-extrabold text-navy text-lg">Pregled narudžbine</h2>
          <span className="bg-teal/10 text-teal text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
            {items.length} {items.length === 1 ? 'artikal' : 'artikala'}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          {items.map(item => (
            <div key={`${item.id}-${item.variantId ?? ''}`} className="flex items-center gap-3 py-2 border-b border-[#F0F4F8] last:border-0">
              <div className="w-10 h-10 rounded-xl bg-[#F4F7FA] flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#E2EAF0]">
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-full h-full object-contain p-0.5" />
                  : <span className="text-lg">🐾</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-navy text-sm truncate">{item.name}</div>
                {item.variant && <div className="text-xs text-gray-400">{item.variant}</div>}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-400">{item.quantity}x {item.price.toLocaleString()} RSD</div>
                <div className="font-bold text-navy text-sm">{(item.price * item.quantity).toLocaleString()} RSD</div>
              </div>
            </div>
          ))}
        </div>

        <TotalBox total={cartTotal} />
      </div>

      {error && <ErrorBox msg={error} />}

      <CustomerFields
        name={name} setName={setName}
        phone={phone} setPhone={setPhone}
        email={email} setEmail={setEmail}
        address={address} setAddress={setAddress}
        city={city} setCity={setCity}
        note={note} setNote={setNote}
      />

      <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full text-base mt-5">
        {loading ? t('order_sending') : `Naruči (${cartTotal.toLocaleString()} RSD) →`}
      </button>
      <FooterNote />
    </FormLayout>
  )
}

/* ── Shared sub-components ── */
function SuccessScreen() {
  return (
    <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center p-4">
      <div className="card text-center max-w-sm w-full py-12">
        <div className="w-16 h-16 rounded-full bg-orange/10 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M5 14l6 6L23 8" stroke="#FF6B4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-navy mb-3">Narudžbina primljena!</h1>
        <p className="text-gray-500 font-medium mb-8">Kontaktiraćemo vas uskoro za potvrdu.</p>
        <Link href="/" className="btn-primary block">Nazad na početnu</Link>
      </div>
    </div>
  )
}

function TotalBox({ total }: { total: number }) {
  return (
    <div className="bg-navy rounded-2xl p-5 flex justify-between items-center">
      <span className="text-sm font-bold text-white/50">Ukupno</span>
      <span className="text-3xl font-extrabold text-white tracking-tight">
        {total.toLocaleString()} <span className="text-lg font-semibold">RSD</span>
      </span>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-5 text-sm font-semibold">
      ⚠️ {msg}
    </div>
  )
}

function FooterNote() {
  return (
    <p className="text-center text-xs text-gray-400 font-medium">
      Plaćanje pouzećem · Post Express dostava · Bez registracije
    </p>
  )
}

function FormLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F7FA] pb-16">
      <nav className="bg-white border-b border-[#E2EAF0] px-5 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <Link href="/"><PetCodeLogo size="sm" /></Link>
        <div className="flex items-center gap-2">
          <CartIconButton />
          <LangSwitcher />
        </div>
      </nav>
      <div className="max-w-md mx-auto p-4 pt-8">
        <h1 className="text-2xl font-extrabold text-navy mb-8 text-center">Narudžbina</h1>
        {children}
      </div>
    </div>
  )
}

interface FieldProps {
  name: string; setName: (v: string) => void
  phone: string; setPhone: (v: string) => void
  email: string; setEmail: (v: string) => void
  address: string; setAddress: (v: string) => void
  city: string; setCity: (v: string) => void
  note: string; setNote: (v: string) => void
}

function CustomerFields({ name, setName, phone, setPhone, email, setEmail, address, setAddress, city, setCity, note, setNote }: FieldProps) {
  const { t } = useLang()
  return (
    <div className="card space-y-4">
      <div><label className="label">{t('order_name')}</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Marko Petrović" /></div>
      <div><label className="label">{t('order_phone')}</label><input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+381 64 123 456" /></div>
      <div><label className="label">{t('order_email')} <span className="text-red-400">*</span></label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="marko@gmail.com" required /></div>
      <div><label className="label">{t('order_address')}</label><input className="input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Knez Mihailova 1" /></div>
      <div><label className="label">{t('order_city')}</label><input className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="Beograd" /></div>
      <div><label className="label">{t('order_note')}</label><textarea className="input resize-none h-20" value={note} onChange={e => setNote(e.target.value)} placeholder={t('order_note_ph')} /></div>
    </div>
  )
}

/* ── Router ── */
function OrderRouter() {
  const params = useSearchParams()
  const fromCart = params?.get('from') === 'cart'
  return fromCart ? <CartCheckoutForm /> : <DirectOrderForm />
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA]">
        <div className="text-teal font-bold animate-pulse">Učitavanje...</div>
      </div>
    }>
      <OrderRouter />
    </Suspense>
  )
}

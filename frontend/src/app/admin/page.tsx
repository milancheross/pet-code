'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
  const sb = createClient()
  const [auth, setAuth] = useState(false)
  const [pin, setPin] = useState('')
  const [tab, setTab] = useState<'qr'|'orders'|'pets'>('orders')
  const [qr, setQr] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [pets, setPets] = useState<any[]>([])
  const [stats, setStats] = useState({ total:0, active:0, unused:0, orders:0, revenue:0 })
  const [loading, setLoading] = useState(false)
  const [gen, setGen] = useState(50)
  const [filter, setFilter] = useState<'all'|'unused'|'active'>('all')
  const [search, setSearch] = useState('')
  const [savedPin, setSavedPin] = useState('')

  const adminFetch = (body?: object) =>
    fetch('/api/admin', {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': savedPin },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }).then(r => r.json())

  const login = async () => {
    if (pin === (process.env.NEXT_PUBLIC_ADMIN_PIN || 'petcode2025')) {
      setSavedPin(pin)
      setAuth(true)
      await loadWithPin(pin)
    } else {
      alert('Pogrešan PIN')
    }
  }

  const loadWithPin = async (currentPin: string) => {
    setLoading(true)
    const data = await fetch('/api/admin', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': currentPin },
    }).then(r => r.json())

    const codes = data.qr || []
    const ords = data.orders || []
    setQr(codes); setOrders(ords); setPets(data.pets || [])
    setStats({
      total: codes.length,
      active: codes.filter((c:any) => c.status === 'active').length,
      unused: codes.filter((c:any) => c.status === 'unused').length,
      orders: ords.length,
      revenue: ords.reduce((s:number, o:any) => s + (o.total_rsd || 0), 0),
    })
    setLoading(false)
  }

  const load = async () => {
    setLoading(true)
    const data = await adminFetch()
    const codes = data.qr || []
    const ords = data.orders || []
    setQr(codes); setOrders(ords); setPets(data.pets || [])
    setStats({
      total: codes.length,
      active: codes.filter((c:any) => c.status === 'active').length,
      unused: codes.filter((c:any) => c.status === 'unused').length,
      orders: ords.length,
      revenue: ords.reduce((s:number, o:any) => s + (o.total_rsd || 0), 0),
    })
    setLoading(false)
  }

  const generateQr = async () => {
    setLoading(true)
    await adminFetch({ action: 'generate_qr', payload: { count: gen } })
    await load()
  }

  const exportCsv = () => {
    const unused = qr.filter(q => q.status === 'unused')
    const csv = ['code,url', ...unused.map(q => `${q.code},${window.location.origin}/p/${q.code}`)].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'petcode-qr.csv'
    a.click()
  }

  const updateOrderStatus = async (id: string, status: string) => {
    await adminFetch({ action: 'update_order', payload: { id, status } })
    await load()
  }

  const updateQrStatus = async (id: string, status: string) => {
    await adminFetch({ action: 'update_qr', payload: { id, status } })
    await load()
  }

  const STATUS_COLORS: Record<string, string> = {
    nova: 'bg-orange-50 text-orange-600',
    potvrdjena: 'bg-blue-50 text-blue-600',
    poslata: 'bg-purple-50 text-purple-600',
    isporucena: 'bg-green-50 text-green-600',
  }

  const filteredQr = qr.filter(q =>
    (filter === 'all' || q.status === filter) &&
    (!search || q.code.toLowerCase().includes(search.toLowerCase()))
  )
  const filteredOrders = orders.filter(o =>
    !search ||
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_phone?.includes(search)
  )
  const filteredPets = pets.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.owners?.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (!auth) return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-xs text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h1 className="font-black text-navy text-xl mb-5">Admin</h1>
        <input
          className="input mb-4"
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
        />
        <button onClick={login} className="btn-teal w-full">Prijavi se</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f0fffe]">
      <nav className="bg-navy px-4 py-3 flex items-center justify-between">
        <span className="font-black text-white">
          pet<span className="text-teal">code</span>
          <span className="text-white/30 text-sm font-mono ml-2">admin</span>
        </span>
        <button onClick={() => setAuth(false)} className="text-white/40 text-xs font-bold hover:text-white">
          Odjavi se
        </button>
      </nav>

      <div className="max-w-5xl mx-auto p-4 pb-16">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-5">
          {[
            { l: 'QR ukupno',   v: stats.total,                  c: 'text-navy' },
            { l: 'Aktivnih',    v: stats.active,                  c: 'text-teal' },
            { l: 'Neiskorišćenih', v: stats.unused,               c: 'text-orange-500' },
            { l: 'Narudžbina',  v: stats.orders,                  c: 'text-purple-500' },
            { l: 'Prihod (RSD)', v: stats.revenue.toLocaleString(), c: 'text-emerald-600' },
          ].map(s => (
            <div key={s.l} className="card text-center py-3">
              <div className={`text-2xl font-black ${s.c}`}>{s.v}</div>
              <div className="text-[11px] text-gray-400 font-semibold mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['orders', 'qr', 'pets'] as const).map(t2 => (
            <button key={t2} onClick={() => setTab(t2)}
              className={`px-4 py-2 rounded-full text-sm font-black border-2 transition-all ${
                tab === t2 ? 'bg-navy border-navy text-white' : 'border-[#e2f0ef] text-gray-400 bg-white'
              }`}>
              {t2 === 'orders' ? '📦 Narudžbine' : t2 === 'qr' ? '🔲 QR Kodovi' : '🐾 Ljubimci'}
            </button>
          ))}
        </div>

        <input
          className="input mb-4"
          placeholder="Pretraži..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* ORDERS */}
        {tab === 'orders' && (
          <div className="space-y-2">
            {filteredOrders.length === 0 && (
              <div className="card text-center py-8 text-gray-400">Nema narudžbina</div>
            )}
            {filteredOrders.map(o => (
              <div key={o.id} className="card py-3 px-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-black text-navy">{o.customer_name}</div>
                    <div className="text-xs text-gray-400">{o.customer_phone} · {o.address}, {o.city}</div>
                    <div className="text-xs font-bold text-teal mt-1">{o.quantity}x privezak · {o.total_rsd} RSD</div>
                    {o.note && <div className="text-xs text-gray-400 mt-1">📝 {o.note}</div>}
                    <div className="text-[10px] text-gray-300 font-mono mt-1">
                      {new Date(o.created_at).toLocaleString('sr')}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    <span className={`text-[11px] font-black px-2 py-1 rounded-full ${STATUS_COLORS[o.status] || ''}`}>
                      {o.status}
                    </span>
                    <select
                      className="text-xs border border-[#e2f0ef] rounded-xl px-2 py-1 font-semibold text-gray-500 bg-white"
                      value={o.status}
                      onChange={e => updateOrderStatus(o.id, e.target.value)}
                    >
                      {['nova', 'potvrdjena', 'poslata', 'isporucena'].map(s =>
                        <option key={s} value={s}>{s}</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* QR */}
        {tab === 'qr' && (
          <div className="space-y-4">
            <div className="card flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-32">
                <label className="label">Generiši QR kodove</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={500}
                  value={gen}
                  onChange={e => setGen(Number(e.target.value))}
                />
              </div>
              <button onClick={generateQr} disabled={loading} className="btn-navy">
                {loading ? 'Čekaj...' : `+ Generiši ${gen}`}
              </button>
              <button onClick={exportCsv} className="btn-outline">📥 Export CSV</button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['all', 'unused', 'active'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all ${
                    filter === f ? 'bg-teal border-teal text-white' : 'border-[#e2f0ef] text-gray-400 bg-white'
                  }`}>
                  {f === 'all' ? 'Svi' : f === 'unused' ? 'Neiskorišćeni' : 'Aktivni'}
                </button>
              ))}
            </div>

            {loading && (
              <div className="card text-center py-6 text-teal font-black animate-pulse">
                Učitavanje...
              </div>
            )}

            <div className="space-y-2">
              {filteredQr.map(q => (
                <div key={q.id} className="card flex items-center justify-between py-2.5 px-4">
                  <div>
                    <div className="font-black text-navy font-mono text-sm">{q.code}</div>
                    <div className="text-[11px] text-gray-400">
                      {new Date(q.created_at).toLocaleDateString('sr')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                      q.status === 'active' ? 'bg-teal/10 text-teal' :
                      q.status === 'unused' ? 'bg-orange-50 text-orange-500' :
                      'bg-red-50 text-red-500'
                    }`}>{q.status}</span>
                    <a href={`/p/${q.code}`} target="_blank" className="text-xs text-teal font-bold hover:underline">
                      Test
                    </a>
                    {q.status === 'active' && (
                      <button
                        onClick={() => updateQrStatus(q.id, 'disabled')}
                        className="text-xs text-red-400 font-bold hover:text-red-600"
                      >
                        Deaktiviraj
                      </button>
                    )}
                    {q.status === 'disabled' && (
                      <button
                        onClick={() => updateQrStatus(q.id, 'unused')}
                        className="text-xs text-green-500 font-bold hover:text-green-700"
                      >
                        Aktiviraj
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PETS */}
        {tab === 'pets' && (
          <div className="space-y-2">
            {filteredPets.length === 0 && (
              <div className="card text-center py-8 text-gray-400">Nema ljubimaca</div>
            )}
            {filteredPets.map(p => (
              <div key={p.id} className="card flex items-center gap-3 py-2.5 px-4">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                  {p.photo_url
                    ? <img src={p.photo_url} className="w-full h-full object-cover rounded-xl" />
                    : '🐾'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-navy text-sm">{p.name}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {p.owners?.name} · {p.owners?.phone} · {p.qr_codes?.code}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.is_lost && (
                    <span className="text-[11px] font-black bg-red-50 text-red-500 px-2 py-0.5 rounded-full animate-pulse">
                      IZGUBLJEN
                    </span>
                  )}
                  <a href={`/ljubimac/${p.id}`} target="_blank" className="text-xs text-teal font-bold hover:underline">
                    →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

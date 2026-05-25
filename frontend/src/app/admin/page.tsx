'use client'
import { useState, useRef } from 'react'

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [pin, setPin] = useState('')
  const pinRef = useRef('')
  const [tab, setTab] = useState<'qr'|'orders'|'pets'|'shop'>('orders')
  const [qr, setQr] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [pets, setPets] = useState<any[]>([])
  const [stats, setStats] = useState({ total:0, active:0, unused:0, orders:0, revenue:0 })
  const [loading, setLoading] = useState(false)
  const [gen, setGen] = useState(50)
  const [filter, setFilter] = useState<'all'|'unused'|'active'>('all')
  const [search, setSearch] = useState('')

  // Shop state
  const [shopCategories, setShopCategories] = useState<any[]>([])
  const [shopProducts, setShopProducts] = useState<any[]>([])
  const [shopModal, setShopModal] = useState<'none'|'add-category'|'add-product'|'edit-product'>('none')
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', short_description: '', price_rsd: '', compare_at_price_rsd: '',
    category_id: '', is_active: true, is_featured: false, is_new: false, in_stock: true, sku: '',
  })
  const [productVariants, setProductVariants] = useState<Array<{type:string,value:string,price_modifier_rsd:string}>>([])
  const [uploadedImages, setUploadedImages] = useState<{ url: string; preview: string }[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit product state
  const [editProduct, setEditProduct] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [editImages, setEditImages] = useState<any[]>([])
  const [editDeletedImageIds, setEditDeletedImageIds] = useState<string[]>([])
  const [editNewImages, setEditNewImages] = useState<{ url: string; preview: string }[]>([])
  const [editVariants, setEditVariants] = useState<any[]>([])
  const [editDeletedVariantIds, setEditDeletedVariantIds] = useState<string[]>([])
  const [editNewVariants, setEditNewVariants] = useState<Array<{type:string,value:string,price_modifier_rsd:string}>>([])
  const [editImageUploading, setEditImageUploading] = useState(false)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  // Pet modals
  const [petPreview, setPetPreview] = useState<any>(null)
  const [petEdit, setPetEdit] = useState<any>(null)
  const [petEditForm, setPetEditForm] = useState<any>({})

  // Order modal
  const [orderPreview, setOrderPreview] = useState<any>(null)

  const adminFetch = (body?: object) =>
    fetch('/api/admin', {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pinRef.current,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }).then(r => r.json())

  const adminDelete = (body: object) =>
    fetch('/api/admin', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pinRef.current,
      },
      body: JSON.stringify(body),
    }).then(r => r.json())

  const adminFetchProducts = (body?: object) =>
    fetch('/api/admin/products', {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pinRef.current },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }).then(r => r.json())

  const adminDeleteProduct = (body: object) =>
    fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pinRef.current },
      body: JSON.stringify(body),
    }).then(r => r.json())

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setImageUploading(true)
    const newImages: { url: string; preview: string }[] = []
    for (const file of Array.from(files)) {
      const preview = URL.createObjectURL(file)
      try {
        // Convert file to base64 and upload via server-side API (service role — bypasses storage RLS)
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const result = reader.result as string
            resolve(result.split(',')[1]) // strip "data:image/...;base64," prefix
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const ext = file.name.split('.').pop() || 'jpg'
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const res = await adminFetchProducts({
          action: 'upload_image',
          payload: { product_id: 'temp', filename, base64, mime_type: file.type },
        })
        if (res.error) { console.error('Upload greška:', res.error); continue }
        newImages.push({ url: res.url, preview })
      } catch (err) {
        console.error('Upload greška:', err)
      }
    }
    setUploadedImages(prev => [...prev, ...newImages])
    setImageUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setEditImageUploading(true)
    const newImgs: { url: string; preview: string }[] = []
    for (const file of Array.from(files)) {
      const preview = URL.createObjectURL(file)
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve((reader.result as string).split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const ext = file.name.split('.').pop() || 'jpg'
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const res = await adminFetchProducts({
          action: 'upload_image',
          payload: { product_id: editProduct?.id || 'temp', filename, base64, mime_type: file.type },
        })
        if (res.error) { console.error('Upload greška:', res.error); continue }
        newImgs.push({ url: res.url, preview })
      } catch (err) { console.error('Upload greška:', err) }
    }
    setEditNewImages(prev => [...prev, ...newImgs])
    setEditImageUploading(false)
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  const openEdit = (prod: any) => {
    setEditProduct(prod)
    setEditForm({
      name: prod.name || '',
      description: prod.description || '',
      short_description: prod.short_description || '',
      price_rsd: String(prod.price_rsd || ''),
      compare_at_price_rsd: prod.compare_at_price_rsd ? String(prod.compare_at_price_rsd) : '',
      category_id: prod.category_id || '',
      is_active: prod.is_active !== false,
      is_featured: !!prod.is_featured,
      is_new: !!prod.is_new,
      in_stock: prod.in_stock !== false,
      sku: prod.sku || '',
    })
    const sorted = [...(prod.product_images || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
    setEditImages(sorted)
    setEditDeletedImageIds([])
    setEditNewImages([])
    setEditVariants([...(prod.product_variants || [])])
    setEditDeletedVariantIds([])
    setEditNewVariants([])
    setShopModal('edit-product')
  }

  const saveEdit = async () => {
    if (!editProduct || !editForm.name || !editForm.price_rsd) { alert('Unesite naziv i cenu'); return }
    const payload: any = {
      id: editProduct.id,
      name: editForm.name,
      description: editForm.description || null,
      short_description: editForm.short_description || null,
      price_rsd: parseFloat(editForm.price_rsd),
      compare_at_price_rsd: editForm.compare_at_price_rsd ? parseFloat(editForm.compare_at_price_rsd) : null,
      category_id: editForm.category_id || null,
      is_active: editForm.is_active,
      is_featured: editForm.is_featured,
      is_new: editForm.is_new,
      in_stock: editForm.in_stock,
      sku: editForm.sku || null,
    }
    const res = await adminFetchProducts({ action: 'update_product', payload })
    if (res.error) { alert('Greška: ' + res.error); return }
    // Delete removed images
    for (const id of editDeletedImageIds) await adminDeleteProduct({ action: 'delete_image', id })
    // Upload & save new images
    const keepCount = editImages.filter(img => !editDeletedImageIds.includes(img.id)).length
    for (let i = 0; i < editNewImages.length; i++) {
      await adminFetchProducts({ action: 'add_image', payload: { product_id: editProduct.id, url: editNewImages[i].url, sort_order: keepCount + i } })
    }
    // Delete removed variants
    for (const id of editDeletedVariantIds) await adminDeleteProduct({ action: 'delete_variant', id })
    // Add new variants
    for (const v of editNewVariants) {
      if (v.value) await adminFetchProducts({ action: 'add_variant', payload: { product_id: editProduct.id, name: v.value, type: v.type, value: v.value, price_modifier_rsd: parseFloat(v.price_modifier_rsd) || 0 } })
    }
    setEditProduct(null)
    setShopModal('none')
    await load()
  }

  const login = async () => {
    pinRef.current = pin
    setLoading(true)
    const data = await adminFetch()
    setLoading(false)
    if (data.error) {
      pinRef.current = ''
      alert('Pogrešan PIN')
      return
    }
    const codes = data.qr || []
    const ords = data.orders || []
    setQr(codes)
    setOrders(ords)
    setPets(data.pets || [])
    setStats({
      total: codes.length,
      active: codes.filter((c: any) => c.status === 'active').length,
      unused: codes.filter((c: any) => c.status === 'unused').length,
      orders: ords.length,
      revenue: ords.reduce((s: number, o: any) => s + (o.total_rsd || 0), 0),
    })
    setAuth(true)
  }

  const load = async () => {
    setLoading(true)
    const [data, shopData] = await Promise.all([
      adminFetch(),
      adminFetchProducts(),
    ])
    const codes = data.qr || []
    const ords = data.orders || []
    setQr(codes)
    setOrders(ords)
    setPets(data.pets || [])
    setStats({
      total: codes.length,
      active: codes.filter((c:any) => c.status === 'active').length,
      unused: codes.filter((c:any) => c.status === 'unused').length,
      orders: ords.length,
      revenue: ords.reduce((s:number, o:any) => s + (o.total_rsd || 0), 0),
    })
    setShopCategories(shopData.categories || [])
    setShopProducts(shopData.products || [])
    setLoading(false)
  }

  const generateQr = async () => {
    setLoading(true)
    const result = await adminFetch({ action: 'generate_qr', payload: { count: gen } })
    if (result.error) {
      alert('Greška: ' + result.error)
      setLoading(false)
      return
    }
    await load()
  }

  const exportCsv = () => {
    const unused = qr.filter(q => q.status === 'unused')
    const csv = ['code,url', ...unused.map(q =>
      `${q.code},${window.location.origin}/p/${q.code}`
    )].join('\n')
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

  const deleteQr = async (id: string) => {
    if (!confirm('Da li ste sigurni? Ova akcija je nepovratna.')) return
    const result = await adminDelete({ action: 'delete_qr', id })
    if (result.error) { alert('Greška: ' + result.error); return }
    await load()
  }

  const deletePet = async (id: string) => {
    if (!confirm('Da li ste sigurni? Ova akcija je nepovratna.')) return
    const result = await adminDelete({ action: 'delete_pet', id })
    if (result.error) { alert('Greška: ' + result.error); return }
    await load()
  }

  const deleteOrder = async (id: string) => {
    if (!confirm('Da li ste sigurni? Ova akcija je nepovratna.')) return
    const result = await adminDelete({ action: 'delete_order', id })
    if (result.error) { alert('Greška: ' + result.error); return }
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
        <button
          onClick={() => { setAuth(false); pinRef.current = '' }}
          className="text-white/40 text-xs font-bold hover:text-white"
        >
          Odjavi se
        </button>
      </nav>

      <div className="max-w-5xl mx-auto p-4 pb-16">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-5">
          {[
            { l: 'QR ukupno',    v: stats.total,                   c: 'text-navy' },
            { l: 'Aktivnih',     v: stats.active,                   c: 'text-teal' },
            { l: 'Neiskorišćenih', v: stats.unused,                 c: 'text-orange-500' },
            { l: 'Narudžbina',   v: stats.orders,                   c: 'text-purple-500' },
            { l: 'Prihod (RSD)', v: stats.revenue.toLocaleString(), c: 'text-emerald-600' },
          ].map(s => (
            <div key={s.l} className="card text-center py-3">
              <div className={`text-2xl font-black ${s.c}`}>{s.v}</div>
              <div className="text-[11px] text-gray-400 font-semibold mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['orders', 'qr', 'pets', 'shop'] as const).map(t2 => (
            <button key={t2} onClick={() => setTab(t2)}
              className={`px-4 py-2 rounded-full text-sm font-black border-2 transition-all ${
                tab === t2
                  ? 'bg-navy border-navy text-white'
                  : 'border-[#e2f0ef] text-gray-400 bg-white'
              }`}>
              {t2 === 'orders' ? '📦 Narudžbine' : t2 === 'qr' ? '🔲 QR Kodovi' : t2 === 'pets' ? '🐾 Ljubimci' : '🛍️ Prodavnica'}
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
                    <div className="text-xs text-gray-400">
                      {o.customer_phone} · {o.address}, {o.city}
                    </div>
                    <div className="text-xs font-bold text-teal mt-1">
                      {o.quantity}x privezak · {o.total_rsd} RSD
                    </div>
                    {o.note && (
                      <div className="text-xs text-gray-400 mt-1">📝 {o.note}</div>
                    )}
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
                    <button onClick={() => setOrderPreview(o)} className="text-xs text-blue-500 font-bold hover:underline">👁️</button>
                    <button
                      onClick={() => deleteOrder(o.id)}
                      className="text-xs text-red-400 font-bold hover:text-red-600"
                    >
                      🗑️
                    </button>
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
              <button
                onClick={generateQr}
                disabled={loading}
                className="btn-navy disabled:opacity-50"
              >
                {loading ? 'Čekaj...' : `+ Generiši ${gen}`}
              </button>
              <button onClick={exportCsv} className="btn-outline">
                📥 Export CSV
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['all', 'unused', 'active'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all ${
                    filter === f
                      ? 'bg-teal border-teal text-white'
                      : 'border-[#e2f0ef] text-gray-400 bg-white'
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

            {!loading && filteredQr.length === 0 && (
              <div className="card text-center py-8 text-gray-400">
                Nema QR kodova — klikni Generiši
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
                      q.status === 'active'   ? 'bg-teal/10 text-teal' :
                      q.status === 'unused'   ? 'bg-orange-50 text-orange-500' :
                                                'bg-red-50 text-red-500'
                    }`}>
                      {q.status}
                    </span>
                    <a
                      href={`/p/${q.code}`}
                      target="_blank"
                      className="text-xs text-teal font-bold hover:underline"
                    >
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
                    {q.status === 'unused' && (
                      <button
                        onClick={() => deleteQr(q.id)}
                        className="text-xs text-red-400 font-bold hover:text-red-600"
                      >
                        🗑️
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
                    ? <img src={p.photo_url} className="w-full h-full object-cover rounded-xl" alt={p.name} />
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
                  <button onClick={() => setPetPreview(p)} className="text-xs text-blue-500 font-bold hover:underline">👁️</button>
                  <button onClick={() => {
                    setPetEdit(p)
                    setPetEditForm({ color: p.color || '', age: p.age || '', allergies: p.allergies || '', medication: p.medication || '', vet_info: p.vet_info || '', note: p.note || '', is_lost: p.is_lost || false })
                  }} className="text-xs text-orange font-bold hover:underline">✏️</button>
                  <a
                    href={`/ljubimac/${p.id}`}
                    target="_blank"
                    className="text-xs text-teal font-bold hover:underline"
                  >
                    →
                  </a>
                  <button
                    onClick={() => deletePet(p.id)}
                    className="text-xs text-red-400 font-bold hover:text-red-600"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SHOP */}
        {tab === 'shop' && (
          <div className="space-y-6">
            {/* Categories */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-navy">Kategorije</h3>
                <button onClick={() => setShopModal('add-category')} className="btn-teal text-sm px-4 py-2">+ Dodaj</button>
              </div>
              {shopCategories.length === 0
                ? <p className="text-gray-400 text-sm">Nema kategorija. Pokrenite SQL migraciju u Supabase.</p>
                : <div className="space-y-2">
                    {shopCategories.map((cat: any) => (
                      <div key={cat.id} className="flex items-center justify-between bg-[#F4F7FA] rounded-2xl px-4 py-2.5">
                        <div>
                          <span className="font-bold text-navy text-sm">{cat.name}</span>
                          <span className="ml-2 text-xs text-gray-400 font-mono">{cat.slug}</span>
                        </div>
                        <button onClick={async () => { if (!confirm('Obriši kategoriju?')) return; await adminDeleteProduct({ action: 'delete_category', id: cat.id }); await load() }}
                          className="text-xs text-red-400 font-bold hover:text-red-600">🗑️</button>
                      </div>
                    ))}
                  </div>
              }
            </div>

            {/* Products */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-navy">Proizvodi</h3>
                <button onClick={() => { setShopModal('add-product'); setProductVariants([]); setUploadedImages([]) }} className="btn-primary text-sm px-4 py-2">+ Novi proizvod</button>
              </div>
              {shopProducts.length === 0
                ? <p className="text-gray-400 text-sm">Nema proizvoda.</p>
                : <div className="space-y-2">
                    {shopProducts.map((prod: any) => {
                      const mainImg = (prod.product_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0]
                      const discPct = prod.compare_at_price_rsd && prod.compare_at_price_rsd > prod.price_rsd
                        ? Math.round(((prod.compare_at_price_rsd - prod.price_rsd) / prod.compare_at_price_rsd) * 100) : 0
                      return (
                        <div key={prod.id} className="flex items-start justify-between bg-[#F4F7FA] rounded-2xl px-4 py-3 gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-white border border-[#E2EAF0] overflow-hidden flex items-center justify-center flex-shrink-0">
                              {mainImg
                                ? <img src={mainImg.url} alt={prod.name} className="w-full h-full object-contain p-0.5" />
                                : <span className="text-2xl">🐾</span>}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-navy text-sm truncate">{prod.name}</div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {Number(prod.price_rsd).toLocaleString()} RSD
                                {discPct > 0 && <span className="ml-1 text-red-500 font-bold">(-{discPct}%)</span>}
                                {' · '}{prod.categories?.name || 'bez kategorije'}
                                {' · '}{(prod.product_images || []).length} slika
                              </div>
                              <div className="flex gap-1.5 mt-1 flex-wrap">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${prod.is_active ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-400'}`}>
                                  {prod.is_active ? '● Aktivan' : '● Neaktivan'}
                                </span>
                                {prod.in_stock === false && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Rasprodato</span>}
                                {prod.is_featured && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange/10 text-orange">⭐ Top</span>}
                                {prod.is_new && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal/10 text-teal">Novo</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => openEdit(prod)} className="text-xs text-orange font-bold hover:underline">✏️ Uredi</button>
                            <button onClick={async () => {
                              await adminFetchProducts({ action: 'update_product', payload: { id: prod.id, is_active: !prod.is_active } })
                              await load()
                            }} className="text-xs text-teal font-bold hover:underline">{prod.is_active ? 'Deaktiviraj' : 'Aktiviraj'}</button>
                            <button onClick={async () => {
                              if (!confirm(`Obriši "${prod.name}"?`)) return
                              const r = await adminDeleteProduct({ action: 'delete_product', id: prod.id })
                              if (r.error) { alert('Greška: ' + r.error); return }
                              await load()
                            }} className="text-xs text-red-400 font-bold hover:text-red-600">🗑️</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
              }
            </div>

            {/* Add category modal */}
            {shopModal === 'add-category' && (
              <div className="fixed inset-0 bg-navy/50 z-50 flex items-center justify-center p-4" onClick={() => setShopModal('none')}>
                <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                  <h3 className="font-black text-navy mb-4">Nova kategorija</h3>
                  <div className="space-y-3">
                    <div><label className="label">Naziv</label><input className="input" value={newCategory.name} onChange={e => setNewCategory(p => ({...p, name: e.target.value}))} placeholder="npr. Privesci" /></div>
                    <div><label className="label">Opis</label><input className="input" value={newCategory.description} onChange={e => setNewCategory(p => ({...p, description: e.target.value}))} /></div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button onClick={async () => { await adminFetchProducts({ action: 'create_category', payload: newCategory }); setNewCategory({ name: '', description: '' }); setShopModal('none'); await load() }} className="btn-primary flex-1">Sačuvaj</button>
                    <button onClick={() => setShopModal('none')} className="btn-outline flex-1">Otkaži</button>
                  </div>
                </div>
              </div>
            )}

            {/* Add product modal */}
            {shopModal === 'add-product' && (() => {
              const discPct = newProduct.compare_at_price_rsd && newProduct.price_rsd
                && parseFloat(newProduct.compare_at_price_rsd) > parseFloat(newProduct.price_rsd)
                ? Math.round(((parseFloat(newProduct.compare_at_price_rsd) - parseFloat(newProduct.price_rsd)) / parseFloat(newProduct.compare_at_price_rsd)) * 100)
                : 0
              return (
              <div className="fixed inset-0 bg-navy/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShopModal('none')}>
                <div className="bg-white rounded-3xl p-6 w-full max-w-lg my-4" onClick={e => e.stopPropagation()}>
                  <h3 className="font-black text-navy mb-4 text-lg">Novi proizvod</h3>
                  <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">

                    {/* Naziv */}
                    <div><label className="label">Naziv *</label><input className="input" value={newProduct.name} onChange={e => setNewProduct(p => ({...p, name: e.target.value}))} placeholder="npr. QR Privezak Premium" /></div>

                    {/* Kratki opis (za karticu) */}
                    <div><label className="label">Kratki opis <span className="text-gray-400 font-normal">(za karticu u prodavnici)</span></label><input className="input" value={newProduct.short_description} onChange={e => setNewProduct(p => ({...p, short_description: e.target.value}))} placeholder="Jedna rečenica..." /></div>

                    {/* Pun opis */}
                    <div><label className="label">Pun opis</label><textarea className="input resize-none h-20" value={newProduct.description} onChange={e => setNewProduct(p => ({...p, description: e.target.value}))} /></div>

                    {/* Cena + Stara cena */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Cena (RSD) *</label>
                        <input className="input" type="number" value={newProduct.price_rsd} onChange={e => setNewProduct(p => ({...p, price_rsd: e.target.value}))} placeholder="1500" />
                      </div>
                      <div>
                        <label className="label">
                          Stara cena (RSD)
                          {discPct > 0 && <span className="ml-1 text-red-500 font-black">-{discPct}%</span>}
                        </label>
                        <input className="input" type="number" value={newProduct.compare_at_price_rsd} onChange={e => setNewProduct(p => ({...p, compare_at_price_rsd: e.target.value}))} placeholder="Opcionalno" />
                      </div>
                    </div>

                    {/* SKU + Kategorija */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">SKU / Šifra</label>
                        <input className="input" value={newProduct.sku} onChange={e => setNewProduct(p => ({...p, sku: e.target.value}))} placeholder="PC-001" />
                      </div>
                      <div>
                        <label className="label">Kategorija</label>
                        <select className="input" value={newProduct.category_id} onChange={e => setNewProduct(p => ({...p, category_id: e.target.value}))}>
                          <option value="">— bez —</option>
                          {shopCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Status checkboxes */}
                    <div className="bg-[#F4F7FA] rounded-2xl p-3 grid grid-cols-2 gap-2">
                      {[
                        { key: 'is_active',   label: '✅ Aktivan (vidljiv)' },
                        { key: 'in_stock',    label: '📦 Na stanju' },
                        { key: 'is_featured', label: '⭐ Istaknuti proizvod' },
                        { key: 'is_new',      label: '🆕 Označi kao NOVO' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 text-sm font-semibold text-gray-600 cursor-pointer">
                          <input type="checkbox" checked={(newProduct as any)[key]} onChange={e => setNewProduct(p => ({...p, [key]: e.target.checked}))} className="w-4 h-4 accent-teal" />
                          {label}
                        </label>
                      ))}
                    </div>

                    {/* Varijacije */}
                    <div>
                      <label className="label">Varijacije <span className="text-gray-400 font-normal">(boja, veličina, materijal)</span></label>
                      {productVariants.map((v, i) => (
                        <div key={i} className="flex gap-2 mb-2 items-center">
                          <select className="input text-sm flex-1" value={v.type} onChange={e => setProductVariants(prev => prev.map((x, j) => j === i ? {...x, type: e.target.value} : x))}>
                            <option value="color">Boja</option>
                            <option value="size">Veličina</option>
                            <option value="material">Materijal</option>
                          </select>
                          <input className="input text-sm flex-1" placeholder="vrednost" value={v.value} onChange={e => setProductVariants(prev => prev.map((x, j) => j === i ? {...x, value: e.target.value} : x))} />
                          <input className="input text-sm w-24" placeholder="+/- RSD" value={v.price_modifier_rsd} onChange={e => setProductVariants(prev => prev.map((x, j) => j === i ? {...x, price_modifier_rsd: e.target.value} : x))} />
                          <button onClick={() => setProductVariants(prev => prev.filter((_, j) => j !== i))} className="text-red-400 font-bold text-sm hover:text-red-600">✕</button>
                        </div>
                      ))}
                      <button onClick={() => setProductVariants(prev => [...prev, { type: 'color', value: '', price_modifier_rsd: '0' }])} className="text-sm text-teal font-bold hover:underline">+ Dodaj varijaciju</button>
                    </div>

                    {/* Slike */}
                    <div>
                      <label className="label">Slike proizvoda</label>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                      {uploadedImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {uploadedImages.map((img, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[#E2EAF0] group flex-shrink-0 bg-[#F4F7FA]">
                              <img src={img.preview} alt="" className="w-full h-full object-contain p-1" />
                              <button
                                type="button"
                                onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                              >✕</button>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/30 text-white text-[8px] text-center py-0.5 font-medium">{i + 1}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={imageUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-[#E2EAF0] text-sm font-semibold text-gray-400 hover:border-teal hover:text-teal transition-colors disabled:opacity-50 w-full justify-center"
                      >
                        {imageUploading ? (
                          <><svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Uploadujem...</>
                        ) : <>📷 Dodaj slike</>}
                      </button>
                      <p className="text-[11px] text-gray-400 mt-1.5 text-center">JPG, PNG, WebP · Više slika odjednom</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-5">
                    <button onClick={async () => {
                      if (!newProduct.name || !newProduct.price_rsd) { alert('Unesite naziv i cenu'); return }
                      const payload: any = {
                        name: newProduct.name,
                        description: newProduct.description || null,
                        short_description: newProduct.short_description || null,
                        price_rsd: parseFloat(newProduct.price_rsd),
                        compare_at_price_rsd: newProduct.compare_at_price_rsd ? parseFloat(newProduct.compare_at_price_rsd) : null,
                        category_id: newProduct.category_id || null,
                        is_active: newProduct.is_active,
                        is_featured: newProduct.is_featured,
                        is_new: newProduct.is_new,
                        in_stock: newProduct.in_stock,
                        sku: newProduct.sku || null,
                      }
                      const res = await adminFetchProducts({ action: 'create_product', payload })
                      if (res.error) { alert('Greška: ' + res.error); return }
                      const pid = res.product?.id
                      if (pid) {
                        for (const v of productVariants) {
                          if (v.value) await adminFetchProducts({ action: 'add_variant', payload: { product_id: pid, name: v.value, type: v.type, value: v.value, price_modifier_rsd: parseFloat(v.price_modifier_rsd) || 0 } })
                        }
                        for (let i = 0; i < uploadedImages.length; i++) {
                          await adminFetchProducts({ action: 'add_image', payload: { product_id: pid, url: uploadedImages[i].url, sort_order: i } })
                        }
                      }
                      setNewProduct({ name: '', description: '', short_description: '', price_rsd: '', compare_at_price_rsd: '', category_id: '', is_active: true, is_featured: false, is_new: false, in_stock: true, sku: '' })
                      setProductVariants([])
                      setUploadedImages([])
                      setShopModal('none')
                      await load()
                    }} className="btn-primary flex-1">💾 Sačuvaj proizvod</button>
                    <button onClick={() => setShopModal('none')} className="btn-outline flex-1">Otkaži</button>
                  </div>
                </div>
              </div>
              )
            })()}

            {/* ── Edit product modal ── */}
            {shopModal === 'edit-product' && editProduct && (() => {
              const discPct = editForm.compare_at_price_rsd && editForm.price_rsd
                && parseFloat(editForm.compare_at_price_rsd) > parseFloat(editForm.price_rsd)
                ? Math.round(((parseFloat(editForm.compare_at_price_rsd) - parseFloat(editForm.price_rsd)) / parseFloat(editForm.compare_at_price_rsd)) * 100)
                : 0
              const visibleImages = editImages.filter((img: any) => !editDeletedImageIds.includes(img.id))
              return (
                <div className="fixed inset-0 bg-navy/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShopModal('none')}>
                  <div className="bg-white rounded-3xl p-6 w-full max-w-lg my-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-navy text-lg">✏️ Uredi proizvod</h3>
                      <button onClick={() => setShopModal('none')} className="text-gray-400 hover:text-navy font-bold text-xl">✕</button>
                    </div>
                    <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">

                      {/* Naziv */}
                      <div><label className="label">Naziv *</label><input className="input" value={editForm.name} onChange={e => setEditForm((p: any) => ({...p, name: e.target.value}))} /></div>

                      {/* Opisi */}
                      <div><label className="label">Kratki opis</label><input className="input" value={editForm.short_description} onChange={e => setEditForm((p: any) => ({...p, short_description: e.target.value}))} placeholder="Za karticu u prodavnici" /></div>
                      <div><label className="label">Pun opis</label><textarea className="input resize-none h-20" value={editForm.description} onChange={e => setEditForm((p: any) => ({...p, description: e.target.value}))} /></div>

                      {/* Cene */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Cena (RSD) *</label>
                          <input className="input" type="number" value={editForm.price_rsd} onChange={e => setEditForm((p: any) => ({...p, price_rsd: e.target.value}))} />
                        </div>
                        <div>
                          <label className="label">
                            Stara cena (RSD)
                            {discPct > 0 && <span className="ml-1 text-red-500 font-black">-{discPct}%</span>}
                          </label>
                          <input className="input" type="number" value={editForm.compare_at_price_rsd} onChange={e => setEditForm((p: any) => ({...p, compare_at_price_rsd: e.target.value}))} placeholder="Opcionalno" />
                        </div>
                      </div>

                      {/* SKU + Kategorija */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">SKU / Šifra</label>
                          <input className="input" value={editForm.sku} onChange={e => setEditForm((p: any) => ({...p, sku: e.target.value}))} placeholder="PC-001" />
                        </div>
                        <div>
                          <label className="label">Kategorija</label>
                          <select className="input" value={editForm.category_id} onChange={e => setEditForm((p: any) => ({...p, category_id: e.target.value}))}>
                            <option value="">— bez —</option>
                            {shopCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Status checkboxes */}
                      <div className="bg-[#F4F7FA] rounded-2xl p-3 grid grid-cols-2 gap-2">
                        {[
                          { key: 'is_active',   label: '✅ Aktivan (vidljiv)' },
                          { key: 'in_stock',    label: '📦 Na stanju' },
                          { key: 'is_featured', label: '⭐ Istaknuti proizvod' },
                          { key: 'is_new',      label: '🆕 Označi kao NOVO' },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-2 text-sm font-semibold text-gray-600 cursor-pointer">
                            <input type="checkbox" checked={editForm[key]} onChange={e => setEditForm((p: any) => ({...p, [key]: e.target.checked}))} className="w-4 h-4 accent-teal" />
                            {label}
                          </label>
                        ))}
                      </div>

                      {/* Varijacije — existing */}
                      <div>
                        <label className="label">Varijacije</label>
                        {editVariants.filter((v: any) => !editDeletedVariantIds.includes(v.id)).map((v: any) => (
                          <div key={v.id} className="flex items-center gap-2 mb-2 bg-[#F4F7FA] rounded-xl px-3 py-2">
                            <span className="text-xs font-bold text-gray-400 uppercase w-16">{v.type}</span>
                            <span className="font-semibold text-navy text-sm flex-1">{v.value}</span>
                            {Number(v.price_modifier_rsd) !== 0 && (
                              <span className="text-xs text-gray-400">{v.price_modifier_rsd > 0 ? '+' : ''}{v.price_modifier_rsd} RSD</span>
                            )}
                            <button onClick={() => setEditDeletedVariantIds(p => [...p, v.id])} className="text-red-400 font-bold text-sm hover:text-red-600 ml-1">✕</button>
                          </div>
                        ))}
                        {/* New variants to add */}
                        {editNewVariants.map((v, i) => (
                          <div key={i} className="flex gap-2 mb-2 items-center">
                            <select className="input text-sm flex-1" value={v.type} onChange={e => setEditNewVariants(p => p.map((x, j) => j === i ? {...x, type: e.target.value} : x))}>
                              <option value="color">Boja</option>
                              <option value="size">Veličina</option>
                              <option value="material">Materijal</option>
                            </select>
                            <input className="input text-sm flex-1" placeholder="vrednost" value={v.value} onChange={e => setEditNewVariants(p => p.map((x, j) => j === i ? {...x, value: e.target.value} : x))} />
                            <input className="input text-sm w-24" placeholder="+/- RSD" value={v.price_modifier_rsd} onChange={e => setEditNewVariants(p => p.map((x, j) => j === i ? {...x, price_modifier_rsd: e.target.value} : x))} />
                            <button onClick={() => setEditNewVariants(p => p.filter((_, j) => j !== i))} className="text-red-400 font-bold text-sm hover:text-red-600">✕</button>
                          </div>
                        ))}
                        <button onClick={() => setEditNewVariants(p => [...p, { type: 'color', value: '', price_modifier_rsd: '0' }])} className="text-sm text-teal font-bold hover:underline">+ Dodaj varijaciju</button>
                      </div>

                      {/* Slike */}
                      <div>
                        <label className="label">Slike proizvoda</label>
                        <input ref={editFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleEditImageUpload} />

                        {/* Existing images */}
                        {visibleImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {visibleImages.map((img: any) => (
                              <div key={img.id} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[#E2EAF0] group flex-shrink-0 bg-[#F4F7FA]">
                                <img src={img.url} alt="" className="w-full h-full object-contain p-1" />
                                <button
                                  type="button"
                                  onClick={() => setEditDeletedImageIds(p => [...p, img.id])}
                                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                                >✕</button>
                                <div className="absolute bottom-0 left-0 right-0 bg-teal/70 text-white text-[8px] text-center py-0.5 font-medium">postoji</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* New uploads */}
                        {editNewImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {editNewImages.map((img, i) => (
                              <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-teal group flex-shrink-0 bg-[#F4F7FA]">
                                <img src={img.preview} alt="" className="w-full h-full object-contain p-1" />
                                <button
                                  type="button"
                                  onClick={() => setEditNewImages(p => p.filter((_, j) => j !== i))}
                                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                                >✕</button>
                                <div className="absolute bottom-0 left-0 right-0 bg-orange/70 text-white text-[8px] text-center py-0.5 font-medium">nova</div>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={editImageUploading}
                          onClick={() => editFileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-[#E2EAF0] text-sm font-semibold text-gray-400 hover:border-teal hover:text-teal transition-colors disabled:opacity-50 w-full justify-center"
                        >
                          {editImageUploading
                            ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Uploadujem...</>
                            : <>📷 Dodaj slike</>}
                        </button>
                        {editDeletedImageIds.length > 0 && (
                          <p className="text-[11px] text-red-400 font-semibold mt-1.5 text-center">
                            {editDeletedImageIds.length} slika označeno za brisanje
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-5">
                      <button onClick={saveEdit} className="btn-primary flex-1">💾 Sačuvaj izmene</button>
                      <button onClick={() => setShopModal('none')} className="btn-outline flex-1">Otkaži</button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

      </div>

      {/* Pet preview modal */}
      {petPreview && (
        <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setPetPreview(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-navy">Profil: {petPreview.name}</h3>
              <button onClick={() => setPetPreview(null)} className="text-gray-400 hover:text-navy font-bold text-xl">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Ime', petPreview.name],
                ['Vrsta', petPreview.species],
                ['Rasa', petPreview.breed],
                ['Starost', petPreview.age],
                ['Boja', petPreview.color],
                ['Vlasnik', petPreview.owners?.name],
                ['Telefon', petPreview.owners?.phone],
                ['Alergije', petPreview.allergies],
                ['Lek', petPreview.medication],
                ['Vet', petPreview.vet_info],
                ['Napomena', petPreview.note],
                ['Izgubljen', petPreview.is_lost ? '⚠️ DA' : 'Ne'],
                ['QR kod', petPreview.qr_codes?.code],
              ].filter(([, v]) => v).map(([l, v]) => (
                <div key={l as string} className="flex justify-between py-1.5 border-b border-[#E2EAF0]">
                  <span className="text-gray-400 font-semibold">{l}</span>
                  <span className="font-bold text-navy text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            <a href={`/ljubimac/${petPreview.id}`} target="_blank" className="btn-outline block text-center mt-4 text-sm">Otvori javni profil →</a>
          </div>
        </div>
      )}

      {/* Pet edit modal */}
      {petEdit && (
        <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setPetEdit(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-navy">Uredi: {petEdit.name}</h3>
              <button onClick={() => setPetEdit(null)} className="text-gray-400 hover:text-navy font-bold text-xl">✕</button>
            </div>
            <div className="space-y-3">
              {([
                ['color', 'Boja', 'text'],
                ['age', 'Starost', 'text'],
                ['allergies', 'Alergije', 'text'],
                ['medication', 'Lekovi', 'text'],
                ['vet_info', 'Veterinar', 'text'],
                ['note', 'Napomena', 'textarea'],
              ] as [string, string, string][]).map(([field, label, type]) => (
                <div key={field}>
                  <label className="label">{label}</label>
                  {type === 'textarea'
                    ? <textarea className="input resize-none h-16" value={petEditForm[field] || ''} onChange={e => setPetEditForm((p: any) => ({...p, [field]: e.target.value}))} />
                    : <input className="input" value={petEditForm[field] || ''} onChange={e => setPetEditForm((p: any) => ({...p, [field]: e.target.value}))} />
                  }
                </div>
              ))}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_lost_edit" checked={petEditForm.is_lost || false} onChange={e => setPetEditForm((p: any) => ({...p, is_lost: e.target.checked}))} className="w-4 h-4" />
                <label htmlFor="is_lost_edit" className="label mb-0 text-red-500">Izgubljen</label>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={async () => {
                const result = await fetch('/api/admin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-admin-pin': pinRef.current },
                  body: JSON.stringify({ action: 'update_pet', payload: { id: petEdit.id, ...petEditForm } }),
                }).then(r => r.json())
                if (result.error) { alert('Greška: ' + result.error); return }
                setPetEdit(null)
                await load()
              }} className="btn-primary flex-1">Sačuvaj</button>
              <button onClick={() => setPetEdit(null)} className="btn-outline flex-1">Otkaži</button>
            </div>
          </div>
        </div>
      )}

      {/* Order preview modal */}
      {orderPreview && (
        <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4" onClick={() => setOrderPreview(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-navy">Narudžbina #{orderPreview.id?.slice(-8)}</h3>
              <button onClick={() => setOrderPreview(null)} className="text-gray-400 hover:text-navy font-bold text-xl">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Kupac', orderPreview.customer_name],
                ['Telefon', orderPreview.customer_phone],
                ['Email', orderPreview.customer_email || '—'],
                ['Adresa', `${orderPreview.address}, ${orderPreview.city}`],
                ['Količina', `${orderPreview.quantity}x`],
                ['Ukupno', `${orderPreview.total_rsd} RSD`],
                ['Status', orderPreview.status],
                ['Napomena', orderPreview.note || '—'],
                ['Datum', new Date(orderPreview.created_at).toLocaleString('sr')],
              ].map(([l, v]) => (
                <div key={l as string} className="flex justify-between py-1.5 border-b border-[#E2EAF0]">
                  <span className="text-gray-400 font-semibold">{l}</span>
                  <span className="font-bold text-navy text-right">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setOrderPreview(null)} className="btn-outline block text-center mt-4 w-full text-sm">Zatvori</button>
          </div>
        </div>
      )}
    </div>
  )
}

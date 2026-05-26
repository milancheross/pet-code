'use client'
import { useState, useRef } from 'react'

// ── Helpers ──────────────────────────────────────────────────────────────
function getEffectivePrice(prod: any) {
  const now = new Date()
  const regular = prod.regular_price_rsd ?? prod.price_rsd ?? 0
  const hasSale =
    prod.sale_price_rsd &&
    prod.sale_price_rsd < regular &&
    (!prod.sale_start || new Date(prod.sale_start) <= now) &&
    (!prod.sale_end   || new Date(prod.sale_end)   >= now)
  const salePrice = hasSale ? prod.sale_price_rsd : null
  const salePct   = salePrice ? Math.round((1 - salePrice / regular) * 100) : 0
  return { regular, salePrice, salePct, display: salePrice ?? regular }
}

const EMPTY_PRODUCT = {
  name: '', description: '', short_description: '',
  regular_price_rsd: '', sale_price_rsd: '', sale_start: '', sale_end: '',
  category_id: '', is_active: true, is_featured: false, is_new: false, in_stock: true, sku: '',
}

// ── Shared price-fields block used in both add & edit modals ─────────────
function PriceFields({ form, setForm }: { form: any; setForm: (fn: (p: any) => any) => void }) {
  const regular = parseFloat(form.regular_price_rsd) || 0
  const sale    = parseFloat(form.sale_price_rsd)    || 0
  const pct     = regular > 0 && sale > 0 && sale < regular
    ? Math.round((1 - sale / regular) * 100) : 0
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Redovna cena (RSD) *</label>
          <input className="input" type="number" min="0" value={form.regular_price_rsd}
            onChange={e => setForm((p: any) => ({ ...p, regular_price_rsd: e.target.value }))}
            placeholder="1500" />
        </div>
        <div>
          <label className="label flex items-center gap-1.5">
            Akcijska cena (RSD)
            {pct > 0 && <span className="text-red-500 font-black">-{pct}%</span>}
          </label>
          <input className="input" type="number" min="0" value={form.sale_price_rsd}
            onChange={e => setForm((p: any) => ({ ...p, sale_price_rsd: e.target.value }))}
            placeholder="Opcionalno" />
        </div>
      </div>
      {(form.sale_price_rsd || form.sale_start || form.sale_end) && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Početak akcije</label>
            <input className="input" type="date" value={form.sale_start}
              onChange={e => setForm((p: any) => ({ ...p, sale_start: e.target.value }))} />
          </div>
          <div>
            <label className="label">Kraj akcije</label>
            <input className="input" type="date" value={form.sale_end}
              onChange={e => setForm((p: any) => ({ ...p, sale_end: e.target.value }))} />
          </div>
        </div>
      )}
      {form.sale_price_rsd && !form.sale_start && (
        <button type="button" className="text-xs text-teal font-bold hover:underline"
          onClick={() => setForm((p: any) => ({ ...p, sale_start: new Date().toISOString().slice(0,10) }))}>
          + Dodaj datume akcije
        </button>
      )}
    </div>
  )
}

// ── Image upload helper used in both add & edit ──────────────────────────
async function uploadFiles(
  files: FileList,
  adminFetchProducts: (b: object) => Promise<any>,
  productId: string,
): Promise<{ url: string; preview: string }[]> {
  const result: { url: string; preview: string }[] = []
  for (const file of Array.from(files)) {
    const preview = URL.createObjectURL(file)
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onloadend = () => res((r.result as string).split(',')[1])
        r.onerror = rej
        r.readAsDataURL(file)
      })
      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const resp = await adminFetchProducts({
        action: 'upload_image',
        payload: { product_id: productId, filename, base64, mime_type: file.type },
      })
      if (resp.error) { console.error(resp.error); continue }
      result.push({ url: resp.url, preview })
    } catch (e) { console.error(e) }
  }
  return result
}

// ── Shared image section ──────────────────────────────────────────────────
function ImageSection({
  existingImages, deletedIds, onDeleteExisting,
  newImages, onDeleteNew,
  uploading, fileRef, onFilePick,
}: {
  existingImages: any[]; deletedIds: string[]; onDeleteExisting: (id: string) => void
  newImages: { url: string; preview: string }[]; onDeleteNew: (i: number) => void
  uploading: boolean; fileRef: React.RefObject<HTMLInputElement>; onFilePick: () => void
}) {
  const visible = existingImages.filter(img => !deletedIds.includes(img.id))
  return (
    <div>
      <label className="label">Slike proizvoda</label>
      {visible.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {visible.map((img: any) => (
            <div key={img.id} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[#E2EAF0] group flex-shrink-0 bg-[#F4F7FA]">
              <img src={img.url} alt="" className="w-full h-full object-contain p-1" />
              <button type="button" onClick={() => onDeleteExisting(img.id)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              <div className="absolute bottom-0 left-0 right-0 bg-teal/70 text-white text-[8px] text-center py-0.5 font-medium">postoji</div>
            </div>
          ))}
        </div>
      )}
      {newImages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {newImages.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-teal group flex-shrink-0 bg-[#F4F7FA]">
              <img src={img.preview} alt="" className="w-full h-full object-contain p-1" />
              <button type="button" onClick={() => onDeleteNew(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              <div className="absolute bottom-0 left-0 right-0 bg-orange/70 text-white text-[8px] text-center py-0.5 font-medium">nova</div>
            </div>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) onFilePick(); }} />
      <button type="button" disabled={uploading} onClick={onFilePick}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-[#E2EAF0] text-sm font-semibold text-gray-400 hover:border-teal hover:text-teal transition-colors disabled:opacity-50 w-full justify-center">
        {uploading
          ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Uploadujem...</>
          : <>📷 Dodaj slike</>}
      </button>
      <p className="text-[11px] text-gray-400 mt-1 text-center">JPG, PNG, WebP · Više slika odjednom</p>
    </div>
  )
}

// ── Variants section ──────────────────────────────────────────────────────
function VariantsSection({
  existing, deletedIds, onDeleteExisting,
  newOnes, setNewOnes,
}: {
  existing: any[]; deletedIds: string[]; onDeleteExisting: (id: string) => void
  newOnes: Array<{type:string;value:string;price_modifier_rsd:string}>
  setNewOnes: React.Dispatch<React.SetStateAction<Array<{type:string;value:string;price_modifier_rsd:string}>>>
}) {
  const visible = existing.filter((v: any) => !deletedIds.includes(v.id))
  return (
    <div>
      <label className="label">Varijacije <span className="text-gray-400 font-normal">(boja, veličina, materijal)</span></label>
      {visible.map((v: any) => (
        <div key={v.id} className="flex items-center gap-2 mb-2 bg-[#F4F7FA] rounded-xl px-3 py-2">
          <span className="text-xs font-bold text-gray-400 uppercase w-16">{v.type}</span>
          <span className="font-semibold text-navy text-sm flex-1">{v.value}</span>
          {Number(v.price_modifier_rsd) !== 0 && <span className="text-xs text-gray-400">{v.price_modifier_rsd > 0 ? '+' : ''}{v.price_modifier_rsd} RSD</span>}
          <button onClick={() => onDeleteExisting(v.id)} className="text-red-400 font-bold text-sm hover:text-red-600">✕</button>
        </div>
      ))}
      {newOnes.map((v, i) => (
        <div key={i} className="flex gap-2 mb-2 items-center">
          <select className="input text-sm flex-1" value={v.type} onChange={e => setNewOnes(p => p.map((x, j) => j === i ? {...x, type: e.target.value} : x))}>
            <option value="color">Boja</option><option value="size">Veličina</option><option value="material">Materijal</option>
          </select>
          <input className="input text-sm flex-1" placeholder="vrednost" value={v.value} onChange={e => setNewOnes(p => p.map((x, j) => j === i ? {...x, value: e.target.value} : x))} />
          <input className="input text-sm w-24" placeholder="+/- RSD" value={v.price_modifier_rsd} onChange={e => setNewOnes(p => p.map((x, j) => j === i ? {...x, price_modifier_rsd: e.target.value} : x))} />
          <button onClick={() => setNewOnes(p => p.filter((_, j) => j !== i))} className="text-red-400 font-bold text-sm hover:text-red-600">✕</button>
        </div>
      ))}
      <button onClick={() => setNewOnes(p => [...p, { type: 'color', value: '', price_modifier_rsd: '0' }])} className="text-sm text-teal font-bold hover:underline">+ Dodaj varijaciju</button>
    </div>
  )
}

// ── Status checkboxes ──────────────────────────────────────────────────────
function StatusChecks({ form, setForm }: { form: any; setForm: (fn: (p: any) => any) => void }) {
  return (
    <div className="bg-[#F4F7FA] rounded-2xl p-3 grid grid-cols-2 gap-2">
      {[
        { key: 'is_active',   label: '✅ Aktivan (vidljiv)' },
        { key: 'in_stock',    label: '📦 Na stanju' },
        { key: 'is_featured', label: '⭐ Istaknuti proizvod' },
        { key: 'is_new',      label: '🆕 Označi kao NOVO' },
      ].map(({ key, label }) => (
        <label key={key} className="flex items-center gap-2 text-sm font-semibold text-gray-600 cursor-pointer">
          <input type="checkbox" checked={form[key]} onChange={e => setForm((p: any) => ({ ...p, [key]: e.target.checked }))} className="w-4 h-4 accent-teal" />
          {label}
        </label>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const [auth,    setAuth]   = useState(false)
  const [pin,     setPin]    = useState('')
  const pinRef = useRef('')
  const [tab, setTab] = useState<'qr'|'orders'|'pets'|'shop'>('orders')
  const [qr,     setQr]     = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [pets,   setPets]   = useState<any[]>([])
  const [stats,  setStats]  = useState({ total:0, active:0, unused:0, orders:0, revenue:0 })
  const [loading, setLoading] = useState(false)
  const [gen,    setGen]    = useState(50)
  const [filter, setFilter] = useState<'all'|'unused'|'active'>('all')
  const [search, setSearch] = useState('')

  // Shop
  const [shopCategories, setShopCategories] = useState<any[]>([])
  const [shopProducts,   setShopProducts]   = useState<any[]>([])
  const [shopModal, setShopModal] = useState<'none'|'add-category'|'add-product'|'edit-product'>('none')
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [newProduct, setNewProduct] = useState({ ...EMPTY_PRODUCT })
  const [newVariants,  setNewVariants]  = useState<Array<{type:string;value:string;price_modifier_rsd:string}>>([])
  const [newImages,    setNewImages]    = useState<{ url: string; preview: string }[]>([])
  const [newUploading, setNewUploading] = useState(false)
  const newFileRef = useRef<HTMLInputElement>(null)

  // Edit product
  const [editProduct,          setEditProduct]          = useState<any>(null)
  const [editForm,             setEditForm]             = useState<any>({})
  const [editImages,           setEditImages]           = useState<any[]>([])
  const [editDeletedImageIds,  setEditDeletedImageIds]  = useState<string[]>([])
  const [editNewImages,        setEditNewImages]        = useState<{ url: string; preview: string }[]>([])
  const [editVariants,         setEditVariants]         = useState<any[]>([])
  const [editDeletedVariantIds,setEditDeletedVariantIds]= useState<string[]>([])
  const [editNewVariants,      setEditNewVariants]      = useState<Array<{type:string;value:string;price_modifier_rsd:string}>>([])
  const [editUploading,        setEditUploading]        = useState(false)
  const editFileRef = useRef<HTMLInputElement>(null)

  // Bulk edit (products)
  const [selectedIds,  setSelectedIds]  = useState<string[]>([])
  const [bulkPrice,    setBulkPrice]    = useState('')
  const [bulkDiscount, setBulkDiscount] = useState('')
  const [bulkSaving,   setBulkSaving]   = useState(false)

  // Bulk QR
  const [selectedQrIds, setSelectedQrIds] = useState<string[]>([])
  const [qrBulkSaving,  setQrBulkSaving]  = useState(false)

  // Modals
  const [petPreview,  setPetPreview]  = useState<any>(null)
  const [petEdit,     setPetEdit]     = useState<any>(null)
  const [petEditForm, setPetEditForm] = useState<any>({})
  const [orderPreview,setOrderPreview]= useState<any>(null)

  // ── API helpers ──────────────────────────────────────────────────────────
  const adminFetch = (body?: object) =>
    fetch('/api/admin', {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pinRef.current },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }).then(r => r.json())

  const adminDelete = (body: object) =>
    fetch('/api/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pinRef.current },
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

  // ── Image upload handlers ────────────────────────────────────────────────
  const handleNewFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setNewUploading(true)
    const imgs = await uploadFiles(e.target.files, adminFetchProducts, 'temp')
    setNewImages(p => [...p, ...imgs])
    setNewUploading(false)
    if (newFileRef.current) newFileRef.current.value = ''
  }

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setEditUploading(true)
    const imgs = await uploadFiles(e.target.files, adminFetchProducts, editProduct?.id || 'temp')
    setEditNewImages(p => [...p, ...imgs])
    setEditUploading(false)
    if (editFileRef.current) editFileRef.current.value = ''
  }

  // ── Open edit modal ──────────────────────────────────────────────────────
  const openEdit = (prod: any) => {
    setEditProduct(prod)
    setEditForm({
      name: prod.name || '',
      description: prod.description || '',
      short_description: prod.short_description || '',
      regular_price_rsd: String(prod.regular_price_rsd ?? prod.price_rsd ?? ''),
      sale_price_rsd: prod.sale_price_rsd ? String(prod.sale_price_rsd) : '',
      sale_start: prod.sale_start || '',
      sale_end: prod.sale_end || '',
      category_id: prod.category_id || '',
      is_active: prod.is_active !== false,
      is_featured: !!prod.is_featured,
      is_new: !!prod.is_new,
      in_stock: prod.in_stock !== false,
      sku: prod.sku || '',
    })
    setEditImages([...(prod.product_images || [])].sort((a: any, b: any) => a.sort_order - b.sort_order))
    setEditDeletedImageIds([])
    setEditNewImages([])
    setEditVariants([...(prod.product_variants || [])])
    setEditDeletedVariantIds([])
    setEditNewVariants([])
    setShopModal('edit-product')
  }

  // ── Save edit ────────────────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!editProduct || !editForm.name || !editForm.regular_price_rsd) { alert('Unesite naziv i redovnu cenu'); return }
    const payload: any = {
      id: editProduct.id,
      name: editForm.name,
      description: editForm.description || null,
      short_description: editForm.short_description || null,
      regular_price_rsd: parseInt(editForm.regular_price_rsd) || null,
      sale_price_rsd: editForm.sale_price_rsd ? parseInt(editForm.sale_price_rsd) : null,
      sale_start: editForm.sale_start || null,
      sale_end: editForm.sale_end || null,
      category_id: editForm.category_id || null,
      is_active: editForm.is_active,
      is_featured: editForm.is_featured,
      is_new: editForm.is_new,
      in_stock: editForm.in_stock,
      sku: editForm.sku || null,
    }
    const res = await adminFetchProducts({ action: 'update_product', payload })
    if (res.error) { alert('Greška: ' + res.error); return }
    for (const id of editDeletedImageIds) await adminDeleteProduct({ action: 'delete_image', id })
    const kept = editImages.filter(img => !editDeletedImageIds.includes(img.id)).length
    for (let i = 0; i < editNewImages.length; i++) {
      await adminFetchProducts({ action: 'add_image', payload: { product_id: editProduct.id, url: editNewImages[i].url, sort_order: kept + i } })
    }
    for (const id of editDeletedVariantIds) await adminDeleteProduct({ action: 'delete_variant', id })
    for (const v of editNewVariants) {
      if (v.value) await adminFetchProducts({ action: 'add_variant', payload: { product_id: editProduct.id, name: v.value, type: v.type, value: v.value, price_modifier_rsd: parseFloat(v.price_modifier_rsd) || 0 } })
    }
    setEditProduct(null); setShopModal('none')
    await load()
  }

  // ── Bulk action ───────────────────────────────────────────────────────────
  const executeBulkAction = async (bulk_action: string) => {
    if (!selectedIds.length) return
    if (bulk_action === 'delete' && !confirm(`Obrisati ${selectedIds.length} proizvod(a)? Ova akcija je nepovratna.`)) return
    if (bulk_action === 'set_price' && !bulkPrice) { alert('Unesite cenu'); return }
    if (bulk_action === 'set_discount' && !bulkDiscount) { alert('Unesite procenat'); return }
    setBulkSaving(true)
    await adminFetchProducts({
      action: 'bulk_products',
      payload: {
        ids: selectedIds,
        bulk_action,
        value: bulk_action === 'set_price' ? bulkPrice : bulkDiscount,
      },
    })
    setBulkSaving(false)
    setSelectedIds([])
    setBulkPrice('')
    setBulkDiscount('')
    await load()
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = async () => {
    pinRef.current = pin
    setLoading(true)
    const data = await adminFetch()
    setLoading(false)
    if (data.error) { pinRef.current = ''; alert('Pogrešan PIN'); return }
    const codes = data.qr || []; const ords = data.orders || []
    setQr(codes); setOrders(ords); setPets(data.pets || [])
    setStats({ total: codes.length, active: codes.filter((c: any) => c.status === 'active').length, unused: codes.filter((c: any) => c.status === 'unused').length, orders: ords.length, revenue: ords.reduce((s: number, o: any) => s + (o.total_rsd || 0), 0) })
    const shopData = await adminFetchProducts()
    setShopCategories(shopData.categories || []); setShopProducts(shopData.products || [])
    setAuth(true)
  }

  const load = async () => {
    setLoading(true)
    const [data, shopData] = await Promise.all([adminFetch(), adminFetchProducts()])
    const codes = data.qr || []; const ords = data.orders || []
    setQr(codes); setOrders(ords); setPets(data.pets || [])
    setStats({ total: codes.length, active: codes.filter((c:any) => c.status === 'active').length, unused: codes.filter((c:any) => c.status === 'unused').length, orders: ords.length, revenue: ords.reduce((s:number, o:any) => s + (o.total_rsd || 0), 0) })
    setShopCategories(shopData.categories || []); setShopProducts(shopData.products || [])
    setLoading(false)
  }

  const generateQr = async () => {
    setLoading(true)
    const result = await adminFetch({ action: 'generate_qr', payload: { count: gen } })
    if (result.error) { alert('Greška: ' + result.error); setLoading(false); return }
    await load()
  }

  const exportCsv = () => {
    const unused = qr.filter(q => q.status === 'unused')
    const csv = ['code,url', ...unused.map(q => `${q.code},${window.location.origin}/p/${q.code}`)].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'petcode-qr.csv'; a.click()
  }

  const updateOrderStatus = async (id: string, status: string) => { await adminFetch({ action: 'update_order', payload: { id, status } }); await load() }
  const updateQrStatus    = async (id: string, status: string) => { await adminFetch({ action: 'update_qr',    payload: { id, status } }); await load() }
  const deleteQr    = async (id: string) => { if (!confirm('Nepovratno?')) return; const r = await adminDelete({ action: 'delete_qr',    id }); if (r.error) alert(r.error); else await load() }
  const deletePet   = async (id: string) => { if (!confirm('Nepovratno?')) return; const r = await adminDelete({ action: 'delete_pet',   id }); if (r.error) alert(r.error); else await load() }
  const deleteOrder = async (id: string) => { if (!confirm('Nepovratno?')) return; const r = await adminDelete({ action: 'delete_order', id }); if (r.error) alert(r.error); else await load() }

  const STATUS_COLORS: Record<string, string> = { nova: 'bg-orange-50 text-orange-600', potvrdjena: 'bg-blue-50 text-blue-600', poslata: 'bg-purple-50 text-purple-600', isporucena: 'bg-green-50 text-green-600' }
  const filteredQr     = qr.filter(q => (filter === 'all' || q.status === filter) && (!search || q.code.toLowerCase().includes(search.toLowerCase())))
  const filteredOrders = orders.filter(o => !search || o.customer_name?.toLowerCase().includes(search.toLowerCase()) || o.customer_phone?.includes(search))
  const filteredPets   = pets.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.owners?.name?.toLowerCase().includes(search.toLowerCase()))
  const allSelected    = shopProducts.length > 0 && shopProducts.every(p => selectedIds.includes(p.id))

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!auth) return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-xs text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h1 className="font-black text-navy text-xl mb-5">Admin</h1>
        <input className="input mb-4" type="password" placeholder="PIN" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
        <button onClick={login} disabled={loading} className="btn-teal w-full disabled:opacity-50">{loading ? 'Čekaj...' : 'Prijavi se'}</button>
      </div>
    </div>
  )

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f0fffe]">
      <nav className="bg-navy px-4 py-3 flex items-center justify-between">
        <span className="font-black text-white">pet<span className="text-teal">code</span><span className="text-white/30 text-sm font-mono ml-2">admin</span></span>
        <button onClick={() => { setAuth(false); pinRef.current = '' }} className="text-white/40 text-xs font-bold hover:text-white">Odjavi se</button>
      </nav>

      <div className="max-w-5xl mx-auto p-4 pb-24">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-5">
          {[
            { l: 'QR ukupno',      v: stats.total,                   c: 'text-navy' },
            { l: 'Aktivnih',       v: stats.active,                   c: 'text-teal' },
            { l: 'Neiskorišćenih', v: stats.unused,                   c: 'text-orange-500' },
            { l: 'Narudžbina',     v: stats.orders,                   c: 'text-purple-500' },
            { l: 'Prihod (RSD)',   v: stats.revenue.toLocaleString(), c: 'text-emerald-600' },
          ].map(s => (
            <div key={s.l} className="card text-center py-3">
              <div className={`text-2xl font-black ${s.c}`}>{s.v}</div>
              <div className="text-[11px] text-gray-400 font-semibold mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['orders','qr','pets','shop'] as const).map(t2 => (
            <button key={t2} onClick={() => setTab(t2)}
              className={`px-4 py-2 rounded-full text-sm font-black border-2 transition-all ${tab === t2 ? 'bg-navy border-navy text-white' : 'border-[#e2f0ef] text-gray-400 bg-white'}`}>
              {t2 === 'orders' ? '📦 Narudžbine' : t2 === 'qr' ? '🔲 QR Kodovi' : t2 === 'pets' ? '🐾 Ljubimci' : '🛍️ Prodavnica'}
            </button>
          ))}
        </div>

        <input className="input mb-4" placeholder="Pretraži..." value={search} onChange={e => setSearch(e.target.value)} />

        {/* ── ORDERS ── */}
        {tab === 'orders' && (
          <div className="space-y-2">
            {filteredOrders.length === 0 && <div className="card text-center py-8 text-gray-400">Nema narudžbina</div>}
            {filteredOrders.map(o => (
              <div key={o.id} className="card py-3 px-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-black text-navy">{o.customer_name}</div>
                    <div className="text-xs text-gray-400">{o.customer_phone} · {o.address}, {o.city}</div>
                    <div className="text-xs font-bold text-teal mt-1">{o.quantity}x privezak · {o.total_rsd} RSD</div>
                    {o.note && <div className="text-xs text-gray-400 mt-1">📝 {o.note}</div>}
                    <div className="text-[10px] text-gray-300 font-mono mt-1">{new Date(o.created_at).toLocaleString('sr')}</div>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    <span className={`text-[11px] font-black px-2 py-1 rounded-full ${STATUS_COLORS[o.status] || ''}`}>{o.status}</span>
                    <select className="text-xs border border-[#e2f0ef] rounded-xl px-2 py-1 font-semibold text-gray-500 bg-white" value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}>
                      {['nova','potvrdjena','poslata','isporucena'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => setOrderPreview(o)} className="text-xs text-blue-500 font-bold hover:underline">👁️</button>
                    <button onClick={() => deleteOrder(o.id)} className="text-xs text-red-400 font-bold hover:text-red-600">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── QR ── */}
        {tab === 'qr' && (
          <div className="space-y-4">
            {/* Generate + export */}
            <div className="card flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-32">
                <label className="label">Generiši QR kodove</label>
                <input className="input" type="number" min={1} max={500} value={gen} onChange={e => setGen(Number(e.target.value))} />
              </div>
              <button onClick={generateQr} disabled={loading} className="btn-navy disabled:opacity-50">{loading ? 'Čekaj...' : `+ Generiši ${gen}`}</button>
              <button onClick={exportCsv} className="btn-outline">📥 Export CSV</button>
            </div>

            {/* Filters + search */}
            <div className="flex gap-2 flex-wrap items-center">
              {(['all','unused','active'] as const).map(f => (
                <button key={f} onClick={() => { setFilter(f); setSelectedQrIds([]) }}
                  className={`px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all ${filter === f ? 'bg-teal border-teal text-white' : 'border-[#e2f0ef] text-gray-400 bg-white'}`}>
                  {f === 'all' ? 'Svi' : f === 'unused' ? 'Neiskorišćeni' : 'Aktivni'}
                </button>
              ))}
            </div>

            {loading && <div className="card text-center py-6 text-teal font-black animate-pulse">Učitavanje...</div>}
            {!loading && filteredQr.length === 0 && <div className="card text-center py-8 text-gray-400">Nema QR kodova — klikni Generiši</div>}

            {/* Select all bar */}
            {!loading && filteredQr.length > 0 && (
              <div className="flex items-center justify-between bg-white border border-[#E2EAF0] rounded-2xl px-4 py-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-teal"
                    checked={selectedQrIds.length === filteredQr.length && filteredQr.length > 0}
                    onChange={e => setSelectedQrIds(e.target.checked ? filteredQr.map((q:any) => q.id) : [])}
                  />
                  <span className="text-xs font-bold text-gray-500">
                    {selectedQrIds.length > 0
                      ? `Selektovano: ${selectedQrIds.length} / ${filteredQr.length}`
                      : `Selektuj sve (${filteredQr.length})`}
                  </span>
                </label>

                {selectedQrIds.length > 0 && (
                  <button
                    disabled={qrBulkSaving}
                    onClick={async () => {
                      const unusedSelected = filteredQr.filter((q:any) => selectedQrIds.includes(q.id) && q.status === 'unused')
                      if (unusedSelected.length === 0) { alert('Možete brisati samo neiskorišćene QR kodove'); return }
                      if (!confirm(`Obrisati ${unusedSelected.length} neiskorišćenih QR kodova? Ovo je nepovratno.`)) return
                      setQrBulkSaving(true)
                      try {
                        const r = await adminFetch({ action: 'bulk_delete_qr', payload: { ids: unusedSelected.map((q:any) => q.id) } })
                        if (r.error) alert(r.error)
                        else { setSelectedQrIds([]); await load() }
                      } finally { setQrBulkSaving(false) }
                    }}
                    className="text-xs font-black text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                  >
                    {qrBulkSaving ? 'Brišem...' : `🗑️ Obriši selektovane (${filteredQr.filter((q:any) => selectedQrIds.includes(q.id) && q.status === 'unused').length} neiskorišćenih)`}
                  </button>
                )}
              </div>
            )}

            {/* QR list */}
            <div className="space-y-2">
              {filteredQr.map((q:any) => (
                <div key={q.id} className={`card flex items-center gap-3 py-2.5 px-4 transition-colors ${selectedQrIds.includes(q.id) ? 'bg-teal/5 border-teal/30' : ''}`}>
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-teal shrink-0"
                    checked={selectedQrIds.includes(q.id)}
                    onChange={e => setSelectedQrIds(prev =>
                      e.target.checked ? [...prev, q.id] : prev.filter(x => x !== q.id)
                    )}
                  />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-navy font-mono text-sm">{q.code}</div>
                    <div className="text-[11px] text-gray-400">{new Date(q.created_at).toLocaleDateString('sr')}</div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${q.status === 'active' ? 'bg-teal/10 text-teal' : q.status === 'unused' ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>{q.status}</span>
                    <a href={`/p/${q.code}`} target="_blank" className="text-xs text-teal font-bold hover:underline">Test</a>
                    {q.status === 'active'   && <button onClick={() => updateQrStatus(q.id, 'disabled')} className="text-xs text-red-400 font-bold hover:text-red-600">Deaktiviraj</button>}
                    {q.status === 'disabled' && <button onClick={() => updateQrStatus(q.id, 'unused')}   className="text-xs text-green-500 font-bold hover:text-green-700">Aktiviraj</button>}
                    {q.status === 'unused'   && <button onClick={() => deleteQr(q.id)}                   className="text-xs text-red-400 font-bold hover:text-red-600">🗑️</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PETS ── */}
        {tab === 'pets' && (
          <div className="space-y-2">
            {filteredPets.length === 0 && <div className="card text-center py-8 text-gray-400">Nema ljubimaca</div>}
            {filteredPets.map(p => (
              <div key={p.id} className="card flex items-center gap-3 py-2.5 px-4">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                  {p.photo_url ? <img src={p.photo_url} className="w-full h-full object-cover rounded-xl" alt={p.name} /> : '🐾'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-navy text-sm">{p.name}</div>
                  <div className="text-xs text-gray-400 truncate">{p.owners?.name} · {p.owners?.phone} · {p.qr_codes?.code}</div>
                </div>
                <div className="flex items-center gap-2">
                  {p.is_lost && <span className="text-[11px] font-black bg-red-50 text-red-500 px-2 py-0.5 rounded-full animate-pulse">IZGUBLJEN</span>}
                  <button onClick={() => setPetPreview(p)} className="text-xs text-blue-500 font-bold hover:underline">👁️</button>
                  <button onClick={() => { setPetEdit(p); setPetEditForm({ color: p.color||'', age: p.age||'', allergies: p.allergies||'', medication: p.medication||'', vet_info: p.vet_info||'', note: p.note||'', is_lost: p.is_lost||false }) }} className="text-xs text-orange font-bold hover:underline">✏️</button>
                  <a href={`/ljubimac/${p.id}`} target="_blank" className="text-xs text-teal font-bold hover:underline">→</a>
                  <button onClick={() => deletePet(p.id)} className="text-xs text-red-400 font-bold hover:text-red-600">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SHOP ── */}
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
                        <div><span className="font-bold text-navy text-sm">{cat.name}</span><span className="ml-2 text-xs text-gray-400 font-mono">{cat.slug}</span></div>
                        <button onClick={async () => { if (!confirm('Obriši kategoriju?')) return; await adminDeleteProduct({ action: 'delete_category', id: cat.id }); await load() }} className="text-xs text-red-400 font-bold hover:text-red-600">🗑️</button>
                      </div>
                    ))}
                  </div>
              }
            </div>

            {/* Products */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-navy">Proizvodi</h3>
                  {shopProducts.length > 0 && (
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 cursor-pointer">
                      <input type="checkbox" checked={allSelected}
                        onChange={e => setSelectedIds(e.target.checked ? shopProducts.map(p => p.id) : [])}
                        className="w-4 h-4 accent-navy" />
                      Sve
                    </label>
                  )}
                </div>
                <button onClick={() => { setShopModal('add-product'); setNewVariants([]); setNewImages([]) }} className="btn-primary text-sm px-4 py-2">+ Novi proizvod</button>
              </div>

              {shopProducts.length === 0
                ? <p className="text-gray-400 text-sm">Nema proizvoda.</p>
                : <div className="space-y-2">
                    {shopProducts.map((prod: any) => {
                      const mainImg = (prod.product_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0]
                      const { regular, salePrice, salePct } = getEffectivePrice(prod)
                      const checked = selectedIds.includes(prod.id)
                      return (
                        <div key={prod.id} className={`flex items-start gap-3 rounded-2xl px-4 py-3 transition-colors ${checked ? 'bg-teal/5 border border-teal/30' : 'bg-[#F4F7FA]'}`}>
                          {/* Checkbox */}
                          <input type="checkbox" checked={checked}
                            onChange={e => setSelectedIds(p => e.target.checked ? [...p, prod.id] : p.filter(x => x !== prod.id))}
                            className="w-4 h-4 mt-1 accent-teal flex-shrink-0" />
                          {/* Thumb */}
                          <div className="w-12 h-12 rounded-xl bg-white border border-[#E2EAF0] overflow-hidden flex items-center justify-center flex-shrink-0">
                            {mainImg ? <img src={mainImg.url} alt={prod.name} className="w-full h-full object-contain p-0.5" /> : <span className="text-2xl">🐾</span>}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-navy text-sm truncate">{prod.name}</div>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              {salePrice ? (
                                <>
                                  <span className="text-sm font-extrabold text-orange">{salePrice.toLocaleString()} RSD</span>
                                  <span className="text-xs text-gray-400 line-through">{regular.toLocaleString()} RSD</span>
                                  <span className="text-[10px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-full">-{salePct}%</span>
                                </>
                              ) : (
                                <span className="text-sm font-bold text-navy">{regular.toLocaleString()} RSD</span>
                              )}
                              <span className="text-xs text-gray-400">· {prod.categories?.name || '—'} · {(prod.product_images||[]).length} slika</span>
                            </div>
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${prod.is_active ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-400'}`}>{prod.is_active ? '● Aktivan' : '● Neaktivan'}</span>
                              {prod.in_stock === false && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Rasprodato</span>}
                              {prod.is_featured && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange/10 text-orange">⭐ Top</span>}
                              {prod.is_new      && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal/10 text-teal">Novo</span>}
                              {prod.sale_end && new Date(prod.sale_end) < new Date() && prod.sale_price_rsd && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Akcija istekla</span>}
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => openEdit(prod)} className="text-xs text-orange font-bold hover:underline">✏️</button>
                            <button onClick={async () => { if (!confirm(`Obriši "${prod.name}"?`)) return; const r = await adminDeleteProduct({ action: 'delete_product', id: prod.id }); if (r.error) alert(r.error); else { setSelectedIds(p => p.filter(x => x !== prod.id)); await load() } }} className="text-xs text-red-400 font-bold hover:text-red-600">🗑️</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
              }
            </div>

            {/* ── Add category modal ── */}
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

            {/* ── Add product modal ── */}
            {shopModal === 'add-product' && (
              <div className="fixed inset-0 bg-navy/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShopModal('none')}>
                <div className="bg-white rounded-3xl p-6 w-full max-w-lg my-4" onClick={e => e.stopPropagation()}>
                  <h3 className="font-black text-navy mb-4 text-lg">Novi proizvod</h3>
                  <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                    <div><label className="label">Naziv *</label><input className="input" value={newProduct.name} onChange={e => setNewProduct(p => ({...p, name: e.target.value}))} placeholder="npr. QR Privezak Premium" /></div>
                    <div><label className="label">Kratki opis</label><input className="input" value={newProduct.short_description} onChange={e => setNewProduct(p => ({...p, short_description: e.target.value}))} placeholder="Jedna rečenica..." /></div>
                    <div><label className="label">Pun opis</label><textarea className="input resize-none h-20" value={newProduct.description} onChange={e => setNewProduct(p => ({...p, description: e.target.value}))} /></div>
                    <PriceFields form={newProduct} setForm={setNewProduct as any} />
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="label">SKU / Šifra</label><input className="input" value={newProduct.sku} onChange={e => setNewProduct(p => ({...p, sku: e.target.value}))} placeholder="PC-001" /></div>
                      <div>
                        <label className="label">Kategorija</label>
                        <select className="input" value={newProduct.category_id} onChange={e => setNewProduct(p => ({...p, category_id: e.target.value}))}>
                          <option value="">— bez —</option>
                          {shopCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <StatusChecks form={newProduct} setForm={setNewProduct as any} />
                    <VariantsSection existing={[]} deletedIds={[]} onDeleteExisting={() => {}} newOnes={newVariants} setNewOnes={setNewVariants} />
                    <input ref={newFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleNewFileChange} />
                    <ImageSection existingImages={[]} deletedIds={[]} onDeleteExisting={() => {}} newImages={newImages} onDeleteNew={i => setNewImages(p => p.filter((_, j) => j !== i))} uploading={newUploading} fileRef={newFileRef} onFilePick={() => newFileRef.current?.click()} />
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button onClick={async () => {
                      if (!newProduct.name || !newProduct.regular_price_rsd) { alert('Unesite naziv i redovnu cenu'); return }
                      const payload: any = { ...newProduct, regular_price_rsd: parseInt(newProduct.regular_price_rsd)||null, sale_price_rsd: newProduct.sale_price_rsd ? parseInt(newProduct.sale_price_rsd) : null, sale_start: newProduct.sale_start || null, sale_end: newProduct.sale_end || null, category_id: newProduct.category_id || null, sku: newProduct.sku || null }
                      const res = await adminFetchProducts({ action: 'create_product', payload })
                      if (res.error) { alert('Greška: ' + res.error); return }
                      const pid = res.product?.id
                      if (pid) {
                        for (const v of newVariants) { if (v.value) await adminFetchProducts({ action: 'add_variant', payload: { product_id: pid, name: v.value, type: v.type, value: v.value, price_modifier_rsd: parseFloat(v.price_modifier_rsd)||0 } }) }
                        for (let i = 0; i < newImages.length; i++) { await adminFetchProducts({ action: 'add_image', payload: { product_id: pid, url: newImages[i].url, sort_order: i } }) }
                      }
                      setNewProduct({ ...EMPTY_PRODUCT }); setNewVariants([]); setNewImages([]); setShopModal('none')
                      await load()
                    }} className="btn-primary flex-1">💾 Sačuvaj proizvod</button>
                    <button onClick={() => setShopModal('none')} className="btn-outline flex-1">Otkaži</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Edit product modal ── */}
            {shopModal === 'edit-product' && editProduct && (
              <div className="fixed inset-0 bg-navy/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShopModal('none')}>
                <div className="bg-white rounded-3xl p-6 w-full max-w-lg my-4" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-navy text-lg">✏️ Uredi proizvod</h3>
                    <button onClick={() => setShopModal('none')} className="text-gray-400 hover:text-navy font-bold text-xl">✕</button>
                  </div>
                  <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                    <div><label className="label">Naziv *</label><input className="input" value={editForm.name} onChange={e => setEditForm((p: any) => ({...p, name: e.target.value}))} /></div>
                    <div><label className="label">Kratki opis</label><input className="input" value={editForm.short_description} onChange={e => setEditForm((p: any) => ({...p, short_description: e.target.value}))} /></div>
                    <div><label className="label">Pun opis</label><textarea className="input resize-none h-20" value={editForm.description} onChange={e => setEditForm((p: any) => ({...p, description: e.target.value}))} /></div>
                    <PriceFields form={editForm} setForm={setEditForm} />
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="label">SKU / Šifra</label><input className="input" value={editForm.sku} onChange={e => setEditForm((p: any) => ({...p, sku: e.target.value}))} /></div>
                      <div>
                        <label className="label">Kategorija</label>
                        <select className="input" value={editForm.category_id} onChange={e => setEditForm((p: any) => ({...p, category_id: e.target.value}))}>
                          <option value="">— bez —</option>
                          {shopCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <StatusChecks form={editForm} setForm={setEditForm} />
                    <VariantsSection existing={editVariants} deletedIds={editDeletedVariantIds} onDeleteExisting={id => setEditDeletedVariantIds(p => [...p, id])} newOnes={editNewVariants} setNewOnes={setEditNewVariants} />
                    <input ref={editFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleEditFileChange} />
                    <ImageSection existingImages={editImages} deletedIds={editDeletedImageIds} onDeleteExisting={id => setEditDeletedImageIds(p => [...p, id])} newImages={editNewImages} onDeleteNew={i => setEditNewImages(p => p.filter((_, j) => j !== i))} uploading={editUploading} fileRef={editFileRef} onFilePick={() => editFileRef.current?.click()} />
                    {editDeletedImageIds.length > 0 && <p className="text-[11px] text-red-400 font-semibold text-center">{editDeletedImageIds.length} slika označeno za brisanje</p>}
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button onClick={saveEdit} className="btn-primary flex-1">💾 Sačuvaj izmene</button>
                    <button onClick={() => setShopModal('none')} className="btn-outline flex-1">Otkaži</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════ BULK ACTIONS TOOLBAR ════════════ */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl z-40">
          <div className="bg-navy rounded-2xl p-3 shadow-[0_8px_40px_rgba(11,31,59,0.4)] flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-white font-black text-sm">{selectedIds.length} selektovano</span>
              <button onClick={() => setSelectedIds([])} className="text-white/40 hover:text-white font-bold text-lg leading-none">✕</button>
            </div>
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {/* Postavi cenu */}
              <div className="flex items-center gap-1">
                <input className="bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-2 py-1.5 text-xs font-semibold w-24 focus:outline-none focus:border-teal"
                  type="number" placeholder="Cena RSD" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} />
                <button disabled={bulkSaving || !bulkPrice} onClick={() => executeBulkAction('set_price')}
                  className="bg-teal text-white text-xs font-black px-3 py-1.5 rounded-xl hover:bg-teal/80 disabled:opacity-40 transition-colors whitespace-nowrap">
                  Postavi cenu
                </button>
              </div>
              {/* Postavi popust */}
              <div className="flex items-center gap-1">
                <input className="bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-2 py-1.5 text-xs font-semibold w-20 focus:outline-none focus:border-orange"
                  type="number" min="1" max="99" placeholder="% popust" value={bulkDiscount} onChange={e => setBulkDiscount(e.target.value)} />
                <button disabled={bulkSaving || !bulkDiscount} onClick={() => executeBulkAction('set_discount')}
                  className="bg-orange text-white text-xs font-black px-3 py-1.5 rounded-xl hover:bg-orange/80 disabled:opacity-40 transition-colors whitespace-nowrap">
                  -{bulkDiscount || '?'}% popust
                </button>
              </div>
              {/* Quick actions */}
              {[
                { a: 'remove_discount', label: '✕ Ukloni popust', cls: 'bg-white/10 text-white hover:bg-white/20' },
                { a: 'activate',        label: '✅ Aktiviraj',      cls: 'bg-green-600 text-white hover:bg-green-500' },
                { a: 'deactivate',      label: '⛔ Deaktiviraj',    cls: 'bg-white/10 text-white hover:bg-white/20' },
                { a: 'delete',          label: '🗑️ Obriši',          cls: 'bg-red-600 text-white hover:bg-red-500' },
              ].map(({ a, label, cls }) => (
                <button key={a} disabled={bulkSaving} onClick={() => executeBulkAction(a)}
                  className={`text-xs font-black px-3 py-1.5 rounded-xl disabled:opacity-40 transition-colors whitespace-nowrap ${cls}`}>
                  {label}
                </button>
              ))}
            </div>
            {bulkSaving && <div className="text-white/60 text-xs font-semibold animate-pulse flex-shrink-0">Čekaj...</div>}
          </div>
        </div>
      )}

      {/* ── Pet preview modal ── */}
      {petPreview && (
        <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setPetPreview(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-navy">Profil: {petPreview.name}</h3>
              <button onClick={() => setPetPreview(null)} className="text-gray-400 hover:text-navy font-bold text-xl">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              {[['Ime', petPreview.name],['Vrsta', petPreview.species],['Rasa', petPreview.breed],['Starost', petPreview.age],['Boja', petPreview.color],['Vlasnik', petPreview.owners?.name],['Telefon', petPreview.owners?.phone],['Alergije', petPreview.allergies],['Lek', petPreview.medication],['Vet', petPreview.vet_info],['Napomena', petPreview.note],['Izgubljen', petPreview.is_lost ? '⚠️ DA' : 'Ne'],['QR kod', petPreview.qr_codes?.code]].filter(([,v]) => v).map(([l,v]) => (
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

      {/* ── Pet edit modal ── */}
      {petEdit && (
        <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setPetEdit(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-navy">Uredi: {petEdit.name}</h3>
              <button onClick={() => setPetEdit(null)} className="text-gray-400 hover:text-navy font-bold text-xl">✕</button>
            </div>
            <div className="space-y-3">
              {([['color','Boja','text'],['age','Starost','text'],['allergies','Alergije','text'],['medication','Lekovi','text'],['vet_info','Veterinar','text'],['note','Napomena','textarea']] as [string,string,string][]).map(([field, label, type]) => (
                <div key={field}>
                  <label className="label">{label}</label>
                  {type === 'textarea'
                    ? <textarea className="input resize-none h-16" value={petEditForm[field]||''} onChange={e => setPetEditForm((p: any) => ({...p, [field]: e.target.value}))} />
                    : <input   className="input"                  value={petEditForm[field]||''} onChange={e => setPetEditForm((p: any) => ({...p, [field]: e.target.value}))} />}
                </div>
              ))}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_lost_edit" checked={petEditForm.is_lost||false} onChange={e => setPetEditForm((p: any) => ({...p, is_lost: e.target.checked}))} className="w-4 h-4" />
                <label htmlFor="is_lost_edit" className="label mb-0 text-red-500">Izgubljen</label>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={async () => {
                const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-pin': pinRef.current }, body: JSON.stringify({ action: 'update_pet', payload: { id: petEdit.id, ...petEditForm } }) }).then(r => r.json())
                if (r.error) { alert('Greška: ' + r.error); return }
                setPetEdit(null); await load()
              }} className="btn-primary flex-1">Sačuvaj</button>
              <button onClick={() => setPetEdit(null)} className="btn-outline flex-1">Otkaži</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order preview modal ── */}
      {orderPreview && (
        <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4" onClick={() => setOrderPreview(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-navy">Narudžbina #{orderPreview.id?.slice(-8)}</h3>
              <button onClick={() => setOrderPreview(null)} className="text-gray-400 hover:text-navy font-bold text-xl">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              {[['Kupac', orderPreview.customer_name],['Telefon', orderPreview.customer_phone],['Email', orderPreview.customer_email||'—'],['Adresa', `${orderPreview.address}, ${orderPreview.city}`],['Količina', `${orderPreview.quantity}x`],['Ukupno', `${orderPreview.total_rsd} RSD`],['Status', orderPreview.status],['Napomena', orderPreview.note||'—'],['Datum', new Date(orderPreview.created_at).toLocaleString('sr')]].map(([l,v]) => (
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

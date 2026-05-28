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

const PRICE_PER_TAG = 1500

const EMPTY_PRODUCT = {
  name: '', description: '', short_description: '',
  regular_price_rsd: '', sale_price_rsd: '', sale_start: '', sale_end: '',
  category_id: '', is_active: true, is_featured: false, is_new: false, in_stock: true, sku: '',
  meta_title: '', meta_description: '', keywords: '',
}

const EMPTY_PARTNER = {
  name: '', type: 'pet_shop', city: '', address: '', phone: '', email: '',
  contact_person: '', instagram_followers: '',
  status: 'nije_kontaktiran', first_contact_date: '', next_contact: '',
  tags_left: '', commission_percent: '20', rejection_reason: '', notes: '',
  legal_name: '', pib: '', mb: '', bank_account: '', bank: '',
  vat_registered: false, legal_address: '',
}

const PARTNER_STATUS_COLORS: Record<string,string> = {
  aktivan:          'bg-green-50 text-green-700 border border-green-200',
  zainteresovan:    'bg-orange-50 text-orange-600 border border-orange-200',
  kontaktiran:      'bg-blue-50 text-blue-600 border border-blue-200',
  dogovoreno:       'bg-purple-50 text-purple-600 border border-purple-200',
  nije_kontaktiran: 'bg-gray-100 text-gray-500 border border-gray-200',
  odbio:            'bg-red-50 text-red-600 border border-red-200',
}
const PARTNER_STATUS_LABELS: Record<string,string> = {
  aktivan:'Aktivan', zainteresovan:'Zainteresovan', kontaktiran:'Kontaktiran',
  dogovoreno:'Dogovoreno', nije_kontaktiran:'Nije kontaktiran', odbio:'Odbio',
}
const PARTNER_TYPE_LABELS: Record<string,string> = {
  pet_shop:'Pet shop', veterinar:'Veterinar', frizer:'Frizer', ostalo:'Ostalo',
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
  onConvertInfo?: (info: string) => void,
): Promise<{ url: string; preview: string }[]> {
  const { convertToWebP, formatBytes } = await import('@/lib/imageUtils')
  const result: { url: string; preview: string }[] = []
  let totalOriginal = 0; let totalNew = 0
  for (const file of Array.from(files)) {
    const preview = URL.createObjectURL(file)
    try {
      // Convert to WebP before upload
      let uploadFile = file
      try {
        const converted = await convertToWebP(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.90 })
        uploadFile = converted.file
        totalOriginal += converted.originalSize
        totalNew += converted.newSize
      } catch { /* fallback to original */ }

      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onloadend = () => res((r.result as string).split(',')[1])
        r.onerror = rej
        r.readAsDataURL(uploadFile)
      })
      const timestamp = Date.now()
      const filename = `${productId}-${timestamp}.webp`
      const resp = await adminFetchProducts({
        action: 'upload_image',
        payload: { product_id: productId, filename, base64, mime_type: 'image/webp' },
      })
      if (resp.error || !resp.url) { console.error('Upload failed:', resp.error || 'no url'); continue }
      result.push({ url: resp.url, preview })
    } catch (e) { console.error(e) }
  }
  if (totalOriginal > 0 && onConvertInfo) {
    onConvertInfo(`✅ ${formatBytes(totalOriginal)} → ${formatBytes(totalNew)}`)
  }
  return result
}

// ── Shared image section ──────────────────────────────────────────────────
function ImageSection({
  existingImages, deletedIds, onDeleteExisting,
  newImages, onDeleteNew,
  uploading, fileRef, onFilePick, convertInfo,
}: {
  existingImages: any[]; deletedIds: string[]; onDeleteExisting: (id: string) => void
  newImages: { url: string; preview: string }[]; onDeleteNew: (i: number) => void
  uploading: boolean; fileRef: React.RefObject<HTMLInputElement>; onFilePick: () => void
  convertInfo?: string
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
          ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Optimizujem sliku...</>
          : <>📷 Dodaj slike</>}
      </button>
      {convertInfo && <p className="text-xs font-semibold text-green-600 mt-1 text-center">{convertInfo}</p>}
      <p className="text-[11px] text-gray-400 mt-1 text-center">JPG, PNG, WebP · Automatska WebP konverzija</p>
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
  const [tab, setTab] = useState<'qr'|'orders'|'pets'|'shop'|'crm'>('orders')
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
  const [newConvertInfo, setNewConvertInfo] = useState('')
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
  const [editConvertInfo,      setEditConvertInfo]      = useState('')
  const editFileRef = useRef<HTMLInputElement>(null)

  // Bulk edit (products)
  const [selectedIds,  setSelectedIds]  = useState<string[]>([])
  const [bulkPrice,    setBulkPrice]    = useState('')
  const [bulkDiscount, setBulkDiscount] = useState('')
  const [bulkSaving,   setBulkSaving]   = useState(false)

  // Bulk QR
  const [selectedQrIds, setSelectedQrIds] = useState<string[]>([])
  const [qrBulkSaving,  setQrBulkSaving]  = useState(false)

  // CRM
  const [crm,            setCrm]           = useState<any[]>([])
  const [crmLoading,     setCrmLoading]    = useState(false)
  const [crmFilter,      setCrmFilter]     = useState('all')
  const [crmTypeFilter,  setCrmTypeFilter] = useState('all')
  const [crmSearch,      setCrmSearch]     = useState('')
  const [partnerModal,   setPartnerModal]  = useState(false)
  const [partnerForm,    setPartnerForm]   = useState<any>({ ...EMPTY_PARTNER })
  const [invoicePartner, setInvoicePartner]= useState<any>(null)
  const [invAccOpen,     setInvAccOpen]    = useState(false)

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
    setNewUploading(true); setNewConvertInfo('')
    const imgs = await uploadFiles(e.target.files, adminFetchProducts, 'temp', setNewConvertInfo)
    setNewImages(p => [...p, ...imgs])
    setNewUploading(false)
    if (newFileRef.current) newFileRef.current.value = ''
  }

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setEditUploading(true); setEditConvertInfo('')
    const imgs = await uploadFiles(e.target.files, adminFetchProducts, editProduct?.id || 'temp', setEditConvertInfo)
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
      slug: prod.slug || '',
      meta_title: prod.meta_title || '',
      meta_description: prod.meta_description || '',
      keywords: prod.keywords || '',
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
      slug: editForm.slug || undefined,
      meta_title: editForm.meta_title || null,
      meta_description: editForm.meta_description || null,
      keywords: editForm.keywords || null,
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

  const loadCrm = async () => {
    setCrmLoading(true)
    const res = await adminFetch({ action: 'get_partners' })
    setCrm(res.partners || [])
    setCrmLoading(false)
  }

  const savePartner = async () => {
    if (!partnerForm.name.trim()) { alert('Unesite naziv partnera'); return }
    const payload = {
      ...partnerForm,
      tags_left: parseInt(partnerForm.tags_left) || 0,
      commission_percent: parseFloat(partnerForm.commission_percent) || 20,
      instagram_followers: partnerForm.instagram_followers ? parseInt(partnerForm.instagram_followers) : null,
      first_contact_date: partnerForm.first_contact_date || null,
      next_contact: partnerForm.next_contact || null,
      rejection_reason: partnerForm.rejection_reason || null,
      notes: partnerForm.notes || null,
      legal_name: partnerForm.legal_name || null,
      pib: partnerForm.pib || null,
      mb: partnerForm.mb || null,
      bank_account: partnerForm.bank_account || null,
      bank: partnerForm.bank || null,
      legal_address: partnerForm.legal_address || null,
    }
    await adminFetch({ action: 'save_partner', payload })
    setPartnerModal(false)
    setPartnerForm({ ...EMPTY_PARTNER })
    await loadCrm()
  }

  const deletePartner = async (id: string) => {
    if (!confirm('Obrisati partnera? Ova akcija je nepovratna.')) return
    await adminDelete({ action: 'delete_partner', id })
    await loadCrm()
  }

  const exportPartnersCsv = (activeOnly = false) => {
    const rows = activeOnly ? crm.filter(p => p.status === 'aktivan') : crm
    const headers = ['Naziv','Tip','Grad','Adresa','Telefon','Email','Kontakt osoba','IG pratioci',
      'Status','Prvi kontakt','Sledeći kontakt','Privezaka na terenu','Provizija %',
      'Razlog odbijanja','Beleška',
      'Pravno ime','PIB','MB','Tekući račun','Banka','PDV obveznik','Adresa sedišta']
    const csv = [headers.join(','), ...rows.map((p:any) => [
      p.name, PARTNER_TYPE_LABELS[p.type]||p.type, p.city, p.address, p.phone, p.email,
      p.contact_person, p.instagram_followers,
      PARTNER_STATUS_LABELS[p.status]||p.status, p.first_contact_date, p.next_contact,
      p.tags_left, p.commission_percent, p.rejection_reason, p.notes,
      p.legal_name, p.pib, p.mb, p.bank_account, p.bank,
      p.vat_registered ? 'Da' : 'Ne', p.legal_address,
    ].map(v => `"${String(v??'').replace(/"/g,'""')}"`).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿'+csv], { type: 'text/csv;charset=utf-8' }))
    a.download = activeOnly ? 'crm-aktivni.csv' : 'crm-svi.csv'
    a.click()
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
          {(['orders','qr','pets','shop','crm'] as const).map(t2 => (
            <button key={t2} onClick={() => { setTab(t2 as any); if (t2 === 'crm') loadCrm() }}
              className={`px-4 py-2 rounded-full text-sm font-black border-2 transition-all ${tab === t2 ? 'bg-navy border-navy text-white' : 'border-[#e2f0ef] text-gray-400 bg-white'}`}>
              {t2 === 'orders' ? '📦 Narudžbine' : t2 === 'qr' ? '🔲 QR Kodovi' : t2 === 'pets' ? '🐾 Ljubimci' : t2 === 'shop' ? '🛍️ Prodavnica' : '🤝 CRM'}
            </button>
          ))}
        </div>

        {tab !== 'crm' && <input className="input mb-4" placeholder="Pretraži..." value={search} onChange={e => setSearch(e.target.value)} />}

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
                    {/* SEO */}
                    <div className="border-t border-[#E2EAF0] pt-3">
                      <div className="text-xs font-extrabold text-teal uppercase tracking-widest mb-2">🔍 SEO</div>
                      <div className="space-y-2">
                        <div><label className="label">Meta naslov</label><input className="input" value={newProduct.meta_title} onChange={e => setNewProduct(p => ({...p, meta_title: e.target.value}))} placeholder="npr. QR Privezak za Pse — PetCode.rs" /></div>
                        <div><label className="label">Meta opis</label><textarea className="input resize-none h-16 text-xs" value={newProduct.meta_description} onChange={e => setNewProduct(p => ({...p, meta_description: e.target.value}))} placeholder="Kratki opis za Google (150–160 znakova)..." /></div>
                        <div><label className="label">Ključne reči</label><input className="input" value={newProduct.keywords} onChange={e => setNewProduct(p => ({...p, keywords: e.target.value}))} placeholder="qr privezak, pet qr code tag, privezak za pse" /></div>
                      </div>
                    </div>
                    <VariantsSection existing={[]} deletedIds={[]} onDeleteExisting={() => {}} newOnes={newVariants} setNewOnes={setNewVariants} />
                    <input ref={newFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleNewFileChange} />
                    <ImageSection existingImages={[]} deletedIds={[]} onDeleteExisting={() => {}} newImages={newImages} onDeleteNew={i => setNewImages(p => p.filter((_, j) => j !== i))} uploading={newUploading} fileRef={newFileRef} onFilePick={() => newFileRef.current?.click()} convertInfo={newConvertInfo} />
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
                    {/* SEO */}
                    <div className="border-t border-[#E2EAF0] pt-3">
                      <div className="text-xs font-extrabold text-teal uppercase tracking-widest mb-2">🔍 SEO</div>
                      <div className="space-y-2">
                        <div><label className="label">URL slug</label><input className="input font-mono text-xs" value={editForm.slug} onChange={e => setEditForm((p: any) => ({...p, slug: e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}))} placeholder="auto-generisan" /></div>
                        <div><label className="label">Meta naslov</label><input className="input" value={editForm.meta_title} onChange={e => setEditForm((p: any) => ({...p, meta_title: e.target.value}))} placeholder="npr. PetCode QR Tag — Privezak za Ljubimce" /></div>
                        <div><label className="label">Meta opis</label><textarea className="input resize-none h-16 text-xs" value={editForm.meta_description} onChange={e => setEditForm((p: any) => ({...p, meta_description: e.target.value}))} placeholder="Kratki opis za Google (150–160 znakova)..." /></div>
                        <div><label className="label">Ključne reči</label><input className="input" value={editForm.keywords} onChange={e => setEditForm((p: any) => ({...p, keywords: e.target.value}))} placeholder="qr privezak, pet qr code tag, privezak za pse srbija" /></div>
                      </div>
                    </div>
                    <VariantsSection existing={editVariants} deletedIds={editDeletedVariantIds} onDeleteExisting={id => setEditDeletedVariantIds(p => [...p, id])} newOnes={editNewVariants} setNewOnes={setEditNewVariants} />
                    <input ref={editFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleEditFileChange} />
                    <ImageSection existingImages={editImages} deletedIds={editDeletedImageIds} onDeleteExisting={id => setEditDeletedImageIds(p => [...p, id])} newImages={editNewImages} onDeleteNew={i => setEditNewImages(p => p.filter((_, j) => j !== i))} uploading={editUploading} fileRef={editFileRef} onFilePick={() => editFileRef.current?.click()} convertInfo={editConvertInfo} />
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
        {/* ── CRM ── */}
        {tab === 'crm' && (() => {
          const today = new Date().toISOString().split('T')[0]
          const filtered = crm.filter(p => {
            const matchStatus = crmFilter === 'all' || p.status === crmFilter
            const matchType   = crmTypeFilter === 'all' || p.type === crmTypeFilter
            const q = crmSearch.toLowerCase()
            const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q) || p.contact_person?.toLowerCase().includes(q)
            return matchStatus && matchType && matchSearch
          })
          const totalPartners  = crm.length
          const activePartners = crm.filter(p => p.status === 'aktivan').length
          const interested     = crm.filter(p => p.status === 'zainteresovan').length
          const tagsOnField    = crm.filter(p => p.status === 'aktivan').reduce((s:number, p:any) => s + (p.tags_left||0), 0)

          return (
            <div className="space-y-4">
              {/* CRM Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { l:'Ukupno partnera',    v: totalPartners,  c:'text-navy' },
                  { l:'Aktivnih',           v: activePartners, c:'text-green-600' },
                  { l:'Zainteresovanih',    v: interested,     c:'text-orange-500' },
                  { l:'Privezaka na terenu',v: tagsOnField,    c:'text-teal' },
                ].map(s => (
                  <div key={s.l} className="card text-center py-3">
                    <div className={`text-2xl font-black ${s.c}`}>{s.v}</div>
                    <div className="text-[11px] text-gray-400 font-semibold mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Filters + actions */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Status filter */}
                {(['all','aktivan','zainteresovan','kontaktiran','dogovoreno','odbio'] as const).map(f => (
                  <button key={f} onClick={() => setCrmFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all ${crmFilter===f ? 'bg-navy border-navy text-white' : 'border-[#e2f0ef] text-gray-400 bg-white'}`}>
                    {f==='all' ? 'Svi' : PARTNER_STATUS_LABELS[f]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {/* Type filter */}
                  {(['all','pet_shop','veterinar','frizer','ostalo'] as const).map(f => (
                    <button key={f} onClick={() => setCrmTypeFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${crmTypeFilter===f ? 'bg-teal border-teal text-white' : 'border-[#e2f0ef] text-gray-400 bg-white'}`}>
                      {f==='all' ? 'Svi tipovi' : PARTNER_TYPE_LABELS[f]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => exportPartnersCsv(false)} className="btn-outline text-xs py-1.5 px-3">📥 Export CSV</button>
                  <button onClick={() => exportPartnersCsv(true)}  className="btn-outline text-xs py-1.5 px-3">📥 Aktivni</button>
                  <button onClick={() => { setPartnerForm({ ...EMPTY_PARTNER }); setPartnerModal(true) }}
                    className="btn-teal text-xs py-1.5 px-3">+ Dodaj partnera</button>
                </div>
              </div>

              {/* Search */}
              <input className="input" placeholder="Pretraži po nazivu, gradu, kontakt osobi..."
                value={crmSearch} onChange={e => setCrmSearch(e.target.value)} />

              {/* Partner list */}
              {crmLoading && <div className="card text-center py-8 text-teal animate-pulse font-bold">Učitavanje...</div>}
              {!crmLoading && filtered.length === 0 && (
                <div className="card text-center py-10 text-gray-400">
                  <div className="text-3xl mb-2">🤝</div>
                  <div className="font-semibold">Nema partnera — dodajte prvog!</div>
                </div>
              )}
              <div className="space-y-3">
                {filtered.map((p:any) => {
                  const overdue = p.next_contact && p.next_contact <= today
                  return (
                    <div key={p.id} className={`card py-3 px-4 ${overdue ? 'border-l-4 border-l-red-400' : ''}`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          {/* Row 1: name + badges */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-black text-navy text-base">{p.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4F7FA] text-gray-500 border border-[#E2EAF0]">
                              {PARTNER_TYPE_LABELS[p.type]||p.type}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${PARTNER_STATUS_COLORS[p.status]||''}`}>
                              {PARTNER_STATUS_LABELS[p.status]||p.status}
                            </span>
                            {overdue && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                                📅 Posetiti danas
                              </span>
                            )}
                          </div>
                          {/* Row 2: city, contact */}
                          {(p.city || p.contact_person) && (
                            <div className="text-xs text-gray-400 font-semibold mb-1">
                              {[p.city, p.contact_person].filter(Boolean).join(' · ')}
                            </div>
                          )}
                          {/* Row 3: phone + email */}
                          <div className="flex gap-3 flex-wrap mb-1">
                            {p.phone && <a href={`tel:${p.phone}`} className="text-xs font-bold text-teal hover:underline">📞 {p.phone}</a>}
                            {p.email && <a href={`mailto:${p.email}`} className="text-xs font-bold text-blue-500 hover:underline">✉️ {p.email}</a>}
                          </div>
                          {/* Row 4: tags + commission */}
                          <div className="flex gap-3 text-xs text-gray-500 font-semibold mb-1">
                            <span>🏷️ {p.tags_left||0} privezaka na konsignaciji</span>
                            <span>💰 {p.commission_percent||20}% provizija</span>
                          </div>
                          {/* Row 5: note */}
                          {p.notes && (
                            <div className="text-xs text-gray-400 italic">
                              {p.notes.length > 80 ? p.notes.slice(0,80)+'…' : p.notes}
                            </div>
                          )}
                        </div>
                        {/* Actions */}
                        <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                          {p.phone && (
                            <a href={`tel:${p.phone}`} className="text-xs font-black text-white bg-teal px-3 py-1.5 rounded-xl hover:bg-teal/80 transition-colors">
                              📞 Pozovi
                            </a>
                          )}
                          <button onClick={() => { setPartnerForm({ ...EMPTY_PARTNER, ...p, tags_left: String(p.tags_left||''), commission_percent: String(p.commission_percent||20), instagram_followers: String(p.instagram_followers||'') }); setPartnerModal(true) }}
                            className="text-xs font-bold text-orange hover:underline">✏️ Uredi</button>
                          <button onClick={() => deletePartner(p.id)}
                            className="text-xs font-bold text-red-400 hover:text-red-600">🗑️ Obriši</button>
                          {p.status === 'aktivan' && (
                            <button onClick={() => setInvoicePartner(p)}
                              className="text-xs font-bold text-purple-600 hover:underline">🧾 Faktura</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

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

      {/* ── Partner edit/add modal ── */}
      {partnerModal && (
        <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setPartnerModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl my-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E2EAF0]">
              <h3 className="font-black text-navy text-lg">{partnerForm.id ? '✏️ Uredi partnera' : '+ Novi partner'}</h3>
              <button onClick={() => setPartnerModal(false)} className="text-gray-400 hover:text-navy font-bold text-xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto">

              {/* Osnovni podaci */}
              <div>
                <h4 className="font-black text-navy text-sm mb-3 uppercase tracking-widest">Osnovni podaci</h4>
                <div className="space-y-3">
                  <div>
                    <label className="label">Naziv *</label>
                    <input className="input" value={partnerForm.name} onChange={e => setPartnerForm((p:any)=>({...p,name:e.target.value}))} placeholder="Petshop Šapica" />
                  </div>
                  <div>
                    <label className="label">Tip</label>
                    <div className="flex gap-2 flex-wrap">
                      {['pet_shop','veterinar','frizer','ostalo'].map(t => (
                        <button key={t} type="button" onClick={() => setPartnerForm((p:any)=>({...p,type:t}))}
                          className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${partnerForm.type===t?'border-teal bg-teal/10 text-teal':'border-[#E2EAF0] text-gray-500'}`}>
                          {PARTNER_TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Grad</label><input className="input" value={partnerForm.city} onChange={e => setPartnerForm((p:any)=>({...p,city:e.target.value}))} placeholder="Beograd" /></div>
                    <div><label className="label">Adresa</label><input className="input" value={partnerForm.address} onChange={e => setPartnerForm((p:any)=>({...p,address:e.target.value}))} placeholder="Knez Mihailova 1" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Telefon</label><input className="input" type="tel" value={partnerForm.phone} onChange={e => setPartnerForm((p:any)=>({...p,phone:e.target.value}))} /></div>
                    <div><label className="label">Email</label><input className="input" type="email" value={partnerForm.email} onChange={e => setPartnerForm((p:any)=>({...p,email:e.target.value}))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Kontakt osoba</label><input className="input" value={partnerForm.contact_person} onChange={e => setPartnerForm((p:any)=>({...p,contact_person:e.target.value}))} placeholder="Marko Petrović" /></div>
                    <div><label className="label">Instagram pratioci</label><input className="input" type="number" min="0" value={partnerForm.instagram_followers} onChange={e => setPartnerForm((p:any)=>({...p,instagram_followers:e.target.value}))} placeholder="5000" /></div>
                  </div>
                </div>
              </div>

              {/* Status saradnje */}
              <div>
                <h4 className="font-black text-navy text-sm mb-3 uppercase tracking-widest">Status saradnje</h4>
                <div className="space-y-3">
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={partnerForm.status} onChange={e => setPartnerForm((p:any)=>({...p,status:e.target.value}))}>
                      {Object.entries(PARTNER_STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Datum prvog kontakta</label><input className="input" type="date" value={partnerForm.first_contact_date} onChange={e => setPartnerForm((p:any)=>({...p,first_contact_date:e.target.value}))} /></div>
                    <div><label className="label">Sledeći kontakt</label><input className="input" type="date" value={partnerForm.next_contact} onChange={e => setPartnerForm((p:any)=>({...p,next_contact:e.target.value}))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Privezaka ostavljeno</label><input className="input" type="number" min="0" value={partnerForm.tags_left} onChange={e => setPartnerForm((p:any)=>({...p,tags_left:e.target.value}))} placeholder="0" /></div>
                    <div><label className="label">Provizija %</label><input className="input" type="number" min="0" max="100" step="0.5" value={partnerForm.commission_percent} onChange={e => setPartnerForm((p:any)=>({...p,commission_percent:e.target.value}))} placeholder="20" /></div>
                  </div>
                  {partnerForm.status === 'odbio' && (
                    <div><label className="label">Razlog odbijanja</label><textarea className="input resize-none h-16" value={partnerForm.rejection_reason} onChange={e => setPartnerForm((p:any)=>({...p,rejection_reason:e.target.value}))} /></div>
                  )}
                  <div><label className="label">Beleške</label><textarea className="input resize-none h-20" value={partnerForm.notes} onChange={e => setPartnerForm((p:any)=>({...p,notes:e.target.value}))} placeholder="Napomene o saradnji..." /></div>
                </div>
              </div>

              {/* Podaci za fakturu — accordion */}
              <div className="border border-[#E2EAF0] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => setInvAccOpen(p=>!p)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#F4F7FA] hover:bg-[#EBF0F5] transition-colors">
                  <span className="font-black text-navy text-sm">🧾 Podaci za fakturu</span>
                  <span className="text-gray-400 font-bold">{invAccOpen ? '▲' : '▼'}</span>
                </button>
                {invAccOpen && (
                  <div className="px-4 py-4 space-y-3">
                    <div><label className="label">Puno pravno ime firme</label><input className="input" value={partnerForm.legal_name} onChange={e => setPartnerForm((p:any)=>({...p,legal_name:e.target.value}))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="label">PIB</label><input className="input" value={partnerForm.pib} onChange={e => setPartnerForm((p:any)=>({...p,pib:e.target.value}))} placeholder="123456789" /></div>
                      <div><label className="label">Matični broj</label><input className="input" value={partnerForm.mb} onChange={e => setPartnerForm((p:any)=>({...p,mb:e.target.value}))} placeholder="12345678" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="label">Tekući račun</label><input className="input" value={partnerForm.bank_account} onChange={e => setPartnerForm((p:any)=>({...p,bank_account:e.target.value}))} placeholder="160-123456-12" /></div>
                      <div><label className="label">Banka</label><input className="input" value={partnerForm.bank} onChange={e => setPartnerForm((p:any)=>({...p,bank:e.target.value}))} placeholder="Raiffeisen" /></div>
                    </div>
                    <div><label className="label">Adresa sedišta</label><input className="input" value={partnerForm.legal_address} onChange={e => setPartnerForm((p:any)=>({...p,legal_address:e.target.value}))} /></div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={partnerForm.vat_registered} onChange={e => setPartnerForm((p:any)=>({...p,vat_registered:e.target.checked}))} className="w-4 h-4 accent-teal" />
                      <span className="text-sm font-semibold text-navy">PDV obveznik</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-[#E2EAF0]">
              <button onClick={savePartner} className="btn-primary flex-1">💾 Sačuvaj</button>
              <button onClick={() => setPartnerModal(false)} className="btn-outline flex-1">Otkaži</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice modal ── */}
      {invoicePartner && (() => {
        const p = invoicePartner
        const qty = p.tags_left || 0
        const commission = parseFloat(p.commission_percent) || 20
        const amount = qty * PRICE_PER_TAG * commission / 100
        return (
          <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4" onClick={() => setInvoicePartner(null)}>
            <div className="bg-white rounded-3xl w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E2EAF0]">
                <h3 className="font-black text-navy">🧾 Predlog fakture</h3>
                <button onClick={() => setInvoicePartner(null)} className="text-gray-400 hover:text-navy font-bold text-xl">✕</button>
              </div>
              <div id="invoice-print" className="px-6 py-5 space-y-4 text-sm">
                <div className="text-center mb-2">
                  <div className="font-black text-navy text-xl">FAKTURA</div>
                  <div className="text-gray-400 text-xs font-mono mt-1">{new Date().toLocaleDateString('sr-Latn-RS')}</div>
                </div>
                <div className="bg-[#F4F7FA] rounded-2xl p-4 space-y-1">
                  <div className="font-black text-navy">{p.legal_name || p.name}</div>
                  {p.pib && <div className="text-xs text-gray-500">PIB: {p.pib}</div>}
                  {p.mb  && <div className="text-xs text-gray-500">MB: {p.mb}</div>}
                  {(p.legal_address||p.address) && <div className="text-xs text-gray-500">{p.legal_address||p.address}</div>}
                  {p.vat_registered && <div className="text-xs text-teal font-bold">PDV obveznik</div>}
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-navy text-white">
                    <th className="text-left p-2 rounded-tl-xl">Opis</th>
                    <th className="text-right p-2">Kom</th>
                    <th className="text-right p-2">Cena</th>
                    <th className="text-right p-2 rounded-tr-xl">Iznos</th>
                  </tr></thead>
                  <tbody><tr className="border-b border-[#E2EAF0]">
                    <td className="p-2">PetCode privezak – konsignacija ({commission}% prov.)</td>
                    <td className="p-2 text-right">{qty}</td>
                    <td className="p-2 text-right">{PRICE_PER_TAG.toLocaleString()} RSD</td>
                    <td className="p-2 text-right font-bold">{amount.toLocaleString(undefined,{maximumFractionDigits:2})} RSD</td>
                  </tr></tbody>
                </table>
                <div className="flex justify-between items-center bg-navy text-white rounded-2xl px-4 py-3">
                  <span className="font-bold">UKUPNO ZA UPLATU</span>
                  <span className="font-black text-lg">{amount.toLocaleString(undefined,{maximumFractionDigits:2})} RSD</span>
                </div>
                {p.bank_account && (
                  <div className="text-xs text-gray-500 text-center">
                    Tekući račun: <span className="font-bold text-navy">{p.bank_account}</span>
                    {p.bank && ` · ${p.bank}`}
                  </div>
                )}
              </div>
              <div className="flex gap-2 px-6 py-4 border-t border-[#E2EAF0]">
                <button onClick={() => window.print()} className="btn-primary flex-1">🖨️ Štampaj</button>
                <button onClick={() => setInvoicePartner(null)} className="btn-outline flex-1">Zatvori</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Order preview modal ── */}
      {orderPreview && (
        <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4" onClick={() => setOrderPreview(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-navy">Narudžbina #{orderPreview.id?.slice(-8)}</h3>
              <button onClick={() => setOrderPreview(null)} className="text-gray-400 hover:text-navy font-bold text-xl">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              {[['Kupac', orderPreview.customer_name],['Telefon', orderPreview.customer_phone],['Email', orderPreview.customer_email||'—'],['Adresa', `${orderPreview.address}, ${orderPreview.city}`],['Ukupno', `${orderPreview.total_rsd?.toLocaleString()} RSD`],['Status', orderPreview.status],['Napomena', orderPreview.note||'—'],['Datum', new Date(orderPreview.created_at).toLocaleString('sr')]].map(([l,v]) => (
                <div key={l as string} className="flex justify-between py-1.5 border-b border-[#E2EAF0]">
                  <span className="text-gray-400 font-semibold">{l}</span>
                  <span className="font-bold text-navy text-right max-w-[60%] break-words">{v}</span>
                </div>
              ))}
            </div>
            {/* items_json — cart orders */}
            {orderPreview.items_json && Array.isArray(orderPreview.items_json) && orderPreview.items_json.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-extrabold text-teal uppercase tracking-widest mb-2">Stavke</div>
                <div className="space-y-1.5">
                  {orderPreview.items_json.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-[#F8FAFB] rounded-xl px-3 py-2 text-sm">
                      <div>
                        <div className="font-bold text-navy">{item.name}</div>
                        {item.variant && <div className="text-xs text-gray-400">{item.variant}</div>}
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="text-xs text-gray-400">{item.quantity}x {Number(item.price).toLocaleString()}</div>
                        <div className="font-bold text-teal text-sm">{(Number(item.price) * Number(item.quantity)).toLocaleString()} RSD</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setOrderPreview(null)} className="btn-outline block text-center mt-4 w-full text-sm">Zatvori</button>
          </div>
        </div>
      )}
    </div>
  )
}

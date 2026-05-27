'use client'
import { useState } from 'react'
import { useCart } from '@/lib/cartStore'

/* ── Color map ── */
const COLOR_MAP: Record<string, { bg: string; ring: string; label: string }> = {
  bela: { bg: '#FFFFFF', ring: '#D1D5DB', label: 'Bela' },
  white: { bg: '#FFFFFF', ring: '#D1D5DB', label: 'White' },
  teget: { bg: '#0B1F3B', ring: '#0B1F3B', label: 'Teget' },
  navy: { bg: '#0B1F3B', ring: '#0B1F3B', label: 'Navy' },
  tamnoplava: { bg: '#1E3A5F', ring: '#1E3A5F', label: 'Tamnoplava' },
  zuta: { bg: '#EAB308', ring: '#CA8A04', label: 'Žuta' },
  yellow: { bg: '#EAB308', ring: '#CA8A04', label: 'Yellow' },
  crna: { bg: '#111111', ring: '#111111', label: 'Crna' },
  black: { bg: '#111111', ring: '#111111', label: 'Black' },
  crvena: { bg: '#EF4444', ring: '#DC2626', label: 'Crvena' },
  red: { bg: '#EF4444', ring: '#DC2626', label: 'Red' },
  zelena: { bg: '#10B981', ring: '#059669', label: 'Zelena' },
  green: { bg: '#10B981', ring: '#059669', label: 'Green' },
  plava: { bg: '#3B82F6', ring: '#2563EB', label: 'Plava' },
  blue: { bg: '#3B82F6', ring: '#2563EB', label: 'Blue' },
  roze: { bg: '#F472B6', ring: '#EC4899', label: 'Roze' },
  pink: { bg: '#F472B6', ring: '#EC4899', label: 'Pink' },
  siva: { bg: '#9CA3AF', ring: '#6B7280', label: 'Siva' },
  gray: { bg: '#9CA3AF', ring: '#6B7280', label: 'Gray' },
  siva_svetla: { bg: '#E5E7EB', ring: '#9CA3AF', label: 'Svetlosiva' },
  braon: { bg: '#92400E', ring: '#78350F', label: 'Braon' },
  brown: { bg: '#92400E', ring: '#78350F', label: 'Brown' },
  narandzasta: { bg: '#FF6B4A', ring: '#E55A39', label: 'Narandžasta' },
  orange: { bg: '#FF6B4A', ring: '#E55A39', label: 'Orange' },
  ljubicasta: { bg: '#8B5CF6', ring: '#7C3AED', label: 'Ljubičasta' },
  purple: { bg: '#8B5CF6', ring: '#7C3AED', label: 'Purple' },
}

function getColor(value: string) {
  const key = value.toLowerCase().trim().replace(/\s+/g, '_')
  return COLOR_MAP[key] || null
}

const TYPE_LABELS: Record<string, string> = {
  color: 'Boja',
  size: 'Veličina',
  material: 'Materijal',
}

export interface Variant {
  id: string
  type: string
  value: string
  price_modifier_rsd?: number
  is_active?: boolean
}

interface Props {
  productId: string
  productSlug: string
  productName: string
  productImage?: string
  inStock: boolean
  priceRsd: number
  variantsByType: Record<string, Variant[]>
}

export default function ProductActions({
  productId, productSlug, productName, productImage,
  inStock, priceRsd, variantsByType,
}: Props) {
  const { addToCart, cartTotal, cartCount, setIsOpen } = useCart()
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const toggle = (type: string, id: string) =>
    setSelected(prev => prev[type] === id ? { ...prev, [type]: '' } : { ...prev, [type]: id })

  const modifierTotal = Object.values(selected).reduce((acc, id) => {
    for (const vars of Object.values(variantsByType)) {
      const v = vars.find(x => x.id === id)
      if (v) acc += Number(v.price_modifier_rsd) || 0
    }
    return acc
  }, 0)

  const unitPrice = priceRsd + modifierTotal
  const lineTotal = qty * unitPrice

  const buildVariantLabel = () => {
    const parts: string[] = []
    for (const [type, vars] of Object.entries(variantsByType)) {
      const selId = selected[type]
      if (selId) {
        const v = vars.find(x => x.id === selId)
        if (v) parts.push(`${TYPE_LABELS[type] || type}: ${v.value}`)
      }
    }
    return parts.join(', ') || undefined
  }

  const buildVariantId = () => {
    const ids = Object.values(selected).filter(Boolean)
    return ids.length === 1 ? ids[0] : ids.join(',') || undefined
  }

  const handleAddToCart = () => {
    if (!inStock) return
    addToCart({
      id: productId,
      type: 'product',
      name: productName,
      price: unitPrice,
      quantity: qty,
      image: productImage,
      variant: buildVariantLabel(),
      variantId: buildVariantId(),
      slug: productSlug,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const hasVariants = Object.keys(variantsByType).length > 0

  return (
    <>
      <div className="space-y-5 mt-2">
        {/* Variant pickers */}
        {Object.entries(variantsByType).map(([type, vars]) => {
          const label = TYPE_LABELS[type] || type
          const selectedId = selected[type] || ''

          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</span>
                {selectedId && type === 'color' && (
                  <span className="text-xs font-semibold text-navy">
                    — {vars.find(v => v.id === selectedId)?.value}
                  </span>
                )}
              </div>
              <div className="flex gap-2.5 flex-wrap">
                {vars.filter(v => v.is_active !== false).map(v => {
                  const isSelected = selectedId === v.id
                  const colorInfo = type === 'color' ? getColor(v.value) : null

                  if (colorInfo) {
                    return (
                      <button
                        key={v.id}
                        onClick={() => toggle(type, v.id)}
                        title={v.value}
                        aria-label={`Boja: ${v.value}`}
                        className={`relative w-9 h-9 rounded-full transition-all duration-150 focus:outline-none ${
                          isSelected ? 'scale-110' : 'hover:scale-105'
                        }`}
                        style={{
                          backgroundColor: colorInfo.bg,
                          boxShadow: isSelected ? '0 0 0 2px #19B6B2' : `0 0 0 1.5px ${colorInfo.ring}`,
                        }}
                      >
                        {isSelected && (
                          <span
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ color: colorInfo.bg === '#FFFFFF' || colorInfo.bg === '#E5E7EB' ? '#0B1F3B' : '#FFFFFF' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        )}
                      </button>
                    )
                  }

                  return (
                    <button
                      key={v.id}
                      onClick={() => toggle(type, v.id)}
                      className={`px-4 py-2 rounded-full border-2 font-semibold text-sm transition-all duration-150 focus:outline-none ${
                        isSelected
                          ? 'border-navy bg-navy text-white shadow'
                          : 'border-[#E2EAF0] text-gray-600 bg-white hover:border-teal hover:text-teal'
                      }`}
                    >
                      {v.value}
                      {Number(v.price_modifier_rsd) !== 0 && (
                        <span className={`ml-1 text-xs ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                          ({v.price_modifier_rsd! > 0 ? '+' : ''}{Number(v.price_modifier_rsd).toLocaleString()} RSD)
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Quantity row */}
        <div className="flex items-center gap-4 pt-1">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">Količina</span>
          <div className="flex items-center bg-white border-2 border-[#E2EAF0] rounded-full overflow-hidden shadow-sm">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="w-11 h-11 flex items-center justify-center text-navy text-xl font-bold hover:bg-[#F4F7FA] transition-colors disabled:opacity-30 disabled:cursor-not-allowed select-none"
              aria-label="Smanji količinu"
            >−</button>
            <span className="w-10 text-center text-lg font-extrabold text-navy select-none">{qty}</span>
            <button
              onClick={() => setQty(q => Math.min(10, q + 1))}
              disabled={qty >= 10}
              className="w-11 h-11 flex items-center justify-center text-navy text-xl font-bold hover:bg-[#F4F7FA] transition-colors disabled:opacity-30 disabled:cursor-not-allowed select-none"
              aria-label="Povećaj količinu"
            >+</button>
          </div>

          {(qty > 1 || modifierTotal !== 0) && (
            <div className="ml-auto text-right">
              <div className="text-[10px] text-gray-400 font-semibold leading-none mb-0.5 uppercase tracking-wide">Ukupno</div>
              <div className="text-2xl font-extrabold text-navy leading-none">
                {lineTotal.toLocaleString()}
                <span className="text-sm font-semibold text-gray-400 ml-1">RSD</span>
              </div>
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div className="pt-1 space-y-3">
          <button
            onClick={handleAddToCart}
            disabled={!inStock || added}
            className={`w-full text-center text-base py-4 rounded-full font-bold transition-all ${
              added
                ? 'bg-teal text-white shadow-[0_4px_16px_rgba(25,182,178,0.4)] cursor-default'
                : inStock
                ? 'bg-navy text-white hover:bg-[#162d52] shadow-[0_4px_16px_rgba(11,31,59,0.2)] active:scale-95 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {added
              ? '✓ Dodato u korpu!'
              : !inStock
              ? 'Trenutno nedostupno'
              : qty > 1
              ? `+ Dodaj ${qty} kom u korpu`
              : '+ Dodaj u korpu'}
          </button>

          {added && (
            <button
              onClick={() => setIsOpen(true)}
              className="w-full text-center py-3 rounded-full font-bold text-sm border-2 border-teal text-teal hover:bg-teal/10 transition-all active:scale-95"
            >
              Pogledaj korpu →
            </button>
          )}

          <p className="text-center text-xs text-gray-400 font-medium">
            💳 Plaćanje pouzećem · 🚚 Post Express dostava · ✅ Bez registracije
          </p>
        </div>
      </div>

      {/* Sticky mobile bottom bar — shown when cart has items */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-[#E2EAF0] px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(11,31,59,0.08)]">
          <div className="flex-1">
            <div className="text-xs text-gray-400 font-semibold">Korpa · {cartCount} artikal{cartCount === 1 ? '' : 'a'}</div>
            <div className="text-base font-extrabold text-navy">{cartTotal.toLocaleString()} RSD</div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-orange text-white font-bold px-5 py-2.5 rounded-full text-sm hover:bg-orange2 transition-colors shadow-[0_4px_12px_rgba(255,107,74,0.3)] active:scale-95 flex-shrink-0"
          >
            Pregledaj korpu 🛒
          </button>
        </div>
      )}
    </>
  )
}

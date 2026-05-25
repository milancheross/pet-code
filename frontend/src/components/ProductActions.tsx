'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

/* ── Color map: ime boje → CSS vrednost ── */
const COLOR_MAP: Record<string, { bg: string; ring: string; label: string }> = {
  // Bela
  bela:         { bg: '#FFFFFF', ring: '#D1D5DB', label: 'Bela' },
  white:        { bg: '#FFFFFF', ring: '#D1D5DB', label: 'White' },
  // Teget / Navy
  teget:        { bg: '#0B1F3B', ring: '#0B1F3B', label: 'Teget' },
  navy:         { bg: '#0B1F3B', ring: '#0B1F3B', label: 'Navy' },
  tamnoplava:   { bg: '#1E3A5F', ring: '#1E3A5F', label: 'Tamnoplava' },
  // Žuta
  zuta:         { bg: '#EAB308', ring: '#CA8A04', label: 'Žuta' },
  yellow:       { bg: '#EAB308', ring: '#CA8A04', label: 'Yellow' },
  // Crna
  crna:         { bg: '#111111', ring: '#111111', label: 'Crna' },
  black:        { bg: '#111111', ring: '#111111', label: 'Black' },
  // Crvena
  crvena:       { bg: '#EF4444', ring: '#DC2626', label: 'Crvena' },
  red:          { bg: '#EF4444', ring: '#DC2626', label: 'Red' },
  // Zelena
  zelena:       { bg: '#10B981', ring: '#059669', label: 'Zelena' },
  green:        { bg: '#10B981', ring: '#059669', label: 'Green' },
  // Plava
  plava:        { bg: '#3B82F6', ring: '#2563EB', label: 'Plava' },
  blue:         { bg: '#3B82F6', ring: '#2563EB', label: 'Blue' },
  // Roze
  roze:         { bg: '#F472B6', ring: '#EC4899', label: 'Roze' },
  pink:         { bg: '#F472B6', ring: '#EC4899', label: 'Pink' },
  // Siva
  siva:         { bg: '#9CA3AF', ring: '#6B7280', label: 'Siva' },
  gray:         { bg: '#9CA3AF', ring: '#6B7280', label: 'Gray' },
  siva_svetla:  { bg: '#E5E7EB', ring: '#9CA3AF', label: 'Svetlosiva' },
  // Braon
  braon:        { bg: '#92400E', ring: '#78350F', label: 'Braon' },
  brown:        { bg: '#92400E', ring: '#78350F', label: 'Brown' },
  // Narandžasta
  narandzasta:  { bg: '#FF6B4A', ring: '#E55A39', label: 'Narandžasta' },
  orange:       { bg: '#FF6B4A', ring: '#E55A39', label: 'Orange' },
  // Ljubičasta
  ljubicasta:   { bg: '#8B5CF6', ring: '#7C3AED', label: 'Ljubičasta' },
  purple:       { bg: '#8B5CF6', ring: '#7C3AED', label: 'Purple' },
}

function getColor(value: string) {
  const key = value.toLowerCase().trim().replace(/\s+/g, '_')
  return COLOR_MAP[key] || null
}

const TYPE_LABELS: Record<string, string> = {
  color:    'Boja',
  size:     'Veličina',
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
  productSlug: string
  inStock: boolean
  priceRsd: number
  variantsByType: Record<string, Variant[]>
}

export default function ProductActions({ productSlug, inStock, priceRsd, variantsByType }: Props) {
  /* Selected variant per type: { color: 'id1', size: 'id2' } */
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [qty, setQty] = useState(1)
  const router = useRouter()

  const toggle = (type: string, id: string) => {
    setSelected(prev =>
      prev[type] === id
        ? { ...prev, [type]: '' }   // deselect on second click
        : { ...prev, [type]: id }
    )
  }

  /* Sum of price modifiers from selected variants */
  const modifierTotal = Object.values(selected).reduce((acc, id) => {
    for (const vars of Object.values(variantsByType)) {
      const v = vars.find(x => x.id === id)
      if (v) acc += Number(v.price_modifier_rsd) || 0
    }
    return acc
  }, 0)

  const unitPrice = priceRsd + modifierTotal
  const total = qty * unitPrice

  const handleOrder = () => {
    const params = new URLSearchParams({ product: productSlug, qty: String(qty), price: String(unitPrice) })
    const selectedIds = Object.values(selected).filter(Boolean)
    selectedIds.forEach(id => params.append('variant', id))
    router.push(`/naruci?${params.toString()}`)
  }

  const hasVariants = Object.keys(variantsByType).length > 0

  return (
    <div className="space-y-5 mt-2">
      {/* ── Variant pickers ── */}
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
              {vars.map(v => {
                const isSelected = selectedId === v.id
                const colorInfo = type === 'color' ? getColor(v.value) : null

                if (colorInfo) {
                  /* Color circle swatch */
                  return (
                    <button
                      key={v.id}
                      onClick={() => toggle(type, v.id)}
                      title={v.value}
                      aria-label={`Boja: ${v.value}`}
                      className={`
                        relative w-9 h-9 rounded-full transition-all duration-150 focus:outline-none
                        ${isSelected ? 'scale-110' : 'hover:scale-105'}
                      `}
                      style={{
                        backgroundColor: colorInfo.bg,
                        boxShadow: isSelected
                          ? `0 0 0 2px #19B6B2`
                          : `0 0 0 1.5px ${colorInfo.ring}`,
                      }}
                    >
                      {/* Checkmark when selected */}
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

                /* Text pill for size / material */
                return (
                  <button
                    key={v.id}
                    onClick={() => toggle(type, v.id)}
                    className={`
                      px-4 py-2 rounded-full border-2 font-semibold text-sm transition-all duration-150 focus:outline-none
                      ${isSelected
                        ? 'border-navy bg-navy text-white shadow'
                        : 'border-[#E2EAF0] text-gray-600 bg-white hover:border-teal hover:text-teal'
                      }
                    `}
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

      {/* ── Quantity row ── */}
      <div className="flex items-center gap-4 pt-1">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">Količina</span>
        <div className="flex items-center bg-white border-2 border-[#E2EAF0] rounded-full overflow-hidden shadow-sm">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            disabled={qty <= 1}
            className="w-11 h-11 flex items-center justify-center text-navy text-xl font-bold hover:bg-[#F4F7FA] transition-colors disabled:opacity-30 disabled:cursor-not-allowed select-none"
            aria-label="Smanji količinu"
          >
            −
          </button>
          <span className="w-10 text-center text-lg font-extrabold text-navy select-none">{qty}</span>
          <button
            onClick={() => setQty(q => Math.min(99, q + 1))}
            disabled={qty >= 99}
            className="w-11 h-11 flex items-center justify-center text-navy text-xl font-bold hover:bg-[#F4F7FA] transition-colors disabled:opacity-30 disabled:cursor-not-allowed select-none"
            aria-label="Povećaj količinu"
          >
            +
          </button>
        </div>

        {/* Live total when qty > 1 or modifier active */}
        {(qty > 1 || modifierTotal !== 0) && (
          <div className="ml-auto text-right">
            <div className="text-[10px] text-gray-400 font-semibold leading-none mb-0.5 uppercase tracking-wide">Ukupno</div>
            <div className="text-2xl font-extrabold text-navy leading-none">
              {total.toLocaleString()}
              <span className="text-sm font-semibold text-gray-400 ml-1">RSD</span>
            </div>
          </div>
        )}
      </div>

      {/* ── CTA button ── */}
      <div className="pt-1 space-y-3">
        <button
          onClick={handleOrder}
          disabled={!inStock}
          className={`w-full text-center text-base py-4 rounded-full font-bold transition-all ${
            inStock
              ? 'btn-primary cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {inStock
            ? qty > 1
              ? `Naruči ${qty} komada →`
              : 'Naruči sada →'
            : 'Trenutno nedostupno'}
        </button>
        <p className="text-center text-xs text-gray-400 font-medium">
          💳 Plaćanje pouzećem · 🚚 Post Express dostava · ✅ Bez registracije
        </p>
      </div>
    </div>
  )
}

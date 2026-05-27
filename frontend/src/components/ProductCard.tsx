'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cartStore'

interface Variant {
  id: string
  type: string
  value: string
  price_modifier_rsd?: number
  is_active?: boolean
}

export interface ProductCardProps {
  id: string
  slug: string
  name: string
  price: number
  comparePrice?: number
  discountPct?: number
  image?: string
  imageAlt?: string
  category?: string
  shortDescription?: string
  isNew?: boolean
  isFeatured?: boolean
  inStock: boolean
  variants: Variant[]
}

export default function ProductCard({
  id, slug, name, price, comparePrice, discountPct = 0,
  image, imageAlt, category, shortDescription,
  isNew, isFeatured, inStock, variants,
}: ProductCardProps) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selVariant, setSelVariant] = useState<Variant | null>(null)

  const activeVariants = variants.filter(v => v.is_active !== false)
  const hasVariants = activeVariants.length > 0

  const doAdd = (variant?: Variant) => {
    const finalPrice = variant
      ? price + (Number(variant.price_modifier_rsd) || 0)
      : price
    addToCart({
      id,
      type: 'product',
      name,
      price: finalPrice,
      image,
      variant: variant ? `${variant.type === 'color' ? 'Boja' : variant.type === 'size' ? 'Vel' : 'Mat'}: ${variant.value}` : undefined,
      variantId: variant?.id,
      slug,
    })
    setAdded(true)
    setShowModal(false)
    setSelVariant(null)
    setTimeout(() => setAdded(false), 1600)
  }

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!inStock) return
    if (hasVariants) {
      setShowModal(true)
    } else {
      doAdd()
    }
  }

  return (
    <>
      <div className="bg-white rounded-3xl border border-[#E2EAF0] overflow-hidden shadow-[0_4px_24px_rgba(11,31,59,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(11,31,59,0.1)] transition-all duration-200 group flex flex-col">

        {/* Image area + hover button */}
        <Link href={`/prodavnica/${slug}`} className="relative bg-[#F8FAFC] overflow-hidden block flex-shrink-0" style={{ aspectRatio: '4/3' }}>
          {discountPct > 0 && (
            <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm">
              -{discountPct}%
            </span>
          )}
          {isNew && !discountPct && (
            <span className="absolute top-3 right-3 z-10 bg-teal text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm">
              NOVO
            </span>
          )}
          {isFeatured && !isNew && (
            <span className="absolute top-3 right-3 z-10 bg-orange/90 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm">
              ⭐ TOP
            </span>
          )}
          {!inStock && (
            <div className="absolute inset-0 z-20 bg-white/70 flex items-center justify-center">
              <span className="bg-gray-600 text-white text-xs font-black px-3 py-1.5 rounded-full">RASPRODATO</span>
            </div>
          )}
          {image ? (
            <img
              src={image}
              alt={imageAlt || name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-2"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🐾</div>
          )}

          {/* Slide-up "Add to cart" on hover */}
          {inStock && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 p-2 z-10">
              <button
                onClick={handleCartClick}
                className={`w-full py-2 rounded-2xl text-sm font-bold text-white transition-colors shadow-lg ${
                  added ? 'bg-teal' : 'bg-navy/85 hover:bg-navy'
                }`}
              >
                {added ? '✓ Dodato u korpu!' : '+ Dodaj u korpu'}
              </button>
            </div>
          )}
        </Link>

        {/* Text info */}
        <div className="p-5 flex flex-col flex-1">
          {category && (
            <div className="text-xs font-bold text-teal uppercase tracking-widest mb-1">{category}</div>
          )}
          <Link href={`/prodavnica/${slug}`}>
            <h3 className="font-extrabold text-navy text-lg leading-tight mb-1 hover:text-teal transition-colors">{name}</h3>
          </Link>
          {shortDescription && (
            <p className="text-sm text-gray-400 font-medium line-clamp-2 mb-3 flex-1">{shortDescription}</p>
          )}

          {/* Price + quick-add button row */}
          <div className="flex items-end justify-between mt-auto pt-3 border-t border-[#F0F4F8]">
            <div>
              {discountPct > 0 && comparePrice ? (
                <>
                  <div className="text-xs text-gray-400 line-through font-medium leading-none mb-0.5">
                    {comparePrice.toLocaleString()} RSD
                  </div>
                  <div className="text-2xl font-extrabold text-red-500 leading-none">
                    {price.toLocaleString()}<span className="text-sm font-semibold ml-1">RSD</span>
                  </div>
                </>
              ) : (
                <div className="text-2xl font-extrabold text-navy leading-none">
                  {price.toLocaleString()}<span className="text-sm font-semibold text-gray-400 ml-1">RSD</span>
                </div>
              )}
            </div>
            <button
              onClick={handleCartClick}
              disabled={!inStock}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex-shrink-0 ${
                added
                  ? 'bg-teal text-white'
                  : inStock
                  ? 'bg-orange/10 text-orange hover:bg-orange hover:text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {added ? '✓ Dodato' : inStock ? '+ Korpa' : 'Rasprodato'}
            </button>
          </div>
        </div>
      </div>

      {/* Variant picker modal */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[9996]"
            onClick={() => { setShowModal(false); setSelVariant(null) }}
          />
          <div className="fixed inset-0 z-[9997] flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-extrabold text-navy text-lg">Odaberite opciju</h3>
                <button
                  onClick={() => { setShowModal(false); setSelVariant(null) }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" stroke="#0B1F3B" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-400 font-medium mb-5">{name}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {activeVariants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelVariant(selVariant?.id === v.id ? null : v)}
                    className={`px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-all ${
                      selVariant?.id === v.id
                        ? 'border-teal bg-teal/10 text-teal'
                        : 'border-[#E2EAF0] text-gray-600 hover:border-teal hover:text-teal'
                    }`}
                  >
                    {v.value}
                    {Number(v.price_modifier_rsd) !== 0 && (
                      <span className="ml-1 text-xs opacity-70">
                        ({Number(v.price_modifier_rsd) > 0 ? '+' : ''}{Number(v.price_modifier_rsd).toLocaleString()} RSD)
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => selVariant && doAdd(selVariant)}
                disabled={!selVariant}
                className="w-full py-3.5 rounded-full font-bold text-sm bg-navy text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#162d52] transition-all active:scale-95"
              >
                {selVariant ? `Dodaj u korpu — ${(price + (Number(selVariant.price_modifier_rsd) || 0)).toLocaleString()} RSD` : 'Odaberite opciju'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

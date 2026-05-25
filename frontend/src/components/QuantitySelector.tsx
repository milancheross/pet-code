'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  productSlug: string
  inStock: boolean
  priceRsd: number
}

export default function QuantitySelector({ productSlug, inStock, priceRsd }: Props) {
  const [qty, setQty] = useState(1)
  const router = useRouter()

  const dec = () => setQty(q => Math.max(1, q - 1))
  const inc = () => setQty(q => Math.min(99, q + 1))

  const total = qty * priceRsd

  const handleOrder = () => {
    router.push(`/naruci?product=${productSlug}&qty=${qty}&price=${priceRsd}`)
  }

  return (
    <div className="mt-8 space-y-4">
      {/* Quantity row */}
      <div className="flex items-center gap-4">
        <span className="label mb-0 text-sm font-bold text-gray-500 shrink-0">Količina</span>
        <div className="flex items-center gap-0 bg-white border-2 border-[#E2EAF0] rounded-full overflow-hidden shadow-sm">
          <button
            onClick={dec}
            disabled={qty <= 1}
            className="w-11 h-11 flex items-center justify-center text-navy text-xl font-bold hover:bg-[#F4F7FA] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Smanji količinu"
          >
            −
          </button>
          <span className="w-10 text-center text-lg font-extrabold text-navy select-none">
            {qty}
          </span>
          <button
            onClick={inc}
            disabled={qty >= 99}
            className="w-11 h-11 flex items-center justify-center text-navy text-xl font-bold hover:bg-[#F4F7FA] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Povećaj količinu"
          >
            +
          </button>
        </div>

        {/* Live total */}
        {qty > 1 && (
          <div className="ml-2 text-right">
            <div className="text-xs text-gray-400 font-semibold leading-none mb-0.5">Ukupno</div>
            <div className="text-xl font-extrabold text-navy leading-none">
              {total.toLocaleString()}
              <span className="text-sm font-semibold text-gray-400 ml-1">RSD</span>
            </div>
          </div>
        )}
      </div>

      {/* CTA button */}
      <button
        onClick={handleOrder}
        disabled={!inStock}
        className={`w-full block text-center text-base py-4 rounded-full font-bold transition-all ${
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
  )
}

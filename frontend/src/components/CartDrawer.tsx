'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cartStore'

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart()
  const [visible, setVisible] = useState(false)
  const [animIn, setAnimIn] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      // Two rAF for reliable CSS transition trigger
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimIn(true)))
    } else {
      setAnimIn(false)
      const t = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  if (!visible) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9997] transition-opacity duration-300"
        style={{ background: `rgba(0,0,0,${animIn ? 0.5 : 0})`, pointerEvents: animIn ? 'auto' : 'none' }}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-[9998] flex flex-col shadow-2xl transition-transform duration-300"
        style={{ transform: animIn ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2EAF0] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B1F3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span className="text-lg font-extrabold text-navy">Vaša korpa</span>
            {cartCount > 0 && (
              <span className="bg-teal text-white text-xs font-black px-2 py-0.5 rounded-full min-w-[22px] text-center">
                {cartCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F4F7FA] transition-colors"
            aria-label="Zatvori korpu"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" stroke="#0B1F3B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-6xl mb-5">🛒</div>
              <div className="font-extrabold text-navy text-xl mb-2">Korpa je prazna</div>
              <p className="text-gray-400 text-sm font-medium mb-7 max-w-[200px]">
                Pronađite savršene proizvode za vašeg ljubimca!
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-teal text-white font-bold px-6 py-3 rounded-full text-sm hover:bg-teal2 transition-colors shadow-[0_4px_14px_rgba(25,182,178,0.3)]"
              >
                Idi u prodavnicu →
              </button>
            </div>
          ) : (
            items.map(item => {
              const lineTotal = item.price * item.quantity
              return (
                <div
                  key={`${item.id}-${item.variantId ?? ''}`}
                  className="bg-[#F8FAFB] rounded-2xl p-3 flex gap-3 border border-[#E2EAF0]"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-white border border-[#E2EAF0] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                      : <span className="text-2xl">🐾</span>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-navy text-sm leading-tight mb-0.5 truncate">{item.name}</div>
                    {item.variant && (
                      <div className="text-xs text-gray-400 font-medium mb-1">{item.variant}</div>
                    )}
                    <div className="text-xs font-bold text-teal">{item.price.toLocaleString()} RSD / kom</div>

                    {/* Qty row */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center bg-white border border-[#E2EAF0] rounded-full overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center text-navy font-bold hover:bg-[#F4F7FA] disabled:opacity-30 transition-colors select-none"
                          aria-label="Smanji"
                        >−</button>
                        <span className="w-7 text-center text-sm font-extrabold text-navy select-none">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)}
                          disabled={item.quantity >= 10}
                          className="w-7 h-7 flex items-center justify-center text-navy font-bold hover:bg-[#F4F7FA] disabled:opacity-30 transition-colors select-none"
                          aria-label="Povećaj"
                        >+</button>
                      </div>
                      <span className="text-xs font-bold text-gray-500">= {lineTotal.toLocaleString()} RSD</span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.id, item.variantId)}
                    className="flex-shrink-0 self-start w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors rounded-full hover:bg-red-50 mt-0.5"
                    aria-label="Ukloni"
                  >
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#E2EAF0] p-4 space-y-3 flex-shrink-0 bg-white">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-500 text-sm">Ukupno:</span>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-navy">
                  {cartTotal.toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-gray-400 ml-1">RSD</span>
              </div>
            </div>
            <Link
              href="/naruci?from=cart"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-3.5 rounded-full font-bold text-base bg-orange text-white hover:bg-orange2 transition-all shadow-[0_4px_16px_rgba(255,107,74,0.3)] active:scale-95"
            >
              Nastavi ka narudžbini →
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2.5 rounded-full font-bold text-sm border-2 border-[#E2EAF0] text-gray-500 hover:border-navy hover:text-navy transition-all active:scale-95"
            >
              Nastavi kupovinu
            </button>
          </div>
        )}
      </div>
    </>
  )
}

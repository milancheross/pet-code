'use client'
import { useEffect, useState } from 'react'
import { useCart } from '@/lib/cartStore'

interface Props {
  dark?: boolean  // true = dark background nav (needs white icon)
}

export default function CartIconButton({ dark = false }: Props) {
  const { cartCount, setIsOpen, lastAdded } = useCart()
  const [bounce, setBounce] = useState(false)

  useEffect(() => {
    if (lastAdded) {
      setBounce(true)
      const t = setTimeout(() => setBounce(false), 700)
      return () => clearTimeout(t)
    }
  }, [lastAdded])

  const strokeColor = dark ? '#FFFFFF' : '#0B1F3B'

  return (
    <button
      onClick={() => setIsOpen(true)}
      className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all ${
        dark ? 'hover:bg-white/10' : 'hover:bg-[#F4F7FA]'
      } ${bounce ? 'animate-bounce' : ''}`}
      aria-label={`Korpa${cartCount > 0 ? ` — ${cartCount} artikal${cartCount === 1 ? '' : 'a'}` : ''}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      {cartCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-0.5 leading-none tabular-nums">
          {cartCount > 9 ? '9+' : cartCount}
        </span>
      )}
    </button>
  )
}

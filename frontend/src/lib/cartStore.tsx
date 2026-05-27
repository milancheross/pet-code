'use client'
import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'

export interface CartItem {
  id: string
  type: 'product' | 'tag'
  name: string
  price: number
  quantity: number
  image?: string
  variant?: string
  variantId?: string
  slug?: string
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeFromCart: (id: string, variantId?: string) => void
  updateQuantity: (id: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  lastAdded: string | null
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = 'petcode_cart'

function itemKey(id: string, variantId?: string) {
  return variantId ? `${id}::${variantId}` : id
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch { /* ignore parse errors */ }
    setLoaded(true)
  }, [])

  // Persist to localStorage after every change (skip first render)
  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }
    catch { /* ignore storage errors */ }
  }, [items, loaded])

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qty = Math.min(10, Math.max(1, item.quantity ?? 1))
    setItems(prev => {
      const key = itemKey(item.id, item.variantId)
      const existing = prev.find(i => itemKey(i.id, i.variantId) === key)
      if (existing) {
        return prev.map(i =>
          itemKey(i.id, i.variantId) === key
            ? { ...i, quantity: Math.min(10, i.quantity + qty) }
            : i
        )
      }
      return [...prev, { ...item, quantity: qty }]
    })
    // Trigger bounce animation on the cart icon
    if (timerRef.current) clearTimeout(timerRef.current)
    setLastAdded(item.id)
    timerRef.current = setTimeout(() => setLastAdded(null), 800)
  }, [])

  const removeFromCart = useCallback((id: string, variantId?: string) => {
    const key = itemKey(id, variantId)
    setItems(prev => prev.filter(i => itemKey(i.id, i.variantId) !== key))
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number, variantId?: string) => {
    const key = itemKey(id, variantId)
    if (quantity < 1) {
      setItems(prev => prev.filter(i => itemKey(i.id, i.variantId) !== key))
      return
    }
    setItems(prev =>
      prev.map(i =>
        itemKey(i.id, i.variantId) === key
          ? { ...i, quantity: Math.min(10, quantity) }
          : i
      )
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart,
      cartTotal, cartCount, isOpen, setIsOpen, lastAdded,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

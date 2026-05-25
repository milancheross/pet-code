'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const LINKS = [
  { href: '/', label: 'Početna' },
  { href: '/prodavnica', label: 'Prodavnica' },
  { href: '/o-nama', label: 'O nama' },
  { href: '/kontakt', label: 'Kontakt' },
  { href: '/login', label: 'Prijava' },
]

export default function HamburgerNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Hamburger button — only on < lg */}
      <button
        className="lg:hidden flex flex-col gap-1.5 p-2 rounded-xl hover:bg-gray-100 transition-colors"
        onClick={() => setOpen(true)}
        aria-label="Otvori meni"
      >
        <span className="block w-5 h-0.5 bg-navy rounded-full" />
        <span className="block w-5 h-0.5 bg-navy rounded-full" />
        <span className="block w-5 h-0.5 bg-navy rounded-full" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-[-8px_0_40px_rgba(11,31,59,0.15)] transform transition-transform duration-300 ease-out lg:hidden ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2EAF0]">
          <span className="font-extrabold text-lg text-navy">
            pet<span className="text-teal">code</span>
          </span>
          <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" aria-label="Zatvori meni">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="#0B1F3B" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <nav className="p-5 flex flex-col gap-1">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block px-4 py-3 rounded-2xl font-semibold text-gray-600 hover:bg-[#F4F7FA] hover:text-navy transition-colors">
              {l.label}
            </Link>
          ))}
          <Link href="/naruci" onClick={() => setOpen(false)}
            className="mt-3 btn-primary text-center block">
            Naruči
          </Link>
        </nav>
      </div>
    </>
  )
}

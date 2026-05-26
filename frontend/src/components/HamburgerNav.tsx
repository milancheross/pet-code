'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const LINKS = [
  { href: '/',           label: 'Početna' },
  { href: '/prodavnica', label: 'Prodavnica' },
  { href: '/o-nama',     label: 'O nama' },
  { href: '/naruci',     label: 'Naruči' },
  { href: '/login',      label: 'Prijava' },
]

export default function HamburgerNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      {/* ── Hamburger button ─────────────────────────────────── */}
      <button
        className="lg:hidden flex flex-col justify-center items-center gap-[5px] w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
        onClick={() => setOpen(true)}
        aria-label="Otvori meni"
        aria-expanded={open}
      >
        <span className="block w-5 h-[2px] bg-navy rounded-full" />
        <span className="block w-5 h-[2px] bg-navy rounded-full" />
        <span className="block w-5 h-[2px] bg-navy rounded-full" />
      </button>

      {/* ── Full-screen navy drawer ──────────────────────────── */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            background: '#0B1F3B',
          }}
        >
          {/* Close button */}
          <button
            onClick={close}
            aria-label="Zatvori meni"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 1l14 14M15 1L1 15" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Logo */}
          <div style={{ padding: '24px 32px 0' }}>
            <span style={{ fontWeight: 900, fontSize: 22, color: '#fff', letterSpacing: '-0.3px' }}>
              pet<span style={{ color: '#19B6B2' }}>code</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 500, marginLeft: 6 }}>.rs</span>
            </span>
          </div>

          {/* Nav links */}
          <nav style={{ marginTop: 24 }}>
            {LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                style={{
                  display: 'block',
                  padding: '20px 32px',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* CTA dugme */}
          <div style={{ padding: '32px 32px 0' }}>
            <Link
              href="/naruci"
              onClick={close}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '16px 32px',
                borderRadius: 9999,
                background: '#FF6B4A',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 17,
                textDecoration: 'none',
                boxShadow: '0 6px 24px rgba(255,107,74,0.4)',
              }}
            >
              Naruči odmah →
            </Link>
          </div>

          {/* Footer */}
          <div style={{
            position: 'absolute',
            bottom: 32,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 12,
            color: 'rgba(255,255,255,0.25)',
            fontWeight: 500,
          }}>
            © 2025 PetCode · Srbija
          </div>
        </div>
      )}
    </>
  )
}

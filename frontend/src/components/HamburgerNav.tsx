'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const LINKS = [
  { href: '/',            label: 'Početna' },
  { href: '/prodavnica',  label: 'Prodavnica' },
  { href: '/o-nama',      label: 'O nama' },
  { href: '/kontakt',     label: 'Kontakt' },
  { href: '/login',       label: 'Prijava' },
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
      {/* Hamburger button — visible only below lg */}
      <button
        className="lg:hidden flex flex-col justify-center gap-[5px] w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors items-center"
        onClick={() => setOpen(true)}
        aria-label="Otvori meni"
      >
        <span className="block w-5 h-[2px] bg-navy rounded-full" />
        <span className="block w-5 h-[2px] bg-navy rounded-full" />
        <span className="block w-5 h-[2px] bg-navy rounded-full" />
      </button>

      {/* Portal-like overlay + drawer — always in DOM for smooth animation */}
      <div
        aria-hidden={!open}
        className="lg:hidden"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {/* Overlay — semi-transparent black, no blur */}
        <div
          onClick={close}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: open ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Drawer — slides in from right, fully opaque white */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: '100vh',
            width: '100%',
            maxWidth: '320px',
            backgroundColor: '#ffffff',
            transform: open ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(11,31,59,0.18)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #E2EAF0',
            flexShrink: 0,
          }}>
            <span style={{ fontWeight: 800, fontSize: '20px', color: '#0B1F3B', letterSpacing: '-0.3px' }}>
              pet<span style={{ color: '#19B6B2' }}>code</span>
            </span>
            <button
              onClick={close}
              aria-label="Zatvori meni"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#F4F7FA',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="#0B1F3B" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
            {LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 52,
                  padding: '0 16px',
                  borderRadius: 16,
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#4B5563',
                  textDecoration: 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F4F7FA'; (e.currentTarget as HTMLElement).style.color = '#0B1F3B' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#4B5563' }}
              >
                {l.label}
              </Link>
            ))}

            {/* CTA */}
            <Link
              href="/naruci"
              onClick={close}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 52,
                marginTop: 12,
                borderRadius: 9999,
                backgroundColor: '#FF6B4A',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(255,107,74,0.4)',
                transition: 'background 0.15s',
              }}
            >
              Naruči
            </Link>
          </nav>

          {/* Footer info */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid #E2EAF0',
            flexShrink: 0,
            textAlign: 'center',
          }}>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>© 2025 PetCode · Srbija</span>
          </div>
        </div>
      </div>
    </>
  )
}

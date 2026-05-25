'use client'
import { useState, useEffect, useCallback } from 'react'

interface GalleryImage {
  url: string
  alt?: string | null
}

export default function ProductImageGallery({
  images,
  productName,
  discountPct,
  isNew,
  inStock,
}: {
  images: GalleryImage[]
  productName: string
  discountPct?: number
  isNew?: boolean
  inStock?: boolean
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

  const activeImg = images[activeIdx]

  /* ── keyboard navigation ── */
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowLeft')  setActiveIdx(i => (i - 1 + images.length) % images.length)
      if (e.key === 'ArrowRight') setActiveIdx(i => (i + 1) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, images.length])

  /* ── prevent body scroll when lightbox open ── */
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  const prev = useCallback(() => setActiveIdx(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setActiveIdx(i => (i + 1) % images.length), [images.length])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return
    const r = e.currentTarget.getBoundingClientRect()
    setZoomPos({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    })
  }

  return (
    <div className="space-y-3">
      {/* ── Main image ── */}
      <div
        className="relative bg-white rounded-3xl border border-[#E2EAF0] overflow-hidden shadow-[0_4px_24px_rgba(11,31,59,0.06)] flex items-center justify-center select-none group"
        style={{ minHeight: 300, maxHeight: 520, cursor: zoomed ? 'zoom-out' : 'zoom-in' }}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => { setZoomed(false); setZoomPos({ x: 50, y: 50 }) }}
        onMouseMove={handleMouseMove}
        onClick={() => setLightbox(true)}
      >
        {/* Badges */}
        {(discountPct ?? 0) > 0 && (
          <span className="absolute top-4 left-4 z-10 bg-red-500 text-white text-sm font-black px-3 py-1.5 rounded-full shadow pointer-events-none">
            -{discountPct}% POPUST
          </span>
        )}
        {isNew && !(discountPct ?? 0) && (
          <span className="absolute top-4 right-4 z-10 bg-teal text-white text-sm font-black px-3 py-1.5 rounded-full shadow pointer-events-none">
            NOVO
          </span>
        )}
        {inStock === false && (
          <div className="absolute inset-0 z-20 bg-white/80 flex items-center justify-center rounded-3xl pointer-events-none">
            <span className="bg-gray-700 text-white text-sm font-black px-4 py-2 rounded-full">RASPRODATO</span>
          </div>
        )}

        {/* Image with zoom */}
        {activeImg ? (
          <div className="w-full overflow-hidden flex items-center justify-center p-4" style={{ maxHeight: 480 }}>
            <img
              src={activeImg.url}
              alt={activeImg.alt || productName}
              className="w-full h-auto object-contain transition-transform duration-150 pointer-events-none"
              style={{
                maxHeight: 464,
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transform: zoomed ? 'scale(2)' : 'scale(1)',
              }}
              draggable={false}
            />
          </div>
        ) : (
          <div className="text-8xl py-16 pointer-events-none">🐾</div>
        )}

        {/* Zoom hint */}
        <div className="absolute bottom-3 right-3 z-10 bg-black/40 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          🔍 Klikni za uvećanje
        </div>

        {/* Nav arrows on main image (when multiple) */}
        {images.length > 1 && (
          <>
            <button
              className="absolute left-3 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              onClick={e => { e.stopPropagation(); prev() }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="#0B1F3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              className="absolute right-3 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              onClick={e => { e.stopPropagation(); next() }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="#0B1F3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-2xl border-2 overflow-hidden bg-white transition-all duration-150 ${
                activeIdx === i
                  ? 'border-teal shadow-[0_0_0_2px_rgba(25,182,178,0.25)]'
                  : 'border-[#E2EAF0] hover:border-gray-300 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/96 flex flex-col items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 z-10">
            <span className="text-white/60 text-sm font-semibold">{productName}</span>
            <div className="flex items-center gap-3">
              {images.length > 1 && (
                <span className="text-white/60 text-sm font-semibold">{activeIdx + 1} / {images.length}</span>
              )}
              <button
                onClick={() => setLightbox(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Prev/Next arrows */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
                onClick={e => { e.stopPropagation(); prev() }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M14 4L7 11l7 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button
                className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
                onClick={e => { e.stopPropagation(); next() }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M8 4l7 7-7 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </>
          )}

          {/* Full image */}
          <div
            className="flex items-center justify-center w-full px-16 py-20 max-h-screen"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={images[activeIdx]?.url}
              alt={images[activeIdx]?.alt || productName}
              className="max-w-full max-h-[80vh] object-contain"
              style={{ userSelect: 'none' }}
              draggable={false}
            />
          </div>

          {/* Thumbnail strip in lightbox */}
          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setActiveIdx(i) }}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all bg-white/5 ${
                    activeIdx === i ? 'border-white scale-110' : 'border-white/25 opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-contain p-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

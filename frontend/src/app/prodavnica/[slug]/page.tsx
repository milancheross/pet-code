import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'
import HamburgerNav from '@/components/HamburgerNav'
import { createAdminClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'

// Always render fresh — no static cache so admin changes appear instantly
export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: { slug: string } }) {
  noStore()
  let product: any = null
  let variants: any[] = []

  try {
    const sb = createAdminClient()
    const { data } = await sb
      .from('products')
      .select('*, categories(name,slug), product_images(url,alt,sort_order), product_variants(*)')
      .eq('slug', params.slug)
      .eq('is_active', true)
      .single()
    if (data) {
      product = data
      variants = data.product_variants?.filter((v: any) => v.is_active) || []
    }
  } catch {}

  if (!product) return notFound()

  const images = [...(product.product_images || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
  const mainImg = images[0]

  const variantsByType: Record<string, any[]> = {}
  variants.forEach((v: any) => {
    if (!variantsByType[v.type]) variantsByType[v.type] = []
    variantsByType[v.type].push(v)
  })

  const typeLabels: Record<string, string> = {
    color: 'Boja',
    size: 'Veličina',
    material: 'Materijal',
  }

  const discountPct = product.compare_at_price_rsd && product.compare_at_price_rsd > product.price_rsd
    ? Math.round(((product.compare_at_price_rsd - product.price_rsd) / product.compare_at_price_rsd) * 100)
    : 0

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <nav className="bg-white border-b border-[#E2EAF0] px-5 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <Link href="/"><PetCodeLogo size="sm" /></Link>
        <div className="flex items-center gap-3">
          <Link href="/naruci" className="hidden sm:block btn-primary text-sm px-5 py-2.5">Naruči</Link>
          <HamburgerNav />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-8">
          <Link href="/prodavnica" className="hover:text-teal transition-colors">Prodavnica</Link>
          <span>›</span>
          {product.categories && (
            <>
              <Link href={`/prodavnica?kategorija=${product.categories.slug}`} className="hover:text-teal transition-colors">
                {product.categories.name}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-navy">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Image gallery */}
          <div className="space-y-3">
            {/* Main image — natural aspect ratio, no cropping */}
            <div className="relative bg-white rounded-3xl border border-[#E2EAF0] overflow-hidden shadow-[0_4px_24px_rgba(11,31,59,0.06)] flex items-center justify-center p-4" style={{ minHeight: '300px', maxHeight: '520px' }}>
              {discountPct > 0 && (
                <span className="absolute top-4 left-4 z-10 bg-red-500 text-white text-sm font-black px-3 py-1.5 rounded-full shadow">
                  -{discountPct}% POPUST
                </span>
              )}
              {product.is_new && (
                <span className="absolute top-4 right-4 z-10 bg-teal text-white text-sm font-black px-3 py-1.5 rounded-full shadow">
                  NOVO
                </span>
              )}
              {!product.in_stock && (
                <div className="absolute inset-0 z-20 bg-white/80 flex items-center justify-center rounded-3xl">
                  <span className="bg-gray-700 text-white text-sm font-black px-4 py-2 rounded-full">RASPRODATO</span>
                </div>
              )}
              {mainImg ? (
                <img
                  src={mainImg.url}
                  alt={mainImg.alt || product.name}
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: '480px' }}
                />
              ) : (
                <div className="text-8xl py-12">🐾</div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 8).map((img: any, i: number) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#E2EAF0] overflow-hidden flex items-center justify-center p-1.5" style={{ aspectRatio: '1' }}>
                    <img src={img.url} alt={img.alt || product.name} className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div>
            {product.categories && (
              <Link href={`/prodavnica?kategorija=${product.categories.slug}`} className="text-xs font-bold text-teal uppercase tracking-widest mb-2 hover:underline inline-block">
                {product.categories.name}
              </Link>
            )}

            <h1 className="text-3xl font-extrabold text-navy mb-3 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* SKU */}
            {product.sku && (
              <div className="text-xs text-gray-400 font-mono mb-4">SKU: {product.sku}</div>
            )}

            {/* Price */}
            <div className="mb-6">
              {discountPct > 0 ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-extrabold text-red-500">
                    {Number(product.price_rsd).toLocaleString()}
                    <span className="text-xl font-semibold ml-1">RSD</span>
                  </span>
                  <span className="text-xl text-gray-400 line-through font-medium">
                    {Number(product.compare_at_price_rsd).toLocaleString()} RSD
                  </span>
                  <span className="bg-red-50 text-red-500 text-sm font-black px-2 py-0.5 rounded-lg">
                    Uštediš {(Number(product.compare_at_price_rsd) - Number(product.price_rsd)).toLocaleString()} RSD
                  </span>
                </div>
              ) : (
                <div className="text-4xl font-extrabold text-navy">
                  {Number(product.price_rsd).toLocaleString()}
                  <span className="text-xl font-semibold text-gray-400 ml-2">RSD</span>
                </div>
              )}

              {/* Stock status */}
              <div className={`mt-2 text-sm font-bold flex items-center gap-1.5 ${product.in_stock !== false ? 'text-teal' : 'text-gray-400'}`}>
                <span className={`w-2 h-2 rounded-full ${product.in_stock !== false ? 'bg-teal' : 'bg-gray-300'}`} />
                {product.in_stock !== false ? 'Na stanju' : 'Rasprodato'}
              </div>
            </div>

            {product.description && (
              <p className="text-gray-500 font-medium leading-relaxed mb-6 text-[15px]">
                {product.description}
              </p>
            )}

            {/* Variants */}
            {Object.entries(variantsByType).map(([type, vars]) => (
              <div key={type} className="mb-5">
                <div className="label mb-2">{typeLabels[type] || type}</div>
                <div className="flex gap-2 flex-wrap">
                  {vars.map((v: any) => (
                    <div
                      key={v.id}
                      className="px-4 py-2 rounded-full border-2 border-[#E2EAF0] font-semibold text-sm text-gray-600 bg-white hover:border-teal hover:text-teal cursor-pointer transition-colors"
                    >
                      {v.value}
                      {Number(v.price_modifier_rsd) !== 0 && (
                        <span className="ml-1 text-xs text-gray-400">
                          ({v.price_modifier_rsd > 0 ? '+' : ''}{Number(v.price_modifier_rsd).toLocaleString()} RSD)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* CTA */}
            <div className="mt-8 space-y-3">
              <Link
                href={`/naruci?product=${product.slug}`}
                className={`block text-center text-base py-4 rounded-full font-bold transition-all ${
                  product.in_stock !== false
                    ? 'btn-primary'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
                }`}
              >
                {product.in_stock !== false ? 'Naruči sada →' : 'Trenutno nedostupno'}
              </Link>
              <p className="text-center text-xs text-gray-400 font-medium">
                💳 Plaćanje pouzećem · 🚚 Post Express dostava · ✅ Bez registracije
              </p>
            </div>

            {/* Trust badges */}
            <div className="mt-6 bg-[#F4F7FA] rounded-2xl p-4 grid grid-cols-2 gap-3">
              {[
                { icon: '🔒', text: 'Bezbedna kupovina' },
                { icon: '🚚', text: 'Brza dostava' },
                { icon: '💰', text: 'Plaćanje pouzećem' },
                { icon: '↩️', text: 'Lako vraćanje' },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <span>{b.icon}</span>{b.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#E2EAF0] py-8 px-4 bg-white mt-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <PetCodeLogo size="sm" showTagline />
          <div className="text-xs text-gray-400 font-medium">© 2025 PetCode · Srbija · info@pet-code.rs</div>
          <div className="flex items-center gap-5">
            <Link href="/prodavnica" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Prodavnica</Link>
            <Link href="/naruci" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Naruči</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

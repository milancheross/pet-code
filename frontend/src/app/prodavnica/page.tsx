import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'
import HamburgerNav from '@/components/HamburgerNav'
import { createAdminClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'
import type { Metadata } from 'next'

// Belt-and-suspenders: force-dynamic + noStore() ensure zero caching
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Prodavnica — PetCode.rs',
  description: 'Kvalitetni privesci i dodaci za vaše ljubimce.',
}

async function getShopData() {
  noStore() // opt out of Next.js Data Cache explicitly
  try {
    const sb = createAdminClient()
    const [{ data: categories }, { data: products }] = await Promise.all([
      sb.from('categories').select('*').order('name'),
      sb.from('products')
        .select('*, categories(name,slug), product_images(url,alt,sort_order)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ])
    return { categories: categories || [], products: products || [] }
  } catch {
    return { categories: [], products: [] }
  }
}

function DiscountBadge({ pct }: { pct: number }) {
  return (
    <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm">
      -{pct}%
    </span>
  )
}

function NewBadge() {
  return (
    <span className="absolute top-3 right-3 z-10 bg-teal text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm">
      NOVO
    </span>
  )
}

export default async function ProdavnicaPage({
  searchParams,
}: {
  searchParams: Promise<{ kategorija?: string }> | { kategorija?: string }
}) {
  const { categories, products } = await getShopData()
  const sp = await Promise.resolve(searchParams)
  const activeCat = sp?.kategorija || 'sve'

  const featured = products.filter((p: any) => p.is_featured)
  const regular = products.filter((p: any) => !p.is_featured)
  const allSorted = [...featured, ...regular]

  const filtered = activeCat === 'sve'
    ? allSorted
    : allSorted.filter((p: any) => p.categories?.slug === activeCat)

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
        <div className="text-center mb-10">
          <div className="section-label mb-3">// prodavnica</div>
          <h1 className="text-4xl font-extrabold text-navy tracking-tight mb-3">Naši proizvodi</h1>
          <p className="text-gray-500 font-medium">Kvalitetni privesci i dodaci za vaše ljubimce.</p>
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8 justify-center">
            <Link
              href="/prodavnica"
              className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                activeCat === 'sve'
                  ? 'bg-navy border-navy text-white'
                  : 'border-[#E2EAF0] text-gray-500 bg-white hover:border-navy hover:text-navy'
              }`}
            >
              Sve
            </Link>
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/prodavnica?kategorija=${cat.slug}`}
                className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                  activeCat === cat.slug
                    ? 'bg-navy border-navy text-white'
                    : 'border-[#E2EAF0] text-gray-500 bg-white hover:border-navy hover:text-navy'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🐾</div>
            <h2 className="text-xl font-bold text-navy mb-2">Uskoro dostupno</h2>
            <p className="text-gray-400 font-medium">Radimo na pripremi naše prodavnice. Proveri uskoro!</p>
            <Link href="/naruci" className="btn-primary inline-block mt-6">Naruči privezak →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((product: any) => {
              const imgs = [...(product.product_images || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
              const img = imgs[0]
              const discountPct = product.compare_at_price_rsd && product.compare_at_price_rsd > product.price_rsd
                ? Math.round(((product.compare_at_price_rsd - product.price_rsd) / product.compare_at_price_rsd) * 100)
                : 0

              return (
                <Link
                  key={product.id}
                  href={`/prodavnica/${product.slug}`}
                  className="bg-white rounded-3xl border border-[#E2EAF0] overflow-hidden shadow-[0_4px_24px_rgba(11,31,59,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(11,31,59,0.1)] transition-all duration-200 group flex flex-col"
                >
                  {/* Image */}
                  <div className="relative bg-[#F8FAFC] overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    {discountPct > 0 && <DiscountBadge pct={discountPct} />}
                    {product.is_new && !discountPct && <NewBadge />}
                    {product.is_featured && (
                      <span className="absolute top-3 right-3 z-10 bg-orange/90 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm">
                        ⭐ TOP
                      </span>
                    )}
                    {!product.in_stock && (
                      <div className="absolute inset-0 z-20 bg-white/70 flex items-center justify-center">
                        <span className="bg-gray-600 text-white text-xs font-black px-3 py-1.5 rounded-full">RASPRODATO</span>
                      </div>
                    )}
                    {img ? (
                      <img
                        src={img.url}
                        alt={img.alt || product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">🐾</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col flex-1">
                    {product.categories && (
                      <div className="text-xs font-bold text-teal uppercase tracking-widest mb-1">
                        {product.categories.name}
                      </div>
                    )}
                    <h3 className="font-extrabold text-navy text-lg leading-tight mb-1">{product.name}</h3>
                    {(product.short_description || product.description) && (
                      <p className="text-sm text-gray-400 font-medium line-clamp-2 mb-3 flex-1">
                        {product.short_description || product.description}
                      </p>
                    )}
                    <div className="flex items-end justify-between mt-auto pt-3 border-t border-[#F0F4F8]">
                      <div>
                        {discountPct > 0 ? (
                          <>
                            <div className="text-xs text-gray-400 line-through font-medium leading-none mb-0.5">
                              {Number(product.compare_at_price_rsd).toLocaleString()} RSD
                            </div>
                            <div className="text-2xl font-extrabold text-red-500 leading-none">
                              {Number(product.price_rsd).toLocaleString()}
                              <span className="text-sm font-semibold ml-1">RSD</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-2xl font-extrabold text-navy leading-none">
                            {Number(product.price_rsd).toLocaleString()}
                            <span className="text-sm font-semibold text-gray-400 ml-1">RSD</span>
                          </div>
                        )}
                      </div>
                      <span className="bg-orange/10 text-orange text-xs font-bold px-3 py-1.5 rounded-full group-hover:bg-orange group-hover:text-white transition-colors">
                        Naruči →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-[#E2EAF0] py-8 px-4 bg-white mt-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <PetCodeLogo size="sm" showTagline />
          <div className="text-xs text-gray-400 font-medium">© 2025 PetCode · Srbija · info@pet-code.rs</div>
          <div className="flex items-center gap-5">
            <Link href="/" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Početna</Link>
            <Link href="/o-nama" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">O nama</Link>
            <Link href="/naruci" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Naruči</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

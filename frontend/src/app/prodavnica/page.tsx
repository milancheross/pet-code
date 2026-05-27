import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'
import HamburgerNav from '@/components/HamburgerNav'
import CartIconButton from '@/components/CartIconButton'
import ProductCard from '@/components/ProductCard'
import { createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prodavnica — PetCode.rs',
  description: 'Kvalitetni privesci i dodaci za vaše ljubimce.',
}

async function getShopData() {
  try {
    const sb = createAdminClient()
    const [{ data: categories }, { data: products }] = await Promise.all([
      sb.from('categories').select('*').order('name'),
      sb.from('products')
        .select('*, categories(name,slug), product_images(url,alt,sort_order), product_variants(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ])
    return { categories: categories || [], products: products || [] }
  } catch {
    return { categories: [], products: [] }
  }
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
        <div className="flex items-center gap-2">
          <CartIconButton />
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

        {/* Product grid */}
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
              const now = new Date()
              const regularPrice = product.regular_price_rsd ?? product.price_rsd ?? 0
              const hasSale = product.sale_price_rsd && product.sale_price_rsd < regularPrice &&
                (!product.sale_start || new Date(product.sale_start) <= now) &&
                (!product.sale_end   || new Date(product.sale_end)   >= now)
              const effectivePrice = hasSale ? product.sale_price_rsd : regularPrice
              const discountPct = hasSale
                ? Math.round((1 - effectivePrice / regularPrice) * 100)
                : (product.compare_at_price_rsd && product.compare_at_price_rsd > product.price_rsd
                    ? Math.round(((product.compare_at_price_rsd - product.price_rsd) / product.compare_at_price_rsd) * 100)
                    : 0)
              const comparePrice = hasSale ? regularPrice
                : (product.compare_at_price_rsd || 0)

              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  name={product.name}
                  price={effectivePrice}
                  comparePrice={comparePrice || undefined}
                  discountPct={discountPct}
                  image={img?.url}
                  imageAlt={img?.alt}
                  category={product.categories?.name}
                  shortDescription={product.short_description || product.description}
                  isNew={product.is_new}
                  isFeatured={product.is_featured}
                  inStock={product.in_stock !== false}
                  variants={product.product_variants || []}
                />
              )
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-[#E2EAF0] py-8 px-4 bg-white mt-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <PetCodeLogo size="sm" showTagline />
          <div className="text-xs text-gray-400 font-medium">© 2025 PetCode · Srbija · petcodeoffice@gmail.com</div>
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

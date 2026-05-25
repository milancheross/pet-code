import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'
import HamburgerNav from '@/components/HamburgerNav'
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
      sb.from('products').select('*, categories(name,slug), product_images(url,alt,sort_order)').eq('is_active', true).order('created_at', { ascending: false }),
    ])
    return { categories: categories || [], products: products || [] }
  } catch {
    return { categories: [], products: [] }
  }
}

export default async function ProdavnicaPage({ searchParams }: { searchParams: { kategorija?: string } }) {
  const { categories, products } = await getShopData()
  const activeCat = searchParams?.kategorija || 'sve'

  const filtered = activeCat === 'sve'
    ? products
    : products.filter((p: any) => p.categories?.slug === activeCat)

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

        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8 justify-center">
            <Link href="/prodavnica"
              className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${activeCat === 'sve' ? 'bg-navy border-navy text-white' : 'border-[#E2EAF0] text-gray-500 bg-white hover:border-navy'}`}>
              Sve
            </Link>
            {categories.map((cat: any) => (
              <Link key={cat.id} href={`/prodavnica?kategorija=${cat.slug}`}
                className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${activeCat === cat.slug ? 'bg-navy border-navy text-white' : 'border-[#E2EAF0] text-gray-500 bg-white hover:border-navy'}`}>
                {cat.name}
              </Link>
            ))}
          </div>
        )}

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
              const img = product.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order)[0]
              return (
                <Link key={product.id} href={`/prodavnica/${product.slug}`}
                  className="bg-white rounded-3xl border border-[#E2EAF0] overflow-hidden shadow-[0_4px_24px_rgba(11,31,59,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(11,31,59,0.1)] transition-all group">
                  <div className="aspect-square bg-[#F4F7FA] flex items-center justify-center overflow-hidden">
                    {img
                      ? <img src={img.url} alt={img.alt || product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="text-6xl">🐾</div>
                    }
                  </div>
                  <div className="p-5">
                    {product.categories && (
                      <div className="text-xs font-bold text-teal uppercase tracking-widest mb-1">{product.categories.name}</div>
                    )}
                    <h3 className="font-extrabold text-navy text-lg leading-tight mb-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-3">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-extrabold text-navy">{Number(product.price_rsd).toLocaleString()} <span className="text-sm font-semibold text-gray-400">RSD</span></span>
                      <span className="bg-orange/10 text-orange text-xs font-bold px-3 py-1.5 rounded-full">Naruči →</span>
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

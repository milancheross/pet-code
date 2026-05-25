import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'
import HamburgerNav from '@/components/HamburgerNav'
import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

// Always render fresh — no static cache so admin changes appear instantly
export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: { slug: string } }) {
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

  const images = product.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || []
  const mainImg = images[0]

  const variantsByType: Record<string, any[]> = {}
  variants.forEach((v: any) => {
    if (!variantsByType[v.type]) variantsByType[v.type] = []
    variantsByType[v.type].push(v)
  })

  const typeLabels: Record<string, string> = { color: 'Boja', size: 'Veličina', material: 'Materijal' }

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
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-8">
          <Link href="/prodavnica" className="hover:text-teal transition-colors">Prodavnica</Link>
          <span>›</span>
          {product.categories && <><Link href={`/prodavnica?kategorija=${product.categories.slug}`} className="hover:text-teal transition-colors">{product.categories.name}</Link><span>›</span></>}
          <span className="text-navy">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <div className="aspect-square bg-white rounded-3xl border border-[#E2EAF0] overflow-hidden flex items-center justify-center shadow-[0_4px_24px_rgba(11,31,59,0.06)]">
              {mainImg
                ? <img src={mainImg.url} alt={mainImg.alt || product.name} className="w-full h-full object-cover" />
                : <div className="text-8xl">🐾</div>
              }
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((img: any, i: number) => (
                  <div key={i} className="aspect-square bg-white rounded-2xl border border-[#E2EAF0] overflow-hidden">
                    <img src={img.url} alt={img.alt || product.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.categories && (
              <div className="text-xs font-bold text-teal uppercase tracking-widest mb-2">{product.categories.name}</div>
            )}
            <h1 className="text-3xl font-extrabold text-navy mb-3 tracking-tight">{product.name}</h1>

            <div className="text-4xl font-extrabold text-navy mb-6">
              {Number(product.price_rsd).toLocaleString()}
              <span className="text-xl font-semibold text-gray-400 ml-2">RSD</span>
            </div>

            {product.description && (
              <p className="text-gray-500 font-medium leading-relaxed mb-6">{product.description}</p>
            )}

            {Object.entries(variantsByType).map(([type, vars]) => (
              <div key={type} className="mb-5">
                <div className="label mb-2">{typeLabels[type] || type}</div>
                <div className="flex gap-2 flex-wrap">
                  {vars.map((v: any) => (
                    <div key={v.id}
                      className="px-4 py-2 rounded-full border-2 border-[#E2EAF0] font-semibold text-sm text-gray-600 bg-white hover:border-teal hover:text-teal cursor-pointer transition-colors">
                      {v.value}
                      {v.price_modifier_rsd !== 0 && (
                        <span className="ml-1 text-xs text-gray-400">({v.price_modifier_rsd > 0 ? '+' : ''}{v.price_modifier_rsd} RSD)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-8 space-y-3">
              <Link href={`/naruci?product=${product.slug}`} className="btn-primary block text-center text-base py-4">
                Naruči sada →
              </Link>
              <p className="text-center text-xs text-gray-400 font-medium">
                💳 Plaćanje pouzećem · 🚚 Post Express dostava · ✅ Bez registracije
              </p>
            </div>

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

import Link from 'next/link'
import PetCodeLogo from '@/components/PetCodeLogo'
import HamburgerNav from '@/components/HamburgerNav'
import CartIconButton from '@/components/CartIconButton'
import ProductImageGallery from '@/components/ProductImageGallery'
import ProductActions from '@/components/ProductActions'
import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

// ISR: revalidate every hour; admin triggers revalidatePath on product changes
export const revalidate = 3600

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const sb = createAdminClient()
    const { data } = await sb
      .from('products')
      .select('name, description, meta_title, meta_description, keywords, product_images(url,sort_order)')
      .eq('slug', params.slug)
      .eq('is_active', true)
      .single()
    if (!data) return { title: 'Prodavnica — PetCode.rs' }
    const imgs = [...((data as any).product_images || [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
    const firstImg = (imgs[0] as any)?.url as string | undefined
    const desc = (data as any).meta_description
      || ((data as any).description
        ? String((data as any).description)
        : `Kupi ${(data as any).name} na PetCode.rs. QR privezak za kućne ljubimce — nerđajući čelik, doživotni profil. Dostava Post Express-om. Plaćanje pouzećem.`)
    const title = (data as any).meta_title
      ? String((data as any).meta_title)
      : `${(data as any).name} — PetCode.rs`
    return {
      title,
      description: desc,
      keywords: (data as any).keywords || 'qr privezak, qr tag ljubimac srbija, pet qr code tag, privezak za pse',
      openGraph: {
        title: String((data as any).name),
        description: desc,
        images: firstImg ? [{ url: firstImg }] : [],
        type: 'website',
      },
    }
  } catch {
    return { title: 'Prodavnica — PetCode.rs' }
  }
}

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

  const images = [...(product.product_images || [])]
    .filter((img: any) => img.url)
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
  const mainImg = images[0]

  const variantsByType: Record<string, any[]> = {}
  variants.forEach((v: any) => {
    if (!variantsByType[v.type]) variantsByType[v.type] = []
    variantsByType[v.type].push(v)
  })

  // Effective price: use sale_price_rsd if active, otherwise regular_price_rsd or price_rsd (back-compat)
  const regularPrice = product.regular_price_rsd ?? product.price_rsd ?? 0
  const now = new Date()
  const hasSale = product.sale_price_rsd && product.sale_price_rsd < regularPrice &&
    (!product.sale_start || new Date(product.sale_start) <= now) &&
    (!product.sale_end   || new Date(product.sale_end)   >= now)
  const effectivePrice = hasSale ? product.sale_price_rsd : regularPrice

  const discountPct = hasSale
    ? Math.round((1 - effectivePrice / regularPrice) * 100)
    : (product.compare_at_price_rsd && product.compare_at_price_rsd > product.price_rsd
        ? Math.round(((product.compare_at_price_rsd - product.price_rsd) / product.compare_at_price_rsd) * 100)
        : 0)

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
          {/* Image gallery — interactive zoom + lightbox */}
          <ProductImageGallery
            images={images}
            productName={product.name}
            discountPct={discountPct}
            isNew={product.is_new}
            inStock={product.in_stock}
          />

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
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-4xl font-extrabold text-red-500">
                    {Number(effectivePrice).toLocaleString()}
                    <span className="text-xl font-semibold ml-1">RSD</span>
                  </span>
                  <span className="text-xl text-gray-400 line-through font-medium">
                    {Number(regularPrice).toLocaleString()} RSD
                  </span>
                  <span className="bg-red-50 text-red-500 text-sm font-black px-2 py-0.5 rounded-lg">
                    Uštediš {(Number(regularPrice) - Number(effectivePrice)).toLocaleString()} RSD
                  </span>
                </div>
              ) : (
                <div className="text-4xl font-extrabold text-navy">
                  {Number(effectivePrice).toLocaleString()}
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

            {/* Variants + Quantity + CTA (all interactive, client component) */}
            <ProductActions
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              productImage={mainImg?.url}
              inStock={product.in_stock !== false}
              priceRsd={effectivePrice}
              variantsByType={variantsByType}
            />

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
          <div className="text-xs text-gray-400 font-medium">© 2026 PetCode · Srbija · petcodeoffice@gmail.com</div>
          <div className="flex items-center gap-5">
            <Link href="/prodavnica" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Prodavnica</Link>
            <Link href="/naruci" className="text-xs text-gray-400 font-semibold hover:text-teal transition-colors">Naruči</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

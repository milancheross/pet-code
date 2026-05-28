import { createAdminClient } from '@/lib/supabase/server'
import HomeClient from '@/components/HomeClient'
import type { Metadata } from 'next'
import type { ProductCardProps } from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'PetCode.rs — QR identifikacija ljubimaca | Srbija',
  description: 'QR privezak od nerđajućeg čelika za pse i mačke. Skeniranjem koda dobijate kontakt vlasnika i lokaciju ljubimca. Dostava Post Express-om po celoj Srbiji. Plaćanje pouzećem.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pet-code.rs'),
  openGraph: {
    title: 'PetCode.rs — QR identifikacija ljubimaca',
    description: 'QR privezak od nerđajućeg čelika za pse i mačke. Plaćanje pouzećem. Dostava po Srbiji.',
    url: 'https://pet-code.rs',
    siteName: 'PetCode.rs',
    locale: 'sr_RS',
    type: 'website',
  },
  keywords: ['qr privezak', 'privezak za pse', 'identifikacija ljubimaca', 'petcode', 'qr tag ljubimac srbija', 'pet qr code tag'],
}

async function getShopProducts(): Promise<ProductCardProps[]> {
  try {
    const sb = createAdminClient()
    const now = new Date()
    const { data } = await sb
      .from('products')
      .select('*, product_images(url,alt,sort_order), product_variants(*), categories(name,slug)')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6)

    if (!data?.length) return []

    return data.map((p: any) => {
      const regularPrice = p.regular_price_rsd ?? p.price_rsd ?? 0
      const hasSale =
        p.sale_price_rsd && p.sale_price_rsd < regularPrice &&
        (!p.sale_start || new Date(p.sale_start) <= now) &&
        (!p.sale_end   || new Date(p.sale_end)   >= now)
      const salePrice = hasSale ? p.sale_price_rsd : null
      const effectivePrice = salePrice ?? regularPrice
      const discountPct = salePrice ? Math.round((1 - salePrice / regularPrice) * 100) : 0

      const images = [...(p.product_images || [])]
        .filter((img: any) => img.url)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)

      return {
        id:               p.id as string,
        slug:             p.slug as string,
        name:             p.name as string,
        price:            effectivePrice,
        comparePrice:     salePrice ? regularPrice : undefined,
        discountPct:      discountPct || undefined,
        image:            images[0]?.url ?? undefined,
        imageAlt:         images[0]?.alt ?? undefined,
        category:         (p.categories as any)?.name ?? undefined,
        shortDescription: (p.short_description || p.description || '') as string,
        inStock:          p.in_stock !== false,
        isNew:            !!p.is_new,
        isFeatured:       !!p.is_featured,
        variants:         (p.product_variants || []).filter((v: any) => v.is_active !== false),
      }
    })
  } catch {
    return []
  }
}

export default async function Page() {
  const shopProducts = await getShopProducts()
  return <HomeClient shopProducts={shopProducts} />
}

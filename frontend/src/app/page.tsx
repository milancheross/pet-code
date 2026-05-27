import { createAdminClient } from '@/lib/supabase/server'
import HomeClient from '@/components/HomeClient'
import type { Metadata } from 'next'

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

async function getFeaturedProduct() {
  try {
    const sb = createAdminClient()
    const now = new Date()
    const { data } = await sb
      .from('products')
      .select('*, product_images(url,alt,sort_order), categories(name,slug)')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!data) return null

    const regularPrice = (data as any).regular_price_rsd ?? (data as any).price_rsd ?? 0
    const hasSale =
      (data as any).sale_price_rsd &&
      (data as any).sale_price_rsd < regularPrice &&
      (!(data as any).sale_start || new Date((data as any).sale_start) <= now) &&
      (!(data as any).sale_end   || new Date((data as any).sale_end)   >= now)
    const salePrice: number | null = hasSale ? (data as any).sale_price_rsd : null
    const effectivePrice = salePrice ?? regularPrice
    const discountPct = salePrice ? Math.round((1 - salePrice / regularPrice) * 100) : 0

    const images = [...((data as any).product_images || [])].sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    )

    return {
      name: (data as any).name as string,
      slug: (data as any).slug as string,
      regularPrice,
      salePrice,
      effectivePrice,
      discountPct,
      image: images[0]?.url ?? null,
      description: ((data as any).short_description || (data as any).description || '') as string,
      category: ((data as any).categories as any)?.name ?? null,
    }
  } catch {
    return null
  }
}

export default async function Page() {
  const featuredProduct = await getFeaturedProduct()
  return <HomeClient featuredProduct={featuredProduct} />
}

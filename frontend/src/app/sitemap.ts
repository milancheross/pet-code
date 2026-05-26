import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

const BASE = 'https://pet-code.rs'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                    lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/prodavnica`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/naruci`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/o-nama`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/kontakt`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  let petRoutes: MetadataRoute.Sitemap = []
  let productRoutes: MetadataRoute.Sitemap = []

  try {
    const sb = createAdminClient()
    const [{ data: pets }, { data: products }] = await Promise.all([
      sb.from('pets').select('id, updated_at').order('updated_at', { ascending: false }),
      sb.from('products').select('slug, updated_at').eq('is_active', true),
    ])

    if (pets) {
      petRoutes = pets.map((pet: { id: string; updated_at: string | null }) => ({
        url: `${BASE}/ljubimac/${pet.id}`,
        lastModified: pet.updated_at ? new Date(pet.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }

    if (products) {
      productRoutes = products.map((p: { slug: string; updated_at: string | null }) => ({
        url: `${BASE}/prodavnica/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch {
    // Baza nedostupna — vratiti samo statičke rute
  }

  return [...staticRoutes, ...productRoutes, ...petRoutes]
}

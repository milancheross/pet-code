import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

export const revalidate = 3600 // regeneriši svaki sat

const BASE = 'https://www.pet-code.rs'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                    lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/prodavnica`,    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/naruci`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/o-nama`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/login`,         lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  ]

  let categoryRoutes: MetadataRoute.Sitemap = []
  let productRoutes: MetadataRoute.Sitemap = []
  let petRoutes: MetadataRoute.Sitemap = []

  const sb = createAdminClient()

  // Kategorije
  try {
    const { data: categories } = await sb
      .from('categories')
      .select('slug, updated_at')
    if (categories) {
      categoryRoutes = categories.map((c: { slug: string; updated_at: string | null }) => ({
        url: `${BASE}/prodavnica?kategorija=${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch {
    // Baza nedostupna — preskočiti kategorije
  }

  // Proizvodi
  try {
    const { data: products } = await sb
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true)
    if (products) {
      productRoutes = products.map((p: { slug: string; updated_at: string | null }) => ({
        url: `${BASE}/prodavnica/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch {
    // Baza nedostupna — preskočiti proizvode
  }

  // Profili ljubimaca
  try {
    const { data: pets } = await sb
      .from('pets')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
    if (pets) {
      petRoutes = pets.map((pet: { id: string; updated_at: string | null }) => ({
        url: `${BASE}/ljubimac/${pet.id}`,
        lastModified: pet.updated_at ? new Date(pet.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch {
    // Baza nedostupna — preskočiti ljubimce
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...petRoutes]
}

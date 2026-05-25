import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

const BASE = 'https://www.pet-code.rs'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/naruci`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/kontakt`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/login`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  let petRoutes: MetadataRoute.Sitemap = []

  try {
    const sb = createAdminClient()
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
    // Baza nedostupna — vratiti samo statičke rute
  }

  return [...staticRoutes, ...petRoutes]
}

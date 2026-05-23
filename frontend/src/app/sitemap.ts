import type { MetadataRoute } from 'next'

const BASE = 'https://www.pet-code.rs'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 1 },
    { url: `${BASE}/naruci`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/kontakt`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/login`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]
}

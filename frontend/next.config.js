/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: '*.supabase.co',
      pathname: '/storage/v1/object/public/**',
    }],
  },
  experimental: {
    staleTimes: {
      dynamic: 0,   // never cache dynamic pages in client router — instant admin updates
      static: 180,
    },
  },
}
module.exports = nextConfig

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

export default function Page() {
  return <HomeClient />
}

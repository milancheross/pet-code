import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { LangProvider } from '@/lib/i18n/LangContext'
import { Analytics } from '@vercel/analytics/next'

const manrope = Manrope({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-manrope' })

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
  keywords: ['qr privezak', 'privezak za pse', 'identifikacija ljubimaca', 'petcode', 'qr oznaka ljubimac srbija'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <body className={`${manrope.variable} font-sans antialiased`}>
        <LangProvider>{children}</LangProvider>
        <Analytics />
      </body>
    </html>
  )
}

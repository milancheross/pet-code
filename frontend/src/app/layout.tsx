import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { LangProvider } from '@/lib/i18n/LangContext'

const manrope = Manrope({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-manrope' })

export const metadata: Metadata = {
  title: 'PetCode.rs — QR identifikacija ljubimaca',
  description: 'Skeniranjem QR koda na privetku dobijate sve podatke o ljubimcu i kontakt vlasnika.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://petcode.rs'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <body className={`${manrope.variable} font-sans antialiased`}>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  )
}

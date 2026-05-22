import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { LangProvider } from '@/lib/i18n/LangContext'

const nunito = Nunito({ subsets: ['latin'], weight: ['400','600','700','800','900'], variable: '--font-nunito' })

export const metadata: Metadata = {
  title: 'PetCode.rs — QR identifikacija ljubimaca',
  description: 'Skeniranjem QR koda na privetku dobijate sve podatke o ljubimcu i kontakt vlasnika.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://petcode.rs'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <body className={`${nunito.variable} font-sans antialiased`}>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  )
}

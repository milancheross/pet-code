import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aktivacija QR koda — PetCode.rs',
  robots: { index: false, follow: false },
}

export default function AktivacijaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

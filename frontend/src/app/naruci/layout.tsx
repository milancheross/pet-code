import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Naruči QR privezak — PetCode.rs',
  description: 'Naruči QR privezak od nerđajućeg čelika za svog ljubimca. Plaćanje pouzećem, dostava Post Express-om po Srbiji.',
  robots: { index: false, follow: false },
}

export default function NaruciLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

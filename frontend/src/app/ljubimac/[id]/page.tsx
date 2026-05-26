import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import type { PetFull } from '@/lib/types'
import PetClient from './PetClient'

// React.cache() deduplicates the DB call within a single request —
// generateMetadata and the page component share one round-trip.
const getPet = cache(async (id: string) => {
  const sb = createAdminClient()
  const { data: pet } = await sb
    .from('pets')
    .select('*, qr_codes(*), owners(*), health_records(*)')
    .eq('id', id)
    .order('record_date', { referencedTable: 'health_records', ascending: false })
    .single()
  return pet
})

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const pet = await getPet(params.id)
  if (!pet) return { title: 'PetCode.rs' }
  return {
    title: `${pet.name} — PetCode.rs`,
    description: `Profil ljubimca ${pet.name}. Skeniraj QR kod i kontaktiraj vlasnika.`,
  }
}

export default async function PetPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { novi?: string }
}) {
  const pet = await getPet(params.id)
  if (!pet) notFound()
  return <PetClient pet={pet as PetFull} isNew={searchParams.novi === '1'} />
}

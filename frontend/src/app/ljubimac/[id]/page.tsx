import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { PetFull } from '@/lib/types'
import { SPECIES_EMOJI } from '@/lib/types'
import Image from 'next/image'
import PetClient from './PetClient'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const sb = createClient()
  const { data } = await sb.from('pets').select('name').eq('id', params.id).single()
  return { title: data ? `${data.name} — PetCode.rs` : 'PetCode.rs' }
}

export default async function PetPage({ params, searchParams }: { params: { id: string }, searchParams: { novi?: string } }) {
  const sb = createClient()
  const { data: pet, error } = await sb
    .from('pets')
    .select('*, qr_codes(*), owners(*), health_records(*)')
    .eq('id', params.id)
    .order('record_date', { referencedTable: 'health_records', ascending: false })
    .single()

  if (error || !pet) notFound()
  return <PetClient pet={pet as PetFull} isNew={searchParams.novi === '1'} />
}

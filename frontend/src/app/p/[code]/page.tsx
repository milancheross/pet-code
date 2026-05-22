import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'

export default async function QrPage({ params }: { params: { code: string } }) {
  const supabase = createClient()
  const code = params.code.toUpperCase()

  const { data: qr } = await supabase.from('qr_codes').select('*').eq('code', code).single()
  if (!qr) notFound()
  if (qr.status === 'disabled') redirect('/qr-invalid')
  if (qr.status === 'unused') redirect(`/aktivacija/${code}`)

  const { data: pet } = await supabase.from('pets').select('id').eq('qr_code_id', qr.id).single()
  if (!pet) redirect(`/aktivacija/${code}`)

  // Log scan
  await supabase.from('scan_logs').insert({ qr_code_id: qr.id, pet_id: pet.id })

  redirect(`/ljubimac/${pet.id}`)
}

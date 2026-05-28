import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import { verifySessionToken } from '@/lib/adminAuth'

function checkAuth(req: NextRequest) {
  return verifySessionToken(req.headers.get('x-session-token'))
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const sb = createAdminClient()
  const [qrR, ordersR, petsR] = await Promise.all([
    sb.from('qr_codes').select('*').order('created_at', { ascending: false }),
    sb.from('orders').select('*').order('created_at', { ascending: false }),
    sb.from('pets').select('*, owners(*), qr_codes(code)').order('created_at', { ascending: false }),
  ])
  return NextResponse.json({
    qr: qrR.data || [],
    orders: ordersR.data || [],
    pets: petsR.data || []
  })
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const sb = createAdminClient()
  const { action, payload } = await req.json()

  if (action === 'generate_qr') {
    const codes = Array.from({ length: payload.count }, () => ({
      code: 'PC-' + randomBytes(3).toString('hex').toUpperCase()
    }))
    const { error } = await sb.from('qr_codes').insert(codes)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'update_qr') {
    await sb.from('qr_codes').update({ status: payload.status }).eq('id', payload.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'bulk_delete_qr') {
    const { ids } = payload
    if (!ids || !ids.length) return NextResponse.json({ ok: true })
    // Only allow deleting unused codes
    const { data: rows } = await sb.from('qr_codes').select('id, status').in('id', ids)
    const deletable = (rows || []).filter((r: any) => r.status === 'unused').map((r: any) => r.id)
    if (deletable.length === 0) return NextResponse.json({ error: 'Nema neiskorišćenih kodova za brisanje' }, { status: 400 })
    const { error } = await sb.from('qr_codes').delete().in('id', deletable)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, deleted: deletable.length })
  }

  if (action === 'update_order') {
    await sb.from('orders').update({ status: payload.status }).eq('id', payload.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'update_pet') {
    const { id, ...fields } = payload
    await sb.from('pets').update(fields).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'get_partners') {
    const { data, error } = await sb.from('partners').select('*').order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const today = new Date().toISOString().split('T')[0]
    const sorted = [...(data || [])].sort((a: any, b: any) => {
      const aOverdue = a.next_contact && a.next_contact <= today
      const bOverdue = b.next_contact && b.next_contact <= today
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return NextResponse.json({ partners: sorted })
  }

  if (action === 'save_partner') {
    const { id, ...fields } = payload
    const data = {
      ...fields,
      updated_at: new Date().toISOString(),
    }
    if (id) {
      const { error } = await sb.from('partners').update(data).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await sb.from('partners').insert(fields)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const sb = createAdminClient()
  const { action, id } = await req.json()

  if (action === 'delete_qr') {
    const { data } = await sb.from('qr_codes').select('status').eq('id', id).single()
    if (!data || data.status !== 'unused') {
      return NextResponse.json({ error: 'Može se obrisati samo neiskorišćen QR kod' }, { status: 400 })
    }
    const { error } = await sb.from('qr_codes').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete_pet') {
    const { error } = await sb.from('pets').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete_order') {
    const { error } = await sb.from('orders').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete_partner') {
    const { error } = await sb.from('partners').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

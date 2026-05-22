import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function checkPin(req: NextRequest) {
  const pin = req.headers.get('x-admin-pin')
  return pin === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!checkPin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = createAdminClient()
  const [qrR, ordersR, petsR] = await Promise.all([
    sb.from('qr_codes').select('*').order('created_at', { ascending: false }),
    sb.from('orders').select('*').order('created_at', { ascending: false }),
    sb.from('pets').select('*, owners(*), qr_codes(code)').order('created_at', { ascending: false }),
  ])
  return NextResponse.json({ qr: qrR.data || [], orders: ordersR.data || [], pets: petsR.data || [] })
}

export async function POST(req: NextRequest) {
  if (!checkPin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = createAdminClient()
  const { action, payload } = await req.json()

  if (action === 'generate_qr') {
    const codes = Array.from({ length: payload.count }, () => ({
      code: 'PC-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    }))
    const { error } = await sb.from('qr_codes').insert(codes)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'update_qr') {
    await sb.from('qr_codes').update({ status: payload.status }).eq('id', payload.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'update_order') {
    await sb.from('orders').update({ status: payload.status }).eq('id', payload.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

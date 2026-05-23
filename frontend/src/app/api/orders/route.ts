import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { PRICE_PER_TAG } from '@/lib/types'

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_name, customer_phone, customer_email, address, city, note } = body

    if (!customer_name || !customer_phone || !address || !city) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const quantity = 1
    const total_rsd = PRICE_PER_TAG * quantity

    const supabase = createAdminClient()
    const { error: dbError } = await supabase.from('orders').insert({
      customer_name, customer_phone, customer_email: customer_email || null,
      address, city, quantity, note: note || null, total_rsd, status: 'nova',
    })
    if (dbError) throw dbError

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'narudzbine@pet-code.rs',
        to: process.env.ADMIN_EMAIL || 'admin@pet-code.rs',
        subject: `🐾 Nova narudžbina — ${esc(customer_name)} (${quantity}x privezak)`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
            <h2 style="color:#1a2d4a;">Nova narudžbina PetCode</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px;color:#888;font-size:13px;">Ime</td><td style="padding:8px;font-weight:bold;">${esc(customer_name)}</td></tr>
              <tr style="background:#f8f8f8;"><td style="padding:8px;color:#888;font-size:13px;">Telefon</td><td style="padding:8px;font-weight:bold;">${esc(customer_phone)}</td></tr>
              <tr><td style="padding:8px;color:#888;font-size:13px;">Email</td><td style="padding:8px;">${esc(customer_email) || '—'}</td></tr>
              <tr style="background:#f8f8f8;"><td style="padding:8px;color:#888;font-size:13px;">Adresa</td><td style="padding:8px;font-weight:bold;">${esc(address)}, ${esc(city)}</td></tr>
              <tr><td style="padding:8px;color:#888;font-size:13px;">Količina</td><td style="padding:8px;font-weight:bold;">${quantity}x privezak</td></tr>
              <tr style="background:#f8f8f8;"><td style="padding:8px;color:#888;font-size:13px;">Ukupno</td><td style="padding:8px;font-weight:bold;color:#3dbfb8;">${total_rsd} RSD</td></tr>
              <tr><td style="padding:8px;color:#888;font-size:13px;">Napomena</td><td style="padding:8px;">${esc(note) || '—'}</td></tr>
            </table>
            <p style="color:#888;font-size:12px;margin-top:20px;">Plaćanje pouzećem · pet-code.rs</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Greška pri obradi narudžbine' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_name, customer_phone, customer_email, address, city, note, quantity, total_rsd, product_slug, variant_id } = body

    if (!customer_name || !customer_phone || !address || !city) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const qty = Math.max(1, parseInt(quantity) || 1)
    const total = total_rsd ? parseInt(total_rsd) : qty * 990 // fallback

    const supabase = createAdminClient()
    const { error: dbError } = await supabase.from('orders').insert({
      customer_name, customer_phone, customer_email: customer_email || null,
      address, city, quantity: qty, note: note || null, total_rsd: total,
      status: 'nova', product_slug: product_slug || null, variant_id: variant_id || null,
    })
    if (dbError) throw dbError

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      const productLabel = product_slug
        ? product_slug.replace(/-[a-z0-9]{4,}$/, '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : 'Privezak'

      await resend.emails.send({
        from: process.env.RESEND_FROM || 'noreply@pet-code.rs',
        to: process.env.ADMIN_EMAIL || 'petcodeoffice@gmail.com',
        subject: `🛍️ Nova narudžbina — ${esc(customer_name)} · ${qty}x ${productLabel} · ${total.toLocaleString()} RSD`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:#0B1F3B;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">🛍️</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.4);font-family:monospace;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px;">pet-code.rs</div>
      <div style="font-size:22px;font-weight:900;color:#ffffff;margin-bottom:4px;">Nova narudžbina!</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.5);">${new Date().toLocaleString('sr-Latn-RS', { timeZone: 'Europe/Belgrade' })}</div>
    </div>

    <!-- Alert bar -->
    <div style="background:#19B6B2;padding:12px 24px;text-align:center;">
      <div style="font-size:15px;font-weight:900;color:#ffffff;">
        ${qty}x ${esc(productLabel)} · <span style="font-size:18px;">${total.toLocaleString()} RSD</span>
      </div>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:24px;border:1px solid #e2eaf0;border-top:none;border-radius:0 0 16px 16px;">

      <!-- Customer info table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tr style="border-bottom:1px solid #f0f4f8;">
          <td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;width:35%;">Kupac</td>
          <td style="padding:10px 8px;font-weight:800;color:#0B1F3B;font-size:15px;">${esc(customer_name)}</td>
        </tr>
        <tr style="background:#f8fafc;border-bottom:1px solid #f0f4f8;">
          <td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Telefon</td>
          <td style="padding:10px 8px;font-weight:800;color:#0B1F3B;font-size:15px;">
            <a href="tel:${esc(customer_phone)}" style="color:#19B6B2;text-decoration:none;">${esc(customer_phone)}</a>
          </td>
        </tr>
        <tr style="border-bottom:1px solid #f0f4f8;">
          <td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Email</td>
          <td style="padding:10px 8px;color:#0B1F3B;">${customer_email ? `<a href="mailto:${esc(customer_email)}" style="color:#19B6B2;text-decoration:none;">${esc(customer_email)}</a>` : '<span style="color:#9ca3af;">—</span>'}</td>
        </tr>
        <tr style="background:#f8fafc;border-bottom:1px solid #f0f4f8;">
          <td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Adresa</td>
          <td style="padding:10px 8px;font-weight:700;color:#0B1F3B;">${esc(address)}, ${esc(city)}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0f4f8;">
          <td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Proizvod</td>
          <td style="padding:10px 8px;font-weight:700;color:#0B1F3B;">${qty}x ${esc(productLabel)}</td>
        </tr>
        <tr style="background:#f8fafc;border-bottom:1px solid #f0f4f8;">
          <td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Ukupno</td>
          <td style="padding:10px 8px;font-weight:900;color:#19B6B2;font-size:18px;">${total.toLocaleString()} RSD</td>
        </tr>
        <tr>
          <td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Napomena</td>
          <td style="padding:10px 8px;color:#0B1F3B;">${esc(note) || '<span style="color:#9ca3af;">—</span>'}</td>
        </tr>
      </table>

      <!-- Plaćanje info -->
      <div style="background:#f0fffe;border:1px solid #b2e8e6;border-radius:12px;padding:14px 16px;text-align:center;">
        <div style="font-size:13px;color:#0d7377;font-weight:700;">
          💳 Plaćanje pouzećem · 🚚 Post Express dostava
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:16px;">
      <div style="font-size:12px;color:#9ca3af;">
        pet<span style="color:#19B6B2;">code</span>.rs · Srbija · petcodeoffice@gmail.com
      </div>
    </div>

  </div>
</body>
</html>
        `,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Order error:', err)
    return NextResponse.json({ error: 'Greška pri obradi narudžbine' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMail } from '@/lib/mailer'

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_name, customer_phone, customer_email, address, city, note, quantity, total_rsd, product_slug, variant_id } = body

    if (!customer_name || !customer_phone || !customer_email || !address || !city) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const qty = Math.max(1, parseInt(quantity) || 1)
    const total = total_rsd ? parseInt(total_rsd) : qty * 990

    const supabase = createAdminClient()
    const { error: dbError } = await supabase.from('orders').insert({
      customer_name, customer_phone, customer_email: customer_email || null,
      address, city, quantity: qty, note: note || null, total_rsd: total,
      status: 'nova', product_slug: product_slug || null, variant_id: variant_id || null,
    })
    if (dbError) throw dbError

    const productLabel = product_slug
      ? product_slug.replace(/-[a-z0-9]{4,}$/, '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
      : 'Privezak'

    const dateStr = new Date().toLocaleString('sr-Latn-RS', { timeZone: 'Europe/Belgrade' })

    // ── 1. Notifikacija adminu ────────────────────────────────────────────────
    await sendMail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'petcodeoffice@gmail.com',
      subject: `🛍️ Nova narudžbina — ${esc(customer_name)} · ${qty}x ${productLabel} · ${total.toLocaleString()} RSD`,
      html: `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:24px 16px;">
  <div style="background:#0B1F3B;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
    <div style="font-size:32px;margin-bottom:8px;">🛍️</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.4);font-family:monospace;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px;">pet-code.rs</div>
    <div style="font-size:22px;font-weight:900;color:#fff;margin-bottom:4px;">Nova narudžbina!</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.5);">${dateStr}</div>
  </div>
  <div style="background:#19B6B2;padding:12px 24px;text-align:center;">
    <div style="font-size:15px;font-weight:900;color:#fff;">${qty}x ${esc(productLabel)} · <span style="font-size:18px;">${total.toLocaleString()} RSD</span></div>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e2eaf0;border-top:none;border-radius:0 0 16px 16px;">
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tr style="border-bottom:1px solid #f0f4f8;"><td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;width:35%;">Kupac</td><td style="padding:10px 8px;font-weight:800;color:#0B1F3B;font-size:15px;">${esc(customer_name)}</td></tr>
      <tr style="background:#f8fafc;border-bottom:1px solid #f0f4f8;"><td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;">Telefon</td><td style="padding:10px 8px;font-weight:800;color:#0B1F3B;"><a href="tel:${esc(customer_phone)}" style="color:#19B6B2;text-decoration:none;">${esc(customer_phone)}</a></td></tr>
      <tr style="border-bottom:1px solid #f0f4f8;"><td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;">Email</td><td style="padding:10px 8px;color:#0B1F3B;">${customer_email ? `<a href="mailto:${esc(customer_email)}" style="color:#19B6B2;text-decoration:none;">${esc(customer_email)}</a>` : '—'}</td></tr>
      <tr style="background:#f8fafc;border-bottom:1px solid #f0f4f8;"><td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;">Adresa</td><td style="padding:10px 8px;font-weight:700;color:#0B1F3B;">${esc(address)}, ${esc(city)}</td></tr>
      <tr style="border-bottom:1px solid #f0f4f8;"><td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;">Proizvod</td><td style="padding:10px 8px;font-weight:700;color:#0B1F3B;">${qty}x ${esc(productLabel)}</td></tr>
      <tr style="background:#f8fafc;border-bottom:1px solid #f0f4f8;"><td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;">Ukupno</td><td style="padding:10px 8px;font-weight:900;color:#19B6B2;font-size:18px;">${total.toLocaleString()} RSD</td></tr>
      <tr><td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;">Napomena</td><td style="padding:10px 8px;color:#0B1F3B;">${esc(note) || '—'}</td></tr>
    </table>
    <div style="background:#f0fffe;border:1px solid #b2e8e6;border-radius:12px;padding:14px 16px;text-align:center;">
      <div style="font-size:13px;color:#0d7377;font-weight:700;">💳 Plaćanje pouzećem · 🚚 Post Express dostava</div>
    </div>
  </div>
  <div style="text-align:center;padding:16px;font-size:12px;color:#9ca3af;">pet<span style="color:#19B6B2;">code</span>.rs · Srbija</div>
</div>
</body></html>`,
    })

    // ── 2. Potvrda kupcu (samo ako je ostavio email) ──────────────────────────
    if (customer_email) {
      await sendMail({
        to: customer_email,
        subject: `✅ Narudžbina primljena — PetCode.rs`,
        html: `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:24px 16px;">

  <!-- Header -->
  <div style="background:#0B1F3B;border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
    <div style="font-size:48px;margin-bottom:12px;">🎉</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.35);font-family:monospace;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;">pet-code.rs</div>
    <div style="font-size:24px;font-weight:900;color:#fff;margin-bottom:6px;">Narudžbina primljena!</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.55);">Hvala, ${esc(customer_name)} 🐾</div>
  </div>

  <!-- Green bar -->
  <div style="background:#19B6B2;padding:14px 24px;text-align:center;">
    <div style="font-size:15px;font-weight:900;color:#fff;">
      ${qty}x ${esc(productLabel)} · ${total.toLocaleString()} RSD
    </div>
  </div>

  <!-- Body -->
  <div style="background:#fff;padding:28px 24px;border:1px solid #e2eaf0;border-top:none;border-radius:0 0 16px 16px;">

    <p style="font-size:15px;color:#0B1F3B;font-weight:600;line-height:1.6;margin:0 0 20px;">
      Vaša narudžbina je uspešno primljena. Kontaktiraćemo vas telefonom u roku od <strong>24 sata</strong> radi potvrde i dogovora oko dostave.
    </p>

    <!-- Order summary -->
    <div style="background:#f4f7fa;border-radius:14px;padding:18px 20px;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:900;color:#19B6B2;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:12px;">Detalji narudžbine</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #e2eaf0;">
          <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;">Proizvod</td>
          <td style="padding:8px 0;color:#0B1F3B;font-size:13px;font-weight:800;text-align:right;">${qty}x ${esc(productLabel)}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2eaf0;">
          <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;">Adresa dostave</td>
          <td style="padding:8px 0;color:#0B1F3B;font-size:13px;font-weight:700;text-align:right;">${esc(address)}, ${esc(city)}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2eaf0;">
          <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;">Telefon</td>
          <td style="padding:8px 0;color:#0B1F3B;font-size:13px;font-weight:700;text-align:right;">${esc(customer_phone)}</td>
        </tr>
        ${note ? `<tr style="border-bottom:1px solid #e2eaf0;"><td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;">Napomena</td><td style="padding:8px 0;color:#0B1F3B;font-size:13px;text-align:right;">${esc(note)}</td></tr>` : ''}
        <tr>
          <td style="padding:10px 0 0;color:#0B1F3B;font-size:14px;font-weight:900;">Ukupno za plaćanje</td>
          <td style="padding:10px 0 0;color:#19B6B2;font-size:20px;font-weight:900;text-align:right;">${total.toLocaleString()} RSD</td>
        </tr>
      </table>
    </div>

    <!-- Info boxes -->
    <div style="display:grid;gap:10px;">
      <div style="background:#f0fffe;border:1px solid #b2e8e6;border-radius:12px;padding:14px 16px;display:flex;align-items:flex-start;gap:10px;">
        <div style="font-size:20px;flex-shrink:0;">💳</div>
        <div>
          <div style="font-size:13px;font-weight:800;color:#0B1F3B;margin-bottom:2px;">Plaćanje pouzećem</div>
          <div style="font-size:12px;color:#6b7280;line-height:1.4;">Plaćate kuriru kada preuzimate paket. Nema online plaćanja, nema rizika.</div>
        </div>
      </div>
      <div style="background:#f4f7fa;border:1px solid #e2eaf0;border-radius:12px;padding:14px 16px;display:flex;align-items:flex-start;gap:10px;">
        <div style="font-size:20px;flex-shrink:0;">🚚</div>
        <div>
          <div style="font-size:13px;font-weight:800;color:#0B1F3B;margin-bottom:2px;">Post Express dostava</div>
          <div style="font-size:12px;color:#6b7280;line-height:1.4;">1–3 radna dana za Beograd · 2–5 dana za ostatak Srbije.</div>
        </div>
      </div>
      <div style="background:#fff8f0;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;display:flex;align-items:flex-start;gap:10px;">
        <div style="font-size:20px;flex-shrink:0;">📦</div>
        <div>
          <div style="font-size:13px;font-weight:800;color:#0B1F3B;margin-bottom:2px;">Šta se nalazi u paketu?</div>
          <div style="font-size:12px;color:#6b7280;line-height:1.4;">QR privezak od nerđajućeg čelika + uputstvo za aktivaciju profila vašeg ljubimca.</div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="margin-top:24px;text-align:center;">
      <a href="https://pet-code.rs" style="display:inline-block;background:#0B1F3B;color:#fff;font-weight:900;font-size:14px;padding:14px 32px;border-radius:100px;text-decoration:none;">
        Posetite pet-code.rs →
      </a>
    </div>

    <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:20px;line-height:1.5;">
      Pitanja? Pišite nam na <a href="mailto:petcodeoffice@gmail.com" style="color:#19B6B2;text-decoration:none;">petcodeoffice@gmail.com</a><br/>
      ili pozovite na broj koji ste ostavili pri narudžbini.
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:16px;">
    <div style="font-size:12px;color:#9ca3af;">
      pet<span style="color:#19B6B2;">code</span>.rs · QR identifikacija ljubimaca · Srbija
    </div>
  </div>
</div>
</body></html>`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Order error:', err)
    return NextResponse.json({ error: 'Greška pri obradi narudžbine' }, { status: 500 })
  }
}

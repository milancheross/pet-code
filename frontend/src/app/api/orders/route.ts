import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMail } from '@/lib/mailer'

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

interface OrderItem {
  name: string
  quantity: number
  price: number
  variant?: string
  slug?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      customer_name, customer_phone, customer_email,
      address, city, note,
      // Multi-item cart mode
      items,
      // Legacy single-item mode
      quantity, total_rsd, product_slug, variant_id,
    } = body

    if (!customer_name || !customer_phone || !address || !city) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const cartItems: OrderItem[] = items && Array.isArray(items) && items.length > 0 ? items : null!

    let dbTotal: number
    let dbQuantity: number
    let itemsJson: OrderItem[] | null = null
    let productLabel = 'Privezak'

    if (cartItems) {
      // ── Cart checkout mode ──
      // Use client-supplied prices (validated at listing/detail-page level)
      dbTotal = cartItems.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0)
      dbQuantity = cartItems.reduce((s, i) => s + Number(i.quantity), 0)
      itemsJson = cartItems
      const names = cartItems.slice(0, 2).map(i => `${i.quantity}x ${i.name}`)
      productLabel = names.join(', ') + (cartItems.length > 2 ? ` +${cartItems.length - 2} više` : '')
    } else {
      // ── Legacy single-item mode (server-side price recalculation) ──
      const qty = Math.max(1, parseInt(quantity) || 1)
      let unitPrice = 1500 // default PRICE_PER_TAG

      if (product_slug) {
        const { data: productData } = await supabase
          .from('products')
          .select('regular_price_rsd, sale_price_rsd, sale_start, sale_end, price_rsd, name')
          .eq('slug', product_slug)
          .eq('is_active', true)
          .single()
        if (productData) {
          const regularPrice = (productData as any).regular_price_rsd ?? (productData as any).price_rsd ?? 1500
          const now = new Date()
          const hasSale = (productData as any).sale_price_rsd != null &&
            (productData as any).sale_price_rsd < regularPrice &&
            (!(productData as any).sale_start || new Date((productData as any).sale_start) <= now) &&
            (!(productData as any).sale_end   || new Date((productData as any).sale_end)   >= now)
          unitPrice = hasSale ? (productData as any).sale_price_rsd : regularPrice
          productLabel = (productData as any).name ||
            product_slug.replace(/-[a-z0-9]{4,}$/, '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        }
      }

      dbTotal = qty * unitPrice
      dbQuantity = qty
      itemsJson = [{
        name: productLabel,
        quantity: qty,
        price: unitPrice,
        variant: variant_id || undefined,
        slug: product_slug || undefined,
      }]
    }

    // Insert order row
    const { error: dbError } = await supabase.from('orders').insert({
      customer_name, customer_phone, customer_email: customer_email || null,
      address, city, quantity: dbQuantity, note: note || null,
      total_rsd: dbTotal, status: 'nova',
      product_slug: cartItems ? null : (product_slug || null),
      variant_id: cartItems ? null : (variant_id || null),
      items_json: itemsJson,
    })
    if (dbError) throw dbError

    // Build items HTML for email
    const itemsHtml = itemsJson && itemsJson.length > 1
      ? `
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr style="background:#f8fafc;">
            <th style="padding:8px;text-align:left;font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Proizvod</th>
            <th style="padding:8px;text-align:center;font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Kom</th>
            <th style="padding:8px;text-align:right;font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Iznos</th>
          </tr>
          ${itemsJson.map(i => `
            <tr style="border-bottom:1px solid #f0f4f8;">
              <td style="padding:10px 8px;font-weight:700;color:#0B1F3B;font-size:13px;">${esc(i.name)}${i.variant ? `<div style="font-size:11px;color:#9ca3af;font-weight:500;">${esc(i.variant)}</div>` : ''}</td>
              <td style="padding:10px 8px;text-align:center;font-weight:700;color:#0B1F3B;">${i.quantity}</td>
              <td style="padding:10px 8px;text-align:right;font-weight:700;color:#19B6B2;">${(Number(i.price) * Number(i.quantity)).toLocaleString()} RSD</td>
            </tr>
          `).join('')}
        </table>
      `
      : ''

    await sendMail({
      to: process.env.ADMIN_EMAIL || 'petcodeoffice@gmail.com',
      subject: `🛍️ Nova narudžbina — ${esc(customer_name)} · ${esc(productLabel)} · ${dbTotal.toLocaleString()} RSD`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:540px;margin:0 auto;padding:24px 16px;">

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
        ${esc(productLabel)} · <span style="font-size:18px;">${dbTotal.toLocaleString()} RSD</span>
      </div>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:24px;border:1px solid #e2eaf0;border-top:none;border-radius:0 0 16px 16px;">

      <!-- Customer info -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
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
          <td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Ukupno</td>
          <td style="padding:10px 8px;font-weight:900;color:#19B6B2;font-size:18px;">${dbTotal.toLocaleString()} RSD</td>
        </tr>
        <tr>
          <td style="padding:10px 8px;color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Napomena</td>
          <td style="padding:10px 8px;color:#0B1F3B;">${esc(note) || '<span style="color:#9ca3af;">—</span>'}</td>
        </tr>
      </table>

      ${itemsHtml ? `<div style="font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Stavke narudžbine</div>${itemsHtml}` : ''}

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

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Order error:', err)
    return NextResponse.json({ error: 'Greška pri obradi narudžbine' }, { status: 500 })
  }
}

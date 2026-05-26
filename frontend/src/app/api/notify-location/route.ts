import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  try {
    const { pet_id, lat, lng, accuracy } = await req.json()

    if (!pet_id || lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }
    const latNum = Number(lat)
    const lngNum = Number(lng)

    // Dohvati podatke o ljubimcu i vlasniku
    const supabase = createAdminClient()
    const { data: pet, error } = await supabase
      .from('pets')
      .select('*, owners(*)')
      .eq('id', pet_id)
      .single()

    if (error || !pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    const owners = pet.owners as { name?: string | null; email?: string | null; phone?: string | null } | null
    const ownerEmail: string | null = owners?.email || null
    const petName = esc(pet.name)
    const ownerName = esc(owners?.name) || 'Vlasniče'

    const mapsUrl = `https://www.google.com/maps?q=${latNum},${lngNum}`
    const now = new Date().toLocaleString('sr-Latn-RS', { timeZone: 'Europe/Belgrade' })
    const accuracyText = accuracy ? `±${Math.round(Number(accuracy))}m` : 'nepoznata preciznost'

    // Log lokaciju u bazu
    await supabase.from('scan_logs').insert({
      pet_id,
      qr_code_id: pet.qr_code_id,
      location_lat: lat,
      location_lng: lng,
    })

    // Pošalji email ako postoji Resend
    if (process.env.RESEND_API_KEY && ownerEmail) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: process.env.RESEND_FROM || 'obaveštenja@pet-code.rs',
        to: ownerEmail,
        subject: `📍 ${petName} je pronađen! Evo lokacije`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0fffe;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:#1a2d4a;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">🐾</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.4);font-family:monospace;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px;">pet-code.rs</div>
      <div style="font-size:22px;font-weight:900;color:#ffffff;margin-bottom:4px;">${petName} je pronađen!</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.5);">${now} · ${accuracyText}</div>
    </div>

    <!-- Alert -->
    <div style="background:#3dbfb8;padding:14px 24px;text-align:center;">
      <div style="font-size:14px;font-weight:800;color:#ffffff;">
        📍 Neko je pronašao ${petName} i podelio lokaciju sa vama
      </div>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:24px;border:1px solid #e2eeec;border-top:none;">

      <p style="font-size:15px;color:#1a2d4a;font-weight:700;margin:0 0 16px;">
        Poštovani ${ownerName},
      </p>
      <p style="font-size:14px;color:#7a8fa6;line-height:1.6;margin:0 0 20px;">
        Neko je pronašao vašeg ljubimca <strong style="color:#1a2d4a;">${petName}</strong> i skenirao QR privezak. 
        Podelili su svoju lokaciju kako biste znali gde se ${petName} nalazi.
      </p>

      <!-- Map CTA -->
      <div style="text-align:center;margin:20px 0;">
        <a href="${mapsUrl}" target="_blank"
           style="display:inline-block;background:#3dbfb8;color:#ffffff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:100px;text-decoration:none;box-shadow:0 4px 16px rgba(61,191,184,0.4);">
          📍 Otvori lokaciju na mapi →
        </a>
      </div>

      <!-- Coordinates -->
      <div style="background:#f7faf9;border:1px solid #e2eeec;border-radius:12px;padding:16px;margin:20px 0;">
        <div style="font-size:11px;color:#3dbfb8;font-family:monospace;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;font-weight:700;">// koordinate</div>
        <div style="display:grid;gap:8px;">
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:13px;color:#7a8fa6;font-weight:600;">Geografska širina</span>
            <span style="font-size:13px;color:#1a2d4a;font-weight:800;font-family:monospace;">${latNum.toFixed(6)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:13px;color:#7a8fa6;font-weight:600;">Geografska dužina</span>
            <span style="font-size:13px;color:#1a2d4a;font-weight:800;font-family:monospace;">${lngNum.toFixed(6)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:13px;color:#7a8fa6;font-weight:600;">Preciznost</span>
            <span style="font-size:13px;color:#1a2d4a;font-weight:800;">${accuracyText}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:13px;color:#7a8fa6;font-weight:600;">Vreme</span>
            <span style="font-size:13px;color:#1a2d4a;font-weight:800;">${now}</span>
          </div>
        </div>
      </div>

      <!-- Warning -->
      <div style="background:#fffbf0;border:1px solid #f5e4a8;border-radius:12px;padding:14px 16px;margin:16px 0;">
        <div style="font-size:12px;color:#92400e;font-weight:700;line-height:1.5;">
          ⚠️ <strong>Napomena:</strong> Lokacija je tačna u trenutku skeniranja. Ako nalazač nije na istom mestu, ${petName} je možda premešten. Kontaktirajte nalazača što pre.
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:#f7faf9;border:1px solid #e2eeec;border-top:none;border-radius:0 0 16px 16px;padding:16px 24px;text-align:center;">
      <div style="font-size:13px;font-weight:900;color:#1a2d4a;margin-bottom:4px;">
        pet<span style="color:#3dbfb8;">code</span>.rs
      </div>
      <div style="font-size:11px;color:#7a8fa6;">QR identifikacija ljubimaca · Srbija</div>
    </div>

  </div>
</body>
</html>
        `,
      })
    }

    return NextResponse.json({ ok: true, mapsUrl })
  } catch (err) {
    console.error('[notify-location]', err)
    return NextResponse.json({ error: 'Greška pri slanju lokacije' }, { status: 500 })
  }
}

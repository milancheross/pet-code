import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMail } from '@/lib/mailer'

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  try {
    const { pet_id, lat, lng, accuracy } = await req.json()

    if (!pet_id || !lat || !lng) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: pet, error } = await supabase
      .from('pets')
      .select('*, owners(*)')
      .eq('id', pet_id)
      .single()

    if (error || !pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    const ownerEmail = pet.owners?.email || null
    const petName = esc(pet.name)
    const ownerName = esc(pet.owners?.name) || 'Vlasniče'

    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`
    const now = new Date().toLocaleString('sr-Latn-RS', { timeZone: 'Europe/Belgrade' })
    const accuracyText = accuracy ? `±${Math.round(accuracy)}m` : 'nepoznata preciznost'

    await supabase.from('scan_logs').insert({
      pet_id,
      qr_code_id: pet.qr_code_id,
      location_lat: lat,
      location_lng: lng,
    })

    if (ownerEmail) {
      await sendMail({
        to: ownerEmail,
        subject: `📍 ${petName} je pronađen! Evo lokacije`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0fffe;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px;">

    <div style="background:#0B1F3B;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">🐾</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.4);font-family:monospace;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px;">pet-code.rs</div>
      <div style="font-size:22px;font-weight:900;color:#ffffff;margin-bottom:4px;">${petName} je pronađen!</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.5);">${now} · ${accuracyText}</div>
    </div>

    <div style="background:#19B6B2;padding:14px 24px;text-align:center;">
      <div style="font-size:14px;font-weight:800;color:#ffffff;">
        📍 Neko je pronašao ${petName} i podelio lokaciju sa vama
      </div>
    </div>

    <div style="background:#ffffff;padding:24px;border:1px solid #e2eeec;border-top:none;border-radius:0 0 16px 16px;">
      <p style="font-size:15px;color:#0B1F3B;font-weight:700;margin:0 0 16px;">
        Poštovani ${ownerName},
      </p>
      <p style="font-size:14px;color:#7a8fa6;line-height:1.6;margin:0 0 20px;">
        Neko je pronašao vašeg ljubimca <strong style="color:#0B1F3B;">${petName}</strong> i skenirao QR privezak.
        Podelili su svoju lokaciju kako biste znali gde se ${petName} nalazi.
      </p>

      <div style="text-align:center;margin:20px 0;">
        <a href="${mapsUrl}" target="_blank"
           style="display:inline-block;background:#19B6B2;color:#ffffff;font-weight:900;font-size:16px;padding:14px 32px;border-radius:100px;text-decoration:none;">
          📍 Otvori lokaciju na mapi →
        </a>
      </div>

      <div style="background:#f4f7fa;border:1px solid #e2eaf0;border-radius:12px;padding:16px;margin:20px 0;">
        <div style="font-size:11px;color:#19B6B2;font-family:monospace;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;font-weight:700;">// koordinate</div>
        <div style="font-size:13px;color:#0B1F3B;line-height:2;">
          <strong>Lat:</strong> ${lat.toFixed(6)}<br/>
          <strong>Lng:</strong> ${lng.toFixed(6)}<br/>
          <strong>Preciznost:</strong> ${accuracyText}<br/>
          <strong>Vreme:</strong> ${now}
        </div>
      </div>

      <div style="background:#fffbf0;border:1px solid #f5e4a8;border-radius:12px;padding:14px 16px;">
        <div style="font-size:12px;color:#92400e;font-weight:700;line-height:1.5;">
          ⚠️ Lokacija je tačna u trenutku skeniranja. Kontaktirajte nalazača što pre.
        </div>
      </div>
    </div>

    <div style="text-align:center;padding:16px;">
      <div style="font-size:12px;color:#9ca3af;">
        pet<span style="color:#19B6B2;">code</span>.rs · QR identifikacija ljubimaca
      </div>
    </div>
  </div>
</body>
</html>
        `,
      })
    }

    return NextResponse.json({ ok: true, mapsUrl })
  } catch {
    return NextResponse.json({ error: 'Greška pri slanju lokacije' }, { status: 500 })
  }
}

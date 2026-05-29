import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  let name: string, email: string, message: string
  try {
    ;({ name, email, message } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Sva polja su obavezna.' }, { status: 400 })
  }

  const ok = await sendMail({
    to: 'petcodeoffice@gmail.com',
    replyTo: email,
    subject: `Kontakt poruka od ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#0B1F3B">Nova kontakt poruka</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#888;font-size:13px;width:100px">Ime:</td><td style="padding:8px 0;font-weight:600;color:#0B1F3B">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:13px">Email:</td><td style="padding:8px 0;font-weight:600;color:#0B1F3B"><a href="mailto:${email}">${email}</a></td></tr>
        </table>
        <div style="margin-top:16px;padding:16px;background:#f4f7fa;border-radius:12px;color:#333;line-height:1.6;white-space:pre-wrap">${message}</div>
      </div>
    `,
  })

  if (!ok) return NextResponse.json({ error: 'Mail nije poslat.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import nodemailer from 'nodemailer'

/**
 * Šalje email putem Gmail SMTP.
 *
 * Potrebne env varijable (u Vercel → Settings → Environment Variables):
 *   GMAIL_USER          = petcodeoffice@gmail.com
 *   GMAIL_APP_PASSWORD  = xxxx xxxx xxxx xxxx  (Gmail App Password, ne obična lozinka)
 *
 * Kako generisati App Password:
 *   1. myaccount.google.com → Security → 2-Step Verification (mora biti uključena)
 *   2. Traži "App passwords" → generiši za Mail / Other → napiši "PetCode"
 *   3. Kopiraj 16-slovnu lozinku
 */
export async function sendMail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}): Promise<boolean> {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    console.warn('[mailer] Nije konfigurisano — dodaj GMAIL_USER i GMAIL_APP_PASSWORD u Vercel env')
    return false
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: `PetCode.rs <${user}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  })

  return true
}

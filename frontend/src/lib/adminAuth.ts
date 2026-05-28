import { createHmac, timingSafeEqual } from 'crypto'

const DURATION = 8 * 60 * 60 * 1000 // 8 hours

export function createSessionToken(): string {
  const secret = process.env.ADMIN_SECRET!
  const exp = (Date.now() + DURATION).toString()
  const sig = createHmac('sha256', secret).update(exp).digest('base64url')
  return `${exp}.${sig}`
}

export function verifyPin(pin: string): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret || !pin) return false
  try {
    const a = Buffer.from(pin)
    const b = Buffer.from(secret)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch { return false }
}

export function verifySessionToken(token: string | null): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret || !token) return false
  try {
    const dot = token.lastIndexOf('.')
    if (dot < 0) return false
    const exp = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expected = createHmac('sha256', secret).update(exp).digest('base64url')
    const a = Buffer.from(sig, 'base64url')
    const b = Buffer.from(expected, 'base64url')
    if (a.length !== b.length) return false
    if (!timingSafeEqual(a, b)) return false
    return Date.now() < parseInt(exp, 10)
  } catch { return false }
}

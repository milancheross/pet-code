import { NextRequest, NextResponse } from 'next/server'
import { verifyPin, createSessionToken } from '@/lib/adminAuth'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000
const attempts = new Map<string, { count: number; resetAt: number }>()

function getIP(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

export async function POST(req: NextRequest) {
  const addr = getIP(req)
  const now = Date.now()
  const entry = attempts.get(addr)

  if (entry && now < entry.resetAt && entry.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Previše neuspešnih pokušaja. Pokušajte ponovo za 15 minuta.' },
      { status: 429 }
    )
  }

  let pin: string
  try {
    ;({ pin } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtev.' }, { status: 400 })
  }

  if (!verifyPin(pin)) {
    if (!entry || now >= entry.resetAt) {
      attempts.set(addr, { count: 1, resetAt: now + WINDOW_MS })
    } else {
      attempts.set(addr, { count: entry.count + 1, resetAt: entry.resetAt })
    }
    return NextResponse.json({ error: 'Pogrešan PIN.' }, { status: 401 })
  }

  attempts.delete(addr)
  return NextResponse.json({ token: createSessionToken() })
}

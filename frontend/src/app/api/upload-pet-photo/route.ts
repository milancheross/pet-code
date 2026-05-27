import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import sharp from 'sharp'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const petId = formData.get('pet_id') as string | null

    if (!file || !petId) {
      return NextResponse.json({ error: 'Missing file or pet_id' }, { status: 400 })
    }

    // Basic type check (MIME or extension)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif', 'image/avif']
    const allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'avif']
    if (!allowedMime.includes(file.type) && !allowedExt.includes(ext)) {
      return NextResponse.json({ error: 'Nepodržan format slike' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Slika ne sme biti veća od 20MB' }, { status: 400 })
    }

    const originalSize = file.size
    const buffer = Buffer.from(await file.arrayBuffer())

    // ── Sharp compression ──────────────────────────────────────────────────────
    // - Resize to max 900×900 (pet photos are shown at ≤400px on screen)
    // - WebP quality 80 + effort 5: visually lossless for photos, ~50–65% smaller
    //   than Canvas-encoded WebP at 0.85
    // - Strip all EXIF/GPS metadata (phone photos carry 10–100 KB of invisible data)
    // - smartSubsample: better chroma encoding for natural photos
    const compressed = await sharp(buffer)
      .resize(900, 900, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 5, smartSubsample: true })
      .toBuffer()

    const newSize = compressed.length

    const sb = createAdminClient()
    const path = `pets/${petId}.webp`
    const { error: uploadError } = await sb.storage
      .from('pet-photos')
      .upload(path, compressed, { contentType: 'image/webp', upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = sb.storage.from('pet-photos').getPublicUrl(path)

    return NextResponse.json({ ok: true, url: publicUrl, originalSize, newSize })
  } catch (err) {
    console.error('upload-pet-photo error:', err)
    return NextResponse.json({ error: 'Greška pri optimizaciji slike' }, { status: 500 })
  }
}

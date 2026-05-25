import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function revalidateShop() {
  revalidatePath('/prodavnica')
  revalidatePath('/prodavnica', 'layout')
}

function checkPin(req: NextRequest) {
  const pin = req.headers.get('x-admin-pin')
  const secret = process.env.ADMIN_SECRET || 'petcode2025'
  return pin === secret
}

export async function GET(req: NextRequest) {
  if (!checkPin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = createAdminClient()
  try {
    const [{ data: categories }, { data: products }] = await Promise.all([
      sb.from('categories').select('*').order('name'),
      sb.from('products').select('*, categories(name), product_images(*), product_variants(*)').order('created_at', { ascending: false }),
    ])
    return NextResponse.json({ categories: categories || [], products: products || [] })
  } catch {
    return NextResponse.json({ categories: [], products: [] })
  }
}

export async function POST(req: NextRequest) {
  if (!checkPin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = createAdminClient()
  const { action, payload } = await req.json()

  if (action === 'create_category') {
    const slug = payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { error } = await sb.from('categories').insert({ ...payload, slug })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidateShop()
    return NextResponse.json({ ok: true })
  }

  if (action === 'create_product') {
    const slug = payload.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36)
    const { data: product, error } = await sb.from('products').insert({ ...payload, slug }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidateShop()
    return NextResponse.json({ ok: true, product })
  }

  if (action === 'update_product') {
    const { id, ...rest } = payload
    const { data: prod } = await sb.from('products').update(rest).eq('id', id).select('slug').single()
    revalidateShop()
    if (prod?.slug) revalidatePath(`/prodavnica/${prod.slug}`)
    return NextResponse.json({ ok: true })
  }

  if (action === 'add_variant') {
    const { error } = await sb.from('product_variants').insert(payload)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidateShop()
    return NextResponse.json({ ok: true })
  }

  if (action === 'add_image') {
    const { error } = await sb.from('product_images').insert(payload)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidateShop()
    return NextResponse.json({ ok: true })
  }

  if (action === 'upload_image') {
    const { product_id, filename, base64, mime_type } = payload
    const bytes = Buffer.from(base64, 'base64')
    const path = `${product_id}/${filename}`
    const { error: uploadError } = await sb.storage.from('product-images').upload(path, bytes, {
      contentType: mime_type,
      upsert: true,
    })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
    const { data: { publicUrl } } = sb.storage.from('product-images').getPublicUrl(path)
    return NextResponse.json({ ok: true, url: publicUrl })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  if (!checkPin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = createAdminClient()
  const { action, id } = await req.json()

  if (action === 'delete_category') {
    await sb.from('categories').delete().eq('id', id)
    revalidateShop()
    return NextResponse.json({ ok: true })
  }
  if (action === 'delete_product') {
    // Fetch slug before deleting so we can revalidate the product detail page too
    const { data: prod } = await sb.from('products').select('slug').eq('id', id).single()
    await sb.from('products').delete().eq('id', id)
    revalidateShop()
    if (prod?.slug) revalidatePath(`/prodavnica/${prod.slug}`)
    return NextResponse.json({ ok: true })
  }
  if (action === 'delete_variant') {
    await sb.from('product_variants').delete().eq('id', id)
    revalidateShop()
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

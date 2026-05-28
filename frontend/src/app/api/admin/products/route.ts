import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { verifySessionToken } from '@/lib/adminAuth'

function revalidateShop() {
  revalidatePath('/prodavnica')
  revalidatePath('/prodavnica', 'layout')
}

function checkAuth(req: NextRequest) {
  return verifySessionToken(req.headers.get('x-session-token'))
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = createAdminClient()
  try {
    const [{ data: categories }, { data: products }] = await Promise.all([
      sb.from('categories').select('*').order('name'),
      sb.from('products')
        .select('*, categories(name), product_images(*), product_variants(*)')
        .order('created_at', { ascending: false }),
    ])
    return NextResponse.json({ categories: categories || [], products: products || [] })
  } catch {
    return NextResponse.json({ categories: [], products: [] })
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const regularPrice = payload.regular_price_rsd ? parseInt(payload.regular_price_rsd) : null
    const salePrice = payload.sale_price_rsd ? parseInt(payload.sale_price_rsd) : null
    const row = {
      ...payload,
      slug,
      regular_price_rsd: regularPrice,
      price_rsd: regularPrice, // back-compat
      sale_price_rsd: salePrice,
      compare_at_price_rsd: salePrice ? regularPrice : null, // back-compat
      sale_start: payload.sale_start || null,
      sale_end: payload.sale_end || null,
    }
    const { data: product, error } = await sb.from('products').insert(row).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidateShop()
    return NextResponse.json({ ok: true, product })
  }

  if (action === 'update_product') {
    const { id, ...rest } = payload
    const regularPrice = rest.regular_price_rsd !== undefined ? parseInt(rest.regular_price_rsd) || null : undefined
    const salePrice = rest.sale_price_rsd !== undefined ? (rest.sale_price_rsd ? parseInt(rest.sale_price_rsd) : null) : undefined
    const updates: any = { ...rest }
    if (regularPrice !== undefined) {
      updates.regular_price_rsd = regularPrice
      updates.price_rsd = regularPrice
    }
    if (salePrice !== undefined) {
      updates.sale_price_rsd = salePrice
      updates.compare_at_price_rsd = salePrice ? regularPrice : null
    }
    const { data: prod } = await sb.from('products').update(updates).eq('id', id).select('slug').single()
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

  if (action === 'bulk_products') {
    const { ids, bulk_action, value } = payload
    if (!ids || !ids.length) return NextResponse.json({ ok: true })

    if (bulk_action === 'activate') {
      await sb.from('products').update({ is_active: true }).in('id', ids)
    }
    else if (bulk_action === 'deactivate') {
      await sb.from('products').update({ is_active: false }).in('id', ids)
    }
    else if (bulk_action === 'set_price') {
      const price = Math.round(parseFloat(value))
      if (!isNaN(price) && price > 0) {
        await sb.from('products').update({ regular_price_rsd: price, price_rsd: price }).in('id', ids)
      }
    }
    else if (bulk_action === 'set_discount') {
      const pct = parseFloat(value)
      if (!isNaN(pct) && pct > 0 && pct < 100) {
        const { data: prods } = await sb.from('products').select('id, regular_price_rsd, price_rsd').in('id', ids)
        for (const prod of (prods || [])) {
          const regular = prod.regular_price_rsd || prod.price_rsd || 0
          if (regular > 0) {
            const salePrice = Math.round(regular * (1 - pct / 100))
            await sb.from('products').update({ sale_price_rsd: salePrice, compare_at_price_rsd: regular }).eq('id', prod.id)
          }
        }
      }
    }
    else if (bulk_action === 'remove_discount') {
      await sb.from('products').update({ sale_price_rsd: null, sale_start: null, sale_end: null, compare_at_price_rsd: null }).in('id', ids)
    }
    else if (bulk_action === 'delete') {
      const { data: prods } = await sb.from('products').select('slug').in('id', ids)
      await sb.from('products').delete().in('id', ids)
      for (const p of (prods || [])) {
        if (p.slug) revalidatePath(`/prodavnica/${p.slug}`)
      }
    }

    revalidateShop()
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = createAdminClient()
  const { action, id } = await req.json()

  if (action === 'delete_category') {
    await sb.from('categories').delete().eq('id', id)
    revalidateShop()
    return NextResponse.json({ ok: true })
  }
  if (action === 'delete_product') {
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
  if (action === 'delete_image') {
    await sb.from('product_images').delete().eq('id', id)
    revalidateShop()
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

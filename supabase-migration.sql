-- =============================================
-- PetCode — Shop Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_rsd numeric(10,2) NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  images text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product variants
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('color','size','material')),
  value text NOT NULL,
  price_modifier_rsd numeric(10,2) DEFAULT 0,
  stock integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- Product images
CREATE TABLE IF NOT EXISTS product_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  sort_order integer DEFAULT 0
);

-- Add product fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id);

-- Auto-update updated_at on products
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "variants_public_read" ON product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "images_public_read" ON product_images FOR SELECT USING (true);

-- =============================================
-- Storage bucket: product-images
-- Run separately via Supabase Dashboard > Storage
-- OR uncomment if using service role in API:
-- =============================================
-- insert into storage.buckets (id, name, public)
-- values ('product-images', 'product-images', true)
-- on conflict do nothing;

-- Storage policy (public read)
-- CREATE POLICY "product_images_public_read"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'product-images');

-- Storage policy (authenticated insert via service role)
-- Service role bypasses RLS automatically.

-- =============================================
-- WooCommerce-like product enhancements
-- Run this after the initial migration
-- =============================================

-- Sale / discount price
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price_rsd numeric(10,2);

-- Product badges
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false;

-- Stock status
ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT true;

-- SKU / product code
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text;

-- Short description (for grid cards)
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description text;

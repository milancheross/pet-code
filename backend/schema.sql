-- ============================================================
--  PETCODE.RS — Supabase PostgreSQL Schema v1.0 PRODUKCIJA
--  Pokreni u: Supabase > SQL Editor > New Query > Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- QR KODOVI
CREATE TABLE qr_codes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code         VARCHAR(20) UNIQUE NOT NULL,
  status       VARCHAR(20) DEFAULT 'unused' CHECK (status IN ('unused','active','disabled')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ
);

-- VLASNICI (proširuje Supabase Auth)
CREATE TABLE owners (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       VARCHAR(100),
  phone      VARCHAR(30),
  email      VARCHAR(200),  -- za lokacija notifikacije
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LJUBIMCI
CREATE TABLE pets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id  UUID UNIQUE NOT NULL REFERENCES qr_codes(id),
  owner_id    UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  -- Zaključano
  name        VARCHAR(100) NOT NULL,
  species     VARCHAR(20) NOT NULL CHECK (species IN ('pas','macka','zec','ptica','ostalo')),
  breed       VARCHAR(100),
  photo_url   TEXT,
  locked_at   TIMESTAMPTZ DEFAULT NOW(),
  -- Editabilno
  color       VARCHAR(100),
  age         VARCHAR(50),
  microchip   VARCHAR(50),
  vaccinated  BOOLEAN,
  allergies   TEXT,
  medication  TEXT,
  vet_info    TEXT,
  note        TEXT,
  is_lost     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ZDRAVSTVENI ZAPISI
CREATE TABLE health_records (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id      UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  note        TEXT,
  vet_name    VARCHAR(100),
  record_date DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- NARUDŽBINE
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name    VARCHAR(100) NOT NULL,
  customer_phone   VARCHAR(30) NOT NULL,
  customer_email   VARCHAR(100),
  address          TEXT NOT NULL,
  city             VARCHAR(100) NOT NULL,
  quantity         INT DEFAULT 1,
  note             TEXT,
  status           VARCHAR(30) DEFAULT 'nova' CHECK (status IN ('nova','potvrdjena','poslata','isporucena')),
  total_rsd        INT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- SCAN LOG
CREATE TABLE scan_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id   UUID REFERENCES qr_codes(id),
  pet_id       UUID REFERENCES pets(id),
  location_lat DECIMAL(10, 8),   -- GPS lokacija nalazača
  location_lng DECIMAL(11, 8),
  scanned_at   TIMESTAMPTZ DEFAULT NOW()
);

-- SQL za dodavanje lokacije na POSTOJEĆU bazu (ako si već pokrenuo schema):
-- ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,8);
-- ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11,8);
-- ALTER TABLE owners ADD COLUMN IF NOT EXISTS email VARCHAR(200);

-- INDEKSI
CREATE INDEX ON qr_codes(code);
CREATE INDEX ON pets(qr_code_id);
CREATE INDEX ON pets(owner_id);
CREATE INDEX ON health_records(pet_id);
CREATE INDEX ON orders(status);
CREATE INDEX ON orders(created_at);

-- AUTO updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ROW LEVEL SECURITY
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Vlasnik: samo svoje
CREATE POLICY "owners_own" ON owners FOR ALL USING (auth.uid() = id);
CREATE POLICY "pets_own_write" ON pets FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "pets_public_read" ON pets FOR SELECT USING (true);
CREATE POLICY "health_own" ON health_records FOR ALL USING (pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()));
CREATE POLICY "health_public_read" ON health_records FOR SELECT USING (true);
CREATE POLICY "qr_read_all" ON qr_codes FOR SELECT USING (true);
CREATE POLICY "qr_update_auth" ON qr_codes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "scan_insert_all" ON scan_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_insert_all" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_service_read" ON orders FOR SELECT USING (false); -- samo service role

-- INICIJALNI QR KODOVI (200 komada)
INSERT INTO qr_codes (code)
SELECT 'PC-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || generate_series::TEXT), 1, 6))
FROM GENERATE_SERIES(1, 200);

-- Provjeri:
-- SELECT code, status FROM qr_codes ORDER BY created_at LIMIT 10;

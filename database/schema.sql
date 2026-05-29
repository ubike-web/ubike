-- ============================================================
-- u-bike Platform — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL)
-- Safe to re-run — drops everything and recreates from scratch
-- ============================================================

-- ─────────────────────────────────────────
-- RESET (drop all old objects)
-- ─────────────────────────────────────────

-- Drop tables (CASCADE removes dependent objects)
DROP TABLE IF EXISTS sos_alerts CASCADE;
DROP TABLE IF EXISTS surge_zones CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS promo_uses CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS escrow CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS errands CASCADE;
DROP TABLE IF EXISTS rides CASCADE;
DROP TABLE IF EXISTS kyc_documents CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS otps CASCADE;
DROP TABLE IF EXISTS customer_profiles CASCADE;
DROP TABLE IF EXISTS rider_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop old types from previous schema (NestJS era)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS ride_status CASCADE;
DROP TYPE IF EXISTS errand_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS vehicle_type CASCADE;
DROP TYPE IF EXISTS rider_type CASCADE;
DROP TYPE IF EXISTS kyc_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS errand_category CASCADE;
DROP TYPE IF EXISTS escrow_status CASCADE;

-- Drop old functions/triggers from previous schema
DROP FUNCTION IF EXISTS find_available_riders CASCADE;
DROP FUNCTION IF EXISTS get_surge_multiplier CASCADE;
DROP FUNCTION IF EXISTS update_rider_location CASCADE;
DROP FUNCTION IF EXISTS set_updated_at CASCADE;
DROP FUNCTION IF EXISTS sync_ride_locations CASCADE;
DROP FUNCTION IF EXISTS update_rider_stats CASCADE;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('customer','passenger_rider','errands_rider','admin','super_admin','support');
CREATE TYPE ride_status AS ENUM ('requested','accepted','rider_arrived','in_progress','completed','cancelled','fare_negotiation');
CREATE TYPE errand_status AS ENUM ('requested','accepted','picked_up','in_transit','delivered','cancelled');
CREATE TYPE payment_status AS ENUM ('pending','escrowed','released','refunded','failed');
CREATE TYPE vehicle_type AS ENUM ('standard','electric');
CREATE TYPE rider_type AS ENUM ('passenger','errands');
CREATE TYPE kyc_status AS ENUM ('pending','approved','rejected');
CREATE TYPE transaction_type AS ENUM ('ride_payment','errand_payment','wallet_topup','wallet_withdrawal','rider_payout','refund','referral_bonus','promo_credit');
CREATE TYPE transaction_status AS ENUM ('pending','success','failed','reversed');
CREATE TYPE errand_category AS ENUM ('shopping','food_delivery','document_delivery','parcel_delivery','pharmacy','bill_payment','laundry','other');
CREATE TYPE escrow_status AS ENUM ('held','released','refunded');

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT UNIQUE,
  phone           TEXT UNIQUE,
  password_hash   TEXT,
  full_name       TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT,
  role            user_role NOT NULL DEFAULT 'customer',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  referral_code   TEXT UNIQUE NOT NULL DEFAULT CONCAT('UBK', UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8))),
  referred_by     UUID REFERENCES users(id),
  wallet_balance  NUMERIC(12,2) NOT NULL DEFAULT 0,
  loyalty_points  INTEGER NOT NULL DEFAULT 0,
  last_seen_at    TIMESTAMPTZ,
  push_token      TEXT,
  device_info     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- ─────────────────────────────────────────
-- RIDER PROFILES
-- ─────────────────────────────────────────
CREATE TABLE rider_profiles (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rider_type             rider_type NOT NULL,
  vehicle_type           vehicle_type NOT NULL DEFAULT 'standard',
  plate_number           TEXT,
  is_available           BOOLEAN NOT NULL DEFAULT FALSE,
  is_kyc_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  current_lat            DOUBLE PRECISION,
  current_lng            DOUBLE PRECISION,
  current_location       GEOGRAPHY(POINT, 4326),
  rating                 NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_rides            INTEGER NOT NULL DEFAULT 0,
  earnings_total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  earnings_pending       NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_location_update   TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_rider_profiles_user_id ON rider_profiles(user_id);
CREATE INDEX idx_rider_profiles_available ON rider_profiles(is_available, rider_type);
CREATE INDEX idx_rider_profiles_location ON rider_profiles USING GIST(current_location);

-- ─────────────────────────────────────────
-- CUSTOMER PROFILES
-- ─────────────────────────────────────────
CREATE TABLE customer_profiles (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  home_address       TEXT,
  work_address       TEXT,
  home_lat           DOUBLE PRECISION,
  home_lng           DOUBLE PRECISION,
  work_lat           DOUBLE PRECISION,
  work_lng           DOUBLE PRECISION,
  emergency_contact  TEXT,
  preferred_payment  TEXT DEFAULT 'paystack',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─────────────────────────────────────────
-- OTPs
-- ─────────────────────────────────────────
CREATE TABLE otps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       TEXT NOT NULL,
  otp_hash    TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  attempts    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otps_phone ON otps(phone);
CREATE INDEX idx_otps_expires ON otps(expires_at);

-- ─────────────────────────────────────────
-- REFRESH TOKENS
-- ─────────────────────────────────────────
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  revoked     BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ─────────────────────────────────────────
-- KYC DOCUMENTS
-- ─────────────────────────────────────────
CREATE TABLE kyc_documents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plate_number      TEXT,
  license_url       TEXT NOT NULL,
  national_id_url   TEXT NOT NULL,
  vehicle_photo_url TEXT NOT NULL,
  insurance_url     TEXT,
  status            kyc_status NOT NULL DEFAULT 'pending',
  rejection_reason  TEXT,
  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─────────────────────────────────────────
-- RIDES
-- ─────────────────────────────────────────
CREATE TABLE rides (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id             UUID NOT NULL REFERENCES users(id),
  rider_id                UUID REFERENCES users(id),
  pickup_address          TEXT NOT NULL,
  pickup_lat              DOUBLE PRECISION NOT NULL,
  pickup_lng              DOUBLE PRECISION NOT NULL,
  pickup_location         GEOGRAPHY(POINT, 4326),
  dropoff_address         TEXT NOT NULL,
  dropoff_lat             DOUBLE PRECISION NOT NULL,
  dropoff_lng             DOUBLE PRECISION NOT NULL,
  dropoff_location        GEOGRAPHY(POINT, 4326),
  distance_km             NUMERIC(8,2) NOT NULL DEFAULT 0,
  duration_minutes        INTEGER,
  status                  ride_status NOT NULL DEFAULT 'requested',
  fare_estimate           NUMERIC(10,2) NOT NULL,
  fare_final              NUMERIC(10,2),
  fare_customer_approved  BOOLEAN,
  payment_status          payment_status NOT NULL DEFAULT 'pending',
  payment_reference       TEXT,
  vehicle_type            vehicle_type NOT NULL DEFAULT 'standard',
  surge_multiplier        NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  rating_by_customer      SMALLINT CHECK (rating_by_customer BETWEEN 1 AND 5),
  rating_by_rider         SMALLINT CHECK (rating_by_rider BETWEEN 1 AND 5),
  cancellation_reason     TEXT,
  sos_triggered           BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_at            TIMESTAMPTZ,
  accepted_at             TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rides_customer ON rides(customer_id);
CREATE INDEX idx_rides_rider ON rides(rider_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_created ON rides(created_at DESC);
CREATE INDEX idx_rides_pickup ON rides USING GIST(pickup_location);

-- ─────────────────────────────────────────
-- ERRANDS
-- ─────────────────────────────────────────
CREATE TABLE errands (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id           UUID NOT NULL REFERENCES users(id),
  rider_id              UUID REFERENCES users(id),
  category              errand_category NOT NULL DEFAULT 'other',
  description           TEXT NOT NULL,
  pickup_address        TEXT NOT NULL,
  pickup_lat            DOUBLE PRECISION NOT NULL,
  pickup_lng            DOUBLE PRECISION NOT NULL,
  pickup_location       GEOGRAPHY(POINT, 4326),
  dropoff_address       TEXT NOT NULL,
  dropoff_lat           DOUBLE PRECISION NOT NULL,
  dropoff_lng           DOUBLE PRECISION NOT NULL,
  dropoff_location      GEOGRAPHY(POINT, 4326),
  distance_km           NUMERIC(8,2) NOT NULL DEFAULT 0,
  status                errand_status NOT NULL DEFAULT 'requested',
  fare_estimate         NUMERIC(10,2) NOT NULL,
  fare_final            NUMERIC(10,2),
  payment_status        payment_status NOT NULL DEFAULT 'pending',
  payment_reference     TEXT,
  item_value            NUMERIC(10,2),
  item_description      TEXT,
  recipient_name        TEXT,
  recipient_phone       TEXT,
  proof_of_delivery_url TEXT,
  rating_by_customer    SMALLINT CHECK (rating_by_customer BETWEEN 1 AND 5),
  rating_by_rider       SMALLINT CHECK (rating_by_rider BETWEEN 1 AND 5),
  cancellation_reason   TEXT,
  scheduled_at          TIMESTAMPTZ,
  accepted_at           TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_errands_customer ON errands(customer_id);
CREATE INDEX idx_errands_rider ON errands(rider_id);
CREATE INDEX idx_errands_status ON errands(status);
CREATE INDEX idx_errands_created ON errands(created_at DESC);

-- ─────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────
CREATE TABLE transactions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id),
  reference         TEXT NOT NULL UNIQUE,
  type              transaction_type NOT NULL,
  amount            NUMERIC(12,2) NOT NULL,
  fee               NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount        NUMERIC(12,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'KES',
  status            transaction_status NOT NULL DEFAULT 'pending',
  gateway           TEXT NOT NULL DEFAULT 'paystack',
  gateway_response  TEXT,
  metadata          JSONB,
  ride_id           UUID REFERENCES rides(id),
  errand_id         UUID REFERENCES errands(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- ─────────────────────────────────────────
-- ESCROW
-- ─────────────────────────────────────────
CREATE TABLE escrow (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_reference   TEXT NOT NULL REFERENCES transactions(reference),
  ride_id                 UUID REFERENCES rides(id),
  errand_id               UUID REFERENCES errands(id),
  amount                  NUMERIC(12,2) NOT NULL,
  status                  escrow_status NOT NULL DEFAULT 'held',
  held_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at             TIMESTAMPTZ
);

-- ─────────────────────────────────────────
-- PROMO CODES
-- ─────────────────────────────────────────
CREATE TABLE promo_codes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code             TEXT NOT NULL UNIQUE,
  description      TEXT,
  discount_type    TEXT NOT NULL DEFAULT 'percent',  -- percent | flat
  discount_value   NUMERIC(10,2) NOT NULL,
  max_uses         INTEGER,
  uses_count       INTEGER NOT NULL DEFAULT 0,
  min_fare         NUMERIC(10,2),
  max_discount     NUMERIC(10,2),
  valid_from       TIMESTAMPTZ,
  valid_until      TIMESTAMPTZ,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE promo_uses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_id    UUID NOT NULL REFERENCES promo_codes(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  ride_id     UUID REFERENCES rides(id),
  errand_id   UUID REFERENCES errands(id),
  discount    NUMERIC(10,2) NOT NULL,
  used_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promo_id, user_id)
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'general',
  data        JSONB,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ─────────────────────────────────────────
-- AUDIT LOG
-- ─────────────────────────────────────────
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ─────────────────────────────────────────
-- SOS ALERTS
-- ─────────────────────────────────────────
CREATE TABLE sos_alerts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  ride_id     UUID REFERENCES rides(id),
  errand_id   UUID REFERENCES errands(id),
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  message     TEXT,
  resolved    BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SURGE PRICING ZONES
-- ─────────────────────────────────────────
CREATE TABLE surge_zones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  zone        GEOGRAPHY(POLYGON, 4326) NOT NULL,
  multiplier  NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_surge_zones_geom ON surge_zones USING GIST(zone);

-- ─────────────────────────────────────────
-- STORED PROCEDURES
-- ─────────────────────────────────────────

-- Find available riders within radius
CREATE OR REPLACE FUNCTION find_available_riders(
  p_lat         DOUBLE PRECISION,
  p_lng         DOUBLE PRECISION,
  p_radius_km   DOUBLE PRECISION,
  p_rider_type  TEXT
)
RETURNS TABLE (
  user_id       UUID,
  rider_type    rider_type,
  vehicle_type  vehicle_type,
  plate_number  TEXT,
  current_lat   DOUBLE PRECISION,
  current_lng   DOUBLE PRECISION,
  rating        NUMERIC,
  distance_m    DOUBLE PRECISION
) LANGUAGE SQL AS $$
  SELECT
    rp.user_id,
    rp.rider_type,
    rp.vehicle_type,
    rp.plate_number,
    rp.current_lat,
    rp.current_lng,
    rp.rating,
    ST_Distance(
      rp.current_location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY
    ) AS distance_m
  FROM rider_profiles rp
  WHERE
    rp.is_available = TRUE
    AND rp.is_kyc_verified = TRUE
    AND rp.rider_type = p_rider_type::rider_type
    AND rp.current_location IS NOT NULL
    AND ST_DWithin(
      rp.current_location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY,
      p_radius_km * 1000
    )
  ORDER BY distance_m ASC
  LIMIT 20;
$$;

-- Get active surge multiplier for a location
CREATE OR REPLACE FUNCTION get_surge_multiplier(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION)
RETURNS NUMERIC LANGUAGE SQL AS $$
  SELECT COALESCE(MAX(multiplier), 1.0)
  FROM surge_zones
  WHERE
    is_active = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
    AND ST_Within(
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOMETRY,
      zone::GEOMETRY
    );
$$;

-- Update rider location and geography point
CREATE OR REPLACE FUNCTION update_rider_location(
  p_user_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
)
RETURNS VOID LANGUAGE SQL AS $$
  UPDATE rider_profiles SET
    current_lat = p_lat,
    current_lng = p_lng,
    current_location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY,
    last_location_update = NOW()
  WHERE user_id = p_user_id;
$$;

-- ─────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────

-- Auto update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rides_updated_at BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_errands_updated_at BEFORE UPDATE ON errands FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sync geography point when lat/lng updated on rides
CREATE OR REPLACE FUNCTION sync_ride_locations()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.pickup_location  = ST_SetSRID(ST_MakePoint(NEW.pickup_lng, NEW.pickup_lat), 4326)::GEOGRAPHY;
  NEW.dropoff_location = ST_SetSRID(ST_MakePoint(NEW.dropoff_lng, NEW.dropoff_lat), 4326)::GEOGRAPHY;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rides_sync_locations BEFORE INSERT OR UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION sync_ride_locations();

-- Update rider total_rides on completion
CREATE OR REPLACE FUNCTION update_rider_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.rider_id IS NOT NULL THEN
    UPDATE rider_profiles SET total_rides = total_rides + 1 WHERE user_id = NEW.rider_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ride_completed AFTER UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION update_rider_stats();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE errands ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (backend API uses service role key)
-- These policies apply to anon/authenticated Supabase clients only

CREATE POLICY "users_self_read" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_self_update" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "rider_profiles_self" ON rider_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "customer_profiles_self" ON customer_profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rides_customer_read" ON rides FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = rider_id);
CREATE POLICY "errands_customer_read" ON errands FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = rider_id);

CREATE POLICY "transactions_self" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_self" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "otps_self" ON otps FOR SELECT USING (TRUE); -- controlled by API
CREATE POLICY "refresh_tokens_self" ON refresh_tokens FOR SELECT USING (auth.uid() = user_id);

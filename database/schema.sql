-- ============================================================
-- u-bike Platform — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- For geo queries

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
  'customer', 'transport_rider', 'errands_rider',
  'admin', 'super_admin', 'support'
);

CREATE TYPE rider_service_type AS ENUM ('transport', 'errands');
CREATE TYPE vehicle_type AS ENUM ('normal_bike', 'electric_bike');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');

CREATE TYPE ride_status AS ENUM (
  'pending', 'searching', 'accepted', 'rider_arriving',
  'in_progress', 'completed', 'cancelled', 'expired'
);

CREATE TYPE errand_status AS ENUM (
  'pending', 'searching', 'accepted', 'picked_up',
  'in_transit', 'delivered', 'cancelled', 'expired'
);

CREATE TYPE transaction_type AS ENUM (
  'ride_payment', 'errand_payment', 'wallet_funding',
  'rider_payout', 'refund', 'commission', 'withdrawal', 'earning'
);

CREATE TYPE transaction_status AS ENUM ('pending', 'success', 'failed', 'refunded');

-- ─────────────────────────────────────────
-- USERS (base table for all user types)
-- ─────────────────────────────────────────
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name           TEXT NOT NULL,
  phone               TEXT UNIQUE NOT NULL,
  email               TEXT UNIQUE,
  password_hash       TEXT NOT NULL,
  role                user_role NOT NULL DEFAULT 'customer',
  avatar_url          TEXT,
  fcm_token           TEXT,
  refresh_token_hash  TEXT,
  is_phone_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ─────────────────────────────────────────
-- CUSTOMERS (extension of users)
-- ─────────────────────────────────────────
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE DEFAULT UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8)),
  referred_by UUID REFERENCES customers(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_user_id ON customers(user_id);

-- ─────────────────────────────────────────
-- RIDERS
-- ─────────────────────────────────────────
CREATE TABLE riders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  service_type        rider_service_type NOT NULL,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  rejection_reason    TEXT,
  is_online           BOOLEAN NOT NULL DEFAULT FALSE,
  current_lat         DOUBLE PRECISION,
  current_lng         DOUBLE PRECISION,
  last_location_update TIMESTAMPTZ,
  last_seen           TIMESTAMPTZ,
  rating              NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  total_trips         INTEGER NOT NULL DEFAULT 0,
  acceptance_rate     NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  cancellation_rate   NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_riders_user_id ON riders(user_id);
CREATE INDEX idx_riders_service_type ON riders(service_type);
CREATE INDEX idx_riders_verification_status ON riders(verification_status);
CREATE INDEX idx_riders_is_online ON riders(is_online);
-- Geo index for nearest-rider queries
CREATE INDEX idx_riders_location ON riders USING GIST (
  ST_SetSRID(ST_MakePoint(current_lng, current_lat), 4326)
) WHERE current_lat IS NOT NULL AND current_lng IS NOT NULL;

-- ─────────────────────────────────────────
-- VEHICLES
-- ─────────────────────────────────────────
CREATE TABLE vehicles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id      UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  vehicle_type  vehicle_type NOT NULL,
  plate_number  TEXT NOT NULL,
  model         TEXT NOT NULL,
  color         TEXT NOT NULL,
  year          INTEGER,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_rider_id ON vehicles(rider_id);

-- ─────────────────────────────────────────
-- RIDER DOCUMENTS
-- ─────────────────────────────────────────
CREATE TABLE rider_documents (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id   UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  doc_type   TEXT NOT NULL, -- 'national_id', 'driver_license', 'vehicle_photo', 'insurance'
  doc_url    TEXT NOT NULL,
  status     verification_status NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rider_id, doc_type)
);

-- ─────────────────────────────────────────
-- SAVED LOCATIONS
-- ─────────────────────────────────────────
CREATE TABLE saved_locations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT NOT NULL, -- 'Home', 'Work', 'School'
  address    TEXT NOT NULL,
  latitude   DOUBLE PRECISION NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_locations_user_id ON saved_locations(user_id);

-- ─────────────────────────────────────────
-- RIDES (transport)
-- ─────────────────────────────────────────
CREATE TABLE rides (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id           UUID NOT NULL REFERENCES users(id),
  rider_id              UUID REFERENCES riders(id),
  pickup_address        TEXT NOT NULL,
  pickup_lat            DOUBLE PRECISION NOT NULL,
  pickup_lng            DOUBLE PRECISION NOT NULL,
  destination_address   TEXT NOT NULL,
  destination_lat       DOUBLE PRECISION NOT NULL,
  destination_lng       DOUBLE PRECISION NOT NULL,
  vehicle_type          vehicle_type NOT NULL DEFAULT 'normal_bike',
  estimated_fare        NUMERIC(10,2) NOT NULL,
  actual_fare           NUMERIC(10,2),
  distance_km           NUMERIC(8,2),
  status                ride_status NOT NULL DEFAULT 'searching',
  note                  TEXT,
  scheduled_for         TIMESTAMPTZ,
  is_rated              BOOLEAN NOT NULL DEFAULT FALSE,
  cancel_reason         TEXT,
  accepted_at           TIMESTAMPTZ,
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rides_customer_id ON rides(customer_id);
CREATE INDEX idx_rides_rider_id ON rides(rider_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_created_at ON rides(created_at DESC);

-- ─────────────────────────────────────────
-- ERRANDS (deliveries)
-- ─────────────────────────────────────────
CREATE TABLE errands (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id          UUID NOT NULL REFERENCES users(id),
  rider_id             UUID REFERENCES riders(id),
  pickup_address       TEXT NOT NULL,
  pickup_lat           DOUBLE PRECISION NOT NULL,
  pickup_lng           DOUBLE PRECISION NOT NULL,
  delivery_address     TEXT NOT NULL,
  delivery_lat         DOUBLE PRECISION NOT NULL,
  delivery_lng         DOUBLE PRECISION NOT NULL,
  item_description     TEXT NOT NULL,
  item_size            TEXT NOT NULL CHECK (item_size IN ('small', 'medium', 'large')),
  item_value           NUMERIC(10,2),
  recipient_name       TEXT,
  recipient_phone      TEXT,
  note                 TEXT,
  stops                JSONB,
  estimated_fare       NUMERIC(10,2) NOT NULL,
  actual_fare          NUMERIC(10,2),
  distance_km          NUMERIC(8,2),
  status               errand_status NOT NULL DEFAULT 'searching',
  delivery_proof_url   TEXT,
  is_rated             BOOLEAN NOT NULL DEFAULT FALSE,
  cancel_reason        TEXT,
  accepted_at          TIMESTAMPTZ,
  picked_up_at         TIMESTAMPTZ,
  delivered_at         TIMESTAMPTZ,
  cancelled_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_errands_customer_id ON errands(customer_id);
CREATE INDEX idx_errands_rider_id ON errands(rider_id);
CREATE INDEX idx_errands_status ON errands(status);
CREATE INDEX idx_errands_created_at ON errands(created_at DESC);

-- ─────────────────────────────────────────
-- WALLETS
-- ─────────────────────────────────────────
CREATE TABLE wallets (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance      NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  reserved     NUMERIC(12,2) NOT NULL DEFAULT 0.00, -- amount reserved for pending withdrawals
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT balance_non_negative CHECK (balance >= 0),
  CONSTRAINT reserved_non_negative CHECK (reserved >= 0)
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- ─────────────────────────────────────────
-- WALLET TRANSACTIONS
-- ─────────────────────────────────────────
CREATE TABLE wallet_transactions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES users(id),
  type               transaction_type NOT NULL,
  amount             NUMERIC(12,2) NOT NULL,
  status             transaction_status NOT NULL DEFAULT 'pending',
  reference          TEXT UNIQUE,
  provider           TEXT, -- 'paystack', 'internal'
  provider_reference TEXT,
  reference_id       UUID, -- ride_id or errand_id
  description        TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_txns_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_txns_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_txns_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_txns_reference ON wallet_transactions(reference);

-- ─────────────────────────────────────────
-- WITHDRAWALS
-- ─────────────────────────────────────────
CREATE TABLE withdrawals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id),
  amount              NUMERIC(12,2) NOT NULL,
  payout_method       TEXT NOT NULL, -- 'mpesa', 'bank'
  payout_account      TEXT NOT NULL, -- phone number or account
  payout_name         TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
  paystack_reference  TEXT,
  failure_reason      TEXT,
  rejection_reason    TEXT,
  processed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  type         TEXT NOT NULL,
  reference_id UUID,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ─────────────────────────────────────────
-- CHAT ROOMS
-- ─────────────────────────────────────────
CREATE TABLE chat_rooms (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id    UUID UNIQUE REFERENCES rides(id) ON DELETE SET NULL,
  errand_id  UUID UNIQUE REFERENCES errands(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_reference CHECK (
    (ride_id IS NOT NULL AND errand_id IS NULL) OR
    (ride_id IS NULL AND errand_id IS NOT NULL)
  )
);

-- ─────────────────────────────────────────
-- CHAT MESSAGES
-- ─────────────────────────────────────────
CREATE TABLE chat_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id      UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES users(id),
  content      TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'location')),
  media_url    TEXT,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(room_id, created_at DESC);

-- ─────────────────────────────────────────
-- CALL SESSIONS (Agora)
-- ─────────────────────────────────────────
CREATE TABLE call_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_name     TEXT NOT NULL UNIQUE,
  caller_id        UUID NOT NULL REFERENCES users(id),
  receiver_id      UUID NOT NULL REFERENCES users(id),
  ride_id          UUID REFERENCES rides(id),
  errand_id        UUID REFERENCES errands(id),
  status           TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'active', 'ended', 'missed')),
  duration_seconds INTEGER DEFAULT 0,
  expires_at       TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_call_sessions_caller_id ON call_sessions(caller_id);
CREATE INDEX idx_call_sessions_receiver_id ON call_sessions(receiver_id);

-- ─────────────────────────────────────────
-- OTP VERIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE otp_verifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone       TEXT NOT NULL,
  purpose     TEXT NOT NULL, -- 'verification', 'password_reset', 'transaction'
  code_hash   TEXT NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  is_used     BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_phone_purpose ON otp_verifications(phone, purpose);
CREATE INDEX idx_otp_created_at ON otp_verifications(created_at);

-- ─────────────────────────────────────────
-- REVIEWS & RATINGS
-- ─────────────────────────────────────────
CREATE TABLE reviews (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id        UUID REFERENCES rides(id),
  errand_id      UUID REFERENCES errands(id),
  reviewer_id    UUID NOT NULL REFERENCES users(id),
  reviewee_id    UUID NOT NULL REFERENCES riders(id),
  reviewer_type  TEXT NOT NULL DEFAULT 'customer',
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_ride_id ON reviews(ride_id);
CREATE INDEX idx_reviews_errand_id ON reviews(errand_id);

-- ─────────────────────────────────────────
-- ADMIN ACTIONS (audit log)
-- ─────────────────────────────────────────
CREATE TABLE admin_actions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID NOT NULL REFERENCES users(id),
  action_type TEXT NOT NULL,
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- ─────────────────────────────────────────
-- SUPPORT TICKETS
-- ─────────────────────────────────────────
CREATE TABLE support_tickets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  subject     TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT, -- 'payment', 'ride', 'errand', 'account', 'other'
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority    TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  resolution  TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- ─────────────────────────────────────────
-- PLATFORM SETTINGS
-- ─────────────────────────────────────────
CREATE TABLE platform_settings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT NOT NULL UNIQUE,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default pricing values
INSERT INTO platform_settings (key, value) VALUES
  ('base_fare', '100'),
  ('km_rate', '50'),
  ('electric_surcharge', '1.2'),
  ('platform_commission', '0.20'),
  ('errand_base_fare', '150'),
  ('rider_match_radius_km', '5'),
  ('min_withdrawal_kes', '100');

-- ─────────────────────────────────────────
-- FRAUD REPORTS
-- ─────────────────────────────────────────
CREATE TABLE fraud_reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id  UUID NOT NULL REFERENCES users(id),
  reported_id  UUID NOT NULL REFERENCES users(id),
  reason       TEXT NOT NULL,
  evidence_url TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  ride_id      UUID REFERENCES rides(id),
  errand_id    UUID REFERENCES errands(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- STORED PROCEDURES
-- ─────────────────────────────────────────

-- Credit wallet (atomic)
CREATE OR REPLACE FUNCTION credit_wallet(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE wallets
  SET balance = balance + p_amount,
      total_earned = CASE WHEN p_amount > 0 THEN total_earned + p_amount ELSE total_earned END,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;
END;
$$;

-- Deduct from wallet (atomic, with balance check)
CREATE OR REPLACE FUNCTION deduct_wallet(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT balance INTO v_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Available: %, Required: %', v_balance, p_amount;
  END IF;

  UPDATE wallets
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Reserve withdrawal amount
CREATE OR REPLACE FUNCTION reserve_withdrawal(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE wallets
  SET balance = balance - p_amount,
      reserved = reserved + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id AND balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance for withdrawal';
  END IF;
END;
$$;

-- Increment rider trip count
CREATE OR REPLACE FUNCTION increment_rider_trips(p_rider_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE riders SET total_trips = total_trips + 1, updated_at = NOW() WHERE id = p_rider_id;
END;
$$;

-- ─────────────────────────────────────────
-- FIND NEARBY RIDERS (PostGIS)
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION find_nearby_riders(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION,
  p_service_type rider_service_type,
  p_vehicle_type vehicle_type DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  rating NUMERIC,
  acceptance_rate NUMERIC,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.user_id,
    r.current_lat,
    r.current_lng,
    r.rating,
    r.acceptance_rate,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(r.current_lng, r.current_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) / 1000 AS distance_km
  FROM riders r
  JOIN vehicles v ON v.rider_id = r.id
  WHERE
    r.is_online = TRUE
    AND r.verification_status = 'verified'
    AND r.service_type = p_service_type
    AND r.current_lat IS NOT NULL
    AND r.current_lng IS NOT NULL
    AND (p_vehicle_type IS NULL OR v.vehicle_type = p_vehicle_type)
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(r.current_lng, r.current_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    )
  ORDER BY distance_km ASC;
END;
$$;

-- ─────────────────────────────────────────
-- GET SURGE ZONES
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_surge_zones()
RETURNS TABLE(lat DOUBLE PRECISION, lng DOUBLE PRECISION, multiplier NUMERIC)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(pickup_lat)::DOUBLE PRECISION,
    AVG(pickup_lng)::DOUBLE PRECISION,
    CASE
      WHEN COUNT(*) > 20 THEN 1.5
      WHEN COUNT(*) > 10 THEN 1.25
      ELSE 1.0
    END AS multiplier
  FROM rides
  WHERE created_at > NOW() - INTERVAL '30 minutes'
    AND status = 'searching'
  GROUP BY
    ROUND(pickup_lat::NUMERIC, 2),
    ROUND(pickup_lng::NUMERIC, 2)
  HAVING COUNT(*) > 5;
END;
$$;

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE errands ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- NOTE: The NestJS backend uses the SERVICE_ROLE key which bypasses RLS.
-- These policies apply to Supabase client-side SDK access only.

-- Users can read/update their own record
CREATE POLICY "users_own_record" ON users
  FOR ALL USING (auth.uid() = id);

-- Wallets — own access
CREATE POLICY "wallets_own" ON wallets
  FOR ALL USING (auth.uid() = user_id);

-- Rides — customer or rider can access
CREATE POLICY "rides_participants" ON rides
  FOR ALL USING (
    auth.uid() = customer_id OR
    auth.uid() IN (SELECT user_id FROM riders WHERE id = rides.rider_id)
  );

-- Errands — customer or rider
CREATE POLICY "errands_participants" ON errands
  FOR ALL USING (
    auth.uid() = customer_id OR
    auth.uid() IN (SELECT user_id FROM riders WHERE id = errands.rider_id)
  );

-- Notifications — own
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON riders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ─────────────────────────────────────────
-- SUPABASE REALTIME PUBLICATION
-- Enable realtime for tables the mobile app subscribes to
-- ─────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE rides;
ALTER PUBLICATION supabase_realtime ADD TABLE errands;
ALTER PUBLICATION supabase_realtime ADD TABLE riders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ─────────────────────────────────────────
-- STORAGE BUCKETS
-- Run these in Supabase Storage settings or via SQL
-- ─────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ubike-assets', 'ubike-assets', TRUE);

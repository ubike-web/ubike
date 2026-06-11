-- Run this entire file in your Supabase SQL Editor
-- QuickRide tables (qr_ prefix avoids conflicts with existing ubike tables)

CREATE TABLE IF NOT EXISTS qr_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firstname       TEXT NOT NULL,
  lastname        TEXT DEFAULT '',
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  phone           TEXT DEFAULT '',
  socket_id       TEXT DEFAULT '',
  email_verified  BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qr_captains (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firstname        TEXT NOT NULL,
  lastname         TEXT DEFAULT '',
  email            TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  phone            TEXT DEFAULT '',
  socket_id        TEXT DEFAULT '',
  status           TEXT DEFAULT 'inactive' CHECK (status IN ('active','inactive')),
  vehicle_color    TEXT NOT NULL,
  vehicle_number   TEXT NOT NULL,
  vehicle_capacity INTEGER DEFAULT 1,
  vehicle_type     TEXT NOT NULL CHECK (vehicle_type IN ('car','bike','auto')),
  vehicle_make     TEXT DEFAULT '',
  vehicle_model    TEXT DEFAULT '',
  vehicle_year     INTEGER,
  national_id_number TEXT DEFAULT '',
  license_number   TEXT DEFAULT '',
  location_lat     FLOAT DEFAULT 0,
  location_lng     FLOAT DEFAULT 0,
  email_verified   BOOLEAN DEFAULT false,
  approval_status  TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')),
  rejection_reason TEXT DEFAULT '',
  registration_payment_ref  TEXT DEFAULT '',
  registration_payment_paid BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- If qr_captains already exists, add the new columns:
ALTER TABLE qr_captains ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected'));
ALTER TABLE qr_captains ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '';
ALTER TABLE qr_captains ADD COLUMN IF NOT EXISTS registration_payment_ref TEXT DEFAULT '';
ALTER TABLE qr_captains ADD COLUMN IF NOT EXISTS registration_payment_paid BOOLEAN DEFAULT false;
ALTER TABLE qr_captains ADD COLUMN IF NOT EXISTS active_mode TEXT CHECK (active_mode IN ('rides','errands'));

CREATE TABLE IF NOT EXISTS qr_rides (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES qr_users(id) ON DELETE SET NULL,
  captain_id        UUID REFERENCES qr_captains(id) ON DELETE SET NULL,
  pickup            TEXT NOT NULL,
  destination       TEXT NOT NULL,
  fare              FLOAT NOT NULL,
  vehicle           TEXT NOT NULL,
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','ongoing','completed','cancelled')),
  duration          FLOAT DEFAULT 0,
  distance          FLOAT DEFAULT 0,
  otp               TEXT NOT NULL,
  messages          JSONB DEFAULT '[]',
  payment_reference TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qr_blacklist_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kyc_documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  plate_number   TEXT DEFAULT '',
  national_id_url TEXT DEFAULT '',
  license_url    TEXT DEFAULT '',
  selfie_url     TEXT DEFAULT '',
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  submitted_at   TIMESTAMPTZ DEFAULT now(),
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- If kyc_documents already exists without selfie_url, add the column:
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS selfie_url TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS qr_admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT DEFAULT 'Admin',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Geospatial RPC: find active captains within radius using Haversine formula
CREATE OR REPLACE FUNCTION qr_captains_in_radius(
  p_lat float, p_lng float, p_radius_km float, p_vehicle_type text
)
RETURNS SETOF qr_captains
LANGUAGE sql STABLE AS $$
  SELECT * FROM qr_captains
  WHERE status = 'active'
    AND approval_status = 'approved'
    AND vehicle_type = p_vehicle_type
    AND (
      6371 * acos(
        cos(radians(p_lat)) * cos(radians(location_lat)) *
        cos(radians(location_lng) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(location_lat))
      )
    ) <= p_radius_km
  ORDER BY updated_at DESC;
$$;

-- ============================================================
-- u-bike Storage Policies & Helpers
-- Supabase SQL Editor → New query → paste this → Run
--
-- BEFORE running this, create 3 buckets manually:
--   Dashboard → Storage → New bucket:
--     1. avatars          (toggle Public ON,  5 MB limit)
--     2. kyc-documents    (toggle Public OFF, 10 MB limit)
--     3. delivery-proofs  (toggle Public ON,  5 MB limit)
-- ============================================================


-- ─────────────────────────────────────────
-- AVATARS BUCKET — public profile photos
-- ─────────────────────────────────────────

-- Anyone can view (public bucket)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- User can upload their own avatar
-- File path: {user_id}/avatar.jpg
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- User can overwrite (update) their own avatar
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- User can delete their own avatar
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ─────────────────────────────────────────
-- KYC-DOCUMENTS BUCKET — private rider docs
-- ─────────────────────────────────────────

-- Rider can upload their own documents
DROP POLICY IF EXISTS "kyc_owner_insert" ON storage.objects;
CREATE POLICY "kyc_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Rider can read their own documents
DROP POLICY IF EXISTS "kyc_owner_read" ON storage.objects;
CREATE POLICY "kyc_owner_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Rider can replace their documents
DROP POLICY IF EXISTS "kyc_owner_update" ON storage.objects;
CREATE POLICY "kyc_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ─────────────────────────────────────────
-- DELIVERY-PROOFS BUCKET — errand completion photos
-- ─────────────────────────────────────────

-- Anyone can view proof photos (public bucket)
DROP POLICY IF EXISTS "proofs_public_read" ON storage.objects;
CREATE POLICY "proofs_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'delivery-proofs');

-- Rider can upload delivery proof
DROP POLICY IF EXISTS "proofs_rider_insert" ON storage.objects;
CREATE POLICY "proofs_rider_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'delivery-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ─────────────────────────────────────────
-- ENSURE avatar_url COLUMN EXISTS on users
-- (already in schema.sql — safety net only)
-- ─────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'users'
      AND column_name  = 'avatar_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
  END IF;
END $$;


-- ─────────────────────────────────────────
-- FUNCTION — set avatar_url (called by backend after upload)
-- The backend calls this via RPC after a successful storage upload.
-- This is what makes the photo survive reloads — it's stored in the
-- users table, not just in storage, so it loads on every app open.
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_avatar_url(
  p_user_id  UUID,
  p_url      TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET    avatar_url = p_url,
         updated_at = NOW()
  WHERE  id = p_user_id;
END;
$$;


-- ─────────────────────────────────────────
-- FUNCTION — clear avatar_url (called by backend on delete)
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.clear_avatar_url(
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET    avatar_url = NULL,
         updated_at = NOW()
  WHERE  id = p_user_id;
END;
$$;


-- ─────────────────────────────────────────
-- FUNCTION — get KYC document path
-- Returns the storage path so backend can generate a signed URL
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_kyc_path(
  p_user_id UUID,
  p_doc_type TEXT   -- 'license' | 'national_id' | 'vehicle_photo' | 'insurance'
)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 'kyc-documents/' || p_user_id::text || '/' || p_doc_type || '.jpg';
$$;


-- ─────────────────────────────────────────
-- VIEW — rider profile with avatar (useful for admin dashboard)
-- ─────────────────────────────────────────

CREATE OR REPLACE VIEW public.riders_with_avatar AS
SELECT
  u.id,
  u.full_name,
  u.phone,
  u.email,
  u.avatar_url,
  u.role,
  u.is_active,
  rp.rider_type,
  rp.vehicle_type,
  rp.plate_number,
  rp.is_available,
  rp.is_kyc_verified,
  rp.rating,
  rp.total_rides,
  rp.earnings_total
FROM public.users u
LEFT JOIN public.rider_profiles rp ON rp.user_id = u.id
WHERE u.role IN ('passenger_rider', 'errands_rider');


-- ─────────────────────────────────────────
-- VIEW — customers with avatar
-- ─────────────────────────────────────────

CREATE OR REPLACE VIEW public.customers_with_avatar AS
SELECT
  u.id,
  u.full_name,
  u.phone,
  u.email,
  u.avatar_url,
  u.wallet_balance,
  u.loyalty_points,
  u.referral_code,
  u.created_at,
  cp.home_address,
  cp.work_address
FROM public.users u
LEFT JOIN public.customer_profiles cp ON cp.user_id = u.id
WHERE u.role = 'customer';

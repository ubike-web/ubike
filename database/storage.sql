-- ============================================================
-- u-bike Storage Setup
-- Run this ONCE in Supabase SQL Editor → New query
-- DO NOT run the full schema.sql again — just this file
-- ============================================================

-- ─────────────────────────────────────────
-- 1. CREATE STORAGE BUCKETS
-- ─────────────────────────────────────────

-- Profile photos (customers + riders)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,                          -- public = URL is readable without auth
  5242880,                       -- 5 MB max
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp'];

-- KYC documents (license, national ID, vehicle photo, insurance)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,                         -- private — only backend/admin can read
  10485760,                      -- 10 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- Proof of delivery photos (errands completion)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'delivery-proofs',
  'delivery-proofs',
  true,
  5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- ─────────────────────────────────────────
-- 2. STORAGE RLS POLICIES — avatars bucket
-- ─────────────────────────────────────────

-- Anyone can view avatar images (they are public)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar
-- File path must be: avatars/{user_id}/avatar.jpg
DROP POLICY IF EXISTS "avatars_owner_upload" ON storage.objects;
CREATE POLICY "avatars_owner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update (replace) their own avatar
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─────────────────────────────────────────
-- 3. STORAGE RLS POLICIES — kyc-documents bucket
-- ─────────────────────────────────────────

-- Riders can upload their own KYC documents
DROP POLICY IF EXISTS "kyc_rider_upload" ON storage.objects;
CREATE POLICY "kyc_rider_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Riders can read their own documents
DROP POLICY IF EXISTS "kyc_rider_read" ON storage.objects;
CREATE POLICY "kyc_rider_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role (backend/admin) can read all KYC documents
-- (handled automatically via service role key — no policy needed)

-- ─────────────────────────────────────────
-- 4. STORAGE RLS POLICIES — delivery-proofs bucket
-- ─────────────────────────────────────────

DROP POLICY IF EXISTS "proofs_public_read" ON storage.objects;
CREATE POLICY "proofs_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'delivery-proofs');

DROP POLICY IF EXISTS "proofs_rider_upload" ON storage.objects;
CREATE POLICY "proofs_rider_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'delivery-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─────────────────────────────────────────
-- 5. ENSURE avatar_url COLUMN EXISTS ON users
-- ─────────────────────────────────────────

-- (Already in schema — this is a safety net)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- ─────────────────────────────────────────
-- 6. FUNCTION — auto-update avatar_url on upload
-- ─────────────────────────────────────────
-- When a file is uploaded to avatars/{user_id}/avatar.*
-- automatically update users.avatar_url with the public URL

CREATE OR REPLACE FUNCTION storage.handle_avatar_upload()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_public_url TEXT;
BEGIN
  -- Only handle avatars bucket
  IF NEW.bucket_id != 'avatars' THEN
    RETURN NEW;
  END IF;

  -- Extract user_id from path: avatars/{user_id}/avatar.jpg
  BEGIN
    v_user_id := (storage.foldername(NEW.name))[1]::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  -- Build public URL
  v_public_url := 'https://wkqbbovazwphkeeurinz.supabase.co/storage/v1/object/public/avatars/' || NEW.name;

  -- Update users table
  UPDATE public.users
  SET avatar_url = v_public_url,
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN NEW;
END;
$$;

-- Attach trigger to storage.objects
DROP TRIGGER IF EXISTS trg_avatar_upload ON storage.objects;
CREATE TRIGGER trg_avatar_upload
  AFTER INSERT OR UPDATE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION storage.handle_avatar_upload();

-- ─────────────────────────────────────────
-- 7. FUNCTION — remove avatar_url when file deleted
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION storage.handle_avatar_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF OLD.bucket_id != 'avatars' THEN
    RETURN OLD;
  END IF;

  BEGIN
    v_user_id := (storage.foldername(OLD.name))[1]::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN OLD;
  END;

  -- Clear avatar_url only if it points to this file
  UPDATE public.users
  SET avatar_url = NULL,
      updated_at = NOW()
  WHERE id = v_user_id
    AND avatar_url LIKE '%' || OLD.name || '%';

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_avatar_delete ON storage.objects;
CREATE TRIGGER trg_avatar_delete
  AFTER DELETE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION storage.handle_avatar_delete();

-- ─────────────────────────────────────────
-- 8. HELPER FUNCTION — get signed URL for KYC docs
-- (called from backend to generate temporary read URLs)
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_kyc_signed_url(
  p_user_id UUID,
  p_filename TEXT,
  p_expires_in INT DEFAULT 3600
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Returns the storage path — backend generates actual signed URL
  -- via Supabase client: storage.from('kyc-documents').createSignedUrl(path, 3600)
  RETURN 'kyc-documents/' || p_user_id::TEXT || '/' || p_filename;
END;
$$;

-- ─────────────────────────────────────────
-- DONE — Buckets created:
--   avatars        (public)    → profile photos
--   kyc-documents  (private)   → rider KYC files
--   delivery-proofs (public)   → errand completion photos
-- ─────────────────────────────────────────

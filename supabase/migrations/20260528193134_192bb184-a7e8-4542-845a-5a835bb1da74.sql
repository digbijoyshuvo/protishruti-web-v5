
-- Extend shops with SME profile fields
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS logo_path text,
  ADD COLUMN IF NOT EXISTS cover_path text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS funding_goal numeric,
  ADD COLUMN IF NOT EXISTS current_funding numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS roi_expectation numeric,
  ADD COLUMN IF NOT EXISTS monthly_revenue numeric,
  ADD COLUMN IF NOT EXISTS team_size integer,
  ADD COLUMN IF NOT EXISTS risk_level text CHECK (risk_level IN ('low','medium','high')),
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS owner_display_name text;

-- Public storage bucket for SME profile images (logos + covers)
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-assets', 'shop-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
DROP POLICY IF EXISTS "shop_assets_public_read" ON storage.objects;
CREATE POLICY "shop_assets_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-assets');

DROP POLICY IF EXISTS "shop_assets_owner_write" ON storage.objects;
CREATE POLICY "shop_assets_owner_write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "shop_assets_owner_update" ON storage.objects;
CREATE POLICY "shop_assets_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "shop_assets_owner_delete" ON storage.objects;
CREATE POLICY "shop_assets_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shop-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

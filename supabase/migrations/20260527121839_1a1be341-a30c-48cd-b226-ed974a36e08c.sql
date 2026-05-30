
CREATE TABLE public.identity_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified','processing','verified','failed')),
  nid_path text,
  selfie_path text,
  match_score numeric,
  reason text,
  attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.identity_verifications TO authenticated;
GRANT ALL ON public.identity_verifications TO service_role;

ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

-- Owners manage their own record
CREATE POLICY "iv_owner_all" ON public.identity_verifications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Any authenticated user can read verified-status (for badge display across the platform).
-- Only exposes (user_id, status, verified_at) effectively; full row read still allowed
-- but contains no PII beyond storage paths which the storage RLS gates separately.
CREATE POLICY "iv_read_verified_public" ON public.identity_verifications
  FOR SELECT TO authenticated
  USING (status = 'verified');

CREATE TRIGGER iv_touch_updated_at
  BEFORE UPDATE ON public.identity_verifications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage policies for identity folder inside existing 'scans' bucket.
-- Path convention: {user_id}/identity/{file}
CREATE POLICY "scans_identity_owner_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'scans' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "scans_identity_owner_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'scans' AND (storage.foldername(name))[1] = auth.uid()::text);

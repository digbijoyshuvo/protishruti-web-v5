
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('sme', 'investor', 'admin');
CREATE TYPE public.transaction_type AS ENUM ('sale', 'expense', 'return');
CREATE TYPE public.payment_type AS ENUM ('cash', 'credit', 'baki');
CREATE TYPE public.upload_status AS ENUM ('pending', 'processing', 'extracted', 'validated', 'failed');
CREATE TYPE public.alert_urgency AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  language_pref TEXT NOT NULL DEFAULT 'bn',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ SHOPS ============
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  category TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  geo_lat NUMERIC,
  geo_lng NUMERIC,
  trade_license_no TEXT,
  owner_nid TEXT,
  business_age_years INT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shops_owner_all" ON public.shops FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
-- Investors can read a limited view of shops for matching
CREATE POLICY "shops_investor_select" ON public.shops FOR SELECT USING (public.has_role(auth.uid(), 'investor'));

-- ============ UPLOADS ============
CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  raw_ocr TEXT,
  ocr_language TEXT,
  model_version TEXT,
  confidence_map JSONB DEFAULT '{}'::jsonb,
  status upload_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uploads_owner_all" ON public.uploads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_uploads_shop_date ON public.uploads(shop_id, created_at DESC);

-- ============ TRANSACTIONS ============
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES public.uploads(id) ON DELETE SET NULL,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  type transaction_type NOT NULL DEFAULT 'sale',
  payment_type payment_type NOT NULL DEFAULT 'cash',
  counterparty TEXT,
  description TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  confidence_scores JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  validated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "txn_owner_all" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_txn_shop_date ON public.transactions(shop_id, txn_date DESC);

-- ============ ALERTS ============
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  urgency alert_urgency NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  details TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_shop_owner" ON public.alerts FOR ALL
USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()));

-- ============ INVESTOR PROFILES ============
CREATE TABLE public.investor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  contact_email TEXT,
  sectors TEXT[] DEFAULT '{}',
  preferred_location TEXT,
  min_monthly_revenue NUMERIC(12,2) DEFAULT 0,
  max_monthly_revenue NUMERIC(12,2),
  ticket_size_min NUMERIC(12,2),
  ticket_size_max NUMERIC(12,2),
  risk_tolerance TEXT DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_profile_self" ON public.investor_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- SMEs can see investor profiles (basic info only used in matching display)
CREATE POLICY "inv_profile_read_sme" ON public.investor_profiles FOR SELECT USING (public.has_role(auth.uid(), 'sme'));

-- ============ DOCUMENT DRAFTS ============
CREATE TABLE public.document_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  generated_by_ai BOOLEAN NOT NULL DEFAULT true,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.document_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs_owner_all" ON public.document_drafts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ VERIFICATION ============
CREATE TABLE public.verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status verification_status NOT NULL DEFAULT 'pending',
  score INT DEFAULT 0,
  evidence JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verif_owner_all" ON public.verification_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES public.uploads(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select_own" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "audit_insert_own" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, language_pref)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email), 'bn')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'sme'::app_role))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_shops_updated BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_uploads_updated BEFORE UPDATE ON public.uploads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_txn_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_inv_updated BEFORE UPDATE ON public.investor_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_verif_updated BEFORE UPDATE ON public.verification_results FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ STORAGE ============
INSERT INTO storage.buckets (id, name, public) VALUES ('scans', 'scans', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "scans_user_select" ON storage.objects FOR SELECT
USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "scans_user_insert" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "scans_user_update" ON storage.objects FOR UPDATE
USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "scans_user_delete" ON storage.objects FOR DELETE
USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);

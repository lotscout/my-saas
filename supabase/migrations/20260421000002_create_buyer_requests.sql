CREATE TABLE IF NOT EXISTS public.buyer_requests (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status            text        NOT NULL DEFAULT 'active',
  target_regions    text[]      NOT NULL DEFAULT '{}',
  budget_min        numeric,
  budget_max        numeric,
  min_acreage       numeric,
  max_acreage       numeric,
  use_case          text        NOT NULL DEFAULT '',
  zoning_preference text[]      NOT NULL DEFAULT '{}',
  timeline          text        NOT NULL DEFAULT '',
  additional_notes  text,
  contact_preference text[]     NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.buyer_requests ENABLE ROW LEVEL SECURITY;

-- Everyone can read active requests
CREATE POLICY "buyer_requests_read_active"
  ON public.buyer_requests
  FOR SELECT
  USING (status = 'active');

-- Authenticated users can insert their own requests
CREATE POLICY "buyer_requests_insert_own"
  ON public.buyer_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update/delete only their own requests
CREATE POLICY "buyer_requests_modify_own"
  ON public.buyer_requests
  FOR ALL
  USING (auth.uid() = user_id);

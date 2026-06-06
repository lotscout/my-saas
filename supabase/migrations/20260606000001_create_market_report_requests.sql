CREATE TABLE IF NOT EXISTS public.market_report_requests (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text        NOT NULL,
  county           text        NOT NULL,
  state            text        NOT NULL,
  status           text        NOT NULL DEFAULT 'pending',
  report_url       text,
  is_paid          boolean     NOT NULL DEFAULT false,
  report_frequency text        NOT NULL DEFAULT 'once',
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_report_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_report_requests_service_role"
  ON public.market_report_requests
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

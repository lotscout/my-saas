ALTER TABLE public.market_report_requests
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text;

CREATE UNIQUE INDEX IF NOT EXISTS market_report_requests_email_idx
  ON public.market_report_requests (email);

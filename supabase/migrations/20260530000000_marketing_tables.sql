-- ============================================================
-- Migration: 2026-05-30 — Marketing tables
-- ============================================================

-- ad_spend: manual weekly ad spend log per channel
CREATE TABLE IF NOT EXISTS public.ad_spend (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  date          date        NOT NULL,
  channel       text        NOT NULL, -- meta / linkedin / other
  campaign_name text,
  spend         numeric     NOT NULL,
  leads         integer     NOT NULL DEFAULT 0,
  conversions   integer     NOT NULL DEFAULT 0,
  notes         text
);

ALTER TABLE public.ad_spend ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_spend_service_role" ON public.ad_spend
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- email_subscribers: manual list + future ConvertKit sync
CREATE TABLE IF NOT EXISTS public.email_subscribers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  email         text        NOT NULL,
  first_name    text,
  audience_type text,         -- seller / buyer
  source        text,
  status        text        NOT NULL DEFAULT 'active',
  subscribed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_subscribers_service_role" ON public.email_subscribers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- linkedin_outreach: pipeline tracking for LinkedIn prospecting
CREATE TABLE IF NOT EXISTS public.linkedin_outreach (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  contact_name    text,
  company         text,
  stage           text        NOT NULL DEFAULT 'connected', -- connected / value_sent / pitched / replied / converted
  notes           text,
  last_contact_at timestamptz
);

ALTER TABLE public.linkedin_outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "linkedin_outreach_service_role" ON public.linkedin_outreach
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- Migration: 2026-04-29 — Schema additions for buyer profiles seed
-- ============================================================

-- profiles: add is_test_profile flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_test_profile boolean NOT NULL DEFAULT false;

-- profiles: add company_name
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name text;

-- buyer_requests: add is_test_profile flag
ALTER TABLE public.buyer_requests
  ADD COLUMN IF NOT EXISTS is_test_profile boolean NOT NULL DEFAULT false;

-- buyer_requests: add missing columns
ALTER TABLE public.buyer_requests
  ADD COLUMN IF NOT EXISTS price_per_acre   numeric,
  ADD COLUMN IF NOT EXISTS road_access      text,
  ADD COLUMN IF NOT EXISTS utilities        text[],
  ADD COLUMN IF NOT EXISTS financing        text,
  ADD COLUMN IF NOT EXISTS target_state     text,
  ADD COLUMN IF NOT EXISTS target_county    text,
  ADD COLUMN IF NOT EXISTS target_city      text,
  ADD COLUMN IF NOT EXISTS target_zip       text,
  ADD COLUMN IF NOT EXISTS use_case_description  text,
  ADD COLUMN IF NOT EXISTS specific_requirements text,
  ADD COLUMN IF NOT EXISTS state            text;

-- buyer_requests: ensure defaults on existing columns
ALTER TABLE public.buyer_requests
  ALTER COLUMN status             SET DEFAULT 'active',
  ALTER COLUMN timeline           SET DEFAULT '',
  ALTER COLUMN use_case           SET DEFAULT '',
  ALTER COLUMN zoning_preference  SET DEFAULT '{}',
  ALTER COLUMN contact_preference SET DEFAULT '{}';

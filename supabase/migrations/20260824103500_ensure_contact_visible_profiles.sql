-- Ensure profile contact visibility preference exists in production.
-- A previous migration introduced this column, but some environments are missing it.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_visible boolean DEFAULT false;

UPDATE public.profiles
SET contact_visible = false
WHERE contact_visible IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN contact_visible SET DEFAULT false;

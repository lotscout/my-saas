-- Add city column to listings table
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '';

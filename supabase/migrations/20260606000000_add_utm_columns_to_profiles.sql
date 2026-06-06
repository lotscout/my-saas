-- Add UTM tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_source   text,
  ADD COLUMN IF NOT EXISTS signup_medium   text,
  ADD COLUMN IF NOT EXISTS signup_campaign text;

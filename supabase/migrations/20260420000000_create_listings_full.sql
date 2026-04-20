-- Drop dependent tables first, then recreate listings with full schema

DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;

CREATE TABLE public.listings (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        REFERENCES auth.users NOT NULL,
  status                  text        NOT NULL DEFAULT 'pending_review',
  revision_notes          text,
  ownership_type          text        NOT NULL DEFAULT '',
  ownership_certified     boolean     NOT NULL DEFAULT false,
  title                   text        NOT NULL DEFAULT '',
  property_description    text        NOT NULL DEFAULT '',
  state                   text        NOT NULL DEFAULT '',
  county                  text        NOT NULL DEFAULT '',
  zip_code                text        NOT NULL DEFAULT '',
  street_address          text,
  apn                     text,
  lot_size_acres          numeric,
  lot_size_sqft           numeric,
  zoning                  text        NOT NULL DEFAULT '',
  road_access             text[]      NOT NULL DEFAULT '{}',
  utilities               text[]      NOT NULL DEFAULT '{}',
  asking_price            numeric     NOT NULL DEFAULT 0,
  comparable_market_value numeric,
  price_negotiable        boolean     NOT NULL DEFAULT false,
  preferred_close_date    date,
  additional_information  text,
  contact_methods         text[]      NOT NULL DEFAULT '{}',
  photos_urls             text[],
  contract_url            text,
  legal_confirmation      boolean     NOT NULL DEFAULT false,
  platform_understanding  boolean     NOT NULL DEFAULT false,
  state_compliance        boolean     NOT NULL DEFAULT false,
  digital_signature       text        NOT NULL DEFAULT '',
  signature_date          date,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own listings"
  ON public.listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own listings"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
  ON public.listings FOR UPDATE
  USING (auth.uid() = user_id);

-- Recreate matches table
CREATE TABLE public.matches (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        uuid        REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_criteria_id uuid        REFERENCES public.buyer_criteria(id) ON DELETE CASCADE,
  score             numeric     NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(listing_id, buyer_criteria_id)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view matches for their listings"
  ON public.matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

-- Storage bucket for listing photos and documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-assets',
  'listing-assets',
  true,
  52428800,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload listing assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-assets');

CREATE POLICY "Anyone can view listing assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-assets');

CREATE POLICY "Users can delete their own listing assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'listing-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

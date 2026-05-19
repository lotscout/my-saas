ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS source_url text;
COMMENT ON COLUMN public.listings.source_url IS 'Original Facebook Marketplace or other source URL for scraped/imported listings';

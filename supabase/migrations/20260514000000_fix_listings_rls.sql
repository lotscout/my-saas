-- Allow anyone to view active listings (marketplace is public)
CREATE POLICY "Anyone can view active listings"
  ON public.listings FOR SELECT
  USING (status = 'active');

-- Make user_id nullable for imported/scraped listings
ALTER TABLE public.listings ALTER COLUMN user_id DROP NOT NULL;

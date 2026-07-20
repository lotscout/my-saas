-- Target cities and lot-size preferences for buyer requests.
ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_cities text;
ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS lot_size_min numeric;
ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS lot_size_max numeric;
ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS lot_size_label text;

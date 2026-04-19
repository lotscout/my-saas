-- listings
CREATE TABLE IF NOT EXISTS listings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  location    text,
  county      text,
  state       text NOT NULL DEFAULT 'TX',
  acreage     numeric,
  price       numeric,
  land_type   text,
  status      text NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- buyer_criteria
CREATE TABLE IF NOT EXISTS buyer_criteria (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location     text,
  min_acreage  numeric,
  max_acreage  numeric,
  min_budget   numeric,
  max_budget   numeric,
  land_type    text,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- messages
CREATE TABLE IF NOT EXISTS messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body         text NOT NULL,
  listing_id   uuid REFERENCES listings(id) ON DELETE SET NULL,
  read         boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- reports
CREATE TABLE IF NOT EXISTS reports (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  title      text NOT NULL,
  score      integer CHECK (score >= 0 AND score <= 100),
  status     text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- matches (pre-computed listing ↔ buyer_criteria pairings)
CREATE TABLE IF NOT EXISTS matches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_criteria_id uuid NOT NULL REFERENCES buyer_criteria(id) ON DELETE CASCADE,
  score             integer CHECK (score >= 0 AND score <= 100),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_criteria_id)
);

-- RLS
ALTER TABLE listings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches        ENABLE ROW LEVEL SECURITY;

-- listings: owner reads/writes own; everyone reads active
CREATE POLICY "listings_owner"  ON listings FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "listings_public" ON listings FOR SELECT USING (status = 'active');

-- buyer_criteria: owner only
CREATE POLICY "buyer_criteria_owner" ON buyer_criteria FOR ALL USING (auth.uid() = user_id);
-- sellers need to read all active criteria to find buyers
CREATE POLICY "buyer_criteria_read_active" ON buyer_criteria FOR SELECT USING (active = true);

-- messages: sender or recipient
CREATE POLICY "messages_parties" ON messages FOR ALL
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- reports: owner only
CREATE POLICY "reports_owner" ON reports FOR ALL USING (auth.uid() = user_id);

-- matches: visible to listing owner or criteria owner
CREATE POLICY "matches_visible" ON matches FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM listings      WHERE id = listing_id)
    OR
    auth.uid() = (SELECT user_id FROM buyer_criteria WHERE id = buyer_criteria_id)
  );

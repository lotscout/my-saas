-- Contact visibility preference for profiles.
-- Default false (private) so users must opt in to sharing their contact info publicly.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_visible boolean DEFAULT false;

-- ============================================================
-- Migration: 2026-05-30 — Messages dashboard additions
-- ============================================================

-- profiles: managed account flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS managed_by_lotscout boolean NOT NULL DEFAULT false;

-- messages: admin reply tracking
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_read         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at         timestamptz,
  ADD COLUMN IF NOT EXISTS sent_by_admin   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sender_type     text    NOT NULL DEFAULT 'user';

-- conversations: create if not yet migrated (table already exists in production)
CREATE TABLE IF NOT EXISTS public.conversations (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  buyer_id             uuid        REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id            uuid        REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id           uuid        REFERENCES public.listings(id) ON DELETE SET NULL,
  subject              text,
  status               text        NOT NULL DEFAULT 'active',
  last_message_at      timestamptz,
  last_message_preview text
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_service_role" ON public.conversations;
CREATE POLICY "conversations_service_role" ON public.conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "conversations_parties" ON public.conversations;
CREATE POLICY "conversations_parties" ON public.conversations
  FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

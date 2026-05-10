'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  recipientId: string;
  recipientName: string;
  currentUserId: string;
  currentUserIsBuyer: boolean;
  listingId?: string;
  onClose: () => void;
  onSent: () => void;
}

export default function SendMessageModal({
  recipientId,
  recipientName,
  currentUserId,
  currentUserIsBuyer,
  listingId,
  onClose,
  onSent,
}: Props) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const body = message.trim();
    console.log('[SendMessageModal] handleSend called', { body, currentUserId, recipientId, currentUserIsBuyer });

    if (!body) { setError('Please enter a message.'); return; }
    if (!currentUserId) { setError('Not signed in. Please refresh and try again.'); return; }
    if (!recipientId) { setError("This listing's seller is not currently available for messaging."); return; }
    if (sending) return;

    setError(null);
    setSending(true);

    const supabase = createClient();

    const buyerId  = currentUserIsBuyer ? currentUserId : recipientId;
    const sellerId = currentUserIsBuyer ? recipientId   : currentUserId;

    // Find existing conversation between exactly these two participants (either role order)
    const { data: existing, error: findErr } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(buyer_id.eq.${currentUserId},seller_id.eq.${recipientId}),` +
        `and(buyer_id.eq.${recipientId},seller_id.eq.${currentUserId})`
      )
      .limit(1)
      .maybeSingle();

    console.log('[SendMessageModal] find existing conversation', { existing, findErr });

    let conversationId: string | null = existing?.id ?? null;

    if (!conversationId) {
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({ buyer_id: buyerId, seller_id: sellerId, status: 'active', listing_id: listingId ?? null })
        .select('id')
        .single();

      console.log('[SendMessageModal] create conversation', { newConv, convErr });

      if (convErr || !newConv) {
        setError(convErr?.message ?? 'Failed to create conversation. Please try again.');
        setSending(false);
        return;
      }
      conversationId = newConv.id;
    }

    const { error: msgErr } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body });

    console.log('[SendMessageModal] insert message', { conversationId, msgErr });

    if (msgErr) {
      setError(msgErr.message ?? 'Failed to send message. Please try again.');
      setSending(false);
      return;
    }

    // Best-effort update to conversation preview (non-blocking)
    const preview = body.length > 100 ? body.slice(0, 100) + '…' : body;
    supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString(), last_message_preview: preview })
      .eq('id', conversationId)
      .then(({ error: updErr }) => {
        if (updErr) console.warn('[SendMessageModal] conversation preview update failed', updErr);
      });

    setSending(false);
    onSent();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <h2 className="font-headline text-xl font-bold text-primary mb-1">Send a Message</h2>
        <p className="text-secondary text-sm mb-6">{recipientName}</p>

        <textarea
          rows={4}
          className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none mb-4"
          placeholder="Hi, I have a property that matches your criteria. Interested in learning more?"
          value={message}
          onChange={e => { setMessage(e.target.value); if (error) setError(null); }}
        />

        {error && (
          <div className="mb-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="flex-1 bg-[#012d1d] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#012d1d]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending…' : 'Send Message'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

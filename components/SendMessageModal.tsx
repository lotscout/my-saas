'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  recipientId: string;
  recipientName: string;
  currentUserId: string;
  currentUserIsBuyer: boolean;
  onClose: () => void;
  onSent: () => void;
}

export default function SendMessageModal({
  recipientId,
  recipientName,
  currentUserId,
  currentUserIsBuyer,
  onClose,
  onSent,
}: Props) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const body = message.trim();
    if (!body || sending || !currentUserId) return;
    setSending(true);

    const supabase = createClient();

    const buyerId = currentUserIsBuyer ? currentUserId : recipientId;
    const sellerId = currentUserIsBuyer ? recipientId : currentUserId;

    // Find any existing conversation with this recipient (RLS already scopes to current user)
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`buyer_id.eq.${recipientId},seller_id.eq.${recipientId}`)
      .limit(1)
      .maybeSingle();

    let conversationId: string | undefined = existing?.id;

    if (!conversationId) {
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          buyer_id: buyerId,
          seller_id: sellerId,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (convErr || !newConv) { setSending(false); return; }
      conversationId = newConv.id;
    }

    const now = new Date().toISOString();
    const { error: msgErr } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body });

    if (!msgErr) {
      await supabase
        .from('conversations')
        .update({
          last_message_at: now,
          last_message_preview: body.length > 100 ? body.slice(0, 100) + '…' : body,
        })
        .eq('id', conversationId);
      onSent();
    }
    setSending(false);
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
          className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none mb-6"
          placeholder="Hi, I have a property that matches your criteria. Interested in learning more?"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />

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

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  recipientId: string;
  recipientName: string;
  currentUserId: string;
  currentUserIsBuyer: boolean;
  listingId?: string;
  alreadyMessaged?: boolean;
  onClose: () => void;
  onSent: () => void;
}

export default function SendMessageModal({
  recipientId,
  recipientName,
  currentUserIsBuyer,
  listingId,
  alreadyMessaged,
  onClose,
  onSent,
}: Props) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const body = message.trim();
    if (!body) { setError('Please enter a message.'); return; }
    if (!recipientId) { setError('This seller is not currently available for messaging.'); return; }
    if (sending) return;

    setError(null);
    setSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, body, currentUserIsBuyer, listingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      setSent(true);
      setTimeout(() => onSent(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
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

        {sent ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <p className="text-lg font-bold text-on-surface">Message sent!</p>
            <p className="text-sm text-on-surface/50">Closing in a moment…</p>
          </div>
        ) : (
          <>
            <h2 className="font-headline text-xl font-bold text-primary mb-6">Message {recipientName}</h2>

            {alreadyMessaged && (
              <div className="mb-4 flex items-start gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">info</span>
                <span>
                  You've already messaged this seller about this listing.{' '}
                  <Link href="/messaging" className="font-semibold underline hover:text-blue-900">
                    View conversation in Messaging
                  </Link>
                </span>
              </div>
            )}

            <textarea
              rows={4}
              className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none mb-4"
              placeholder="Type your message..."
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
                className="flex-1 bg-green-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          </>
        )}
      </div>
    </div>
  );
}

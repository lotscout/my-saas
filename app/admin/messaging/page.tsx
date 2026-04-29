'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TestProfile {
  id: string;
  user_id: string;
  target_regions: string[] | null;
  use_case: string | null;
  created_at: string;
  profile?: { name: string; email: string | null };
}

interface Listing {
  id: string;
  title: string;
  state: string | null;
  county: string | null;
  user_id: string;
  owner?: { name: string; email: string | null };
}

interface Message {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  sender: { name: string; email: string | null };
  recipient: { name: string; email: string | null };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function AdminMessagingPage() {
  const [testProfiles, setTestProfiles] = useState<TestProfile[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [selectedProfile, setSelectedProfile] = useState<TestProfile | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [messageText, setMessageText] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    (async () => {
      setLoadingProfiles(true);
      const supabase = createClient();
      const { data: buyerRequests } = await supabase
        .from('buyer_requests')
        .select('id, user_id, target_regions, use_case, created_at')
        .eq('is_test_profile', true)
        .order('created_at', { ascending: false });

      const rows = buyerRequests ?? [];
      if (!rows.length) { setTestProfiles([]); setLoadingProfiles(false); return; }

      const userIds = [...new Set(rows.map((r: TestProfile) => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name, email')
        .in('id', userIds);

      const pm: Record<string, { name: string; email: string | null }> = {};
      (profiles ?? []).forEach((p: { id: string; full_name: string | null; first_name: string | null; last_name: string | null; email: string | null }) => {
        pm[p.id] = {
          name: p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown',
          email: p.email,
        };
      });

      setTestProfiles(rows.map((r: TestProfile) => ({ ...r, profile: pm[r.user_id] })));
      setLoadingProfiles(false);
    })();
  }, []);

  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('listings')
      .select('id, title, state, county, user_id')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    const rows = data ?? [];
    if (!rows.length) { setListings([]); setLoadingListings(false); return; }

    const userIds = [...new Set(rows.map((r: Listing) => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, first_name, last_name, email')
      .in('id', userIds);

    const pm: Record<string, { name: string; email: string | null }> = {};
    (profiles ?? []).forEach((p: { id: string; full_name: string | null; first_name: string | null; last_name: string | null; email: string | null }) => {
      pm[p.id] = {
        name: p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown',
        email: p.email,
      };
    });

    setListings(rows.map((r: Listing) => ({ ...r, owner: pm[r.user_id] })));
    setLoadingListings(false);
  }, []);

  const loadMessages = useCallback(async () => {
    if (!selectedProfile || !selectedListing) return;
    setLoadingMessages(true);
    const res = await fetch(
      `/api/admin/messages?listing_id=${selectedListing.id}&sender_id=${selectedProfile.user_id}`
    );
    const data = await res.json();
    setMessages(data.messages ?? []);
    setLoadingMessages(false);
  }, [selectedProfile, selectedListing]);

  useEffect(() => {
    if (selectedProfile) { loadListings(); setSelectedListing(null); setMessages([]); }
  }, [selectedProfile, loadListings]);

  useEffect(() => {
    if (selectedProfile && selectedListing) loadMessages();
  }, [selectedProfile, selectedListing, loadMessages]);

  async function handleSend() {
    if (!selectedProfile || !selectedListing || !messageText.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: selectedListing.id,
          sender_id: selectedProfile.user_id,
          recipient_id: selectedListing.user_id,
          message: messageText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send');
      setMessageText('');
      await loadMessages();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error sending message', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="p-8 pb-4">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Buyer Messaging</h1>
        <p className="text-on-surface/50 mt-1 text-sm">
          Send messages as a test buyer profile to test the seller messaging experience.
          Mark a buyer request as <code className="bg-surface-container-low px-1 rounded text-xs">is_test_profile = true</code> in Supabase to enable it here.
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden px-8 pb-8 gap-6 min-h-0">
        {/* Step 1: Select test profile */}
        <div className="w-72 flex-none flex flex-col">
          <p className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-3">1. Test Profile</p>
          <div className="flex-1 overflow-y-auto space-y-2">
            {loadingProfiles ? (
              <div className="text-sm text-on-surface/40 p-4 text-center">Loading…</div>
            ) : testProfiles.length === 0 ? (
              <div className="bg-white border border-outline-variant/10 rounded-xl p-4 text-sm text-on-surface/40 text-center">
                No test profiles found.<br />
                <span className="text-xs mt-1 block">Set <code className="bg-surface-container-low px-1 rounded">is_test_profile = true</code> on a buyer request in Supabase.</span>
              </div>
            ) : testProfiles.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProfile(p)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedProfile?.id === p.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-outline-variant/10 bg-white hover:bg-surface-container-low'
                }`}
              >
                <p className="font-semibold text-sm text-on-surface">{p.profile?.name ?? 'Unknown'}</p>
                <p className="text-xs text-on-surface/50 truncate">{p.profile?.email ?? '—'}</p>
                <p className="text-xs text-on-surface/40 mt-1">{(p.target_regions ?? []).slice(0, 2).join(', ') || '—'}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select listing */}
        <div className="w-72 flex-none flex flex-col">
          <p className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-3">2. Listing to Message About</p>
          {!selectedProfile ? (
            <div className="flex-1 bg-white border border-outline-variant/10 rounded-xl p-4 text-sm text-on-surface/30 text-center flex items-center justify-center">
              Select a test profile first
            </div>
          ) : loadingListings ? (
            <div className="text-sm text-on-surface/40 p-4 text-center">Loading listings…</div>
          ) : listings.length === 0 ? (
            <div className="bg-white border border-outline-variant/10 rounded-xl p-4 text-sm text-on-surface/40 text-center">No active listings.</div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2">
              {listings.map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedListing(l)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedListing?.id === l.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-outline-variant/10 bg-white hover:bg-surface-container-low'
                  }`}
                >
                  <p className="font-semibold text-sm text-on-surface line-clamp-1">{l.title || '—'}</p>
                  <p className="text-xs text-on-surface/50">{[l.county, l.state].filter(Boolean).join(', ') || '—'}</p>
                  <p className="text-xs text-on-surface/40 mt-0.5">Owner: {l.owner?.name ?? '—'}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Thread + compose */}
        <div className="flex-1 flex flex-col min-w-0">
          <p className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-3">3. Conversation</p>
          <div className="flex-1 bg-white border border-outline-variant/10 rounded-xl flex flex-col overflow-hidden">
            {!selectedProfile || !selectedListing ? (
              <div className="flex-1 flex items-center justify-center text-on-surface/30 text-sm">
                Select a profile and listing to view the conversation.
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="px-5 py-3 border-b border-outline-variant/10 bg-surface-container-low flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{selectedListing.title}</p>
                    <p className="text-xs text-on-surface/50">
                      Messaging as <span className="font-medium text-primary">{selectedProfile.profile?.name}</span>
                      {' → '}{selectedListing.owner?.name}
                    </p>
                  </div>
                  <button onClick={loadMessages} className="text-on-surface/40 hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-lg">refresh</span>
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {loadingMessages ? (
                    <div className="text-center text-on-surface/40 text-sm py-8">Loading messages…</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-on-surface/30 text-sm py-8">No messages yet. Start the conversation below.</div>
                  ) : messages.map(m => {
                    const isTestBuyer = m.sender_id === selectedProfile.user_id;
                    return (
                      <div key={m.id} className={`flex ${isTestBuyer ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isTestBuyer
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-surface-container-low text-on-surface rounded-bl-sm'
                        }`}>
                          <p className="text-xs font-semibold mb-1 opacity-70">
                            {isTestBuyer ? selectedProfile.profile?.name : m.sender.name}
                          </p>
                          <p className="text-sm">{m.body}</p>
                          <p className={`text-[10px] mt-1 ${isTestBuyer ? 'text-white/60' : 'text-on-surface/40'}`}>
                            {fmtDate(m.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Compose */}
                <div className="px-5 py-4 border-t border-outline-variant/10">
                  <div className="flex gap-3">
                    <textarea
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={`Message as ${selectedProfile.profile?.name}…`}
                      rows={2}
                      className="flex-1 bg-surface-container-low border-none rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !messageText.trim()}
                      className="px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40 self-end"
                    >
                      {sending ? (
                        <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-lg">send</span>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-on-surface/30 mt-2">Press Enter to send · Shift+Enter for new line</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Participant {
  id: string | null;
  name: string;
  email: string | null;
  initials: string;
}

interface ConvListing {
  id: string;
  title: string | null;
  street_address: string | null;
  county: string | null;
  state: string | null;
}

interface AdminConversation {
  id: string;
  buyer_id: string | null;
  seller_id: string | null;
  listing_id: string | null;
  status: string | null;
  buyer: Participant;
  seller: Participant;
  listing: ConvListing | null;
  last_message_preview: string;
  last_activity_at: string | null;
  message_count: number;
  unread_count: number;
  orphan: boolean;
}

interface Totals {
  total_conversations: number;
  total_messages: number;
  unread_messages: number;
}

interface ThreadMessage {
  id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
  is_read: boolean;
  role: 'buyer' | 'seller' | 'admin';
  is_admin: boolean;
  sender_name: string;
  recipient_name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtFull(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: number | null; icon: string; color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/10 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-none ${color}`}>
        <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-extrabold font-headline text-on-surface">
          {value === null
            ? <span className="inline-block w-12 h-7 bg-surface-container animate-pulse rounded" />
            : value.toLocaleString()}
        </p>
        <p className="text-xs text-on-surface/60 font-medium mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-on-surface/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [totals, setTotals]               = useState<Totals | null>(null);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [thread, setThread]               = useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText]         = useState('');
  const [sending, setSending]             = useState(false);
  const [sendMsg, setSendMsg]             = useState<{ text: string; ok: boolean } | null>(null);
  const threadBottomRef = useRef<HTMLDivElement>(null);

  // ── Load conversation list (source of truth = messages table) ──────────────
  const loadConversations = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/admin/messages/conversations', { cache: 'no-store' });
    const d = await r.json();
    setConversations(d.conversations ?? []);
    setTotals(d.totals ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load thread when a conversation is selected ────────────────────────────
  const loadThread = useCallback(async (id: string) => {
    setThreadLoading(true);
    setThread([]);
    const r = await fetch(`/api/admin/messages/thread/${id}`, { cache: 'no-store' });
    const d = await r.json();
    setThread(d.messages ?? []);
    setThreadLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadThread(selectedId);
    setReplyText('');
    setSendMsg(null);
  }, [selectedId, loadThread]);

  useEffect(() => {
    if (!threadLoading && thread.length > 0) {
      threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thread, threadLoading]);

  const selectedConv = useMemo(
    () => conversations.find(c => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  // ── Filter by participant name (or listing address) ────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c =>
      c.buyer.name.toLowerCase().includes(q) ||
      c.seller.name.toLowerCase().includes(q) ||
      (c.buyer.email ?? '').toLowerCase().includes(q) ||
      (c.seller.email ?? '').toLowerCase().includes(q) ||
      (c.listing?.street_address ?? '').toLowerCase().includes(q) ||
      (c.listing?.title ?? '').toLowerCase().includes(q)
    );
  }, [conversations, search]);

  // ── Admin sends a message into the conversation ────────────────────────────
  async function sendReply() {
    if (!selectedId || !replyText.trim()) return;
    setSending(true);
    setSendMsg(null);
    const r = await fetch('/api/admin/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: selectedId, body: replyText }),
    });
    const d = await r.json();
    if (r.ok) {
      setReplyText('');
      setThread(prev => [...prev, d.message]);
      setSendMsg({ text: 'Sent as LotScout Support', ok: true });
      loadConversations(); // refresh previews / counts
    } else {
      setSendMsg({ text: d.error ?? 'Failed to send', ok: false });
    }
    setSending(false);
    setTimeout(() => setSendMsg(null), 3500);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header + accuracy KPIs */}
      <div className="flex-none px-4 sm:px-8 pt-6 pb-4 border-b border-outline-variant/10 bg-surface-container-low">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">Message Monitoring</h1>
            <p className="text-on-surface/50 mt-0.5 text-xs">
              Every conversation between all users — read the full thread and respond as LotScout Support.
            </p>
          </div>
          <button
            onClick={loadConversations}
            className="flex-none flex items-center gap-1.5 text-xs font-semibold text-on-surface/60 hover:text-on-surface border border-outline-variant/20 rounded-lg px-3 py-1.5 bg-white transition-colors"
          >
            <span className="material-symbols-outlined text-base">refresh</span> Refresh
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          <StatCard label="Conversations" value={loading ? null : totals?.total_conversations ?? 0} icon="forum" color="bg-blue-600" sub="distinct conversation_id" />
          <StatCard label="Total Messages" value={loading ? null : totals?.total_messages ?? 0} icon="chat" color="bg-emerald-600" sub="count(*) messages" />
          <StatCard label="Unread" value={loading ? null : totals?.unread_messages ?? 0} icon="mark_chat_unread" color="bg-amber-500" />
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: conversation list ── */}
        <div className="w-[36%] max-w-md flex-none flex flex-col border-r border-outline-variant/10 bg-white">
          <div className="flex-none px-4 pt-4 pb-3 border-b border-outline-variant/10 space-y-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface/30 text-sm">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by participant name, email, or address…"
                className="w-full pl-8 pr-3 py-2 text-xs bg-surface-container-low border border-outline-variant/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface/30"
              />
            </div>
            <p className="text-xs text-on-surface/40">
              {filtered.length} of {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/8">
            {loading ? (
              <div className="p-8 text-center text-on-surface/40 text-xs">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-on-surface/40 text-xs">No conversations</div>
            ) : filtered.map(conv => {
              const active = conv.id === selectedId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors hover:bg-surface-container-low ${
                    active ? 'bg-[#E8F5F0] border-l-2 border-l-[#1D9E75]' : ''
                  }`}
                >
                  <div className="relative flex-none w-9 h-9 mt-0.5">
                    <div className="absolute top-0 left-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-bold" style={{ fontSize: 9 }}>{conv.buyer.initials}</span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center ring-1 ring-white">
                      <span className="text-white font-bold" style={{ fontSize: 8 }}>{conv.seller.initials}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-semibold text-on-surface truncate leading-tight min-w-0">
                        {conv.buyer.name}<span className="text-on-surface/40 font-normal"> → </span>{conv.seller.name}
                      </p>
                      <div className="flex-none text-right">
                        <p className="text-[10px] text-on-surface/40 whitespace-nowrap">{relativeTime(conv.last_activity_at)}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-500 leading-none">{conv.message_count} msg</span>
                          {conv.unread_count > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-none" />}
                        </div>
                      </div>
                    </div>
                    {conv.listing && (
                      <p className="text-[10px] text-on-surface/40 truncate mt-0.5 leading-tight">
                        {conv.listing.street_address || conv.listing.title || '—'}{conv.listing.state ? `, ${conv.listing.state}` : ''}
                      </p>
                    )}
                    {conv.last_message_preview && (
                      <p className="text-[11px] text-on-surface/50 mt-1 leading-snug line-clamp-1">{conv.last_message_preview}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: thread + composer ── */}
        <div className="flex-1 flex flex-col bg-surface-container-low overflow-hidden">
          {!selectedConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-6">
              <span className="material-symbols-outlined text-5xl text-on-surface/15">forum</span>
              <div>
                <p className="text-sm font-semibold text-on-surface/40">Select a conversation to read the full thread</p>
                <p className="text-xs text-on-surface/25 mt-1">{conversations.length} total conversations · {totals?.total_messages ?? 0} messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex-none bg-white border-b border-outline-variant/10 px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-headline text-base font-bold text-on-surface">
                      {selectedConv.buyer.name}<span className="text-on-surface/40 font-normal mx-1.5">↔</span>{selectedConv.seller.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-on-surface/50 flex-wrap">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />{selectedConv.buyer.name} (buyer){selectedConv.buyer.email ? ` · ${selectedConv.buyer.email}` : ''}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" />{selectedConv.seller.name} (seller){selectedConv.seller.email ? ` · ${selectedConv.seller.email}` : ''}</span>
                    </div>
                    {selectedConv.listing && (
                      <p className="text-[11px] text-on-surface/40 mt-1 truncate">
                        <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">location_on</span>
                        {[selectedConv.listing.street_address, selectedConv.listing.county, selectedConv.listing.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="flex-none text-[10px] text-on-surface/40">{selectedConv.message_count} messages</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {threadLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : thread.length === 0 ? (
                  <div className="text-center py-16 text-on-surface/30 text-sm">No messages in this conversation.</div>
                ) : (
                  <>
                    {thread.map(msg => {
                      if (msg.role === 'admin') {
                        return (
                          <div key={msg.id} className="flex flex-col items-center gap-1 py-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wide">LotScout Support</span>
                              <span className="text-[10px] text-on-surface/30">{fmtFull(msg.created_at)}</span>
                            </div>
                            <div className="max-w-[75%] px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-sm text-emerald-900 whitespace-pre-wrap">
                              {msg.body}
                            </div>
                          </div>
                        );
                      }
                      const isBuyer = msg.role === 'buyer';
                      return (
                        <div key={msg.id} className={`flex ${isBuyer ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[72%] flex flex-col gap-1 ${isBuyer ? 'items-start' : 'items-end'}`}>
                            <div className="flex items-center gap-1.5 text-[10px] text-on-surface/40">
                              {isBuyer && <span className="w-2 h-2 rounded-full bg-blue-500 flex-none" />}
                              <span className="font-medium">{msg.sender_name}</span>
                              <span>·</span>
                              <span>{fmtFull(msg.created_at)}</span>
                              {!isBuyer && <span className="w-2 h-2 rounded-full bg-emerald-600 flex-none" />}
                            </div>
                            <div
                              className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed text-on-surface whitespace-pre-wrap"
                              style={{ backgroundColor: isBuyer ? '#F3F4F6' : '#E8F5F0' }}
                            >
                              {msg.body}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={threadBottomRef} />
                  </>
                )}
              </div>

              {/* Composer — admin sends as LotScout Support */}
              <div className="flex-none bg-white border-t border-outline-variant/10 px-5 pt-3 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wide">LotScout Support</span>
                  <span className="text-xs text-on-surface/40">Your reply is inserted into this thread — both participants will see it.</span>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply(); }}
                    placeholder="Type a message… (⌘/Ctrl + Enter to send)"
                    rows={2}
                    className="flex-1 text-sm border border-emerald-200 rounded-xl px-3 py-2 bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-on-surface placeholder:text-emerald-500/50 resize-none"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !replyText.trim()}
                    className="px-5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors flex-none"
                  >
                    {sending ? '…' : 'Send'}
                  </button>
                </div>
                {sendMsg && (
                  <p className={`text-xs font-medium mt-2 ${sendMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>{sendMsg.text}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

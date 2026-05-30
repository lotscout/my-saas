'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Participant {
  id: string;
  name: string;
  email: string | null;
  initials: string;
  managed_by_lotscout: boolean;
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
  buyer_id: string;
  seller_id: string;
  listing_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  buyer: Participant;
  seller: Participant;
  listing: ConvListing | null;
  unread_count: number;
  managed_participants: string[];
  unresponded: boolean;
}

interface ThreadMessage {
  id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
  sent_by_admin: boolean;
  sender_type: string;
  sender_name: string;
}

interface Kpis {
  totalConversations: number;
  unreadMessages: number;
  managedAccounts: number;
  activeTodayConvs: number;
}

type FilterKey = 'all' | 'managed' | 'unread' | 'unresponded';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Avatar({ initials, color = 'bg-slate-400', size = 9 }: { initials: string; color?: string; size?: number }) {
  return (
    <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center flex-none`}>
      <span className="text-white font-bold" style={{ fontSize: size <= 8 ? 11 : 13 }}>{initials}</span>
    </div>
  );
}

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: number | null; icon: string; color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex items-center gap-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-none ${color}`}>
        <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-2xl font-extrabold font-headline text-on-surface">
          {value === null
            ? <span className="inline-block w-14 h-7 bg-surface-container animate-pulse rounded" />
            : value.toLocaleString()}
        </p>
        <p className="text-sm text-on-surface/60 font-medium mt-0.5">{label}</p>
        {sub && <p className="text-xs text-on-surface/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',         label: 'All'          },
  { key: 'managed',     label: 'Managed'      },
  { key: 'unread',      label: 'Unread'       },
  { key: 'unresponded', label: 'Unresponded'  },
];

export default function DashboardMessagesPage() {
  const [kpis, setKpis]                   = useState<Kpis | null>(null);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState<FilterKey>('all');
  const [search, setSearch]               = useState('');
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [thread, setThread]               = useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyAs, setReplyAs]             = useState('');
  const [replyText, setReplyText]         = useState('');
  const [supportText, setSupportText]     = useState('');
  const [sending, setSending]             = useState(false);
  const [sendingSupport, setSendingSupport] = useState(false);
  const [sendMsg, setSendMsg]             = useState<{ text: string; ok: boolean } | null>(null);
  const threadBottomRef = useRef<HTMLDivElement>(null);

  // ── Fetch conversations ──────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/admin/dashboard/messages')
      .then(r => r.json())
      .then(d => {
        setKpis(d.kpis ?? null);
        setConversations(d.conversations ?? []);
        setLoading(false);
      });
  }, []);

  // ── Fetch thread when conversation selected ──────────────────────────────

  const fetchThread = useCallback(async (id: string) => {
    setThreadLoading(true);
    setThread([]);
    const r = await fetch(`/api/admin/dashboard/messages/${id}`);
    const d = await r.json();
    setThread(d.messages ?? []);
    setThreadLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetchThread(selectedId);
  }, [selectedId, fetchThread]);

  // ── Scroll thread to bottom on load ─────────────────────────────────────

  useEffect(() => {
    if (!threadLoading && thread.length > 0) {
      threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thread, threadLoading]);

  // ── Selected conversation ────────────────────────────────────────────────

  const selectedConv = useMemo(
    () => conversations.find(c => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  // Set default replyAs to first managed participant
  useEffect(() => {
    if (selectedConv?.managed_participants.length) {
      setReplyAs(selectedConv.managed_participants[0]);
    } else {
      setReplyAs('');
    }
    setReplyText('');
    setSupportText('');
    setSendMsg(null);
  }, [selectedId, selectedConv]);

  // ── Filtered conversations ───────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = conversations;

    if (filter === 'managed')     list = list.filter(c => c.managed_participants.length > 0);
    if (filter === 'unread')      list = list.filter(c => c.unread_count > 0);
    if (filter === 'unresponded') list = list.filter(c => c.unresponded);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.buyer.name.toLowerCase().includes(q) ||
        c.seller.name.toLowerCase().includes(q) ||
        c.listing?.street_address?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [conversations, filter, search]);

  // ── Send reply as managed user ───────────────────────────────────────────

  async function sendReply() {
    if (!selectedId || !replyText.trim() || !replyAs) return;
    setSending(true);
    setSendMsg(null);
    const r = await fetch(`/api/admin/dashboard/messages/${selectedId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: replyAs, body: replyText }),
    });
    const d = await r.json();
    if (r.ok) {
      setReplyText('');
      setThread(prev => [...prev, d.message]);
      setSendMsg({ text: 'Sent!', ok: true });
    } else {
      setSendMsg({ text: d.error ?? 'Failed to send', ok: false });
    }
    setSending(false);
    setTimeout(() => setSendMsg(null), 3000);
  }

  // ── Send support message ─────────────────────────────────────────────────

  async function sendSupport() {
    if (!selectedId || !supportText.trim()) return;
    setSendingSupport(true);
    setSendMsg(null);
    const r = await fetch(`/api/admin/dashboard/messages/${selectedId}/support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: supportText }),
    });
    const d = await r.json();
    if (r.ok) {
      setSupportText('');
      setThread(prev => [...prev, { ...d.message, sender_name: 'LotScout Support' }]);
      setSendMsg({ text: 'Support message sent!', ok: true });
    } else {
      setSendMsg({ text: d.error ?? 'Failed to send', ok: false });
    }
    setSendingSupport(false);
    setTimeout(() => setSendMsg(null), 3000);
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const isManaged = (selectedConv?.managed_participants.length ?? 0) > 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header + KPIs */}
      <div className="flex-none px-4 sm:px-8 pt-6 pb-4 border-b border-outline-variant/10 bg-surface-container-low">
        <div className="mb-4">
          <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">Messages</h1>
          <p className="text-on-surface/50 mt-0.5 text-xs">All platform conversations and managed account replies.</p>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Conversations"
            value={loading ? null : kpis?.totalConversations ?? 0}
            icon="forum"
            color="bg-blue-600"
          />
          <StatCard
            label="Unread Messages"
            value={loading ? null : kpis?.unreadMessages ?? 0}
            icon="mark_chat_unread"
            color="bg-emerald-600"
          />
          <StatCard
            label="Managed Accounts"
            value={loading ? null : kpis?.managedAccounts ?? 0}
            icon="manage_accounts"
            color="bg-purple-600"
            sub="managed_by_lotscout"
          />
          <StatCard
            label="Active Today"
            value={loading ? null : kpis?.activeTodayConvs ?? 0}
            icon="today"
            color="bg-slate-500"
            sub="conversations"
          />
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden gap-0">

        {/* ── Left panel: Conversation list ── */}
        <div className="w-[35%] flex-none flex flex-col border-r border-outline-variant/10 bg-white">

          {/* Filter + Search */}
          <div className="flex-none px-4 pt-4 pb-3 space-y-3 border-b border-outline-variant/10">
            {/* Filter pills */}
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map(({ key, label }) => {
                const active = filter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-all border"
                    style={active ? {
                      backgroundColor: '#E8F5F0', color: '#0F6E56', borderColor: '#1D9E75',
                    } : {
                      backgroundColor: 'transparent', color: '#6b7280', borderColor: 'transparent',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface/30 text-sm">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users or address…"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-container-low border border-outline-variant/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface/30"
              />
            </div>
            <p className="text-xs text-on-surface/40">{filtered.length} conversation{filtered.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Conversation rows */}
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
                  {/* Initials stack */}
                  <div className="relative flex-none w-9 h-9 mt-0.5">
                    <div className="absolute top-0 left-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-bold" style={{ fontSize: 9 }}>{conv.buyer.initials}</span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center ring-1 ring-white">
                      <span className="text-white font-bold" style={{ fontSize: 8 }}>{conv.seller.initials}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-on-surface truncate leading-tight">
                          {conv.buyer.name}
                          <span className="text-on-surface/40 font-normal"> → </span>
                          {conv.seller.name}
                        </p>
                        {conv.listing && (
                          <p className="text-[10px] text-on-surface/40 truncate mt-0.5 leading-tight">
                            {conv.listing.street_address || conv.listing.title || '—'}{conv.listing.state ? `, ${conv.listing.state}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex-none text-right">
                        <p className="text-[10px] text-on-surface/40 whitespace-nowrap">{relativeTime(conv.last_message_at)}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {conv.unread_count > 0 && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-none" />
                          )}
                          {conv.managed_participants.length > 0 && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-purple-100 text-purple-700 leading-none">
                              MGMT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {conv.last_message_preview && (
                      <p className="text-[11px] text-on-surface/50 mt-1 leading-snug line-clamp-1">
                        {conv.last_message_preview.slice(0, 60)}
                        {conv.last_message_preview.length > 60 ? '…' : ''}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right panel: Thread ── */}
        <div className="flex-1 flex flex-col bg-surface-container-low overflow-hidden">
          {!selectedConv ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="LotScout" className="h-10 w-10 object-contain opacity-20" />
              <div>
                <p className="text-sm font-semibold text-on-surface/40">Select a conversation to view messages</p>
                <p className="text-xs text-on-surface/25 mt-1">{conversations.length} total conversations</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex-none bg-white border-b border-outline-variant/10 px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-headline text-base font-bold text-on-surface">
                        {selectedConv.buyer.name}
                        <span className="text-on-surface/40 font-normal mx-1">↔</span>
                        {selectedConv.seller.name}
                      </h2>
                      {isManaged && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          Managed
                        </span>
                      )}
                    </div>
                    {selectedConv.listing && (
                      <p className="text-xs text-on-surface/50 mt-0.5 truncate">
                        <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">location_on</span>
                        {[selectedConv.listing.street_address, selectedConv.listing.county, selectedConv.listing.state]
                          .filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex-none flex items-center gap-4 text-xs text-on-surface/40">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-none" />
                      <span>{selectedConv.buyer.name} (buyer)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-none" />
                      <span>{selectedConv.seller.name} (seller)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {threadLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : thread.length === 0 ? (
                  <div className="text-center py-16 text-on-surface/30 text-sm">No messages yet</div>
                ) : (
                  <>
                    {thread.map((msg, i) => {
                      const isSupport = msg.sender_type === 'support';
                      const isBuyer = msg.sender_id === selectedConv.buyer_id;

                      if (isSupport) {
                        // Support messages: centered with teal styling
                        return (
                          <div key={msg.id} className="flex flex-col items-center gap-1 py-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-none">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/logo.png" alt="" className="h-3.5 w-3.5 object-contain invert brightness-0 invert" />
                              </div>
                              <span className="text-xs font-bold text-emerald-700">LotScout Support</span>
                              <span className="text-[10px] text-on-surface/30">{fmtTime(msg.created_at)}</span>
                            </div>
                            <div className="max-w-[75%] px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
                              {msg.body}
                            </div>
                          </div>
                        );
                      }

                      // Regular messages: buyer left, seller right
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isBuyer ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-[72%] ${isBuyer ? 'items-start' : 'items-end'} flex flex-col gap-1`}>
                            <div className="flex items-center gap-1.5 text-[10px] text-on-surface/40">
                              {isBuyer && <span className="w-2 h-2 rounded-full bg-blue-500 flex-none" />}
                              <span className="font-medium">{msg.sender_name}</span>
                              {msg.sent_by_admin && !isSupport && (
                                <span className="text-purple-600 font-semibold">(via admin)</span>
                              )}
                              <span>·</span>
                              <span>{fmtTime(msg.created_at)}</span>
                              {!isBuyer && <span className="w-2 h-2 rounded-full bg-emerald-600 flex-none" />}
                            </div>
                            <div
                              className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed text-on-surface"
                              style={{ backgroundColor: isBuyer ? '#F3F4F6' : '#E8F5F0' }}
                            >
                              {msg.body}
                            </div>
                            {i === 0 && <p className="text-[10px] text-on-surface/30">{fmtDate(msg.created_at)}</p>}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={threadBottomRef} />
                  </>
                )}
              </div>

              {/* Reply + Support area */}
              <div className="flex-none bg-white border-t border-outline-variant/10">

                {/* Reply as managed user */}
                {isManaged ? (
                  <div className="px-5 pt-4 pb-3 border-b border-outline-variant/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-on-surface/50 uppercase tracking-wider">Reply as</span>
                      <select
                        value={replyAs}
                        onChange={e => setReplyAs(e.target.value)}
                        className="text-xs font-semibold border border-outline-variant/20 rounded-lg px-2 py-1 bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                      >
                        {selectedConv.managed_participants.map(pid => {
                          const p = pid === selectedConv.buyer_id ? selectedConv.buyer : selectedConv.seller;
                          return <option key={pid} value={pid}>{p.name}</option>;
                        })}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply(); }}
                        placeholder="Type a reply… (⌘↵ to send)"
                        rows={2}
                        className="flex-1 text-sm border border-outline-variant/20 rounded-xl px-3 py-2 bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface/30 resize-none"
                      />
                      <button
                        onClick={sendReply}
                        disabled={sending || !replyText.trim()}
                        className="px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors flex-none"
                      >
                        {sending ? '…' : 'Send'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-3 border-b border-outline-variant/10 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-on-surface/30">lock</span>
                    <p className="text-xs text-on-surface/40 italic">
                      Read only — neither user has authorized LotScout account management
                    </p>
                  </div>
                )}

                {/* LotScout Support — always available */}
                <div className="px-5 pt-3 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center flex-none">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.png" alt="" className="h-3 w-3 object-contain invert brightness-0 invert" />
                    </div>
                    <span className="text-xs font-bold text-emerald-700">Send as LotScout Support</span>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={supportText}
                      onChange={e => setSupportText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendSupport(); }}
                      placeholder="Send a support message… (⌘↵ to send)"
                      rows={2}
                      className="flex-1 text-sm border border-emerald-200 rounded-xl px-3 py-2 bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-on-surface placeholder:text-emerald-400 resize-none"
                    />
                    <button
                      onClick={sendSupport}
                      disabled={sendingSupport || !supportText.trim()}
                      className="px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors flex-none"
                    >
                      {sendingSupport ? '…' : 'Send'}
                    </button>
                  </div>
                  {sendMsg && (
                    <p className={`text-xs font-medium mt-2 ${sendMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                      {sendMsg.text}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

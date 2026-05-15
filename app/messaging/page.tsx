'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import { useUserTier } from '@/hooks/useUserTier';
import { createClient } from '@/lib/supabase/client';

interface Participant {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  email?: string | null;
}

interface ListingContext {
  id: string;
  title: string | null;
  county: string | null;
  state: string | null;
  lot_size_acres: number | null;
}

interface Conversation {
  id: string;
  buyer_id: string | null;
  seller_id: string | null;
  subject: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  status: string;
  listing_id: string | null;
  other_participant: Participant | null;
  listing: ListingContext | null;
}

interface Message {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

function participantName(p: Participant | null): string {
  if (!p) return 'User';
  if (p.company_name) return p.company_name;
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ');
  if (name) return name;
  if (p.email) return p.email;
  return 'User';
}

function initials(p: Participant | null): string {
  if (!p) return '?';
  if (p.company_name) return p.company_name.substring(0, 2).toUpperCase();
  const first = p.first_name?.[0] ?? '';
  const last = p.last_name?.[0] ?? '';
  if (first || last) return (first + last).toUpperCase();
  if (p.email) return p.email[0].toUpperCase();
  return '?';
}

function listingSubtitle(listing: ListingContext | null): string | null {
  if (!listing) return null;
  if (listing.title) return `Re: ${listing.title}`;
  const parts: string[] = [];
  if (listing.lot_size_acres) parts.push(`${listing.lot_size_acres.toLocaleString()} Acres`);
  if (listing.county) parts.push(`${listing.county} County`);
  if (listing.state) parts.push(listing.state);
  return parts.length > 0 ? `Re: ${parts.join(', ')}` : null;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDateSeparator(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a).toDateString();
  const db = new Date(b).toDateString();
  return da === db;
}

export default function MessagingPage() {
  const { loading, tier } = useUserTier();
  const [showSendUpgradeModal, setShowSendUpgradeModal] = useState(false);
  const isFreeUser = !loading && !tier;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  const loadConversations = useCallback(async (_uid: string) => {
    const res = await fetch('/api/conversations');
    if (res.ok) {
      const json = await res.json() as { conversations: Conversation[] };
      setConversations(json.conversations ?? []);
    }
    setLoadingConvs(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      await loadConversations(user.id);
    })();
  }, [loadConversations]);

  // Load messages + subscribe to realtime when conversation selected
  useEffect(() => {
    if (!selectedConv) return;
    const supabase = createClient();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setLoadingMsgs(true);
    setMessages([]);

    supabase
      .from('messages')
      .select('id, body, sender_id, created_at, is_read')
      .eq('conversation_id', selectedConv.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) ?? []);
        setLoadingMsgs(false);
      });

    const channel = supabase
      .channel(`conv-messages-${selectedConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [selectedConv?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConv || !currentUserId || sending) return;
    const body = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      const recipientId = selectedConv.other_participant?.id;
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedConv.id, recipientId, body }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to send message');
      // Optimistically add the message (realtime may also add it; dedup logic handles it)
      if (result.message) {
        setMessages(prev => {
          if (prev.some(m => m.id === result.message.id)) return prev;
          return [...prev, result.message as Message];
        });
      }
      await loadConversations(currentUserId);
    } catch (err) {
      console.error('[messaging] sendMessage error:', err);
      setNewMessage(body); // restore on failure
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function getOtherParticipant(conv: Conversation): Participant | null {
    return conv.other_participant ?? null;
  }

  const filteredConvs = conversations.filter(conv => {
    if (!searchQuery) return true;
    const other = getOtherParticipant(conv);
    const name = participantName(other).toLowerCase();
    const preview = (conv.last_message_preview ?? '').toLowerCase();
    const subject = (conv.subject ?? '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || preview.includes(q) || subject.includes(q);
  });

  const otherParticipant = selectedConv ? getOtherParticipant(selectedConv) : null;

  return (
    <div className="bg-surface font-body text-on-surface overflow-hidden h-screen flex flex-col">

      {/* Upgrade modal */}
      {showSendUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSendUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowSendUpgradeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Upgrade to Send Messages</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">Messaging buyers and sellers is available on paid plans. Upgrade to start closing deals.</p>
            <div className="flex gap-3">
              <a href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors">View Plans →</a>
              <button onClick={() => setShowSendUpgradeModal(false)} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      <Header />

      <main className="flex flex-1 pt-16 h-full overflow-hidden">
        <div className="max-w-screen-2xl mx-auto px-2 sm:px-8 w-full flex h-full overflow-hidden">

          {/* Left nav sidebar */}
          <aside className="flex-none w-56 h-full flex flex-col border-r border-outline-variant/20 bg-white font-['Inter'] text-sm font-medium">
            <div className="px-6 pt-6 pb-3">
              <p className="text-xs font-bold text-secondary uppercase tracking-widest">Inbox</p>
            </div>
            <nav className="flex-1 py-2 space-y-0.5">
              {([
                { icon: 'chat_bubble', label: 'All Messages' },
              ] as { icon: string; label: string }[]).map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-6 py-3 text-left bg-primary/5 text-primary border-r-4 border-primary"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  {label}
                  {conversations.length > 0 && (
                    <span className="ml-auto text-xs font-bold bg-primary text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {conversations.length}
                    </span>
                  )}
                </div>
              ))}
            </nav>
          </aside>

          {/* Conversation list + chat area */}
          <section className="flex flex-1 overflow-hidden">

            {/* Conversation list */}
            <div className="w-80 flex flex-col bg-white border-r border-outline-variant/15">
              <div className="p-5 border-b border-outline-variant/10">
                <h2 className="font-headline text-lg font-extrabold tracking-tight text-primary mb-3">Conversations</h2>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-low border-none rounded-lg px-10 py-2.5 text-sm focus:ring-1 focus:ring-primary/20 transition-all"
                    placeholder="Search messages..."
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-lg">search</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingConvs ? (
                  <div className="p-6 space-y-3">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="animate-pulse space-y-2">
                        <div className="h-4 bg-surface-container-high rounded w-2/3" />
                        <div className="h-3 bg-surface-container-high rounded w-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredConvs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center gap-3 p-8 h-48">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">chat_bubble</span>
                    <p className="text-secondary text-sm">
                      {searchQuery ? 'No conversations match your search.' : 'No conversations yet.'}
                    </p>
                    {!searchQuery && (
                      <p className="text-secondary text-xs">Messages will appear here when buyers or sellers contact you.</p>
                    )}
                  </div>
                ) : (
                  filteredConvs.map(conv => {
                    const other = getOtherParticipant(conv);
                    const isSelected = selectedConv?.id === conv.id;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConv(conv)}
                        className={`w-full text-left p-4 mx-0 transition-colors border-b border-outline-variant/10 last:border-0 ${
                          isSelected
                            ? 'bg-primary/5 border-l-4 border-l-primary'
                            : 'hover:bg-surface-container border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {initials(other)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                              <span className="font-bold text-sm text-primary truncate">{participantName(other)}</span>
                              {conv.last_message_at && (
                                <span className="text-[10px] text-secondary shrink-0 ml-2">{relativeTime(conv.last_message_at)}</span>
                              )}
                            </div>
                            {(() => {
                              const sub = listingSubtitle(conv.listing) ?? (conv.subject || null);
                              return sub ? <p className="text-[11px] text-emerald-700 font-medium truncate mb-0.5">{sub}</p> : null;
                            })()}
                            {conv.last_message_preview && (
                              <p className="text-xs text-on-surface-variant line-clamp-1">{conv.last_message_preview}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat window */}
            <div className="flex-1 flex flex-col bg-surface-container-lowest">
              {!selectedConv ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-12">
                  <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">chat</span>
                  </div>
                  <div>
                    <h3 className="font-headline text-xl font-bold text-primary mb-1">Select a conversation</h3>
                    <p className="text-secondary text-sm">Choose a conversation from the list to view messages.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="h-16 px-6 flex items-center justify-between bg-white border-b border-outline-variant/10 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                        {initials(otherParticipant)}
                      </div>
                      <div>
                        <h3 className="font-headline font-extrabold text-primary text-sm leading-tight">
                          {participantName(otherParticipant)}
                        </h3>
                        {(() => {
                          const sub = listingSubtitle(selectedConv.listing) ?? (selectedConv.subject || null);
                          return sub ? <p className="text-xs text-emerald-700 font-medium">{sub}</p> : null;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loadingMsgs ? (
                      <div className="flex items-center justify-center h-32">
                        <span className="material-symbols-outlined animate-spin text-secondary">progress_activity</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 gap-2">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">chat</span>
                        <p className="text-secondary text-sm">No messages yet. Send the first one!</p>
                      </div>
                    ) : (
                      messages.map((msg, i) => {
                        const isOwn = msg.sender_id === currentUserId;
                        const showDateSep = i === 0 || !isSameDay(messages[i - 1].created_at, msg.created_at);
                        return (
                          <div key={msg.id}>
                            {showDateSep && (
                              <div className="flex justify-center my-4">
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] bg-surface-container px-3 py-1 rounded-full">
                                  {formatDateSeparator(msg.created_at)}
                                </span>
                              </div>
                            )}
                            <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''} max-w-[75%] ${isOwn ? 'ml-auto' : ''}`}>
                              {!isOwn && (
                                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0 mb-1">
                                  {initials(otherParticipant)}
                                </div>
                              )}
                              <div className="flex flex-col gap-1">
                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                  isOwn
                                    ? 'bg-primary text-on-primary rounded-br-none'
                                    : 'bg-surface-container-low text-on-surface rounded-bl-none'
                                }`}>
                                  {msg.body}
                                </div>
                                <span className={`text-[10px] text-secondary ${isOwn ? 'text-right' : 'text-left'}`}>
                                  {formatTime(msg.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input area */}
                  <div className="p-4 bg-white border-t border-outline-variant/10 shrink-0">
                    {isFreeUser ? (
                      <button
                        onClick={() => setShowSendUpgradeModal(true)}
                        className="w-full flex items-center justify-center gap-3 bg-surface-container-high border border-outline-variant/20 text-secondary py-4 rounded-2xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">lock</span>
                        Upgrade to Send Messages
                      </button>
                    ) : (
                      <div className="bg-surface-container-low rounded-2xl p-2 flex items-center gap-2">
                        <input
                          ref={inputRef}
                          className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2"
                          placeholder="Type your message..."
                          type="text"
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          onKeyDown={handleKeyDown}
                          disabled={sending}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sending}
                          className="bg-primary text-on-primary p-2.5 rounded-xl flex items-center justify-center shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {sending ? (
                            <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}

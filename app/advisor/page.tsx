'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Header from '@/components/Header';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Msg[];
  updatedAt: number;
}

interface Access {
  status: 'guest' | 'free' | 'pro';
  unlimited: boolean;
  remaining: number | null;
  limit: number | null;
  canSave: boolean;
}

const SUGGESTIONS = [
  'What is the real estate market doing right now?',
  'Is it a good time to buy or sell?',
  'How do I evaluate an investment property?',
  'What should builders know about the current market?',
  'Where are the best markets to invest in 2026?',
  'How do I price my property to sell?',
];

const DISCLAIMER = 'Educational information only, not financial, legal, or investment advice.';
const GUEST_LIMIT = 3;
const GUEST_COUNT_KEY = 'ls_guest_count';
const SESSION_KEY = 'ls_advisor_session';

// Stitch palette
const INK = '#0D1F16';
const MUTED = '#717973';
const GREEN = '#1D9E75';
const CHIP_BG = '#E7F3EC';

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Lightweight markdown for AI messages: strips leading # from headings and renders
// them bold (no raw hashtags), plus **bold** inline and bullet/numbered lists.
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={`${keyBase}-b${i}`} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={`${keyBase}-t${i}`}>{part}</span>;
  });
}

function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let para: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (para.length) {
      const k = key++;
      blocks.push(<p key={`p${k}`} className="mb-2 last:mb-0">{renderInline(para.join(' '), `p${k}`)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (listItems.length) {
      const k = key++;
      const items = listItems;
      blocks.push(
        <ul key={`u${k}`} className="list-disc pl-5 mb-2 last:mb-0 space-y-1">
          {items.map((li, i) => <li key={i}>{renderInline(li, `u${k}-${i}`)}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) { flushPara(); flushList(); continue; }

    const heading = trimmed.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      flushPara(); flushList();
      const k = key++;
      blocks.push(<p key={`h${k}`} className="font-bold text-[1.05em] mt-3 first:mt-0 mb-1">{renderInline(heading[1], `h${k}`)}</p>);
      continue;
    }

    const item = trimmed.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
    if (item) {
      flushPara();
      listItems.push(item[1]);
      continue;
    }

    flushList();
    para.push(trimmed);
  }
  flushPara();
  flushList();
  return <>{blocks}</>;
}

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string>(() => newId());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [access, setAccess] = useState<Access | null>(null);
  const [limitHit, setLimitHit] = useState<null | 'guest' | 'free'>(null);
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [upgrading, setUpgrading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Restore the in-progress session (keeps the chat, incl. for guests, across navigation).
    let restored = false;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (Array.isArray(s?.messages) && s.messages.length) {
          setMessages(s.messages);
          if (s.currentId) setCurrentId(s.currentId);
          restored = true;
        }
      }
    } catch {}

    // Client-side guest counter (reliable enforcement of the 3-question limit).
    let gc = 0;
    try { gc = parseInt(localStorage.getItem(GUEST_COUNT_KEY) || '0', 10) || 0; } catch {}
    setGuestCount(gc);

    fetch('/api/advisor')
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!j) return;
        if (j.access) {
          setAccess(j.access);
          if (j.access.status === 'guest') {
            if (gc >= GUEST_LIMIT || (j.access.remaining !== null && j.access.remaining <= 0)) setLimitHit('guest');
          } else {
            // Logged-in: clear any stale guest counter, honor the daily free limit.
            try { localStorage.removeItem(GUEST_COUNT_KEY); } catch {}
            setGuestCount(0);
            if (!j.access.unlimited && j.access.remaining !== null && j.access.remaining <= 0) setLimitHit('free');
          }
        }
        const convs: Conversation[] = Array.isArray(j.conversations)
          ? j.conversations.map((c: any) => ({
              id: c.id,
              title: c.title || 'New chat',
              messages: Array.isArray(c.messages) ? c.messages : [],
              updatedAt: Date.parse(c.updatedAt) || Date.now(),
            }))
          : [];
        if (convs.length) {
          convs.sort((a, b) => b.updatedAt - a.updatedAt);
          setConversations(convs);
          if (!restored) {
            setCurrentId(convs[0].id);
            setMessages(convs[0].messages);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Persist the current session so navigating away and back keeps the chat.
  useEffect(() => {
    try {
      if (messages.length) sessionStorage.setItem(SESSION_KEY, JSON.stringify({ currentId, messages }));
    } catch {}
  }, [messages, currentId]);

  // Auto-scroll to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const upsertConversation = useCallback((id: string, msgs: Msg[]) => {
    const title = (msgs.find(m => m.role === 'user')?.content ?? 'New chat').slice(0, 80);
    setConversations(prev => [{ id, title, messages: msgs, updatedAt: Date.now() }, ...prev.filter(c => c.id !== id)]);
  }, []);

  const send = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || loading || limitHit) return;

    // Enforce the guest limit client-side before sending a 4th question.
    const isGuest = access?.status === 'guest';
    if (isGuest && guestCount >= GUEST_LIMIT) {
      setLimitHit('guest');
      return;
    }

    setInput('');
    setSaved({});

    // Count this guest question up front so the limit triggers reliably.
    if (isGuest) {
      const next = guestCount + 1;
      setGuestCount(next);
      try { localStorage.setItem(GUEST_COUNT_KEY, String(next)); } catch {}
      if (next >= GUEST_LIMIT) setLimitHit('guest');
    }

    const prior = messages;
    const withUser: Msg[] = [...prior, { role: 'user', content: q }];
    setMessages([...withUser, { role: 'assistant', content: '' }]);
    setLoading(true);

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: withUser, conversationId: currentId }),
      });

      if (res.status === 429) {
        const j = await res.json().catch(() => ({}));
        setMessages(prior); // revert the unanswered question
        setLimitHit(j?.reason === 'guest_limit' ? 'guest' : 'free');
        return;
      }
      if (!res.ok) {
        // Surface the server-provided error type for debugging (e.g. config, api_500).
        let detail = '';
        try { const j = await res.json(); if (j?.type) detail = ` (${j.type})`; } catch {}
        setMessages(m => {
          const copy = [...m];
          copy[copy.length - 1] = { role: 'assistant', content: `Sorry, something went wrong${detail}. Please try again.` };
          return copy;
        });
        return;
      }
      if (!res.body) throw new Error('no response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages(m => {
          const copy = [...m];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
      const finalContent = acc.trim() ? acc : 'Sorry, I could not generate a response. Please try again.';
      const finalMessages: Msg[] = [...withUser, { role: 'assistant', content: finalContent }];
      setMessages(finalMessages);
      upsertConversation(currentId, finalMessages);

      const remainingHdr = res.headers.get('X-Advisor-Remaining');
      const statusHdr = (res.headers.get('X-Advisor-Status') as Access['status']) || access?.status || 'guest';
      const unlimited = res.headers.get('X-Advisor-Unlimited') === 'true';
      const canSave = res.headers.get('X-Advisor-Can-Save') === 'true';
      const remaining = remainingHdr !== null ? parseInt(remainingHdr, 10) : null;
      setAccess(a => ({
        status: statusHdr,
        unlimited,
        canSave,
        remaining,
        limit: a?.limit ?? (statusHdr === 'guest' ? 3 : statusHdr === 'free' ? 5 : null),
      }));
      if (!unlimited && remaining !== null && remaining <= 0) {
        setLimitHit(statusHdr === 'guest' ? 'guest' : 'free');
      }
    } catch {
      setMessages(m => {
        const copy = [...m];
        copy[copy.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' };
        return copy;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [messages, loading, limitHit, access, currentId, upsertConversation, guestCount]);

  function newChat() {
    setCurrentId(newId());
    setMessages([]);
    setSaved({});
    setMobileSidebar(false);
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    inputRef.current?.focus();
  }

  function loadConversation(c: Conversation) {
    setCurrentId(c.id);
    setMessages(c.messages);
    setSaved({});
    setMobileSidebar(false);
  }

  // Open the in-page upgrade modal (keeps the chat; no navigation away).
  function upgrade() {
    setShowUpgradeModal(true);
  }

  async function startCheckout() {
    if (upgrading) return;
    setUpgrading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey: 'searchProMonthly' }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { alert(data.error || 'Could not start checkout.'); setUpgrading(false); }
    } catch {
      alert('Could not start checkout.');
      setUpgrading(false);
    }
  }

  async function saveReport(content: string, idx: number) {
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', content }),
      });
      if (res.ok) setSaved(s => ({ ...s, [idx]: true }));
      else {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || 'Could not save.');
      }
    } catch {
      alert('Could not save.');
    }
  }

  function handleSaveClick(content: string, idx: number) {
    if (access?.canSave) { saveReport(content, idx); return; }
    if (access?.status === 'free') { upgrade(); return; }
    alert('Saving reports is a Scout Pro feature. Sign up free, then upgrade to Scout Pro to save market reports.');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const isEmpty = messages.length === 0;
  const streaming = loading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !messages[messages.length - 1].content;
  const showRemaining = access && !access.unlimited && typeof access.remaining === 'number';

  const blockedCard = limitHit && (
    <div className="w-full max-w-xl mx-auto bg-white border border-black/10 rounded-2xl p-6 text-center shadow-sm">
      {limitHit === 'guest' ? (
        <>
          <p className="text-lg font-semibold mb-1" style={{ color: INK }}>You have reached the guest limit.</p>
          <p className="text-base mb-4" style={{ color: MUTED }}>Sign up free to continue.</p>
          <a href="/signup" className="inline-block text-white px-6 py-3 rounded-xl font-bold text-base transition-opacity hover:opacity-90" style={{ backgroundColor: GREEN }}>
            Sign Up Free
          </a>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold mb-1" style={{ color: INK }}>You have reached today&apos;s free limit.</p>
          <p className="text-base mb-4" style={{ color: MUTED }}>Upgrade to Scout Pro for unlimited questions and saved reports.</p>
          <button onClick={upgrade} className="inline-block text-white px-6 py-3 rounded-xl font-bold text-base transition-opacity hover:opacity-90" style={{ backgroundColor: GREEN }}>
            Upgrade to Scout Pro, $20/mo
          </button>
        </>
      )}
    </div>
  );

  const composer = (large: boolean) => (
    <form
      onSubmit={e => { e.preventDefault(); send(input); }}
      className={`w-full flex items-end gap-2 bg-white rounded-2xl border border-black/10 px-3 py-2.5 ${large ? 'shadow-lg' : 'shadow-md'} ${limitHit ? 'opacity-60' : ''}`}
      style={large ? { minHeight: '4rem' } : undefined}
    >
      <textarea
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={!!limitHit}
        rows={1}
        placeholder={limitHit ? 'Limit reached' : 'Ask anything about real estate...'}
        className="flex-grow resize-none bg-transparent px-2 py-2 text-lg leading-relaxed placeholder:text-[#717973] focus:outline-none disabled:cursor-not-allowed max-h-40"
        style={{ color: INK }}
        aria-label="Scout"
      />
      <button
        type="submit"
        disabled={loading || !!limitHit || !input.trim()}
        aria-label="Send"
        className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-white transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: GREEN }}
      >
        <span className="material-symbols-outlined text-xl">arrow_upward</span>
      </button>
    </form>
  );

  const remainingLine = showRemaining && !limitHit && (
    <p className="text-sm text-center mt-2" style={{ color: MUTED }}>
      {access!.remaining} {access!.remaining === 1 ? 'question' : 'questions'} left
      {access!.status === 'guest' ? ' as a guest' : ' today'}.
      {access!.status === 'free' && (
        <button onClick={upgrade} className="ml-1 font-semibold hover:underline" style={{ color: GREEN }}>Upgrade for unlimited</button>
      )}
    </p>
  );

  const sidebarInner = (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <button
          onClick={newChat}
          className="w-full flex items-center justify-center gap-2 bg-green-700 text-white rounded-xl font-bold py-2.5 text-sm hover:bg-green-800 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Chat
        </button>
      </div>
      <div className="flex-grow overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="text-xs text-center px-2 py-4" style={{ color: MUTED }}>
            {access?.status === 'guest' ? 'Sign in to save your chat history.' : 'No saved chats yet.'}
          </p>
        ) : (
          <>
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => loadConversation(c)}
                title={c.title}
                className={`w-full text-left truncate rounded-lg px-3 py-2 text-sm mb-0.5 transition-colors ${c.id === currentId ? 'font-semibold' : 'hover:bg-black/5'}`}
                style={{ color: INK, backgroundColor: c.id === currentId ? CHIP_BG : undefined }}
              >
                {c.title || 'New chat'}
              </button>
            ))}
            {access?.status === 'guest' && (
              <p className="text-[11px] px-3 pt-3" style={{ color: MUTED }}>Sign in to keep your history across visits.</p>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-surface h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="h-16 shrink-0" aria-hidden />

      <div className="flex-grow flex w-full min-h-0">
        {/* Desktop sidebar (always visible) */}
        <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-black/10 bg-white overflow-hidden">
          {sidebarInner}
        </aside>

        {/* Mobile slide-in sidebar */}
        {mobileSidebar && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileSidebar(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">{sidebarInner}</div>
          </div>
        )}

        <div className="flex-grow flex flex-col min-w-0 min-h-0">
          {/* Mobile controls (history + new chat) */}
          <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-black/10 bg-white shrink-0">
            <button onClick={() => setMobileSidebar(true)} className="flex items-center gap-1 text-sm font-semibold" style={{ color: INK }}>
              <span className="material-symbols-outlined text-lg">history</span>
              History
            </button>
            <button onClick={newChat} className="flex items-center gap-1 text-sm font-semibold" style={{ color: GREEN }}>
              <span className="material-symbols-outlined text-lg">add</span>
              New Chat
            </button>
          </div>

          {isEmpty ? (
            /* ── Centered empty state ── */
            <main className="flex-grow flex flex-col w-full max-w-3xl mx-auto px-4 pb-6 min-h-0">
              <div className="flex-grow flex flex-col items-center justify-center gap-6">
                <div className="text-center">
                  <h1 className="font-['Manrope'] font-bold tracking-tight" style={{ color: INK, fontSize: '40px', lineHeight: 1.1 }}>Scout</h1>
                  <p className="mt-2 text-lg" style={{ color: MUTED }}>Hi, I&apos;m Scout. Ask me anything about real estate markets, buying, selling, investing, and more.</p>
                </div>

                {limitHit ? (
                  <div className="w-full max-w-2xl">{blockedCard}</div>
                ) : (
                  <>
                    <div className="w-full max-w-2xl">
                      {composer(true)}
                      {remainingLine}
                    </div>

                    <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl">
                      {SUGGESTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          disabled={loading}
                          className="text-base font-semibold rounded-full px-4 py-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                          style={{ backgroundColor: CHIP_BG, color: INK }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <p className="text-xs text-center mt-4" style={{ color: MUTED }}>{DISCLAIMER}</p>
            </main>
          ) : (
            /* ── Active chat state ── */
            <main className="flex-grow flex flex-col w-full max-w-3xl mx-auto px-4 pb-4 min-h-0">
              <div ref={scrollRef} className="flex-grow overflow-y-auto space-y-6 py-4 min-h-0">
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: GREEN }}>
                          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>travel_explore</span>
                        </span>
                        <span className="text-sm font-bold" style={{ color: INK }}>Scout</span>
                      </div>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-3 text-lg leading-relaxed ${
                        m.role === 'user' ? 'max-w-[75%] rounded-br-md whitespace-pre-wrap' : 'max-w-[85%] rounded-bl-md border border-black/5 shadow-sm'
                      }`}
                      style={m.role === 'user' ? { backgroundColor: CHIP_BG, color: INK } : { backgroundColor: '#ffffff', color: INK }}
                    >
                      {m.content
                        ? (m.role === 'assistant' ? <Markdown text={m.content} /> : m.content)
                        : (streaming && i === messages.length - 1 ? (
                          <span className="inline-flex gap-1 py-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-black/25 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2.5 h-2.5 rounded-full bg-black/25 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2.5 h-2.5 rounded-full bg-black/25 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        ) : '')}
                    </div>

                    {/* Save as Report */}
                    {m.role === 'assistant' && m.content && !streaming && access && (
                      <button
                        onClick={() => handleSaveClick(m.content, i)}
                        disabled={!!saved[i]}
                        title={access.canSave ? 'Save this as a report' : 'Saving reports is a Scout Pro feature'}
                        className="mt-1.5 flex items-center gap-1 text-sm font-semibold hover:underline disabled:no-underline"
                        style={{ color: saved[i] ? MUTED : access.canSave ? GREEN : MUTED }}
                      >
                        <span className="material-symbols-outlined text-base">
                          {saved[i] ? 'check' : access.canSave ? 'bookmark_add' : 'lock'}
                        </span>
                        {saved[i] ? 'Saved' : 'Save as Report'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {limitHit ? (
                <div className="py-2">{blockedCard}</div>
              ) : (
                <>
                  {composer(false)}
                  {remainingLine}
                </>
              )}
              <p className="text-xs text-center mt-3" style={{ color: MUTED }}>{DISCLAIMER}</p>
            </main>
          )}
        </div>
      </div>

      {/* In-page upgrade modal — keeps the chat, no navigation away (browser back stays on /advisor). */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white" style={{ backgroundColor: GREEN }}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: INK }}>Upgrade to Scout Pro</h2>
            <p className="text-base mb-5" style={{ color: MUTED }}>
              Unlimited questions, saved market reports, and priority research for $20 per month.
            </p>
            <button
              onClick={startCheckout}
              disabled={upgrading}
              className="w-full text-white px-6 py-3 rounded-xl font-bold text-base transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: GREEN }}
            >
              {upgrading ? 'Starting checkout…' : 'Continue to checkout'}
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full mt-2 px-6 py-2.5 rounded-xl font-semibold text-base hover:bg-black/5 transition-colors"
              style={{ color: MUTED }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

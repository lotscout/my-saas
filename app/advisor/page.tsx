'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { track } from '@vercel/analytics';

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
  'What cities are in highest demand for single-family homes?',
  'What policy changes should builders be watching right now?',
  'Where is new construction demand outpacing housing supply?',
  'Which markets have the strongest builder activity?',
  'What land and zoning trends could affect development timelines?',
];

const DISCLAIMER = 'Educational information only, not financial, legal, or investment advice.';
const GUEST_LIMIT = 1;
const GUEST_COUNT_KEY = 'ls_guest_count';
const SESSION_KEY = 'ls_advisor_session';
const ANALYTICS_SESSION_KEY = 'ls_scout_analytics_session';

// Stitch palette
const INK = '#0D1F16';
const MUTED = '#717973';
const GREEN = '#1D9E75';
const CHIP_BG = '#E7F3EC';
const PAGE_BG = '#F6F8F4';

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getAnalyticsSessionId(): string {
  try {
    const existing = localStorage.getItem(ANALYTICS_SESSION_KEY);
    if (existing) return existing;
    const id = newId();
    localStorage.setItem(ANALYTICS_SESSION_KEY, id);
    return id;
  } catch {
    return newId();
  }
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
  const [showSaved, setShowSaved] = useState(false);
  const [savedReports, setSavedReports] = useState<{ title: string; content: string }[]>([]);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [analyticsSessionId, setAnalyticsSessionId] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const sid = getAnalyticsSessionId();
    setAnalyticsSessionId(sid);
    track('scout_page_view', { path: '/scout' });

    // Always start Scout on a fresh chat when the page opens.
    // Saved conversations remain available in Recents, but are never auto-loaded.
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    setCurrentId(newId());
    setMessages([]);
    setSaved({});

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
          if (j.access.unlimited) {
            setLimitHit(null);
            try { localStorage.removeItem(GUEST_COUNT_KEY); } catch {}
            setGuestCount(0);
          } else if (j.access.status === 'guest') {
            if (gc >= GUEST_LIMIT || (j.access.remaining !== null && j.access.remaining <= 0)) setLimitHit('guest');
          } else {
            // Logged-in: clear any stale guest counter, honor the weekly free limit.
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
        }
      })
      .catch(() => {});
  }, []);

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

    // Enforce the one-question guest limit client-side before sending another question.
    const isGuest = access?.status === 'guest';
    if (isGuest && guestCount >= GUEST_LIMIT) {
      setLimitHit('guest');
      track('scout_guest_limit_hit', { source: 'client_preflight', guest_count: guestCount });
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
    track('scout_question_submitted', {
      access_status: access?.status ?? 'unknown',
      question_number: isGuest ? guestCount + 1 : messages.filter(m => m.role === 'user').length + 1,
    });

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: withUser, conversationId: currentId, sessionId: analyticsSessionId }),
      });

      if (res.status === 429) {
        const j = await res.json().catch(() => ({}));
        setMessages(prior); // revert the unanswered question
        setLimitHit(j?.reason === 'guest_limit' ? 'guest' : 'free');
        track(j?.reason === 'guest_limit' ? 'scout_guest_limit_hit' : 'scout_free_limit_hit', { source: 'server' });
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
      track('scout_answer_received', {
        access_status: statusHdr,
        response_chars: finalContent.length,
        remaining: remaining ?? -1,
      });
      setAccess(a => ({
        status: statusHdr,
        unlimited,
        canSave,
        remaining,
        limit: a?.limit ?? (statusHdr === 'guest' ? 1 : statusHdr === 'free' ? 2 : null),
      }));
      if (unlimited) {
        setLimitHit(null);
        try { localStorage.removeItem(GUEST_COUNT_KEY); } catch {}
        setGuestCount(0);
      } else if (remaining !== null && remaining <= 0) {
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

  // Scout is included in every paid LotScout plan, or available standalone.
  function upgrade() {
    window.location.href = '/pricing';
  }

  async function saveReport(idx: number) {
    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', messages }),
      });
      if (res.ok) {
        const j = await res.json().catch(() => ({}));
        const content = String(j?.content || '').trim() || 'Saved Scout report';
        setSaved(s => ({ ...s, [idx]: true }));
        const title = (content.trim().split('\n')[0] || 'Saved report').slice(0, 60);
        setSavedReports(prev => [{ title, content }, ...prev]);
      } else {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || 'Could not save.');
      }
    } catch {
      alert('Could not save.');
    }
  }

  function handleSaveClick(idx: number) {
    if (access?.canSave) { saveReport(idx); return; }
    if (access?.status === 'free') { track('scout_upgrade_click', { source: 'save_report' }); upgrade(); return; }
    alert('Saving reports requires a LotScout plan. Sign up free, then upgrade to any plan to save market reports.');
  }

  async function captureScoutLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLeadError(null);
    setLeadLoading(true);
    track('scout_signup_click', { source: 'guest_limit_card', guest_questions: guestCount || GUEST_LIMIT });
    try {
      const res = await fetch('/api/scout/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: leadEmail, guestQuestions: guestCount || GUEST_LIMIT }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLeadError(data.error || 'Could not save email. Please try again.');
        return;
      }
      track('scout_lead_captured', { source: 'guest_limit_card', guest_questions: guestCount || GUEST_LIMIT });
      window.location.href = data.redirect || `/sign-up?email=${encodeURIComponent(leadEmail.trim())}&source=scout`;
    } catch {
      setLeadError('Could not save email. Please try again.');
    } finally {
      setLeadLoading(false);
    }
  }

  async function downloadPdf(r: { title: string; content: string }) {
    try {
      const res = await fetch('/api/advisor/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: r.title, content: r.content }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || 'Could not generate PDF.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LotScout-Report-${(r.title || 'report').replace(/[^a-z0-9]+/gi, '-').slice(0, 50) || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not generate PDF.');
    }
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
    <div className="w-full max-w-xl mx-auto bg-white/90 backdrop-blur border border-emerald-900/10 rounded-[2rem] p-6 sm:p-8 text-center shadow-[0_24px_80px_rgba(13,31,22,0.10)]">
      {limitHit === 'guest' ? (
        <>
          <p className="text-lg font-semibold mb-1" style={{ color: INK }}>Create a free account to keep going.</p>
          <p className="text-base mb-4" style={{ color: MUTED }}>You got one free Scout question. Sign up to ask more and save your searches.</p>
          <p className="text-sm mb-4" style={{ color: MUTED }}>
            Already have a LotScout account?{' '}
          <a href="/sign-in?redirect=/scout" onClick={() => track('scout_signin_click', { source: 'guest_limit_card' })} className="font-semibold hover:underline" style={{ color: GREEN }}>Sign in to continue</a>.
          </p>
          <form onSubmit={captureScoutLead} className="space-y-3">
            <input
              type="email"
              value={leadEmail}
              onChange={e => setLeadEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-emerald-900/10 bg-[#F9FBF7] px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-[#1D9E75]/15 focus:border-[#1D9E75]/50 transition"
              style={{ color: INK }}
            />
            {leadError && <p className="text-sm text-red-600">{leadError}</p>}
            <button type="submit" disabled={leadLoading} className="inline-flex items-center justify-center text-white px-6 py-3 rounded-2xl font-bold text-base shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-60 disabled:hover:translate-y-0" style={{ backgroundColor: GREEN }}>
              {leadLoading ? 'Saving…' : 'Continue with Scout Search'}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold mb-1" style={{ color: INK }}>You used your 2 free Scout questions this week.</p>
          <p className="text-base mb-4" style={{ color: MUTED }}>Upgrade to keep asking Scout, save reports, and get unlimited searches.</p>
          <a href="/pricing" onClick={() => track('scout_upgrade_click', { source: 'free_limit_card' })} className="inline-flex items-center justify-center text-white px-6 py-3 rounded-2xl font-bold text-base shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:opacity-95" style={{ backgroundColor: GREEN }}>
            View options
          </a>
        </>
      )}
    </div>
  );

  const composer = (large: boolean) => (
    <form
      onSubmit={e => { e.preventDefault(); send(input); }}
      className={`w-full flex items-end gap-2 bg-white/95 backdrop-blur rounded-[1.75rem] border border-emerald-900/10 px-3 py-2.5 sm:px-4 sm:py-3 ring-1 ring-white/60 ${large ? 'shadow-[0_26px_90px_rgba(13,31,22,0.16)]' : 'shadow-[0_16px_50px_rgba(13,31,22,0.10)]'} ${limitHit ? 'opacity-60' : ''}`}
      style={large ? { minHeight: '4rem' } : undefined}
    >
      <textarea
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={!!limitHit}
        rows={1}
        placeholder={limitHit ? 'Limit reached' : 'Ask Scout about a market, parcel, zoning rule, or deal...'}
        className="flex-grow resize-none bg-transparent px-2 py-2 text-base sm:text-lg leading-snug sm:leading-relaxed placeholder:text-[#717973]/80 focus:outline-none disabled:cursor-not-allowed max-h-32 sm:max-h-40"
        style={{ color: INK }}
        aria-label="Scout Search"
      />
      <button
        type="submit"
        disabled={loading || !!limitHit || !input.trim()}
        aria-label="Send"
        className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        style={{ backgroundColor: GREEN }}
      >
        <span className="material-symbols-outlined text-lg sm:text-xl">arrow_upward</span>
      </button>
    </form>
  );

  const remainingLine = showRemaining && !limitHit && (
    <p className="text-xs sm:text-sm text-center mt-1.5 sm:mt-2" style={{ color: MUTED }}>
      {access!.status === 'guest'
        ? `${access!.remaining} free ${access!.remaining === 1 ? 'question' : 'questions'} before signup`
        : `${access!.remaining} ${access!.remaining === 1 ? 'question' : 'questions'} left this week`}.
      {access!.status === 'free' && (
        <button onClick={upgrade} className="ml-1 font-semibold hover:underline" style={{ color: GREEN }}>Get unlimited</button>
      )}
    </p>
  );

  const sidebarInner = (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl">
      <div className="px-3 pt-3 sm:pt-4 space-y-1">
        <button
          onClick={newChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm sm:text-base font-semibold text-left transition-colors hover:bg-emerald-50"
          style={{ color: INK }}
        >
          <span className="material-symbols-outlined text-2xl" style={{ color: MUTED }}>add</span>
          New
        </button>
        <button
          onClick={() => { setShowSaved(true); setMobileSidebar(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm sm:text-base font-semibold text-left transition-colors hover:bg-emerald-50"
          style={{ color: INK }}
        >
          <span className="material-symbols-outlined text-2xl" style={{ color: MUTED }}>bookmark</span>
          Saved
        </button>
      </div>

      {/* Recents */}
      <div className="flex-grow overflow-y-auto px-3 pb-4 mt-4">
        <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: MUTED }}>Recents</p>
        {conversations.length === 0 ? (
          <p className="px-3 py-2 text-xs" style={{ color: MUTED }}>
            {access?.status === 'guest' ? 'Sign in to save your chat history.' : 'No recent chats yet.'}
          </p>
        ) : (
          <>
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => loadConversation(c)}
                title={c.title}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm sm:text-base text-left transition-colors ${c.id === currentId ? 'shadow-sm' : 'hover:bg-emerald-50'}`}
                style={{ color: INK, backgroundColor: c.id === currentId ? CHIP_BG : undefined }}
              >
                <span className="material-symbols-outlined text-xl shrink-0" style={{ color: MUTED }}>chat_bubble</span>
                <span className="truncate">{c.title || 'New chat'}</span>
              </button>
            ))}
            {access?.status === 'guest' && (
              <p className="text-sm px-3 pt-3" style={{ color: MUTED }}>Sign in to keep your history across visits.</p>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[100svh] flex flex-col overflow-hidden" style={{ backgroundColor: PAGE_BG }}>
      <Header />
      <div className="h-16 shrink-0" aria-hidden />

      <div className="flex-grow flex w-full min-h-0 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(29,158,117,0.16),transparent_34%),radial-gradient(circle_at_78%_8%,rgba(13,31,22,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.80),rgba(246,248,244,0.95))]" />
        {/* Desktop sidebar (always visible) */}
        <aside className="hidden md:flex md:flex-col w-72 shrink-0 border-r border-emerald-900/10 bg-white/70 backdrop-blur-xl overflow-hidden relative z-10">
          {sidebarInner}
        </aside>

        {/* Mobile slide-in sidebar */}
        {mobileSidebar && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileSidebar(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[82vw] bg-white shadow-2xl">{sidebarInner}</div>
          </div>
        )}

        <div className="flex-grow flex flex-col min-w-0 min-h-0 relative z-10">
          {/* Mobile pull-out history control */}
          <button
            onClick={() => setMobileSidebar(true)}
            aria-label="Open Scout Search history"
            className="md:hidden fixed left-3 top-20 z-30 w-11 h-11 rounded-2xl bg-white/90 backdrop-blur border border-emerald-900/10 shadow-lg flex items-center justify-center active:scale-95"
            style={{ color: INK }}
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>

          {isEmpty ? (
            /* ── Centered empty state ── */
            <main className="flex-grow flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 pb-4 sm:pb-8 min-h-0">
              <div className="flex-grow flex flex-col items-center justify-center gap-5 sm:gap-7 pt-1">
                <div className="flex flex-col items-center text-center">
                  <h1 className="font-headline text-5xl sm:text-7xl md:text-8xl font-black text-primary tracking-[-0.07em] leading-[0.88]">
                    Scout Search
                  </h1>
                  <p className="mt-5 max-w-2xl text-base sm:text-xl leading-relaxed" style={{ color: MUTED }}>Ask about markets, zoning, lots, buyer demand, and deal strategy.</p>
                </div>

                {limitHit ? (
                  <div className="w-full max-w-3xl">{blockedCard}</div>
                ) : (
                  <>
                    <div className="w-full max-w-3xl">
                      {composer(true)}
                      {remainingLine}
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center max-w-3xl">
                      {SUGGESTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          disabled={loading}
                          className="text-xs sm:text-sm leading-tight font-semibold rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 border border-emerald-900/10 bg-white/80 backdrop-blur text-[#0D1F16] shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <p className="text-[10px] sm:text-xs text-center mt-2 sm:mt-4" style={{ color: MUTED }}>{DISCLAIMER}</p>
            </main>
          ) : (
            /* ── Active chat state ── */
            <main className="flex-grow flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 pb-4 sm:pb-5 min-h-0">
              <div ref={scrollRef} className="flex-grow overflow-y-auto space-y-5 sm:space-y-7 py-5 sm:py-7 pr-1 min-h-0">
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="mb-2 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl flex items-center justify-center bg-white shadow-sm border border-emerald-900/10 overflow-hidden"><img src="/logo.png" alt="LotScout" className="w-5 h-5 object-contain" /></span>
                        <span className="text-sm font-extrabold" style={{ color: INK }}>Scout</span>
                      </div>
                    )}

                    <div
                      className={`rounded-[1.6rem] px-4 py-3 sm:px-5 sm:py-4 text-base sm:text-[17px] leading-snug sm:leading-relaxed ${
                        m.role === 'user' ? 'max-w-[82%] rounded-br-md whitespace-pre-wrap shadow-sm' : 'max-w-[92%] rounded-bl-md border border-emerald-900/10 shadow-[0_18px_60px_rgba(13,31,22,0.08)]'
                      }`}
                      style={m.role === 'user' ? { backgroundColor: GREEN, color: '#ffffff' } : { backgroundColor: 'rgba(255,255,255,0.92)', color: INK }}
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
                        onClick={() => handleSaveClick(i)}
                        disabled={!!saved[i]}
                        title={access.canSave ? 'Summarize and save this chat as a report' : 'Saving reports requires a LotScout plan'}
                        className="mt-2 flex items-center gap-1.5 text-sm font-bold hover:underline disabled:no-underline"
                        style={{ color: saved[i] ? MUTED : access.canSave ? GREEN : MUTED }}
                      >
                        <span className="material-symbols-outlined text-base">
                          {saved[i] ? 'check' : access.canSave ? 'bookmark_add' : 'lock'}
                        </span>
                        {saved[i] ? 'Saved' : 'Save chat as Report'}
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
              <p className="text-[10px] sm:text-xs text-center mt-2 sm:mt-3" style={{ color: MUTED }}>{DISCLAIMER}</p>
            </main>
          )}
        </div>
      </div>

      {/* Scout is included in every paid LotScout plan, or available standalone; upgrade links to /pricing. */}

      {/* Saved reports (saved this session) */}
      {showSaved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSaved(false)} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-900/10">
              <h2 className="text-lg font-bold" style={{ color: INK }}>Saved reports</h2>
              <button onClick={() => setShowSaved(false)} className="p-1 rounded hover:bg-black/5" aria-label="Close">
                <span className="material-symbols-outlined" style={{ color: MUTED }}>close</span>
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {savedReports.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: MUTED }}>
                  {access?.canSave
                    ? 'No saved reports yet. Use Save chat as Report under any answer to summarize the full conversation.'
                    : 'Saving reports requires a LotScout plan.'}
                </p>
              ) : (
                savedReports.map((r, i) => (
                  <div key={i} className="border border-emerald-900/10 rounded-2xl p-3 bg-[#F9FBF7]">
                    <p className="text-sm font-semibold truncate mb-1" style={{ color: INK }}>{r.title}</p>
                    <div className="text-sm max-h-24 overflow-hidden" style={{ color: MUTED }}>{r.content}</div>
                    {access?.canSave && (
                      <button
                        onClick={() => downloadPdf(r)}
                        className="mt-2 flex items-center gap-1 text-sm font-semibold hover:underline"
                        style={{ color: GREEN }}
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                        Download PDF
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

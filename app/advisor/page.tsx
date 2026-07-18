'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Header from '@/components/Header';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

interface Access {
  status: 'guest' | 'free' | 'pro';
  unlimited: boolean;
  remaining: number | null;
  limit: number | null;
  canSave: boolean;
}

const SUGGESTIONS = [
  'Where is land demand growing fastest right now?',
  'What should I look for in a good land investment?',
  'Is now a good time to buy vacant land?',
  'What states have the best land opportunities?',
  'How do I evaluate a land parcel?',
  'What is driving land prices in 2026?',
];

const DISCLAIMER = 'Educational information only, not financial, legal, or investment advice.';

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [access, setAccess] = useState<Access | null>(null);
  const [limitHit, setLimitHit] = useState<null | 'guest' | 'free'>(null);
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [upgrading, setUpgrading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/advisor')
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!j) return;
        if (Array.isArray(j.messages) && j.messages.length) setMessages(j.messages);
        if (j.access) {
          setAccess(j.access);
          if (!j.access.unlimited && j.access.remaining !== null && j.access.remaining <= 0) {
            setLimitHit(j.access.status === 'guest' ? 'guest' : 'free');
          }
        }
      })
      .catch(() => {});
  }, []);

  // Auto-scroll to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || loading || limitHit) return;
    setInput('');

    const prior = messages;
    const withUser: Msg[] = [...prior, { role: 'user', content: q }];
    setMessages([...withUser, { role: 'assistant', content: '' }]);
    setLoading(true);

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: withUser }),
      });

      if (res.status === 429) {
        const j = await res.json().catch(() => ({}));
        setMessages(prior); // revert the unanswered question
        setLimitHit(j?.reason === 'guest_limit' ? 'guest' : 'free');
        return;
      }
      if (!res.ok || !res.body) throw new Error('request failed');

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
      if (!acc.trim()) {
        setMessages(m => {
          const copy = [...m];
          copy[copy.length - 1] = { role: 'assistant', content: 'Sorry, I could not generate a response. Please try again.' };
          return copy;
        });
      }

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
  }, [messages, loading, limitHit, access]);

  async function upgrade() {
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
    <div className="w-full max-w-xl mx-auto bg-white border border-primary/20 rounded-2xl p-6 text-center shadow-sm">
      {limitHit === 'guest' ? (
        <>
          <p className="text-on-surface text-lg font-semibold mb-1">You have reached the guest limit.</p>
          <p className="text-secondary text-base mb-4">Sign up free to continue.</p>
          <a href="/signup" className="inline-block bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-base hover:bg-green-800 transition-colors">
            Sign Up Free
          </a>
        </>
      ) : (
        <>
          <p className="text-on-surface text-lg font-semibold mb-1">You have reached today&apos;s free limit.</p>
          <p className="text-secondary text-base mb-4">Upgrade to Search Pro for unlimited questions and saved reports.</p>
          <button onClick={upgrade} disabled={upgrading} className="inline-block bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-base hover:bg-green-800 transition-colors disabled:opacity-60">
            {upgrading ? 'Starting checkout…' : 'Upgrade to Search Pro, $20/mo'}
          </button>
        </>
      )}
    </div>
  );

  const composer = (large: boolean) => (
    <form
      onSubmit={e => { e.preventDefault(); send(input); }}
      className={`w-full flex items-end gap-2 bg-white border border-outline-variant/30 rounded-2xl p-2 ${large ? 'shadow-md' : 'shadow-sm sticky bottom-2'} ${limitHit ? 'opacity-60' : ''}`}
    >
      <textarea
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={!!limitHit}
        rows={1}
        placeholder={limitHit ? 'Limit reached' : 'Ask about land markets, where to invest, what to look for…'}
        className="flex-grow resize-none bg-transparent px-3 py-2.5 text-lg leading-relaxed text-on-surface placeholder:text-secondary focus:outline-none disabled:cursor-not-allowed max-h-40"
        aria-label="Search"
      />
      <button
        type="submit"
        disabled={loading || !!limitHit || !input.trim()}
        className="shrink-0 flex items-center gap-1.5 bg-green-700 text-white rounded-xl font-bold px-5 py-3 text-base hover:bg-green-800 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-lg">send</span>
        Send
      </button>
    </form>
  );

  const remainingLine = showRemaining && !limitHit && (
    <p className="text-sm text-secondary/80 text-center mt-2">
      {access!.remaining} {access!.remaining === 1 ? 'question' : 'questions'} left
      {access!.status === 'guest' ? ' as a guest' : ' today'}.
      {access!.status === 'free' && (
        <button onClick={upgrade} className="ml-1 text-primary font-semibold hover:underline">Upgrade for unlimited</button>
      )}
    </p>
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <Header />

      {isEmpty ? (
        <main className="flex-grow flex flex-col w-full max-w-3xl mx-auto px-4 pt-16 pb-4">
          <div className="flex-grow flex flex-col items-center justify-center gap-8">
            <h1 className="font-headline text-4xl sm:text-5xl font-black text-primary tracking-tight text-center">Search</h1>

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
                      className="text-base font-semibold text-primary bg-white border border-primary/20 rounded-full px-4 py-2 hover:bg-primary/5 transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <p className="text-xs text-secondary/70 text-center mt-2">{DISCLAIMER}</p>
        </main>
      ) : (
        <main className="flex-grow flex flex-col w-full max-w-3xl mx-auto px-4 pt-20 pb-4">
          <h1 className="font-headline text-2xl font-black text-primary tracking-tight py-3">Search</h1>

          <div ref={scrollRef} className="flex-grow overflow-y-auto space-y-6 py-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-secondary">
                    <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>travel_explore</span>
                    <span className="text-sm font-bold">LotScout Search</span>
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 text-lg leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'max-w-[75%] bg-green-100 text-green-950 rounded-br-md'
                      : 'max-w-[85%] bg-white border border-outline-variant/20 text-on-surface rounded-bl-md shadow-sm'
                  }`}
                >
                  {m.content || (streaming && i === messages.length - 1 ? (
                    <span className="inline-flex gap-1 py-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  ) : '')}
                </div>

                {/* Save (paid/pro only) */}
                {m.role === 'assistant' && m.content && !streaming && access && (
                  access.canSave ? (
                    <button
                      onClick={() => saveReport(m.content, i)}
                      disabled={!!saved[i]}
                      className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-primary hover:underline disabled:text-secondary disabled:no-underline"
                    >
                      <span className="material-symbols-outlined text-base">{saved[i] ? 'check' : 'bookmark_add'}</span>
                      {saved[i] ? 'Saved' : 'Save report'}
                    </button>
                  ) : access.status === 'free' ? (
                    <button
                      onClick={upgrade}
                      title="Upgrade to Search Pro to save reports"
                      className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-secondary/70 hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-base">lock</span>
                      Save (Search Pro)
                    </button>
                  ) : null
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
          <p className="text-xs text-secondary/70 text-center mt-2">{DISCLAIMER}</p>
        </main>
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Header from '@/components/Header';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Where is land demand growing fastest right now?',
  'What should I look for in a good land investment?',
  'Is now a good time to buy vacant land?',
  'What states have the best land opportunities?',
  'How do I evaluate a land parcel?',
  'What is driving land prices in 2026?',
];

const DISCLAIMER = 'Educational information only — not financial, legal, or investment advice.';

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load persisted history for logged-in users (returns empty for logged-out).
  useEffect(() => {
    fetch('/api/advisor')
      .then(r => (r.ok ? r.json() : { messages: [] }))
      .then(j => {
        if (Array.isArray(j.messages) && j.messages.length) setMessages(j.messages);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput('');

    const withUser: Msg[] = [...messages, { role: 'user', content: q }];
    setMessages([...withUser, { role: 'assistant', content: '' }]);
    setLoading(true);

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: withUser }),
      });
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
  }, [messages, loading]);

  const isEmpty = messages.length === 0;
  const streaming = loading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !messages[messages.length - 1].content;

  const searchForm = (large: boolean) => (
    <form
      onSubmit={e => { e.preventDefault(); send(input); }}
      className={`w-full flex items-center gap-2 bg-white border border-outline-variant/30 rounded-2xl p-2 ${large ? 'shadow-md' : 'shadow-sm sticky bottom-2'}`}
    >
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Ask about land markets, where to invest, what to look for…"
        className={`flex-grow bg-transparent px-3 py-2.5 text-on-surface placeholder:text-secondary focus:outline-none ${large ? 'text-lg' : 'text-base'}`}
        aria-label="Search"
      />
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className={`shrink-0 flex items-center gap-1.5 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${large ? 'px-6 py-3 text-base' : 'px-5 py-2.5 text-sm'}`}
      >
        <span className="material-symbols-outlined text-base">search</span>
        Search
      </button>
    </form>
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <Header />

      {isEmpty ? (
        /* ── Centered search-home (empty state) ── */
        <main className="flex-grow flex flex-col w-full max-w-3xl mx-auto px-4 pt-16 pb-4">
          <div className="flex-grow flex flex-col items-center justify-center gap-8">
            <h1 className="font-headline text-4xl sm:text-5xl font-black text-primary tracking-tight text-center">
              Search
            </h1>

            <div className="w-full max-w-2xl">
              {searchForm(true)}
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
          </div>

          <p className="text-[11px] text-secondary/70 text-center mt-2">{DISCLAIMER}</p>
        </main>
      ) : (
        /* ── Standard chat view (after first message) ── */
        <main className="flex-grow flex flex-col w-full max-w-3xl mx-auto px-4 pt-20 pb-4">
          <h1 className="font-headline text-2xl font-black text-primary tracking-tight py-3">Search</h1>

          <div ref={scrollRef} className="flex-grow overflow-y-auto space-y-4 py-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-green-700 text-white rounded-br-md'
                      : 'bg-white border border-outline-variant/20 text-on-surface rounded-bl-md shadow-sm'
                  }`}
                >
                  {m.content || (streaming && i === messages.length - 1 ? (
                    <span className="inline-flex gap-1 py-1">
                      <span className="w-2 h-2 rounded-full bg-secondary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-secondary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-secondary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  ) : '')}
                </div>
              </div>
            ))}
          </div>

          {searchForm(false)}
          <p className="text-[11px] text-secondary/70 text-center mt-2">{DISCLAIMER}</p>
        </main>
      )}
    </div>
  );
}

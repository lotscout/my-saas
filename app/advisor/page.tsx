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

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow flex flex-col w-full max-w-3xl mx-auto px-4 pt-20 pb-4">
        {/* Intro */}
        <div className="py-4 text-center">
          <h1 className="font-headline text-2xl sm:text-3xl font-black text-primary tracking-tight">AI Land Investment Advisor</h1>
          <p className="text-secondary text-sm mt-1">Ask about land markets, where to invest, and what to look for — grounded in LotScout data.</p>
        </div>

        {/* Message history */}
        <div ref={scrollRef} className="flex-grow overflow-y-auto space-y-4 py-4">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
              </div>
              <p className="text-secondary text-sm max-w-md">
                I&apos;m your LotScout land investment advisor. This is educational information, not personalized financial, legal, or investment advice — always do your own due diligence.
              </p>
            </div>
          )}

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

        {/* Suggested questions (first load) */}
        {isEmpty && (
          <div className="flex flex-wrap gap-2 justify-center pb-3">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="text-xs font-semibold text-primary bg-white border border-primary/20 rounded-full px-3.5 py-2 hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={e => { e.preventDefault(); send(input); }}
          className="flex items-end gap-2 bg-white border border-outline-variant/30 rounded-2xl p-2 shadow-sm sticky bottom-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about land markets, where to invest, what to look for…"
            className="flex-grow bg-transparent px-3 py-2.5 text-sm text-on-surface placeholder:text-secondary focus:outline-none"
            aria-label="Ask the advisor"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 flex items-center gap-1.5 bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-green-800 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-base">send</span>
            Send
          </button>
        </form>
        <p className="text-[11px] text-secondary/70 text-center mt-2">
          Educational information only — not financial, legal, or investment advice.
        </p>
      </main>
    </div>
  );
}

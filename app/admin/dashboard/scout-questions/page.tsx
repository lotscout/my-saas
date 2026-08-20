'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type ScoutQuestion = {
  id: string;
  user_id: string | null;
  asker: string;
  email: string | null;
  question: string;
  created_at: string;
};

function fmtDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ScoutQuestionsPage() {
  const [questions, setQuestions] = useState<ScoutQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (appliedSearch) params.set('q', appliedSearch);
      const res = await fetch(`/api/admin/scout-questions?${params}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load Scout questions');
      setQuestions(json.questions ?? []);
      setTotal(json.total ?? 0);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Scout questions');
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch]);

  useEffect(() => { load(); }, [load]);

  const rangeLabel = useMemo(() => {
    if (!total) return '0 questions';
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(total, page * pageSize);
    return `${start}-${end} of ${total} questions`;
  }, [page, total]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <Link href="/admin/dashboard" className="text-sm font-bold text-[#1D9E75] hover:underline">← Back to admin dashboard</Link>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mt-2">Scout Questions Asked</h1>
          <p className="text-on-surface/50 mt-1 text-sm">Every saved Scout user question, including guest questions going forward.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setAppliedSearch(search.trim()); }} className="flex gap-2 w-full md:w-auto">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions…" className="w-full md:w-72 rounded-xl border border-outline-variant/20 px-4 py-2 text-sm outline-none focus:border-[#1D9E75]" />
          <button className="rounded-xl bg-[#1D9E75] px-4 py-2 text-sm font-bold text-white">Search</button>
        </form>
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white border border-outline-variant/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-on-surface">{rangeLabel}</p>
            <p className="text-xs text-on-surface/40">Newest first</p>
          </div>
          <button onClick={load} className="px-3 py-2 rounded-lg text-xs font-bold bg-white border border-outline-variant/20 text-on-surface/65 hover:text-on-surface">Refresh</button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-on-surface/40">Loading Scout questions…</div>
        ) : questions.length === 0 ? (
          <div className="p-10 text-center text-sm text-on-surface/40">No Scout questions found.</div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {questions.map((q) => (
              <div key={q.id} className="p-5 hover:bg-surface-container-lowest/60">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface truncate">{q.asker}</p>
                    <p className="text-xs text-on-surface/40 truncate">{q.email || (q.user_id ? q.user_id : 'Guest')}</p>
                  </div>
                  <p className="text-xs font-semibold text-on-surface/40 shrink-0">{fmtDate(q.created_at)}</p>
                </div>
                <p className="text-sm text-on-surface/75 whitespace-pre-wrap leading-relaxed">{q.question}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded-xl border border-outline-variant/20 bg-white text-sm font-bold disabled:opacity-40">Previous</button>
        <p className="text-sm text-on-surface/45">Page {page} of {totalPages}</p>
        <button disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-outline-variant/20 bg-white text-sm font-bold disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

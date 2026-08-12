'use client';

import { useState, useMemo } from 'react';

interface Props {
  listingId: string;
  listingTitle: string;
  tier: string;
  onClose: () => void;
}

const WEEKLY_RATES: Record<string, number> = {
  standard: 29,
  priority: 29,
  exclusive: 2.90,
};

export default function BoostModal({ listingId, listingTitle, tier, onClose }: Props) {
  const weeklyRate = WEEKLY_RATES[tier] ?? 29;
  const [budget, setBudget] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const budgetNum = parseFloat(budget) || 0;
  const weeks = Math.max(0, Math.floor(budgetNum / weeklyRate));
  const actualCost = weeks * weeklyRate;

  const expiresDate = useMemo(() => {
    if (weeks < 1) return null;
    const d = new Date();
    d.setDate(d.getDate() + weeks * 7);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [weeks]);

  const isExclusive = tier === 'exclusive';

  async function handleBoost() {
    if (weeks < 1 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          budgetCents: Math.round(actualCost * 100),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start boost');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
            <div>
              <h2 className="text-white font-headline font-bold text-lg leading-tight">Promote Your Listing</h2>
              <p className="text-white/70 text-xs">Featured badge · Top of search results</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Listing name */}
          <div className="bg-surface-container-low rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-0.5">Listing</p>
            <p className="text-sm font-semibold text-on-surface truncate">{listingTitle}</p>
          </div>

          {/* Pricing info */}
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <div>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Weekly Rate</p>
              <p className="text-2xl font-extrabold text-primary">${weeklyRate.toFixed(2)}<span className="text-sm font-normal text-secondary">/wk</span></p>
            </div>
            {isExclusive && (
              <div className="bg-[#1D9E75] text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest">
                90% off
              </div>
            )}
          </div>

          {/* Budget input */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Set Your Budget</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold text-lg">$</span>
              <input
                type="number"
                min={weeklyRate}
                step={weeklyRate}
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder={`${weeklyRate}`}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-8 pr-4 py-3.5 text-on-surface text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <p className="text-xs text-secondary mt-1.5">Minimum ${weeklyRate.toFixed(2)} (1 week)</p>
          </div>

          {/* Budget breakdown */}
          {weeks >= 1 ? (
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary">Promotion duration</span>
                <span className="text-sm font-bold text-on-surface">{weeks} week{weeks > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary">Expires</span>
                <span className="text-sm font-bold text-on-surface">{expiresDate}</span>
              </div>
              <div className="border-t border-primary/10 pt-2 flex justify-between items-center">
                <span className="text-sm font-bold text-secondary">Total charge</span>
                <span className="text-lg font-extrabold text-primary">${actualCost.toFixed(2)}</span>
              </div>
            </div>
          ) : budgetNum > 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-slate-600 text-sm">Budget must be at least ${weeklyRate.toFixed(2)} for 1 week of promotion.</p>
            </div>
          ) : null}

          {/* What you get */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">What you get</p>
            {[
              'Featured badge on your listing',
              'Pinned to top of search results',
              'Highlighted in the marketplace map',
              'Cancel anytime (no refunds after payment)',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-on-surface">
                <span className="material-symbols-outlined text-emerald-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                {item}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              {error}
            </div>
          )}

          <button
            onClick={handleBoost}
            disabled={weeks < 1 || loading}
            className="w-full bg-[#1D9E75] text-white font-bold py-4 rounded-xl text-base hover:bg-[#14795A] transition-all shadow-lg shadow-[#1D9E75]/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Redirecting to checkout...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                Boost Now — ${actualCost > 0 ? actualCost.toFixed(2) : '0.00'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { PageHeader, PrimaryAction, SurfaceCard } from '@/components/ui/LotScoutUI';
import {
  buildMatches,
  formatCurrency,
  formatSqft,
  seedBuyers,
  seedParcels,
  type ParcelMatch,
} from '@/lib/land-matcher';

const SELECT_CLS = 'bg-white px-4 py-3 rounded-xl border border-outline-variant/25 hover:border-primary/30 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all shadow-sm';

function ScorePill({ label, score }: { label: string; score: number }) {
  const tone = score >= 80 ? 'bg-[#E8EFE6] text-[#1D9E75]' : score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600';
  return (
    <div className={`rounded-full px-3 py-1 text-xs font-black ${tone}`}>
      {label}: {score}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <SurfaceCard className="p-5">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-secondary/75">{label}</p>
      <p className="mt-1 font-headline text-3xl font-extrabold text-primary">{value}</p>
      <p className="mt-1 text-sm font-semibold text-secondary">{sub}</p>
    </SurfaceCard>
  );
}

function MatchRow({ match, selected, onSelect }: { match: ParcelMatch; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-3xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${selected ? 'border-[#1D9E75] bg-[#FCFFFD] ring-2 ring-[#1D9E75]/15' : 'border-emerald-900/10 bg-white hover:border-primary/25'}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">Contact</span>
            <span className="text-xs font-bold text-secondary">{match.parcel.neighborhood} · {match.parcel.zip}</span>
          </div>
          <h3 className="mt-3 font-headline text-xl font-extrabold leading-tight text-primary">{match.parcel.address}</h3>
          <p className="mt-1 text-sm font-semibold text-secondary">Owner: {match.parcel.ownerName} · {match.parcel.ownerMailingAddress}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <ScorePill label="Opportunity" score={match.opportunityScore} />
          <ScorePill label="Buyer fit" score={match.buyerFitScore} />
          <ScorePill label="Motivation" score={match.sellerMotivationScore} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-surface-container-low px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-secondary/65">Matched buyer</p>
          <p className="mt-1 truncate text-sm font-extrabold text-primary">{match.buyer.company}</p>
        </div>
        <div className="rounded-2xl bg-surface-container-low px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-secondary/65">Lot size</p>
          <p className="mt-1 text-sm font-extrabold text-primary">{formatSqft(match.parcel.lotSqft)}</p>
        </div>
        <div className="rounded-2xl bg-surface-container-low px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-secondary/65">Zoning</p>
          <p className="mt-1 text-sm font-extrabold text-primary">{match.parcel.zoning}</p>
        </div>
        <div className="rounded-2xl bg-surface-container-low px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-secondary/65">Value</p>
          <p className="mt-1 text-sm font-extrabold text-primary">{formatCurrency(match.parcel.assessedValue)}</p>
        </div>
      </div>
    </button>
  );
}

function DetailPanel({ match }: { match: ParcelMatch }) {
  return (
    <SurfaceCard className="sticky top-24 overflow-hidden">
      <div className="border-b border-outline-variant/10 bg-[#FCFFFD] p-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1D9E75]">Selected opportunity</p>
        <h2 className="mt-2 font-headline text-2xl font-extrabold text-primary">{match.parcel.address}</h2>
        <p className="mt-1 text-sm font-semibold text-secondary">{match.parcel.neighborhood}, Denver</p>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-secondary/70">Who to call</p>
          <p className="mt-2 text-lg font-extrabold text-primary">{match.parcel.ownerName}</p>
          <p className="text-sm font-semibold text-secondary">Mailing: {match.parcel.ownerMailingAddress}</p>
          <p className="mt-1 text-sm font-semibold text-secondary">Status: <span className="capitalize text-primary">{match.parcel.contactStatus}</span></p>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-secondary/70">Why this is prioritized</p>
          <ul className="mt-2 space-y-2">
            {match.reasons.slice(0, 6).map(reason => (
              <li key={reason} className="flex gap-2 text-sm font-semibold text-secondary">
                <span className="material-symbols-outlined text-base text-[#1D9E75]">check_circle</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {match.redFlags.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Check before outreach</p>
            <ul className="mt-2 space-y-1">
              {match.redFlags.map(flag => <li key={flag} className="text-sm font-semibold text-amber-800">• {flag}</li>)}
            </ul>
          </div>
        )}

        <div className="rounded-2xl bg-surface-container-low p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-secondary/70">Suggested seller angle</p>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-primary">“{match.outreachAngle}”</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PrimaryAction className="rounded-2xl">Mark called</PrimaryAction>
          <button className="rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-sm font-extrabold text-primary shadow-sm hover:bg-surface-container-low">Follow up</button>
        </div>
      </div>
    </SurfaceCard>
  );
}

export default function LandMatcherPage() {
  const [buyerId, setBuyerId] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const allMatches = useMemo(() => buildMatches(), []);
  const neighborhoods = useMemo(() => Array.from(new Set(seedParcels.map(parcel => parcel.neighborhood))).sort(), []);

  const matches = useMemo(() => {
    return allMatches.filter(match => {
      const buyerOk = !buyerId || match.buyer.id === buyerId;
      const neighborhoodOk = !neighborhood || match.parcel.neighborhood === neighborhood;
      const statusOk = !status || match.parcel.contactStatus === status;
      return buyerOk && neighborhoodOk && statusOk;
    });
  }, [allMatches, buyerId, neighborhood, status]);

  const selected = matches.find(match => `${match.buyer.id}-${match.parcel.id}` === selectedId) ?? matches[0] ?? allMatches[0];
  const topContacts = allMatches.filter(match => match.opportunityScore >= 75).length;
  const matchedParcels = new Set(allMatches.map(match => match.parcel.id)).size;

  async function testAttomImport() {
    setImporting(true);
    setImportStatus(null);
    try {
      const response = await fetch('/api/land-matcher/attom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postalCode: '80211', pageSize: 25 }),
      });
      const data = await response.json();
      if (!response.ok) {
        setImportStatus(data?.nextStep || data?.error || 'ATTOM connector needs configuration.');
        return;
      }
      setImportStatus(data?.message || 'ATTOM connector test succeeded.');
    } catch {
      setImportStatus('Could not reach the ATTOM connector.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 md:px-10">
        <PageHeader
          title={<>Land <span className="text-[#1D9E75]">Matcher</span></>}
          description="Internal tool for turning builder criteria and ATTOM parcel data into a ranked seller contact queue. Start with the highest opportunity score, then update the outreach status as you work the list."
          actions={<PrimaryAction onClick={testAttomImport} disabled={importing}>{importing ? 'Testing ATTOM...' : 'Test ATTOM import'}</PrimaryAction>}
        />

        {importStatus && (
          <SurfaceCard className="mb-7 border-[#1D9E75]/20 bg-[#FCFFFD] p-5">
            <p className="text-sm font-bold text-primary">{importStatus}</p>
          </SurfaceCard>
        )}

        <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-4">
          <StatCard label="Active buyers" value={seedBuyers.length.toString()} sub="Builder buy boxes loaded" />
          <StatCard label="Matched parcels" value={matchedParcels.toString()} sub="Lots matching at least one buyer" />
          <StatCard label="Top contacts" value={topContacts.toString()} sub="Opportunity score 75+" />
          <StatCard label="Source" value="ATTOM" sub="Ready for live parcel imports" />
        </div>

        <SurfaceCard className="mb-7 p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <select value={buyerId} onChange={e => setBuyerId(e.target.value)} className={SELECT_CLS}>
              <option value="">All buyers</option>
              {seedBuyers.map(buyer => <option key={buyer.id} value={buyer.id}>{buyer.company}</option>)}
            </select>
            <select value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className={SELECT_CLS}>
              <option value="">All neighborhoods</option>
              {neighborhoods.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value)} className={SELECT_CLS}>
              <option value="">All contact statuses</option>
              <option value="new">New</option>
              <option value="call">Call</option>
              <option value="mail">Mail</option>
              <option value="emailed">Emailed</option>
              <option value="follow-up">Follow up</option>
              <option value="not-interested">Not interested</option>
            </select>
            {(buyerId || neighborhood || status) && (
              <button onClick={() => { setBuyerId(''); setNeighborhood(''); setStatus(''); }} className="rounded-xl px-4 py-3 text-xs font-extrabold text-secondary hover:bg-surface-container-low hover:text-primary">
                Clear filters
              </button>
            )}
          </div>
        </SurfaceCard>

        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-secondary/70">Seller contact queue</p>
                <h2 className="font-headline text-2xl font-extrabold text-primary">Who to contact first</h2>
              </div>
              <p className="text-sm font-bold text-secondary">{matches.length} matches</p>
            </div>

            {matches.map(match => {
              const id = `${match.buyer.id}-${match.parcel.id}`;
              return (
                <MatchRow
                  key={id}
                  match={match}
                  selected={selectedId === id || (!selectedId && selected === match)}
                  onSelect={() => setSelectedId(id)}
                />
              );
            })}
          </div>

          {selected && <DetailPanel match={selected} />}
        </div>
      </main>
    </div>
  );
}

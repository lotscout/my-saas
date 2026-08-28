'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import { MOCK_PROPERTY_LEADS, formatLeadDate, formatLeadPrice } from '@/lib/mockPropertyLeads';

const LEGACY_LEAD_IDS: Record<string, string> = {
  'austin-tx-024-acre-infill': 'austin-tx-0-24-acres',
  'denver-co-6250-sqft-lot': 'denver-co-6-250-sq-ft',
  'bend-or-191-acre-buildable': 'bend-or-1-91-acres',
  'phoenix-az-5000-sqft-lot': 'phoenix-az-5-000-sq-ft',
  'charlotte-nc-072-acre-lot': 'charlotte-nc-0-72-acres',
  'boise-id-235-acre-acreage': 'boise-id-2-35-acres',
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary/70">{label}</p>
      <p className="mt-1 font-headline text-base font-extrabold text-primary">{value}</p>
    </div>
  );
}

export default function PropertyLeadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const resolvedId = LEGACY_LEAD_IDS[id] ?? id;
  const lead = MOCK_PROPERTY_LEADS.find(item => item.id === resolvedId);

  if (!lead) {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        <Header />
        <main className="mx-auto max-w-4xl px-4 pt-28 pb-16 text-center">
          <p className="font-headline text-2xl font-extrabold text-primary">Lead not found</p>
          <Link href="/leads" className="mt-4 inline-flex text-sm font-bold text-[#1D9E75] hover:underline">← Back to Leads</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Header />
      <main className="mx-auto max-w-[1180px] px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-5">
          <Link href="/leads" className="inline-flex items-center gap-1 text-secondary hover:text-[#1D9E75] text-sm font-semibold transition-colors rounded-md">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Leads
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-7 items-start">
          <section className="space-y-5 min-w-0">
            <div className="bg-white border border-outline-variant/15 rounded-2xl p-5 sm:p-7 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="rounded-full bg-surface-container-low border border-outline-variant/15 px-3 py-1 text-xs font-bold text-secondary">Listed {formatLeadDate(lead.listedDate)}</span>
              </div>
              <h1 className="font-headline text-[30px] sm:text-[42px] leading-[1.05] font-extrabold tracking-tight text-primary">{lead.title}</h1>
              <p className="mt-3 text-lg font-extrabold text-[#1D9E75]">{formatLeadPrice(lead.price)}</p>
              <p className="mt-4 text-sm sm:text-base text-secondary leading-relaxed max-w-3xl">{lead.summary}</p>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailRow label="Lot size" value={lead.lotSize} />
              <DetailRow label="County" value={`${lead.county} County`} />
              <DetailRow label="Zoning" value={lead.zoning} />
              <DetailRow label="Road access" value={lead.roadAccess} />
              <DetailRow label="Utilities" value={lead.utilities} />
              <DetailRow label="Property type" value={lead.propertyType} />
            </section>

            <section className="bg-white border border-outline-variant/15 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="font-headline text-xl font-extrabold text-primary mb-4">Lead highlights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lead.highlights.map(item => (
                  <div key={item} className="flex items-center gap-3 rounded-xl bg-surface-container-low border border-outline-variant/15 px-4 py-3">
                    <span className="h-2 w-2 rounded-full bg-[#1D9E75] shrink-0" />
                    <p className="text-sm font-bold text-secondary">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-outline-variant/15 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="font-headline text-xl font-extrabold text-primary mb-4">Due diligence checklist</h2>
              <div className="space-y-3">
                {lead.dueDiligence.map(item => (
                  <div key={item} className="flex gap-3">
                    <span className="material-symbols-outlined text-[#1D9E75] text-xl">task_alt</span>
                    <p className="text-sm text-secondary leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <section className="bg-white border border-outline-variant/15 rounded-2xl p-5 shadow-sm">
              <h2 className="font-headline text-base font-extrabold text-primary mb-4">Seller contact</h2>
              <dl className="space-y-3 border-y border-outline-variant/15 py-4">
                <div><dt className="font-headline text-[11px] font-extrabold uppercase tracking-widest text-secondary">Listed by</dt><dd className="mt-0.5 font-bold text-primary">{lead.sellerName}</dd></div>
                <div><dt className="font-headline text-[11px] font-extrabold uppercase tracking-widest text-secondary">Company</dt><dd className="mt-0.5 font-bold text-primary">{lead.sellerCompany}</dd></div>
              </dl>
              <div className="mt-4 space-y-2">
                <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D9E75] px-4 py-3 text-white font-headline text-sm font-extrabold hover:bg-[#14795A] transition-colors">
                  <span className="material-symbols-outlined text-base">chat</span>
                  Message seller
                </button>
              </div>
            </section>

            <section className="rounded-2xl border-2 border-[#1D9E75] bg-white p-5 shadow-sm">
              <h2 className="font-headline text-base font-extrabold text-primary mb-2">Verify before outreach</h2>
              <p className="text-sm text-secondary leading-relaxed">This is sample lead data for the LotScout UI. Real leads should be checked for ownership, availability, duplicate listings, title issues, zoning, utilities, and seller authorization.</p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

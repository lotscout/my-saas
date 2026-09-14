'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/client';

const inputClass = 'w-full rounded-2xl border border-emerald-900/15 bg-white px-4 py-3 text-sm font-semibold text-[#1B4332] outline-none transition focus:border-[#1D9E75] focus:ring-4 focus:ring-[#1D9E75]/10 placeholder:text-[#7b8d84]';
const labelClass = 'mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#456257]';

type Unit = 'acres' | 'sqft';

export default function CreateLeadPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lotSizeUnit, setLotSizeUnit] = useState<Unit>('acres');
  const [form, setForm] = useState({
    streetAddress: '',
    apn: '',
    lotSizeValue: '',
    askingPrice: '',
    priceNegotiable: false,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/sign-in?redirect=/create-lead');
        return;
      }
      setCheckingAuth(false);
    });
  }, [router]);

  function set(field: keyof typeof form, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, lotSizeUnit }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not submit lead.');
      router.push('/leads?submitted=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit lead.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FBF8] text-[#1B4332]">
        <Header />
        <main className="flex min-h-screen items-center justify-center px-6 pt-24">
          <p className="font-bold text-[#456257]">Opening lead form...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FBF8] text-[#1B4332]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/leads"
            className="inline-flex items-center justify-center rounded-full border border-emerald-900/15 bg-white px-7 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-[#1B4332] shadow-sm transition hover:border-[#1D9E75]/40 hover:bg-[#E8EFE6]"
          >
            Back to Leads
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-white shadow-xl shadow-emerald-900/5">
          <div className="border-b border-emerald-900/10 bg-[#E8EFE6] px-6 py-5 sm:px-8">
            <h2 className="font-headline text-2xl font-black text-[#1B4332]">Lead details</h2>
            <p className="mt-1 text-sm font-semibold text-[#456257]">Address or APN is required. You can include both if you have them.</p>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="streetAddress">Address</label>
                  <input id="streetAddress" className={inputClass} value={form.streetAddress} onChange={e => set('streetAddress', e.target.value)} placeholder="123 Main St, Denver, CO" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="apn">APN</label>
                  <input id="apn" className={inputClass} value={form.apn} onChange={e => set('apn', e.target.value)} placeholder="Parcel or assessor number" />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label className={labelClass} htmlFor="lotSizeValue">Lot size *</label>
                  <input id="lotSizeValue" required min="0" step="any" inputMode="decimal" type="number" className={inputClass} value={form.lotSizeValue} onChange={e => set('lotSizeValue', e.target.value)} placeholder={lotSizeUnit === 'sqft' ? '6250' : '0.25'} />
                </div>
                <div className="rounded-2xl border border-emerald-900/15 bg-[#F8FBF8] p-1">
                  {(['acres', 'sqft'] as Unit[]).map(unit => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setLotSizeUnit(unit)}
                      className={`rounded-xl px-5 py-3 text-xs font-black uppercase tracking-[0.12em] transition ${lotSizeUnit === unit ? 'bg-[#1B4332] text-white shadow-sm' : 'text-[#456257] hover:bg-white'}`}
                    >
                      {unit === 'sqft' ? 'Sq ft' : 'Acres'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label className={labelClass} htmlFor="askingPrice">Price *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#456257]">$</span>
                    <input id="askingPrice" required min="0" step="1" inputMode="numeric" type="number" className={`${inputClass} pl-8`} value={form.askingPrice} onChange={e => set('askingPrice', e.target.value)} placeholder="125000" />
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-emerald-900/15 bg-[#F8FBF8] px-5 py-4 text-sm font-extrabold text-[#1B4332]">
                  <input type="checkbox" checked={form.priceNegotiable} onChange={e => set('priceNegotiable', e.target.checked)} className="h-5 w-5 accent-[#1D9E75]" />
                  Price is negotiable
                </label>
              </div>

              <div>
                <label className={labelClass} htmlFor="notes">Notes</label>
                <textarea id="notes" rows={4} className={inputClass} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Anything helpful about seller motivation, access, utilities, timing, or follow-up." />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-emerald-900/10 bg-[#FCFFFD] p-5 sm:p-6">
              <h3 className="font-headline text-2xl font-black text-[#1B4332]">Contact information</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#456257]">Who should LotScout contact to verify this lead?</p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className={labelClass} htmlFor="contactName">Contact name *</label>
                  <input id="contactName" required className={inputClass} value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Name" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="contactEmail">Contact email</label>
                  <input id="contactEmail" type="email" className={inputClass} value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="name@email.com" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="contactPhone">Contact phone</label>
                  <input id="contactPhone" type="tel" className={inputClass} value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="(555) 555-1234" />
                </div>
                <p className="rounded-2xl bg-[#E8EFE6] px-4 py-3 text-xs font-bold leading-5 text-[#456257]">
                  Enter at least one contact method: email or phone.
                </p>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-4 border-t border-emerald-900/10 bg-[#F8FBF8] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            {error ? <p className="text-sm font-bold text-red-600">{error}</p> : <p className="text-sm font-semibold text-[#456257]">Lead will be saved for review before buyer outreach.</p>}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#1B4332] px-8 py-4 text-sm font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-emerald-900/15 transition hover:bg-[#153628] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit lead'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

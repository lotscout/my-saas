'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
];

const ZONING_OPTIONS = ['Residential', 'Agricultural', 'Commercial', 'Industrial', 'Mixed-Use', 'Other/Unknown'];
const ROAD_OPTIONS = ['Paved Road', 'Gravel Road', 'Dirt Road', 'Private Road', 'Easement', 'No Road Access'];
const UTILITY_OPTIONS = ['Water', 'Electric', 'Gas', 'Septic', 'Sewer'];

type ListingForm = {
  title: string;
  property_description: string;
  city: string;
  state: string;
  county: string;
  zip_code: string;
  street_address: string;
  apn: string;
  lot_size_acres: string;
  lot_size_sqft: string;
  zoning: string;
  road_access: string[];
  utilities: string[];
  asking_price: string;
  comparable_market_value: string;
  price_negotiable: boolean;
  preferred_close_date: string;
  additional_information: string;
};

const emptyForm: ListingForm = {
  title: '',
  property_description: '',
  city: '',
  state: '',
  county: '',
  zip_code: '',
  street_address: '',
  apn: '',
  lot_size_acres: '',
  lot_size_sqft: '',
  zoning: '',
  road_access: [],
  utilities: [],
  asking_price: '',
  comparable_market_value: '',
  price_negotiable: false,
  preferred_close_date: '',
  additional_information: '',
};

function toInput(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = params.id;
  const [form, setForm] = useState<ListingForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/listings/${listingId}`)
      .then(r => r.json().then(data => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) throw new Error(data?.error ?? 'Listing not found');
        setForm({
          title: toInput(data.title),
          property_description: toInput(data.property_description),
          city: toInput(data.city),
          state: toInput(data.state),
          county: toInput(data.county),
          zip_code: toInput(data.zip_code),
          street_address: toInput(data.street_address),
          apn: toInput(data.apn),
          lot_size_acres: toInput(data.lot_size_acres),
          lot_size_sqft: toInput(data.lot_size_sqft),
          zoning: toInput(data.zoning),
          road_access: Array.isArray(data.road_access) ? data.road_access : [],
          utilities: Array.isArray(data.utilities) ? data.utilities : [],
          asking_price: toInput(data.asking_price),
          comparable_market_value: toInput(data.comparable_market_value),
          price_negotiable: Boolean(data.price_negotiable),
          preferred_close_date: toInput(data.preferred_close_date),
          additional_information: toInput(data.additional_information),
        });
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load listing'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [listingId]);

  const set = (field: keyof ListingForm, value: string | boolean | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const toggle = (field: 'road_access' | 'utilities', value: string) => {
    set(field, form[field].includes(value) ? form[field].filter(v => v !== value) : [...form[field], value]);
  };

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Unable to save listing');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save listing');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Header />
      <main className="pt-24 sm:pt-32 pb-16 px-4 sm:px-6 md:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/marketplace" className="text-sm font-semibold text-secondary hover:text-primary">← Back to Marketplace</Link>
              <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-primary mt-3">Edit Listing</h1>
              <p className="text-secondary text-sm mt-2">Update your listing details. Changes remain tied to your existing listing.</p>
            </div>
            <Link href={`/listings/${listingId}`} className="inline-flex items-center justify-center rounded-xl border border-outline-variant/25 bg-white px-5 py-3 text-sm font-bold text-primary hover:bg-surface-container-low transition-colors">
              Preview Listing
            </Link>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white border border-outline-variant/15 p-8 text-secondary">Loading listing…</div>
          ) : (
            <div className="rounded-3xl bg-white border border-outline-variant/15 shadow-sm p-5 sm:p-8 space-y-7">
              {error && <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm font-semibold">{error}</div>}
              {saved && <div className="rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 text-sm font-semibold">Listing updated.</div>}

              <div>
                <label className="text-xs font-extrabold uppercase tracking-widest text-secondary">Listing title</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant/25 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div>
                <label className="text-xs font-extrabold uppercase tracking-widest text-secondary">Description</label>
                <textarea value={form.property_description} onChange={e => set('property_description', e.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-outline-variant/25 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Street address" value={form.street_address} onChange={v => set('street_address', v)} />
                <Input label="APN" value={form.apn} onChange={v => set('apn', v)} />
                <Input label="City" value={form.city} onChange={v => set('city', v)} />
                <Input label="County" value={form.county} onChange={v => set('county', v)} />
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-widest text-secondary">State</label>
                  <select value={form.state} onChange={e => set('state', e.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant/25 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Select state</option>
                    {US_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                </div>
                <Input label="Zip code" value={form.zip_code} onChange={v => set('zip_code', v)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Lot size acres" type="number" value={form.lot_size_acres} onChange={v => set('lot_size_acres', v)} />
                <Input label="Lot size sqft" type="number" value={form.lot_size_sqft} onChange={v => set('lot_size_sqft', v)} />
                <Input label="Asking price" type="number" value={form.asking_price} onChange={v => set('asking_price', v)} />
                <Input label="Comparable market value" type="number" value={form.comparable_market_value} onChange={v => set('comparable_market_value', v)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-widest text-secondary">Zoning</label>
                  <select value={form.zoning} onChange={e => set('zoning', e.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant/25 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Select zoning</option>
                    {ZONING_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <Input label="Preferred close date" type="date" value={form.preferred_close_date} onChange={v => set('preferred_close_date', v)} />
              </div>

              <CheckboxGroup label="Road access" options={ROAD_OPTIONS} values={form.road_access} onToggle={value => toggle('road_access', value)} />
              <CheckboxGroup label="Utilities" options={UTILITY_OPTIONS} values={form.utilities} onToggle={value => toggle('utilities', value)} />

              <label className="flex items-center gap-3 text-sm font-semibold text-primary">
                <input type="checkbox" checked={form.price_negotiable} onChange={e => set('price_negotiable', e.target.checked)} className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary" />
                Price is negotiable
              </label>

              <div>
                <label className="text-xs font-extrabold uppercase tracking-widest text-secondary">Additional information</label>
                <textarea value={form.additional_information} onChange={e => set('additional_information', e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-outline-variant/25 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#1D9E75] px-6 py-3 text-sm font-bold text-white hover:bg-[#14795A] disabled:opacity-60 transition-colors">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button onClick={() => router.push(`/listings/${listingId}`)} className="inline-flex flex-1 items-center justify-center rounded-xl border border-outline-variant/25 bg-white px-6 py-3 text-sm font-bold text-primary hover:bg-surface-container-low transition-colors">
                  Preview Listing
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-extrabold uppercase tracking-widest text-secondary">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant/25 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
    </div>
  );
}

function CheckboxGroup({ label, options, values, onToggle }: { label: string; options: string[]; values: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-widest text-secondary mb-3">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map(option => (
          <button key={option} type="button" onClick={() => onToggle(option)} className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${values.includes(option) ? 'border-[#1D9E75] bg-emerald-50 text-[#14795A]' : 'border-outline-variant/25 bg-white text-secondary hover:border-[#1D9E75]/40'}`}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { usePermissions } from '@/hooks/usePermissions';
import { createClient } from '@/lib/supabase/client';

// ─── Constants ────────────────────────────────────────────────────────────────

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

const ZONING_OPTIONS = [
  'Residential','Agricultural','Commercial','Industrial',
  'Mixed Use','Recreational','Timber','Other',
];

const OWNERSHIP_OPTIONS = [
  'Owner','Under Contract','Power of Attorney','Authorized Agent',
];

const ROAD_ACCESS_OPTIONS = [
  { value: 'paved',    label: 'Paved Road' },
  { value: 'gravel',   label: 'Gravel Road' },
  { value: 'dirt',     label: 'Dirt Road' },
  { value: 'private',  label: 'Private Road' },
  { value: 'easement', label: 'Easement' },
  { value: 'none',     label: 'No Road Access' },
];

const UTILITY_OPTIONS = [
  { value: 'electric', label: 'Electric' },
  { value: 'water',    label: 'Water' },
  { value: 'sewer',    label: 'Sewer' },
  { value: 'septic',   label: 'Septic' },
  { value: 'gas',      label: 'Gas' },
];

const CONTACT_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'text',  label: 'Text / SMS' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  ownershipType: string;
  ownershipCertified: boolean;
  title: string;
  propertyDescription: string;
  state: string;
  county: string;
  zipCode: string;
  streetAddress: string;
  apn: string;
  lotSizeValue: string;
  lotSizeUnit: 'acres' | 'sqft';
  zoning: string;
  roadAccess: string[];
  utilities: string[];
  askingPrice: string;
  comparableMarketValue: string;
  priceNegotiable: boolean;
  preferredCloseDate: string;
  photosUrls: string[];
  contractUrl: string;
  additionalInformation: string;
  contactMethods: string[];
  legalConfirmation: boolean;
  platformUnderstanding: boolean;
  stateCompliance: boolean;
  digitalSignature: string;
  signatureDate: string;
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function inputCls(extra = '') {
  return `w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all ${extra}`;
}

function CheckboxCard({
  checked, onChange, children,
}: {
  checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode;
}) {
  return (
    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
      checked ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/20'
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 accent-primary w-4 h-4 shrink-0"
      />
      <span className="text-sm text-on-surface leading-relaxed">{children}</span>
    </label>
  );
}

function MultiCheck({
  options, values, onChange,
}: {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(v: string) {
    onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <label key={o.value} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${
          values.includes(o.value)
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-outline-variant/30 bg-surface-container-low text-secondary hover:border-primary/30'
        }`}>
          <input
            type="checkbox"
            checked={values.includes(o.value)}
            onChange={() => toggle(o.value)}
            className="sr-only"
          />
          {values.includes(o.value) && (
            <span className="material-symbols-outlined text-xs">check</span>
          )}
          {o.label}
        </label>
      ))}
    </div>
  );
}

function UpgradeBanner() {
  return (
    <div className="mt-10 p-6 bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-5">
      <span
        className="material-symbols-outlined text-4xl text-emerald-300 shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        workspace_premium
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white font-black text-base mb-1">Let LotScout Create Your Listing</p>
        <p className="text-emerald-100/80 text-sm leading-relaxed">
          Listings created by LotScout are 4X as likely to be viewed by buyers. We'll build a
          professional listing with 2D and 3D maps, aerial images, and verified property data —
          so you get more views, higher offers, and faster closings.{' '}
          <span className="font-bold text-emerald-300">Available on Exclusive plan.</span>
        </p>
      </div>
      <Link
        href="/pricing"
        className="shrink-0 bg-white text-emerald-800 font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors whitespace-nowrap"
      >
        Upgrade Now
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateListingPage() {
  const router = useRouter();
  const { tier, profile, loading: permLoading } = usePermissions();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingAdditional, setGeneratingAdditional] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const contractInputRef = useRef<HTMLInputElement>(null);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const [contractDragOver, setContractDragOver] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<FormData>({
    ownershipType: '',
    ownershipCertified: false,
    title: '',
    propertyDescription: '',
    state: '',
    county: '',
    zipCode: '',
    streetAddress: '',
    apn: '',
    lotSizeValue: '',
    lotSizeUnit: 'acres',
    zoning: '',
    roadAccess: [],
    utilities: [],
    askingPrice: '',
    comparableMarketValue: '',
    priceNegotiable: false,
    preferredCloseDate: '',
    photosUrls: [],
    contractUrl: '',
    additionalInformation: '',
    contactMethods: [],
    legalConfirmation: false,
    platformUnderstanding: false,
    stateCompliance: false,
    digitalSignature: '',
    signatureDate: today,
  });

  // Pre-fill signature with user's name
  useEffect(() => {
    if (profile) {
      const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
      if (name) setForm(f => ({ ...f, digitalSignature: f.digitalSignature || name }));
    }
  }, [profile]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  // ── Step validation ──────────────────────────────────────────────────────────
  const step1Valid = !!form.ownershipType && form.ownershipCertified;
  const step2Valid =
    !!form.title && !!form.propertyDescription && !!form.state && !!form.county &&
    !!form.zipCode && !!form.lotSizeValue && !!form.zoning &&
    form.roadAccess.length > 0 && form.utilities.length > 0 &&
    !!form.askingPrice && !!form.preferredCloseDate;
  const step3Valid = form.photosUrls.length > 0 && !!form.contractUrl && form.contactMethods.length > 0;
  const step4Valid =
    form.legalConfirmation && form.platformUnderstanding && form.stateCompliance &&
    !!form.digitalSignature && !!form.signatureDate;

  const canAdvance = [step1Valid, step2Valid, step3Valid, step4Valid][step - 1];

  const isExclusive = !permLoading && tier === 'exclusive';

  // ── File uploads ─────────────────────────────────────────────────────────────
  async function uploadPhotos(files: FileList) {
    if (!files.length) return;
    setUploadingPhotos(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploadingPhotos(false); return; }

    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${user.id}/photos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { data, error } = await supabase.storage.from('listing-assets').upload(path, file, { upsert: true });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('listing-assets').getPublicUrl(data.path);
        urls.push(urlData.publicUrl);
      }
    }
    set('photosUrls', [...form.photosUrls, ...urls]);
    setUploadingPhotos(false);
  }

  async function uploadContract(file: File) {
    setUploadingContract(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploadingContract(false); return; }

    const path = `${user.id}/contract/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { data, error } = await supabase.storage.from('listing-assets').upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('listing-assets').getPublicUrl(data.path);
      set('contractUrl', urlData.publicUrl);
    }
    setUploadingContract(false);
  }

  // ── AI generation ─────────────────────────────────────────────────────────────
  async function generateDescription(target: 'propertyDescription' | 'additionalInformation') {
    const setter = target === 'propertyDescription' ? setGeneratingDesc : setGeneratingAdditional;
    setter(true);
    set(target, '');

    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          state: form.state,
          county: form.county,
          lotSize: form.lotSizeValue,
          lotSizeUnit: form.lotSizeUnit,
          zoning: form.zoning,
          roadAccess: form.roadAccess,
          utilities: form.utilities,
          context: target === 'additionalInformation' ? 'Additional property details and special conditions' : undefined,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setForm(f => ({ ...f, [target]: text }));
      }
    } catch (e) {
      console.error('AI generation error:', e);
    }
    setter(false);
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Submission failed');
      sessionStorage.setItem('listing_submitted', '1');
      router.push('/dashboard');
    } catch (e) {
      console.error('Submit error:', e);
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      <Header />

      <main className="max-w-3xl mx-auto pt-24 pb-24 px-6">

        {/* Page heading */}
        <header className="mb-8">
          <p className="text-secondary font-medium tracking-wide uppercase text-xs mb-1">List a Property</p>
          <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tighter leading-tight">
            Create <span className="text-emerald-600">Listing</span>
          </h1>
        </header>

        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-secondary uppercase tracking-widest">Step {step} of 4</span>
            <span className="text-xs font-bold text-secondary">
              {['Ownership', 'Property Info', 'Photos & Docs', 'Compliance'][step - 1]}
            </span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* ── STEP 1: Ownership ───────────────────────────────────────────── */}
        {step === 1 && (
          <section className="space-y-6">
            <div>
              <h2 className="font-headline text-2xl font-extrabold text-primary mb-1">Ownership Type</h2>
              <p className="text-secondary text-sm">Tell us your relationship to the property you're listing.</p>
            </div>

            <div>
              <Label required>Ownership Type</Label>
              <select
                value={form.ownershipType}
                onChange={e => set('ownershipType', e.target.value)}
                className={inputCls()}
              >
                <option value="">Select ownership type...</option>
                {OWNERSHIP_OPTIONS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <CheckboxCard
              checked={form.ownershipCertified}
              onChange={v => set('ownershipCertified', v)}
            >
              I hereby certify that I am the legal owner of this property or hold authorized equitable
              interest and have the legal right to market this property.{' '}
              <span className="text-red-500 font-bold">*</span>
            </CheckboxCard>

            {!isExclusive && <UpgradeBanner />}
          </section>
        )}

        {/* ── STEP 2: Property Information ────────────────────────────────── */}
        {step === 2 && (
          <section className="space-y-6">
            <div>
              <h2 className="font-headline text-2xl font-extrabold text-primary mb-1">Property Information</h2>
              <p className="text-secondary text-sm">Provide accurate details about the land you're listing.</p>
            </div>

            {/* Title */}
            <div>
              <Label required>Listing Title</Label>
              <input
                type="text"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g., 2.5 Acres in El Paso County"
                className={inputCls()}
              />
            </div>

            {/* Location */}
            <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
              <p className="text-xs font-black text-secondary uppercase tracking-widest">Location</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>State</Label>
                  <select
                    value={form.state}
                    onChange={e => { set('state', e.target.value); set('county', ''); }}
                    className={inputCls()}
                  >
                    <option value="">Select state...</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label required>County</Label>
                  <input
                    type="text"
                    value={form.county}
                    onChange={e => set('county', e.target.value)}
                    placeholder="County name"
                    disabled={!form.state}
                    className={inputCls(!form.state ? 'opacity-40 cursor-not-allowed' : '')}
                  />
                </div>
                <div>
                  <Label required>Zip Code</Label>
                  <input
                    type="text"
                    value={form.zipCode}
                    onChange={e => set('zipCode', e.target.value)}
                    placeholder="00000"
                    className={inputCls()}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                <div>
                  <Label>Street Address <span className="text-secondary normal-case font-medium">(optional)</span></Label>
                  <input
                    type="text"
                    value={form.streetAddress}
                    onChange={e => set('streetAddress', e.target.value)}
                    placeholder="123 County Road"
                    className={inputCls()}
                  />
                </div>
                <span className="text-secondary font-bold text-sm text-center pt-5">OR</span>
                <div>
                  <Label>APN <span className="text-secondary normal-case font-medium">(optional)</span></Label>
                  <input
                    type="text"
                    value={form.apn}
                    onChange={e => set('apn', e.target.value)}
                    placeholder="Assessor Parcel Number"
                    className={inputCls()}
                  />
                </div>
              </div>
            </div>

            {/* Lot Features */}
            <div className="bg-surface-container-low rounded-2xl p-6 space-y-5">
              <p className="text-xs font-black text-secondary uppercase tracking-widest">Lot Features</p>

              {/* Lot Size */}
              <div>
                <Label required>Lot Size</Label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={form.lotSizeValue}
                    onChange={e => set('lotSizeValue', e.target.value)}
                    placeholder="0"
                    min="0"
                    className={inputCls('flex-1')}
                  />
                  <div className="flex bg-surface-container rounded-xl border border-outline-variant/30 overflow-hidden">
                    {(['acres', 'sqft'] as const).map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => set('lotSizeUnit', u)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                          form.lotSizeUnit === u
                            ? 'bg-primary text-white'
                            : 'text-secondary hover:text-primary'
                        }`}
                      >
                        {u === 'acres' ? 'Acres' : 'Sq Ft'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Zoning */}
              <div>
                <Label required>Zoning</Label>
                <select
                  value={form.zoning}
                  onChange={e => set('zoning', e.target.value)}
                  className={inputCls()}
                >
                  <option value="">Select zoning...</option>
                  {ZONING_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>

              {/* Road Access */}
              <div>
                <Label required>Road Access Type</Label>
                <MultiCheck
                  options={ROAD_ACCESS_OPTIONS}
                  values={form.roadAccess}
                  onChange={v => set('roadAccess', v)}
                />
              </div>

              {/* Utilities */}
              <div>
                <Label required>Utilities</Label>
                <MultiCheck
                  options={UTILITY_OPTIONS}
                  values={form.utilities}
                  onChange={v => set('utilities', v)}
                />
              </div>
            </div>

            {/* Property Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label required>Property Description</Label>
                <button
                  type="button"
                  onClick={() => generateDescription('propertyDescription')}
                  disabled={generatingDesc || !form.title || !form.state}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                  {generatingDesc ? 'Writing...' : 'Write with AI'}
                </button>
              </div>
              <textarea
                value={form.propertyDescription}
                onChange={e => set('propertyDescription', e.target.value)}
                placeholder="Describe the property, its features, potential uses, and what makes it special..."
                rows={5}
                className={inputCls('resize-none')}
              />
              <p className="text-xs text-secondary mt-1">Keep it concise and descriptive.</p>
            </div>

            {/* Pricing */}
            <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
              <p className="text-xs font-black text-secondary uppercase tracking-widest">Pricing</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Asking Price</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold">$</span>
                    <input
                      type="number"
                      value={form.askingPrice}
                      onChange={e => set('askingPrice', e.target.value)}
                      placeholder="0"
                      min="0"
                      className={inputCls('pl-8')}
                    />
                  </div>
                </div>
                <div>
                  <Label>Comparable Market Value <span className="text-secondary normal-case font-medium">(optional)</span></Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold">$</span>
                    <input
                      type="number"
                      value={form.comparableMarketValue}
                      onChange={e => set('comparableMarketValue', e.target.value)}
                      placeholder="0"
                      min="0"
                      className={inputCls('pl-8')}
                    />
                  </div>
                  <p className="text-xs text-secondary mt-1">Estimated market value based on comparable sales in the area.</p>
                </div>
              </div>
              <CheckboxCard
                checked={form.priceNegotiable}
                onChange={v => set('priceNegotiable', v)}
              >
                Price is negotiable
              </CheckboxCard>
              <div>
                <Label required>Preferred Close Date</Label>
                <input
                  type="date"
                  value={form.preferredCloseDate}
                  onChange={e => set('preferredCloseDate', e.target.value)}
                  min={today}
                  className={inputCls()}
                />
              </div>
            </div>

            {!isExclusive && <UpgradeBanner />}
          </section>
        )}

        {/* ── STEP 3: Photos & Documents ─────────────────────────────────── */}
        {step === 3 && (
          <section className="space-y-6">
            <div>
              <h2 className="font-headline text-2xl font-extrabold text-primary mb-1">Photos &amp; Documents</h2>
              <p className="text-secondary text-sm">Upload property photos and your contract or title document.</p>
            </div>

            {/* Photo upload */}
            <div>
              <Label required>Property Photos</Label>
              <div
                onDragOver={e => { e.preventDefault(); setPhotoDragOver(true); }}
                onDragLeave={() => setPhotoDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setPhotoDragOver(false);
                  if (e.dataTransfer.files.length) uploadPhotos(e.dataTransfer.files);
                }}
                onClick={() => photoInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  photoDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container-low'
                }`}
              >
                <input
                  ref={photoInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={e => e.target.files && uploadPhotos(e.target.files)}
                />
                {uploadingPhotos ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
                    <p className="text-sm font-semibold text-secondary">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-secondary">add_photo_alternate</span>
                    <p className="text-sm font-bold text-on-surface">Drag &amp; drop or click to upload</p>
                    <p className="text-xs text-secondary">JPG, PNG, WEBP · Multiple files allowed</p>
                  </div>
                )}
              </div>
              {form.photosUrls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.photosUrls.map((url, i) => (
                    <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-outline-variant/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => set('photosUrls', form.photosUrls.filter((_, j) => j !== i))}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contract upload */}
            <div>
              <Label required>Contract or Title Document</Label>
              <div
                onDragOver={e => { e.preventDefault(); setContractDragOver(true); }}
                onDragLeave={() => setContractDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setContractDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) uploadContract(file);
                }}
                onClick={() => contractInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  contractDragOver
                    ? 'border-primary bg-primary/5'
                    : form.contractUrl
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container-low'
                }`}
              >
                <input
                  ref={contractInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,image/jpeg,image/png"
                  className="sr-only"
                  onChange={e => e.target.files?.[0] && uploadContract(e.target.files[0])}
                />
                {uploadingContract ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
                    <p className="text-sm font-semibold text-secondary">Uploading...</p>
                  </div>
                ) : form.contractUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                    <p className="text-sm font-bold text-emerald-700">Document uploaded</p>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); set('contractUrl', ''); }}
                      className="text-xs text-secondary hover:text-on-surface underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-secondary">upload_file</span>
                    <p className="text-sm font-bold text-on-surface">Drag &amp; drop or click to upload</p>
                    <p className="text-xs text-secondary">PDF, DOC, DOCX, JPG, PNG · Max 10MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional info */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Additional Information <span className="text-secondary normal-case font-medium">(optional)</span></Label>
                <button
                  type="button"
                  onClick={() => generateDescription('additionalInformation')}
                  disabled={generatingAdditional || !form.title}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                  {generatingAdditional ? 'Writing...' : 'Write with AI'}
                </button>
              </div>
              <textarea
                value={form.additionalInformation}
                onChange={e => set('additionalInformation', e.target.value)}
                placeholder="Share any additional details, special conditions, or important information about the property..."
                rows={4}
                className={inputCls('resize-none')}
              />
            </div>

            {/* Contact methods */}
            <div>
              <Label required>How should buyers contact you?</Label>
              <MultiCheck
                options={CONTACT_OPTIONS}
                values={form.contactMethods}
                onChange={v => set('contactMethods', v)}
              />
            </div>

            {!isExclusive && <UpgradeBanner />}
          </section>
        )}

        {/* ── STEP 4: Compliance ──────────────────────────────────────────── */}
        {step === 4 && (
          <section className="space-y-6">
            <div>
              <h2 className="font-headline text-2xl font-extrabold text-primary mb-1">Compliance Agreement</h2>
              <p className="text-secondary text-sm">Please review and agree to the following terms before submitting.</p>
            </div>

            <div className="space-y-3">
              <CheckboxCard
                checked={form.legalConfirmation}
                onChange={v => set('legalConfirmation', v)}
              >
                <span className="font-bold text-on-surface">Legal Confirmation *</span>
                <br />
                I confirm I have the legal right to market this property or contract in accordance with state laws.
              </CheckboxCard>

              <CheckboxCard
                checked={form.platformUnderstanding}
                onChange={v => set('platformUnderstanding', v)}
              >
                <span className="font-bold text-on-surface">Platform Understanding *</span>
                <br />
                I agree that LotScout is an advertising platform only and does not broker or negotiate real estate transactions.
              </CheckboxCard>

              <CheckboxCard
                checked={form.stateCompliance}
                onChange={v => set('stateCompliance', v)}
              >
                <span className="font-bold text-on-surface">State Compliance Acknowledgment *</span>
                <br />
                I acknowledge and agree to comply with all applicable state and local laws regarding property marketing and advertising.
              </CheckboxCard>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
              <p className="text-xs font-black text-secondary uppercase tracking-widest">Digital Signature &amp; Date</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Full Legal Name (Digital Signature)</Label>
                  <input
                    type="text"
                    value={form.digitalSignature}
                    onChange={e => set('digitalSignature', e.target.value)}
                    placeholder="Your full legal name"
                    className={inputCls('font-semibold')}
                  />
                </div>
                <div>
                  <Label required>Date</Label>
                  <input
                    type="date"
                    value={form.signatureDate}
                    onChange={e => set('signatureDate', e.target.value)}
                    className={inputCls()}
                  />
                </div>
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                By typing your name above, you are providing your digital signature and agreeing to all
                terms stated in this compliance agreement.
              </p>
            </div>

            {!isExclusive && <UpgradeBanner />}
          </section>
        )}

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <div className="flex gap-3 mt-10 pt-6 border-t border-outline-variant/20">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant/40 text-sm font-bold text-secondary hover:border-primary/30 hover:text-primary transition-all"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Previous
            </button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance}
              className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Next
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!step4Valid || submitting}
              className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Submitting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">send</span>
                  Submit for Review
                </>
              )}
            </button>
          )}
        </div>

      </main>
    </div>
  );
}

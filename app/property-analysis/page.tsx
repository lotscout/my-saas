'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { usePermissions } from '@/hooks/usePermissions';
import { createClient } from '@/lib/supabase/client';

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming',
];

interface AnalysisRequest {
  id: string;
  user_id?: string;
  input_type: string;
  street_address: string | null;
  city: string | null;
  county: string;
  state: string;
  zip_code: string | null;
  apn: string | null;
  status: string;
  report_url: string | null;
  submitted_at: string;
  completed_at: string | null;
}

type AddrValidStatus = 'idle' | 'validating' | 'valid';

const inputClass = 'w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-3.5 py-2 text-on-surface placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] transition-colors text-sm leading-tight';
const selectClass = `${inputClass} cursor-pointer`;
const labelClass = 'block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1 whitespace-nowrap';

export default function PropertyAnalysisPage() {
  const { tier, loading, isAdmin } = usePermissions();
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const [inputMode, setInputMode] = useState<'address' | 'apn'>('address');

  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [apn, setApn] = useState('');
  const [apnCounty, setApnCounty] = useState('');
  const [apnState, setApnState] = useState('');

  const [addrValidStatus, setAddrValidStatus] = useState<AddrValidStatus>('idle');
  const [addrValidMsg, setAddrValidMsg] = useState('');
  const [resolvedCounty, setResolvedCounty] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deliveryPopup, setDeliveryPopup] = useState<{ turnaround: string; property: string } | null>(null);

  const [requests, setRequests] = useState<AnalysisRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [buyingReport, setBuyingReport] = useState(false);
  const [pendingPaidSession, setPendingPaidSession] = useState<string | null>(null);

  const isFree = !loading && !tier;
  const isPaid = !loading && !!tier;
  const showInputGate = isFree && inputFocused && !overlayDismissed;
  const showSpeedBanner = !loading && (tier === 'standard' || tier === 'priority');

  const MONTHLY_LIMITS: Record<string, number | null> = { standard: 5, priority: 15, exclusive: null };
  const monthlyLimit = tier ? (MONTHLY_LIMITS[tier] ?? null) : null;
  const startOfCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthlyUsed = requests.filter(r => new Date(r.submitted_at) >= startOfCurrentMonth).length;
  const atLimit = !isAdmin && monthlyLimit !== null && monthlyUsed >= monthlyLimit;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paidSession = params.get('paid_session');
    if (!paidSession) return;
    const saved = sessionStorage.getItem('pa_form_data');
    if (saved) {
      try {
        const d = JSON.parse(saved) as Record<string, string>;
        if (d.inputMode === 'address' || d.inputMode === 'apn') setInputMode(d.inputMode as 'address' | 'apn');
        setStreetAddress(d.streetAddress ?? '');
        setCity(d.city ?? '');
        setAddrState(d.addrState ?? '');
        setZipCode(d.zipCode ?? '');
        setApn(d.apn ?? '');
        setApnCounty(d.apnCounty ?? '');
        setApnState(d.apnState ?? '');
        setResolvedCounty(d.resolvedCounty ?? '');
        sessionStorage.removeItem('pa_form_data');
      } catch {}
    }
    setPendingPaidSession(paidSession);
    window.history.replaceState({}, '', '/property-analysis');
  }, []);

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setRequests([]);
      setRequestsLoading(false);
      return;
    }
    const { data } = await supabase
      .from('property_analysis_requests')
      .select('id, user_id, input_type, street_address, city, county, state, zip_code, apn, status, report_url, submitted_at, completed_at')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false });
    setRequests(data ?? []);
    setRequestsLoading(false);
  }, []);

  useEffect(() => {
    if (isPaid) loadRequests();
  }, [isPaid, loadRequests]);

  useEffect(() => {
    if (pendingPaidSession && canSubmit && !submitting) {
      void handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPaidSession]);

  const validateAddress = useCallback(async () => {
    if (!streetAddress.trim() || !city.trim() || !addrState || !zipCode.trim()) return;
    setAddrValidStatus('validating');
    setAddrValidMsg('');
    setResolvedCounty('');
    try {
      const oneLineAddress = `${streetAddress}, ${city}, ${addrState} ${zipCode}`;
      const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(oneLineAddress)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      const matches = data?.result?.addressMatches;
      if (!matches || matches.length === 0) {
        setAddrValidStatus('idle');
        setAddrValidMsg('');
      } else {
        const match = matches[0];
        const county = match?.geographies?.Counties?.[0]?.NAME ?? '';
        setResolvedCounty(county);
        setAddrValidStatus('valid');
        setAddrValidMsg(county ? `Valid address · ${county} County, ${addrState}` : `Valid address · ${addrState}`);
      }
    } catch {
      setAddrValidStatus('idle');
      setAddrValidMsg('');
    }
  }, [streetAddress, city, addrState, zipCode]);

  function handleAddressBlur() {
    if (streetAddress.trim() && city.trim() && addrState && zipCode.trim()) {
      validateAddress();
    }
  }

  function resetAddrValidation() {
    if (addrValidStatus !== 'idle') {
      setAddrValidStatus('idle');
      setAddrValidMsg('');
      setResolvedCounty('');
    }
  }

  const apnValid = apn.trim() !== '' && apnCounty.trim() !== '' && apnState !== '';
  const addrFieldsFilled = streetAddress.trim() !== '' && city.trim() !== '' && addrState !== '' && zipCode.trim() !== '';
  const canSubmit = inputMode === 'address' ? addrFieldsFilled : apnValid;

  async function buyReportWithStripe() {
    setBuyingReport(true);
    sessionStorage.setItem('pa_form_data', JSON.stringify({
      inputMode, streetAddress, city, addrState, zipCode,
      apn, apnCounty, apnState, resolvedCounty,
    }));
    try {
      const res = await fetch('/api/stripe/pay-per-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setBuyingReport(false);
    }
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    if (atLimit && !pendingPaidSession) { setShowLimitModal(true); return; }
    const isDuplicate = inputMode === 'address'
      ? requests.some(r => r.street_address?.toLowerCase().trim() === streetAddress.toLowerCase().trim())
      : requests.some(r => r.apn?.toLowerCase().trim() === apn.toLowerCase().trim());
    if (isDuplicate) { setShowDuplicateModal(true); return; }
    setSubmitting(true);
    setSubmitError('');
    setAddrValidStatus('idle');
    setAddrValidMsg('');
    try {
      const baseBody = inputMode === 'address'
        ? { inputType: 'address', streetAddress, city, county: resolvedCounty, state: addrState, zipCode }
        : { inputType: 'apn', apn, county: apnCounty, state: apnState };
      const body = pendingPaidSession ? { ...baseBody, paidSessionId: pendingPaidSession } : baseBody;
      const res = await fetch('/api/property-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Submission failed');
      }
      const result = await res.json();
      const propertyLabel = inputMode === 'address'
        ? [streetAddress, city, addrState].filter(Boolean).join(', ')
        : `APN ${apn} · ${apnCounty} County, ${apnState}`;
      setDeliveryPopup({ turnaround: result.turnaround ?? '24 hours', property: propertyLabel });
      setStreetAddress(''); setCity(''); setAddrState(''); setZipCode('');
      setApn(''); setApnCounty(''); setApnState('');
      setAddrValidStatus('idle'); setAddrValidMsg(''); setResolvedCounty('');
      setPendingPaidSession(null);
      await loadRequests();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function formatNumericDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  }

  function completionDate(req: AnalysisRequest) {
    return formatNumericDate(req.completed_at || req.submitted_at);
  }

  function requestLabel(req: AnalysisRequest) {
    if (req.input_type === 'address') return req.street_address || '—';
    return req.apn ? `APN ${req.apn}` : 'APN —';
  }

  function statusBadge(status: string) {
    if (status === 'pending') {
      return <span className="text-xs font-bold text-on-surface">Pending</span>;
    }
    const styles: Record<string, string> = {
      in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
      complete: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
    };
    const labels: Record<string, string> = {
      in_progress: 'In Progress',
      complete: 'Complete',
      completed: 'Complete',
      rejected: 'Rejected',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] ?? 'bg-surface-container text-secondary border-outline-variant/30'}`}>
        {labels[status] ?? status}
      </span>
    );
  }

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-fixed selection:text-primary">

      {/* Delivery confirmation popup */}
      {deliveryPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-emerald-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h2 className="font-headline text-2xl font-extrabold text-on-surface mb-2">Request Submitted!</h2>
            <p className="text-secondary text-sm mb-4 leading-relaxed">
              Your analysis request for <span className="font-semibold text-on-surface">{deliveryPopup.property}</span> has been received.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-4 mb-6">
              <p className="text-emerald-800 font-semibold text-sm">
                {deliveryPopup.turnaround === '15 minutes'
                  ? '⚡ Your report will be delivered within 15 minutes'
                  : '⏱ Your report will be delivered within 24 hours'}
              </p>
              <p className="text-emerald-700 text-xs mt-1">We&apos;ll email you when it&apos;s ready.</p>
            </div>
            <button
              onClick={() => setDeliveryPopup(null)}
              className="w-full bg-[#1D9E75] text-white font-bold py-3 rounded-xl hover:bg-[#14795A] transition-opacity"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Duplicate detection modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>content_copy</span>
            </div>
            <h2 className="font-headline text-xl font-extrabold text-on-surface mb-2">Already Submitted</h2>
            <p className="text-secondary text-sm leading-relaxed mb-6">
              You have already submitted an analysis request for this property. View your existing report in the requests history below.
            </p>
            <button
              onClick={() => { setShowDuplicateModal(false); document.getElementById('past-requests')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="w-full bg-[#1D9E75] text-white font-bold py-3 rounded-xl hover:bg-[#14795A] transition-opacity"
            >
              View My Requests
            </button>
          </div>
        </div>
      )}

      {/* Monthly limit modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <button onClick={() => setShowLimitModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <h2 className="font-headline text-xl font-extrabold text-black mb-6">Upgrade account or pay per report.</h2>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <p className="text-sm text-gray-700 mb-3">Upgrade your plan for more monthly reports</p>
                <a
                  href="/pricing"
                  className="inline-block bg-green-700 text-white rounded px-4 py-2 text-sm font-bold hover:bg-green-800 transition-colors"
                >
                  Upgrade Now
                </a>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 mb-3">Or get this single report for $29</p>
                <button
                  onClick={buyReportWithStripe}
                  disabled={buyingReport}
                  className="inline-block border border-green-700 text-green-700 rounded px-4 py-2 text-sm font-bold hover:bg-green-50 transition-colors disabled:opacity-50"
                >
                  {buyingReport ? 'Loading…' : 'Buy This Report'}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
              Reports delivered within 24 hours. Exclusive members receive results in 15 minutes.
            </p>
          </div>
        </div>
      )}

      <Header />

      <main className="max-w-[1440px] mx-auto pt-20 pb-10 px-4 sm:px-8">

        {/* Page heading */}
        <div className="mb-5 text-center">
          <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tighter leading-tight">
            Deal <span className="text-[#1D9E75]">Analysis</span>
          </h1>
        </div>

        {/* Property analysis request */}
        <div className="max-w-6xl mx-auto mb-8">
          {/* LEFT: Unified white card — Submit a Property + How It Works */}
          <div className="bg-white border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">

            <div className="min-w-0">
              {isPaid ? (
                <>
                {/* Form header */}
                <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-outline-variant/15">
                  <h2 className="font-headline text-base sm:text-xl font-extrabold text-primary tracking-tight">Submit a Property</h2>
                </div>

                {/* Mode toggle */}
                <div className="border-b border-outline-variant/20 px-5 sm:px-6 py-2 flex items-center gap-2 sm:gap-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-secondary shrink-0">Search by:</span>
                  <div className="flex bg-surface-container-low rounded-xl p-1 gap-1">
                    <button
                      onClick={() => { setInputMode('address'); resetAddrValidation(); }}
                      className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${inputMode === 'address' ? 'bg-[#1D9E75] text-white shadow-sm' : 'text-secondary hover:text-on-surface'}`}
                    >
                      Address
                    </button>
                    <button
                      onClick={() => setInputMode('apn')}
                      className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${inputMode === 'apn' ? 'bg-[#1D9E75] text-white shadow-sm' : 'text-secondary hover:text-on-surface'}`}
                    >
                      APN / Parcel ID
                    </button>
                  </div>
                </div>

                {/* Form fields */}
                <div className="p-5 sm:p-6 space-y-3">
                  {inputMode === 'address' ? (
                    <>
                      <div>
                        <label className={labelClass}>Street Address</label>
                        <input
                          type="text"
                          className={inputClass}
                          placeholder="123 Main St"
                          value={streetAddress}
                          onChange={e => { setStreetAddress(e.target.value); resetAddrValidation(); }}
                          onBlur={handleAddressBlur}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className={labelClass}>City</label>
                          <input type="text" className={inputClass} placeholder="Austin" value={city} onChange={e => { setCity(e.target.value); resetAddrValidation(); }} onBlur={handleAddressBlur} />
                        </div>
                        <div>
                          <label className={labelClass}>State</label>
                          <select className={selectClass} value={addrState} onChange={e => { setAddrState(e.target.value); resetAddrValidation(); }} onBlur={handleAddressBlur}>
                            <option value="">Select state</option>
                            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Zip Code</label>
                          <input type="text" className={inputClass} placeholder="78701" value={zipCode} onChange={e => { setZipCode(e.target.value); resetAddrValidation(); }} onBlur={handleAddressBlur} />
                        </div>
                      </div>
                      {addrValidStatus === 'validating' && (
                        <div className="flex items-center gap-2 text-secondary text-sm">
                          <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Verifying address...
                        </div>
                      )}
                      {addrValidStatus === 'valid' && (
                        <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          {addrValidMsg}
                        </div>
                      )}
                      {addrValidStatus === 'idle' && streetAddress && city && addrState && zipCode && (
                        <button onClick={validateAddress} className="text-primary text-sm font-semibold hover:underline">
                          Validate address →
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <label className={labelClass}>APN / Parcel ID</label>
                        <input type="text" className={inputClass} placeholder="e.g. 123-456-789" value={apn} onChange={e => setApn(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>County</label>
                          <input type="text" className={inputClass} placeholder="e.g. Bastrop" value={apnCounty} onChange={e => setApnCounty(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>State</label>
                          <select className={selectClass} value={apnState} onChange={e => setApnState(e.target.value)}>
                            <option value="">Select state</option>
                            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      {apnValid && (
                        <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          Ready to submit · {apnCounty} County, {apnState}
                        </div>
                      )}
                    </>
                  )}

                  {submitError && (
                    <div className="flex items-center gap-2 text-red-700 text-sm font-semibold bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                      {submitError}
                    </div>
                  )}

                  {monthlyLimit !== null && (
                    <p className="text-xs text-secondary text-center">
                      {monthlyUsed} of {monthlyLimit} analysis report{monthlyLimit !== 1 ? 's' : ''} used this month
                    </p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className="w-full bg-[#1D9E75] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#14795A] transition-all shadow-lg shadow-[#1D9E75]/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Submitting...
                      </span>
                    ) : 'Submit for Analysis'}
                  </button>
                </div>
                </>
              ) : (
                /* Free user: search bar */
                <div className="p-5 sm:p-8">
                <div className="mb-4">
                  <h2 className="font-headline text-base sm:text-xl font-extrabold text-primary tracking-tight">Submit a Property</h2>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="relative">
                    <div className="bg-surface-container-low p-2 rounded-full border border-outline-variant/30 shadow-sm flex items-center gap-2">
                      <div className="flex-1 flex items-center px-6">
                        <span className="material-symbols-outlined text-primary mr-3">location_on</span>
                        <input
                          className="w-full bg-transparent border-none text-on-surface placeholder-secondary/50 focus:ring-0 text-base py-3 font-body"
                          placeholder="Enter property address or parcel ID..."
                          type="text"
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
                          readOnly
                        />
                      </div>
                      <button
                        type="button"
                        className="bg-[#1D9E75] text-white font-bold px-5 py-2.5 rounded-full transition-all flex items-center gap-2 group shadow-lg hover:bg-[#14795A] active:scale-95 text-sm"
                      >
                        Analyze
                        <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">analytics</span>
                      </button>
                    </div>
                    {showInputGate && (
                      <div className="absolute inset-0 z-10 flex items-center justify-between gap-4 bg-surface-container-low/95 backdrop-blur-sm rounded-full border border-primary/20 px-8 shadow-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                          <p className="text-sm font-semibold text-on-surface leading-tight truncate">
                            Upgrade to run analysis on any property
                          </p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <a href="/pricing" className="bg-[#1D9E75] text-white font-bold text-xs px-5 py-2.5 rounded-full hover:bg-[#14795A] transition-colors whitespace-nowrap">
                            View Plans →
                          </a>
                          <button
                            onMouseDown={(e) => { e.preventDefault(); setOverlayDismissed(true); }}
                            className="text-secondary text-xs hover:text-on-surface transition-colors whitespace-nowrap"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-6 text-secondary text-sm">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">check_circle</span> 150M+ Parcels</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">check_circle</span> Real-time Comps</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">check_circle</span> AI-Risk Scoring</span>
                  </div>
                </div>
                </div>
              )}
            </div>

            {/* How It Works */}
            <div className="p-5 sm:p-6 border-t lg:border-t-0 lg:border-l border-outline-variant/15 bg-surface-container-lowest/60">
              <div className="flex flex-col gap-1 mb-4">
                <div>
                  <h2 className="font-headline text-xl font-extrabold text-primary tracking-tight">How it works</h2>
                  <p className="text-secondary text-xs sm:text-sm leading-relaxed">
                    Quick land analysis built for smarter buy/sell decisions.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: 'input',        step: '01', title: 'Input Property',              body: 'Search by address, parcel ID, or simply drop a pin on our high-resolution topographic map interface.' },
                  { icon: 'auto_awesome', step: '02', title: 'AI-Powered Comparison',       body: 'Our engine instantly scans thousands of recent transactions and environmental data points to calculate true market value.' },
                  { icon: 'description',  step: '03', title: 'Export Comprehensive Report', body: 'Download a detailed PDF report containing zoning insights, risk assessments, and comparable property maps.' },
                ].map(({ icon, step, title, body }) => (
                  <div key={step} className="flex gap-3 bg-surface-container-low p-3 rounded-xl border-l-4 border-primary/20 hover:border-primary/50 hover:bg-surface-container transition-all">
                    <div className="flex-none w-8 h-8 bg-[#1D9E75] text-white rounded-lg flex items-center justify-center shadow-inner">
                      <span className="material-symbols-outlined text-base">{icon}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-secondary uppercase tracking-widest mb-0.5">Step {step}</p>
                      <h3 className="font-headline text-sm font-bold text-primary mb-0.5">{title}</h3>
                      <p className="hidden xl:block text-secondary leading-relaxed text-xs">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>



          <div className="mt-4 text-center">
            <a
              href="/property-analysis/sample"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-white px-5 py-2.5 text-sm font-extrabold text-[#1D9E75] shadow-sm hover:border-primary/40 hover:bg-emerald-50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">description</span>
              View property analysis report sample
            </a>
          </div>

          {showSpeedBanner && (
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4 bg-white border border-outline-variant/20 rounded-2xl px-6 py-4 shadow-sm">
              <span className="material-symbols-outlined text-primary text-2xl shrink-0">bolt</span>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-bold text-primary text-sm">Want faster results?</p>
                <p className="text-secondary text-xs mt-0.5">Standard and Priority plans deliver within 24 hours. Exclusive delivers within 15 minutes.</p>
              </div>
              <a href="/pricing" className="shrink-0 bg-[#1D9E75] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#14795A] transition-opacity whitespace-nowrap">
                Upgrade →
              </a>
            </div>
          )}
        </div>

        {/* ── PAST REQUESTS — full width below both columns ── */}
        <div id="past-requests">
          {isPaid ? (
            <>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-headline text-2xl font-extrabold text-primary tracking-tight">Your Past Requests</h2>
                <button onClick={loadRequests} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">refresh</span> Refresh
                </button>
              </div>

              {requestsLoading ? (
                <div className="text-secondary text-sm">Loading requests...</div>
              ) : requests.length === 0 ? (
                <div className="bg-surface-container-low border border-dashed border-outline-variant/40 rounded-2xl p-10 text-center">
                  <span className="material-symbols-outlined text-secondary/40 text-4xl mb-3 block">analytics</span>
                  <p className="text-secondary text-sm">No requests yet. Submit a property above to get started.</p>
                </div>
              ) : (
                <div className="bg-white border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden divide-y divide-outline-variant/10">
                  {requests.map(req => (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="min-w-0 text-sm font-bold text-on-surface truncate whitespace-nowrap">{requestLabel(req)}</p>
                          {statusBadge(req.status)}
                        </div>
                        <p className="mt-1 text-xs font-semibold text-secondary whitespace-nowrap">
                          {req.report_url ? 'Report ready' : 'Submitted'} · {completionDate(req)}
                        </p>
                      </div>
                      {req.report_url ? (
                        <a
                          href={req.report_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1D9E75] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#14795A] transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                          View PDF
                        </a>
                      ) : (
                        <span className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-container-low px-4 py-2 text-xs font-bold text-secondary border border-outline-variant/20">
                          <span className="material-symbols-outlined text-base">schedule</span>
                          Awaiting PDF
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[240px]">
              <span className="material-symbols-outlined text-primary text-4xl mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <h3 className="font-headline text-2xl font-bold text-primary mb-2">Unlock Property Analysis</h3>
              <p className="text-secondary text-sm leading-relaxed mb-6 max-w-sm">Get detailed AI-powered reports including comparable sales, zoning insights, and risk scoring for any parcel in the US.</p>
              <a href="/pricing" className="inline-flex items-center gap-2 bg-[#1D9E75] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#14795A] transition-opacity shadow-lg shadow-[#1D9E75]/20">
                View Plans <span className="material-symbols-outlined">arrow_forward</span>
              </a>
            </div>
          )}
        </div>

      </main>

      <footer className="bg-[#1D9E75] text-white w-full py-12 mt-16">
        <div className="max-w-screen-2xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-lg font-bold text-white font-headline">LotScout</span>
            <p className="font-body text-xs tracking-wide uppercase text-white/60">© 2026 LotScout. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-4 justify-start md:justify-end">
            <a className="text-white/60 hover:text-white transition-opacity text-xs uppercase tracking-wide font-body" href="/terms">Terms of Service</a>
            <a className="text-white/60 hover:text-white transition-opacity text-xs uppercase tracking-wide font-body" href="/privacy">Privacy Policy</a>
            <a className="text-white/60 hover:text-white transition-opacity text-xs uppercase tracking-wide font-body" href="/data-sources">Data Sources</a>
            <a className="text-white/60 hover:text-white transition-opacity text-xs uppercase tracking-wide font-body" href="mailto:support@lotscout.com">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

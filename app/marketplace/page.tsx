'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import LockedFeature from '@/components/LockedFeature';
import ListingLimitBanner from '@/components/ListingLimitBanner';
import UpgradeModal from '@/components/UpgradeModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const LISTINGS = [
  {
    id: 1,
    title: 'Elderwood Peak Estates',
    location: 'Aspen Ridge, CO',
    acreage: '420.5 Acres',
    price: '$4.25M',
    promoted: true,
    badge: { label: 'Residential-A1', position: 'top-right' },
    tags: ['R-1 Agricultural', 'Well, Solar-Ready'],
    seller: { name: 'Hargrove Land Co.', email: 'deals@hargrove.com', phone: '+1 (970) 555-0142' },
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxJzpl7PtPZ3P9-BbZWEnnurDCh6iCuzDzxd8ZqqT8JD-uoS6-tQYgI_5g7BnCOd1fs3CLCNTBes6QTw5XNx3DYg00cXSRnCDOV-ZtJM9W4SpVL9aDpq3c-K3x7DHVcOaQzcGxY23ECyKHXOCa9XhyhCMPPI_X5zQB49vCbRWK9mw81BYCTcpT41Tixw8YTyPaCHGElLbCoI2F7Ibp7h4rhUYZ6t3kCUX6-hXPN0VSjjTo3gKOFBoTlscbAUd9I2zokdmW_oU__CKd',
    imgAlt: 'Aerial mountain vista',
  },
  {
    id: 2,
    title: 'Sutter Basin Flats',
    location: 'Sacramento Valley, CA',
    acreage: '64 Acres',
    price: '$890k',
    promoted: false,
    badge: { label: 'Utility Ready', position: 'bottom-left' },
    tags: ['Prime Soil', 'Water Rights'],
    seller: { name: 'Basin Properties LLC', email: 'info@basinprops.com', phone: '+1 (916) 555-0278' },
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4r8Hu0cQUcXuWX0WzV_2H0XqwnqPBMB2Fca9iPIFQXepEoRpS7nvtdqueP7eKmXCCpLpVbOoMXZAw0y3EUYLrYQgzam2dLiwITqadNzN_VqADUyY5_rZZ0nrwHcQbWCNUvqozu5VPXXJNMSu8bQxKsOkaWrpOetGX4J5YePqJyv013HCe5gyz6sakET7TkLMvrdeX5S4KHoiMziudlXEMOWm3WOKmrg1cYfTmrwfG2a1YP7q8n8g9nQDOWoR2j6yETU4PFUd46Ylq',
    imgAlt: 'Verdant plains',
  },
  {
    id: 3,
    title: 'Crystal Lake Ridge',
    location: 'Boundary Waters, MN',
    acreage: '12 Acres',
    price: '$1.2M',
    promoted: false,
    badge: null,
    tags: ['Lakefront', 'Dense Timber'],
    seller: { name: 'Northwoods Realty', email: 'listings@northwoodsrealty.com', phone: '+1 (218) 555-0391' },
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJgD76eTifmmVKsF6SKPMw5sl_2i-NBS2SYmw1MVN0Ek0JNspDy1hmu6WwFi8BiXHSoUOnbdytJbBTi0ya5yYZqKnvCL27J0iSnXUF8qfFBhhVmTnlDLP51Ku3X96FjFoIJEqp82xY17mK3iUAwH2LXk81xF0UeDp8DxsuxCfj3oteXz-N4RWMsBlIVJpW9--ORcBEbgHDAxRpbizysUp_31kt2qNwAw7MDa_i3YxraxgJg_rEPvjFB213dKRX7dVCWWZloPV2zZN4',
    imgAlt: 'Alpine lake',
  },
  {
    id: 4,
    title: 'Red Rock Plateau',
    location: 'Sedona Outskirts, AZ',
    acreage: '120 Acres',
    price: '$340k',
    promoted: false,
    badge: null,
    tags: ['Zoned Commercial'],
    seller: { name: 'Desert Land Group', email: 'contact@desertland.com', phone: '+1 (928) 555-0456' },
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyf9G08S4V2FIgyV6ti9nSFXGqTOVLsmyHIQnc3htRd4FnzJmkfw70GUKVvqpYTKRed0tJGRZTCxscIC_rkhYQ8l5yxEWkB102mkOdmtcWGnuE9wFMgg13nv295YGLVkBmy6dQU6fWAiD0IoW_rqPWn3DsAzUoSa95_yff57-MtbAzpPEkFrTj-cuYDfKp0H5ivVubg-U5S-O-KVkdO4bsAy3jVR7b6mZdwUlpA4Wy4u7_D8aJn0ZBdwNMuRofdiRpMou6scDkdPQa',
    imgAlt: 'Desert mesa',
  },
  {
    id: 5,
    title: 'Old Growth Sanctuary',
    location: 'Olympic Peninsula, WA',
    acreage: '215 Acres',
    price: '$2.8M',
    promoted: false,
    badge: null,
    tags: ['Conservation Easement'],
    seller: { name: 'Pacific Timberland Trust', email: 'info@pttrust.org', phone: '+1 (360) 555-0512' },
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDD-JzenLAuzwTyCM7r1lUolp3DE8j14_kDPQUYsrUPhcEihB-rfJUzfxvEavG__Ewz8h2zZlExQPGau_aYWRABPj_AvykNIraOyfsnuO2pYdvvd3azQ2I1RkjyxKsfeMdUlkHqB62r_8IwqxiVIc904u82VsxkrNMO7givq8WAaGULWDIGDsNEjlHvaQS8Clev7pxsv-9yRMgffR6A9d5mzxx6EXhPoDiHH9upjQVbaVWpQPoUkHpfWk4b437Jr1UPSANF7oeRayxn',
    imgAlt: 'Foggy forest',
  },
];

function SellerContact({ seller }: { seller: typeof LISTINGS[0]['seller'] }) {
  return (
    <div className="pt-3 mt-3 border-t border-surface-container">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Listed By</p>
      <p className="text-sm font-bold text-primary mb-1">{seller.name}</p>
      <div className="space-y-0.5">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">mail</span>{seller.email}
        </p>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">phone</span>{seller.phone}
        </p>
      </div>
    </div>
  );
}

function formatBudget(min: number | null, max: number | null): string {
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return 'Flexible';
}

interface BuyerRequestForm {
  target_regions: string;
  budget_min: string;
  budget_max: string;
  min_acreage: string;
  max_acreage: string;
  use_case: string;
  zoning_preference: string[];
  timeline: string;
  additional_notes: string;
  contact_preference: string[];
}

const USE_CASES = ['Residential', 'Agricultural', 'Commercial', 'Industrial', 'Conservation', 'Recreation', 'Mixed Use'];
const ZONING_OPTIONS = ['R-1 Residential', 'Agricultural', 'Commercial', 'Industrial', 'Rural', 'Mixed Use', 'Conservation', 'Any'];
const TIMELINE_OPTIONS = ['ASAP', 'Within 30 days', '1–3 months', '3–6 months', '6–12 months', 'Just browsing'];
const CONTACT_OPTIONS = ['Email', 'Phone', 'Platform Message'];

const EMPTY_FORM: BuyerRequestForm = {
  target_regions: '',
  budget_min: '',
  budget_max: '',
  min_acreage: '',
  max_acreage: '',
  use_case: '',
  zoning_preference: [],
  timeline: '',
  additional_notes: '',
  contact_preference: [],
};

interface BuyerRequest {
  id: string;
  user_id: string;
  status: string;
  target_regions: string[];
  budget_min: number | null;
  budget_max: number | null;
  min_acreage: number | null;
  max_acreage: number | null;
  use_case: string;
  zoning_preference: string[];
  timeline: string;
  additional_notes: string | null;
  contact_preference: string[];
  created_at: string;
  profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
}

export default function MarketplacePage() {
  const { tier, profile, loading, listingsThisPeriod, listingStatus } = usePermissions();
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showFreeModal, setShowFreeModal] = useState(false);
  const [showBuyerFreeModal, setShowBuyerFreeModal] = useState(false);
  const [showContactUpgradeModal, setShowContactUpgradeModal] = useState(false);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [buyerForm, setBuyerForm] = useState<BuyerRequestForm>(EMPTY_FORM);
  const [buyerFormStep, setBuyerFormStep] = useState(1);
  const [buyerFormSubmitting, setBuyerFormSubmitting] = useState(false);
  const [buyerFormSuccess, setBuyerFormSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'properties' | 'buyer-requests'>('properties');
  const [buyerRequests, setBuyerRequests] = useState<BuyerRequest[]>([]);
  const [buyerRequestsLoading, setBuyerRequestsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const canViewContact = !loading && (tier === 'priority' || tier === 'exclusive');
  const isFreeUser = !loading && !tier;
  const isPaidUser = !loading && !!tier;

  useEffect(() => {
    if (activeTab !== 'buyer-requests') return;
    setBuyerRequestsLoading(true);
    const supabase = createClient();
    supabase
      .from('buyer_requests')
      .select('*, profiles(first_name, last_name, avatar_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBuyerRequests((data as BuyerRequest[]) ?? []);
        setBuyerRequestsLoading(false);
      });
  }, [activeTab]);

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return LISTINGS;
    const q = searchQuery.toLowerCase();
    return LISTINGS.filter(l =>
      l.location.toLowerCase().includes(q) || l.title.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  function handleCreateListing() {
    if (loading) return;
    if (!profile || !tier) { setShowFreeModal(true); return; }
    if (listingStatus === 'blocked') { setShowBlockedModal(true); }
    else { router.push('/create-listing'); }
  }

  function openBuyerForm() {
    setBuyerForm(EMPTY_FORM);
    setBuyerFormStep(1);
    setBuyerFormSuccess(false);
    setShowBuyerForm(true);
  }

  function closeBuyerForm() {
    setShowBuyerForm(false);
    setBuyerFormSuccess(false);
  }

  function toggleMulti(field: 'zoning_preference' | 'contact_preference', value: string) {
    setBuyerForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  }

  async function submitBuyerRequest() {
    setBuyerFormSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/sign-in'); return; }
      const regions = buyerForm.target_regions.split(',').map(s => s.trim()).filter(Boolean);
      await supabase.from('buyer_requests').insert({
        user_id: user.id,
        status: 'active',
        target_regions: regions,
        budget_min: buyerForm.budget_min ? Number(buyerForm.budget_min) : null,
        budget_max: buyerForm.budget_max ? Number(buyerForm.budget_max) : null,
        min_acreage: buyerForm.min_acreage ? Number(buyerForm.min_acreage) : null,
        max_acreage: buyerForm.max_acreage ? Number(buyerForm.max_acreage) : null,
        use_case: buyerForm.use_case,
        zoning_preference: buyerForm.zoning_preference,
        timeline: buyerForm.timeline,
        additional_notes: buyerForm.additional_notes || null,
        contact_preference: buyerForm.contact_preference,
      });
      setBuyerFormSuccess(true);
      const { data } = await supabase
        .from('buyer_requests')
        .select('*, profiles(first_name, last_name, avatar_url)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setBuyerRequests((data as BuyerRequest[]) ?? []);
    } catch {
      // silent — user can retry
    } finally {
      setBuyerFormSubmitting(false);
    }
  }

  function handlePostBuyerRequest() {
    if (loading) return;
    if (!profile || !tier) { setShowBuyerFreeModal(true); return; }
    openBuyerForm();
  }

  return (
    <div className="bg-surface text-on-surface">
      <Header />

      {showBlockedModal && (
        <UpgradeModal featureName="Unlimited Listings" requiredTier="priority" onDismiss={() => setShowBlockedModal(false)} />
      )}

      {showFreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFreeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowFreeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-xl">close</span></button>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Create a Listing</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">Listing your property requires a paid LotScout account. Choose a plan to get started.</p>
            <div className="flex gap-3">
              <a href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors">View Plans →</a>
              <button onClick={() => setShowFreeModal(false)} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      {showBuyerFreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBuyerFreeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowBuyerFreeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-xl">close</span></button>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Post Buying Criteria</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">Posting buyer requests requires a paid LotScout account. Choose a plan to get started.</p>
            <div className="flex gap-3">
              <a href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors">View Plans →</a>
              <button onClick={() => setShowBuyerFreeModal(false)} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      {showBuyerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeBuyerForm} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 z-10 max-h-[90vh] overflow-y-auto">
            <button onClick={closeBuyerForm} className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            {buyerFormSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <span className="material-symbols-outlined text-emerald-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h2 className="font-headline text-2xl font-bold text-primary mb-2">Criteria Posted!</h2>
                <p className="text-secondary text-sm mb-6">Your buying criteria is now live. Sellers with matching properties will reach out.</p>
                <button onClick={closeBuyerForm} className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">View All Requests</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-6">
                  {[1, 2, 3].map(s => (
                    <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= buyerFormStep ? 'bg-primary' : 'bg-surface-container-high'}`} />
                  ))}
                </div>
                {buyerFormStep === 1 && (
                  <>
                    <h2 className="font-headline text-xl font-bold text-primary mb-1">Where are you looking?</h2>
                    <p className="text-secondary text-sm mb-6">Step 1 of 3 — Location &amp; Budget</p>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Target Regions</label>
                        <input type="text" value={buyerForm.target_regions} onChange={e => setBuyerForm(p => ({ ...p, target_regions: e.target.value }))} placeholder="e.g. Denver, CO · Texas Hill Country · PNW" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        <p className="text-xs text-secondary mt-1">Separate multiple regions with commas</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Budget Min</label>
                          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">$</span><input type="number" value={buyerForm.budget_min} onChange={e => setBuyerForm(p => ({ ...p, budget_min: e.target.value }))} placeholder="500000" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Budget Max</label>
                          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">$</span><input type="number" value={buyerForm.budget_max} onChange={e => setBuyerForm(p => ({ ...p, budget_max: e.target.value }))} placeholder="2000000" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Min Acreage</label>
                          <input type="number" value={buyerForm.min_acreage} onChange={e => setBuyerForm(p => ({ ...p, min_acreage: e.target.value }))} placeholder="10" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Max Acreage</label>
                          <input type="number" value={buyerForm.max_acreage} onChange={e => setBuyerForm(p => ({ ...p, max_acreage: e.target.value }))} placeholder="500" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-8">
                      <button onClick={() => setBuyerFormStep(2)} disabled={!buyerForm.target_regions.trim()} className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
                    </div>
                  </>
                )}
                {buyerFormStep === 2 && (
                  <>
                    <h2 className="font-headline text-xl font-bold text-primary mb-1">What are you buying for?</h2>
                    <p className="text-secondary text-sm mb-6">Step 2 of 3 — Use Case &amp; Zoning</p>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-3">Use Case</label>
                        <div className="flex flex-wrap gap-2">{USE_CASES.map(uc => (<button key={uc} onClick={() => setBuyerForm(p => ({ ...p, use_case: uc }))} className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${buyerForm.use_case === uc ? 'bg-primary text-white border-primary' : 'border-outline-variant/30 text-secondary hover:border-primary/30 hover:text-primary'}`}>{uc}</button>))}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-3">Zoning Preference <span className="normal-case font-normal">(select all that apply)</span></label>
                        <div className="flex flex-wrap gap-2">{ZONING_OPTIONS.map(z => (<button key={z} onClick={() => toggleMulti('zoning_preference', z)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${buyerForm.zoning_preference.includes(z) ? 'bg-primary text-white border-primary' : 'border-outline-variant/30 text-secondary hover:border-primary/30 hover:text-primary'}`}>{z}</button>))}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-3">Timeline</label>
                        <div className="flex flex-wrap gap-2">{TIMELINE_OPTIONS.map(t => (<button key={t} onClick={() => setBuyerForm(p => ({ ...p, timeline: t }))} className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${buyerForm.timeline === t ? 'bg-primary text-white border-primary' : 'border-outline-variant/30 text-secondary hover:border-primary/30 hover:text-primary'}`}>{t}</button>))}</div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-8">
                      <button onClick={() => setBuyerFormStep(1)} className="px-6 py-3 rounded-xl border border-outline-variant/30 text-secondary font-bold text-sm hover:bg-surface-container-low transition-colors">← Back</button>
                      <button onClick={() => setBuyerFormStep(3)} disabled={!buyerForm.use_case || !buyerForm.timeline} className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
                    </div>
                  </>
                )}
                {buyerFormStep === 3 && (
                  <>
                    <h2 className="font-headline text-xl font-bold text-primary mb-1">Final details</h2>
                    <p className="text-secondary text-sm mb-6">Step 3 of 3 — Notes &amp; Contact</p>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Additional Notes <span className="normal-case font-normal">(optional)</span></label>
                        <textarea rows={4} value={buyerForm.additional_notes} onChange={e => setBuyerForm(p => ({ ...p, additional_notes: e.target.value }))} placeholder="Any specific requirements, deal-breakers, or preferences..." className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-3">Preferred Contact Method</label>
                        <div className="flex flex-wrap gap-2">{CONTACT_OPTIONS.map(c => (<button key={c} onClick={() => toggleMulti('contact_preference', c)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${buyerForm.contact_preference.includes(c) ? 'bg-primary text-white border-primary' : 'border-outline-variant/30 text-secondary hover:border-primary/30 hover:text-primary'}`}>{c}</button>))}</div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-8">
                      <button onClick={() => setBuyerFormStep(2)} className="px-6 py-3 rounded-xl border border-outline-variant/30 text-secondary font-bold text-sm hover:bg-surface-container-low transition-colors">← Back</button>
                      <button onClick={submitBuyerRequest} disabled={buyerFormSubmitting} className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                        {buyerFormSubmitting ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Posting...</>) : 'Post Criteria'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showContactUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowContactUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowContactUpgradeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-xl">close</span></button>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Upgrade to Contact Sellers</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">Contacting sellers and making offers requires a paid LotScout account. Upgrade to get direct access to every deal.</p>
            <div className="flex gap-3">
              <a href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors">View Plans →</a>
              <button onClick={() => setShowContactUpgradeModal(false)} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-24 px-10 pb-20 min-h-screen max-w-[1400px] mx-auto">
        {/* Header */}
        <section className="mb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-2xl">
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight mb-4">
              Scout Your <span className="text-emerald-600">Next Deal</span>
            </h1>
            <p className="text-slate-500 font-body text-lg leading-relaxed">
              Advanced land acquisition powered by cartographic precision. Browse 2,400+ off-market listings throughout the U.S
            </p>
          </div>
          <div className="flex gap-2 bg-surface-container p-1 rounded-xl">
            <button className="px-6 py-2 bg-surface-container-lowest shadow-sm rounded-lg text-sm font-bold text-primary">Grid</button>
            <button className="px-6 py-2 text-slate-500 text-sm font-medium hover:text-primary transition-colors">Map View</button>
          </div>
        </section>

        {/* Tab toggle */}
        <div className="mb-8 flex items-center gap-1 bg-surface-container-low p-1 rounded-full w-fit">
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === 'properties'
                ? 'bg-primary text-white shadow-sm'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => setActiveTab('buyer-requests')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === 'buyer-requests'
                ? 'bg-primary text-white shadow-sm'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Buyer Requests
          </button>
        </div>

        {/* ── PROPERTIES TAB ── */}
        {activeTab === 'properties' && (
          <>
            {!loading && tier === 'standard' && listingsThisPeriod >= 2 && (
              <div className="mb-6">
                <ListingLimitBanner listingsUsed={listingsThisPeriod} tier="standard" />
              </div>
            )}

            {/* Search bar */}
            <div className="mb-6">
              <div className="relative max-w-xl">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl pointer-events-none">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by zip code, city, county, or state..."
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-11 pr-4 py-3 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-8 mb-12">
              <div className="col-span-12 flex flex-wrap items-center gap-4 py-6 border-y border-outline-variant/20">
                {['Acreage Range', 'Zoning Type', 'Utilities Access'].map(filter => (
                  <div key={filter} className="group relative">
                    <button className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-lg border border-transparent hover:border-primary/20 transition-all text-sm font-semibold text-primary">
                      {filter}
                      <span className="material-symbols-outlined text-sm">expand_more</span>
                    </button>
                  </div>
                ))}
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort By:</span>
                  <select className="bg-transparent border-none text-sm font-bold text-primary focus:ring-0 cursor-pointer">
                    <option>Newest First</option>
                    <option>Price: High to Low</option>
                    <option>Acreage: Largest</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredListings.length === 0 ? (
              <div className="text-center py-20 text-secondary">
                <span className="material-symbols-outlined text-5xl mb-4 block">search_off</span>
                <p className="font-headline text-xl font-bold text-primary mb-2">No listings found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredListings.map(listing => (
                  <div key={listing.id} className="flex flex-col group">
                    <div className="relative overflow-hidden rounded-2xl bg-surface-container-low aspect-video mb-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt={listing.imgAlt} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" src={listing.img} />
                      {listing.promoted && (
                        <div className="absolute top-4 left-4">
                          <span className="bg-amber-400 text-amber-950 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">workspace_premium</span>Promoted
                          </span>
                        </div>
                      )}
                      {listing.badge?.position === 'top-right' && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">{listing.badge.label}</span>
                        </div>
                      )}
                      {listing.badge?.position === 'bottom-left' && (
                        <div className="absolute bottom-4 left-4">
                          <span className="bg-primary/90 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">{listing.badge.label}</span>
                        </div>
                      )}
                      {!listing.promoted && !listing.badge && (
                        <div className="absolute top-4 right-4">
                          <button className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm text-primary hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-lg">favorite</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="px-2 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl font-black text-primary">{listing.title}</h3>
                        <span className="text-3xl font-black text-primary">{listing.price}</span>
                      </div>
                      <p className="text-slate-500 text-sm mb-4">{listing.location} • {listing.acreage}</p>
                      <div className="flex flex-wrap gap-2 mb-auto">
                        {listing.tags.map(tag => (
                          <span key={tag} className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{tag}</span>
                        ))}
                      </div>
                      {canViewContact ? (
                        <SellerContact seller={listing.seller} />
                      ) : isFreeUser ? (
                        <div className="pt-3 mt-3 border-t border-surface-container">
                          <button
                            onClick={() => setShowContactUpgradeModal(true)}
                            className="w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">lock</span>
                            Upgrade to Contact Seller
                          </button>
                        </div>
                      ) : (
                        <LockedFeature requiredTier="priority" message="Upgrade to Priority to contact this seller" className="rounded-xl mt-3">
                          <SellerContact seller={listing.seller} />
                        </LockedFeature>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── BUYER REQUESTS TAB ── */}
        {activeTab === 'buyer-requests' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-slate-500 text-sm">Active buyers looking for land that matches your listings</p>
              </div>
              <button
                onClick={handlePostBuyerRequest}
                className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/10"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Post Buying Criteria
              </button>
            </div>

            {buyerRequestsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-surface-container-low rounded-2xl p-6 animate-pulse space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-container-high" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 bg-surface-container-high rounded w-24" />
                        <div className="h-2 bg-surface-container-high rounded w-16" />
                      </div>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded w-full" />
                    <div className="h-2 bg-surface-container-high rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : buyerRequests.length === 0 ? (
              <div className="text-center py-24 text-secondary">
                <span className="material-symbols-outlined text-6xl mb-4 block text-primary/20">person_search</span>
                <p className="font-headline text-2xl font-bold text-primary mb-2">No buyer requests yet</p>
                <p className="text-sm mb-6">Be the first to post your buying criteria and connect with sellers</p>
                <button onClick={handlePostBuyerRequest} className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
                  Post Buying Criteria
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buyerRequests.map(req => {
                  const firstName = req.profiles?.first_name ?? '';
                  const lastName = req.profiles?.last_name ?? '';
                  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Anonymous Buyer';
                  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || 'AB';
                  const blurIdentity = !canViewContact;

                  return (
                    <div key={req.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                      {/* Header: avatar + name + badge */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${blurIdentity ? 'blur-sm' : ''}`}>
                            {req.profiles?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={req.profiles.avatar_url} alt="Buyer" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-bold text-sm">{initials}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className={`font-bold text-primary text-sm ${blurIdentity ? 'blur-sm select-none' : ''}`}>{displayName}</p>
                            <p className="text-[10px] text-secondary uppercase tracking-widest font-bold">Verified Buyer</p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Active Buying
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-2.5 text-sm">
                        {req.target_regions?.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-secondary text-base mt-0.5">location_on</span>
                            <span className="text-on-surface-variant">{req.target_regions.join(', ')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-base">payments</span>
                          <span className="text-on-surface-variant">{formatBudget(req.budget_min, req.budget_max)}</span>
                        </div>
                        {req.min_acreage && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-base">landscape</span>
                            <span className="text-on-surface-variant">
                              {req.min_acreage}{req.max_acreage ? ` – ${req.max_acreage}` : '+'} acres
                            </span>
                          </div>
                        )}
                        {req.use_case && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-base">agriculture</span>
                            <span className="bg-primary/8 text-primary px-2 py-0.5 rounded-full text-xs font-bold capitalize">{req.use_case}</span>
                          </div>
                        )}
                        {req.timeline && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-base">schedule</span>
                            <span className="text-on-surface-variant text-xs">{req.timeline}</span>
                          </div>
                        )}
                      </div>

                      {/* Contact button */}
                      <div className="pt-2 mt-auto border-t border-outline-variant/20">
                        {canViewContact ? (
                          <button className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
                            <span className="material-symbols-outlined text-base">mail</span>
                            Contact Buyer
                          </button>
                        ) : isFreeUser ? (
                          <button
                            onClick={() => setShowContactUpgradeModal(true)}
                            className="w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">lock</span>
                            Upgrade to Contact Buyer
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push('/pricing')}
                            className="w-full flex items-center justify-center gap-2 bg-surface-container-high text-secondary py-2.5 rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">lock</span>
                            Upgrade to Contact
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="w-full py-16 px-8 bg-primary dark:bg-black grid grid-cols-1 md:grid-cols-2 items-center gap-8 z-10 relative">
        <div className="space-y-6">
          <div className="text-emerald-50 font-black text-2xl tracking-tighter flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="LotScout Logo" className="h-10 w-10 object-contain invert brightness-0" src="/logo.png" />
            LotScout
          </div>
          <p className="font-['Inter'] text-xs tracking-wide uppercase text-emerald-200/60 max-w-sm leading-relaxed">
            Advanced Geospatial Land Management Systems. Precision in every boundary. Engineered for the modern acquisition professional.
          </p>
          <div className="text-emerald-200/40 font-['Inter'] text-[10px] uppercase tracking-widest">© 2024 LotScout. All rights reserved.</div>
        </div>
        <div className="flex flex-wrap md:justify-end gap-x-10 gap-y-4 font-['Inter'] text-xs tracking-widest uppercase font-bold">
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Terms of Service</a>
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Privacy Policy</a>
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Data Sources</a>
          <a className="text-emerald-200/60 hover:text-white transition-colors" href="#">Contact Support</a>
        </div>
      </footer>

      {/* FAB */}
      <div className="fixed bottom-10 right-10 z-[60]">
        <button
          onClick={activeTab === 'properties' ? handleCreateListing : handlePostBuyerRequest}
          className="bg-primary text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform ring-4 ring-white/10"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        </button>
      </div>
    </div>
  );
}

// -- Run this in Supabase SQL editor before testing:
// -- create table buyer_requests (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, state text, county text, zip_code text, city text, location_notes text, zoning text[], area_unit text default 'acres', min_acreage numeric, max_acreage numeric, road_access text[], utilities text[], min_budget numeric, max_budget numeric, price_per_acre numeric, financing text[], primary_use_case text, use_case_description text, specific_requirements text, target_close_date date, timeline_urgency text, working_with_agent boolean default false, contact_methods text[], additional_notes text, created_at timestamptz default now());
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_state text;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_county text;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_city text;
// -- ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS target_zip text;

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { containsProfanity } from '@/lib/profanity-filter'
import Header from '@/components/Header'
import { PageHeader, SurfaceCard } from '@/components/ui/LotScoutUI'

type Profile = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  tier: string | null
}

const ZONING_OPTIONS = [
  'Agricultural (A-1)',
  'Residential (R-1)',
  'Commercial / Industrial',
  'Unrestricted / No Zoning',
]

const ROAD_ACCESS_OPTIONS = ['Paved Road', 'Gravel Road', 'Dirt Road', 'Private Road', 'Easement', 'No Road Access']
const UTILITIES_OPTIONS = ['Electric', 'Well', 'Septic', 'Not Required']

const FINANCING_OPTIONS = [
  { value: 'Cash Offer', label: 'Cash Offer', sub: 'Immediate liquidity available' },
  { value: 'Seller Financing', label: 'Seller Financing', sub: 'Seeking terms with interest' },
  { value: 'Conventional Loan', label: 'Conventional Loan', sub: 'Pre-approved with lender' },
  { value: 'Seeking Financing', label: 'Seeking Financing', sub: 'Open to external loan options' },
]

const URGENCY_OPTIONS = ['Flexible', 'Urgent']

const CONTACT_METHODS = ['Email', 'Phone Call', 'Text Message', 'In-App Messaging']

export default function CreateBuyerRequestPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<Record<string, any>>({
    state: '',
    county: '',
    zip_code: '',
    city: '',
    target_cities: '',
    zoning: [] as string[],
    area_unit: 'acres',
    min_acreage: '',
    max_acreage: '',
    road_access: [] as string[],
    utilities: [] as string[],
    min_budget: '',
    max_budget: '',
    financing: [] as string[],
    target_close_date: '',
    timeline_urgency: 'Flexible',
    working_with_agent: false,
    contact_methods: [] as string[],
    additional_notes: '',
  })

  const [profile, setProfile] = useState<Profile | null>(null)
  const [tierChecked, setTierChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [toast, setToast] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [profanityErrors, setProfanityErrors] = useState<Record<string, boolean>>({})
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/sign-in'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', user.id)
        .single()

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      const tier = sub?.tier ?? null

      if (profileData) {
        setProfile({ ...profileData, email: profileData.email ?? user.email ?? null, tier })
      } else {
        setProfile({ id: user.id, email: user.email ?? null, first_name: null, last_name: null, tier })
      }

      if (!tier) setShowUpgradeModal(true)

      setTierChecked(true)
    })
  }, [])

  const set = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const toggleArray = (field: string, value: string) => {
    const arr: string[] = formData[field] ?? []
    set(field, arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value])
  }

  function checkProfanity(field: string, value: string) {
    setProfanityErrors(prev => ({ ...prev, [field]: containsProfanity(value) }))
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!formData.min_budget || Number(String(formData.min_budget).replace(/,/g, '')) <= 0)
      errors.min_budget = 'Minimum budget is required'
    if (!formData.max_budget || Number(String(formData.max_budget).replace(/,/g, '')) <= 0)
      errors.max_budget = 'Maximum budget is required'
    if (!formData.min_acreage || Number(formData.min_acreage) <= 0)
      errors.min_acreage = 'Minimum lot size is required'
    if (!formData.max_acreage || Number(formData.max_acreage) <= 0)
      errors.max_acreage = 'Maximum lot size is required'
    if (formData.min_acreage && formData.max_acreage && Number(formData.max_acreage) < Number(formData.min_acreage))
      errors.max_acreage = 'Maximum must be greater than minimum'
    if (!formData.target_close_date)
      errors.target_close_date = 'Target close date is required'
    if (!(formData.contact_methods as string[]).length)
      errors.contact_methods = 'Select at least one contact method'
    if (!(formData.zoning as string[]).length)
      errors.zoning = 'Select at least one zoning preference'
    return errors
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors = validate()
    setValidationErrors(errors)
    if (Object.keys(errors).length > 0) return

    const hasProfanity = Object.values(profanityErrors).some(Boolean)
    if (hasProfanity) {
      setSubmitError('Please remove inappropriate language before submitting.')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/buyer-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_state: formData.state || null,
          target_county: formData.county || null,
          target_city: formData.city || null,
          target_zip: formData.zip_code || null,
          target_cities: formData.target_cities?.trim() || null,
          lot_size_min: Number(formData.min_acreage),
          lot_size_max: Number(formData.max_acreage),
          lot_size_label: null,
          target_regions: [formData.state, formData.county, formData.city].filter(Boolean),
          budget_min: formData.min_budget ? Number(String(formData.min_budget).replace(/,/g, '')) : null,
          budget_max: formData.max_budget ? Number(String(formData.max_budget).replace(/,/g, '')) : null,
          min_acreage: Number(formData.min_acreage),
          max_acreage: Number(formData.max_acreage),
          area_unit: formData.area_unit || 'acres',
          zoning_preference: formData.zoning,
          road_access: formData.road_access,
          utilities: formData.utilities,
          financing: formData.financing,
          timeline: formData.timeline_urgency || null,
          target_close_date: formData.target_close_date || null,
          working_with_agent: formData.working_with_agent,
          additional_notes: formData.additional_notes || null,
          contact_preference: formData.contact_methods,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submission failed')

      setToast('Your buying criteria is now live.')
      setTimeout(() => router.push(`/buyer-requests/${json.requestId}`), 900)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const isFormReady =
    Number(String(formData.min_budget || '').replace(/,/g, '')) > 0 &&
    Number(String(formData.max_budget || '').replace(/,/g, '')) > 0 &&
    Number(formData.min_acreage) > 0 &&
    Number(formData.max_acreage) > 0 &&
    Number(formData.max_acreage) >= Number(formData.min_acreage) &&
    !!formData.target_close_date &&
    (formData.contact_methods as string[]).length > 0 &&
    (formData.zoning as string[]).length > 0 &&
    !Object.values(profanityErrors).some(Boolean)

  if (!tierChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
    <Header />
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-24 pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-6 py-3 rounded-xl shadow-lg font-semibold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {toast}
        </div>
      )}

      {/* Upgrade modal for free users */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => router.push('/marketplace')} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button
              onClick={() => router.push('/marketplace')}
              className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors"
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Find a Property</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Finding a property requires a paid LotScout account. Choose a plan to get started and get matched with the right properties.
            </p>
            <div className="flex gap-3">
              <Link href="/pricing" className="flex-1 bg-[#1D9E75] text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-[#14795A] transition-colors">
                View Plans →
              </Link>
              <button onClick={() => router.push('/marketplace')} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Post Buying Criteria"
        description="Tell sellers what you're looking for and get matched with the right properties."
        className="sm:mb-12"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main form */}
        <div className="lg:col-span-8">
          <SurfaceCard className="bg-surface-container-lowest rounded-xl overflow-hidden">
            <form onSubmit={handleSubmit} className="divide-y divide-surface-container">

              {/* ── 1. Property Details ── */}
              <section className="p-4 sm:p-8 lg:p-10">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                  <span className="material-symbols-outlined text-primary text-xl sm:text-3xl">landscape</span>
                  <h2 className="font-headline text-lg sm:text-2xl font-bold text-primary tracking-tight">Property Details</h2>
                </div>
                <div className="space-y-6 sm:space-y-10">

                  {/* Target Regions */}
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-3 sm:mb-4">Target Regions</label>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                      {[
                        { key: 'state', label: 'State', placeholder: 'e.g. Montana' },
                        { key: 'county', label: 'County', placeholder: 'e.g. Missoula' },
                        { key: 'zip_code', label: 'Zip Code', placeholder: 'e.g. 59801' },
                        { key: 'city', label: 'City', placeholder: 'e.g. Seeley Lake' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key} className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-secondary">{label}</label>
                          <input
                            type="text"
                            value={formData[key]}
                            onChange={e => set(key, e.target.value)}
                            placeholder={placeholder}
                            className="w-full bg-surface border-none rounded-lg focus:ring-2 focus:ring-[#1D9E75]/20 text-sm py-2 px-3 sm:py-2.5 sm:px-4"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 mt-4">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-secondary">Target Cities <span className="font-normal normal-case">(optional, comma separated)</span></label>
                      <input
                        type="text"
                        value={formData.target_cities}
                        onChange={e => set('target_cities', e.target.value)}
                        placeholder="e.g. Denver, Aurora, Lakewood"
                        className="w-full bg-surface border-none rounded-lg focus:ring-2 focus:ring-[#1D9E75]/20 text-sm py-2 px-3 sm:py-2.5 sm:px-4"
                      />
                    </div>
                  </div>

                  {/* Zoning Preference */}
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-4">
                      Zoning Preference <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      {ZONING_OPTIONS.map(opt => (
                        <label key={opt} className="flex items-center gap-3 p-2.5 sm:p-3 bg-surface rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors">
                          <input
                            type="checkbox"
                            checked={(formData.zoning as string[]).includes(opt)}
                            onChange={() => { toggleArray('zoning', opt); setValidationErrors(prev => ({ ...prev, zoning: '' })) }}
                            className="rounded border-outline-variant text-[#1D9E75] focus:ring-[#1D9E75] h-5 w-5"
                          />
                          <span className="text-sm font-medium text-on-surface">{opt}</span>
                        </label>
                      ))}
                    </div>
                    {validationErrors.zoning && <p className="text-xs text-error mt-2">{validationErrors.zoning}</p>}
                  </div>

                  {/* Lot Size */}
                  <div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-primary">
                          Min <span className="text-error">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.min_acreage}
                          onChange={e => { set('min_acreage', e.target.value); setValidationErrors(prev => ({ ...prev, min_acreage: '' })) }}
                          placeholder="e.g. 5"
                          className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-[#1D9E75]/20 focus:bg-surface-container-lowest transition-all py-2.5 sm:py-3 px-3 sm:px-4"
                        />
                        {validationErrors.min_acreage && <p className="text-xs text-error">{validationErrors.min_acreage}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-primary">Max <span className="text-error">*</span></label>
                        <input
                          type="number"
                          value={formData.max_acreage}
                          onChange={e => { set('max_acreage', e.target.value); setValidationErrors(prev => ({ ...prev, max_acreage: '' })) }}
                          placeholder="e.g. 50"
                          className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-[#1D9E75]/20 focus:bg-surface-container-lowest transition-all py-2.5 sm:py-3 px-3 sm:px-4"
                        />
                        {validationErrors.max_acreage && <p className="text-xs text-error">{validationErrors.max_acreage}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Road Access & Utilities */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-3">Road Access</label>
                      <div className="flex flex-wrap gap-2">
                        {ROAD_ACCESS_OPTIONS.map(opt => (
                          <label key={opt} className="group">
                            <input
                              type="checkbox"
                              checked={(formData.road_access as string[]).includes(opt)}
                              onChange={() => toggleArray('road_access', opt)}
                              className="hidden peer"
                            />
                            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-outline-variant text-sm font-medium peer-checked:bg-[#1D9E75]/10 peer-checked:text-[#14795A] peer-checked:border-[#1D9E75] cursor-pointer transition-all block">
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-3">Utilities</label>
                      <div className="flex flex-wrap gap-2">
                        {UTILITIES_OPTIONS.map(opt => (
                          <label key={opt} className="group">
                            <input
                              type="checkbox"
                              checked={(formData.utilities as string[]).includes(opt)}
                              onChange={() => toggleArray('utilities', opt)}
                              className="hidden peer"
                            />
                            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-outline-variant text-sm font-medium peer-checked:bg-[#1D9E75]/10 peer-checked:text-[#14795A] peer-checked:border-[#1D9E75] cursor-pointer transition-all block">
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </section>

              {/* ── 2. Budget & Pricing ── */}
              <section className="p-4 sm:p-8 lg:p-10 bg-surface/30">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                  <span className="material-symbols-outlined text-primary text-xl sm:text-3xl">payments</span>
                  <h2 className="font-headline text-lg sm:text-2xl font-bold text-primary tracking-tight">Budget &amp; Pricing</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">
                      Min Budget ($) <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.min_budget}
                      onChange={e => { set('min_budget', e.target.value); setValidationErrors(prev => ({ ...prev, min_budget: '' })) }}
                      placeholder="10,000"
                      className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-[#1D9E75]/20 focus:bg-surface-container-lowest transition-all py-2.5 sm:py-3 px-3 sm:px-4"
                    />
                    {validationErrors.min_budget && <p className="text-xs text-error">{validationErrors.min_budget}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">
                      Max Budget ($) <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.max_budget}
                      onChange={e => { set('max_budget', e.target.value); setValidationErrors(prev => ({ ...prev, max_budget: '' })) }}
                      placeholder="500,000"
                      className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-[#1D9E75]/20 focus:bg-surface-container-lowest transition-all py-2.5 sm:py-3 px-3 sm:px-4"
                    />
                    {validationErrors.max_budget && <p className="text-xs text-error">{validationErrors.max_budget}</p>}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-primary">Financing Preferences</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {FINANCING_OPTIONS.map(({ value, label, sub }) => (
                      <label
                        key={value}
                        className="flex-1 flex items-center gap-3 p-3 sm:p-4 border border-outline-variant rounded-xl cursor-pointer hover:bg-surface-container-low transition-all has-[:checked]:border-[#1D9E75] has-[:checked]:bg-[#1D9E75]/5"
                      >
                        <input
                          type="checkbox"
                          checked={(formData.financing as string[]).includes(value)}
                          onChange={() => toggleArray('financing', value)}
                          className="text-[#1D9E75] focus:ring-[#1D9E75] h-5 w-5"
                        />
                        <div>
                          <p className="font-bold text-primary">{label}</p>
                          <p className="text-xs text-secondary">{sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              {/* ── 3. Purchase Timeline ── */}
              <section className="p-4 sm:p-8 lg:p-10 bg-surface/30">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                  <span className="material-symbols-outlined text-primary text-xl sm:text-3xl">calendar_month</span>
                  <h2 className="font-headline text-lg sm:text-2xl font-bold text-primary tracking-tight">Purchase Timeline</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-10">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">
                      Target Close Date <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.target_close_date}
                      onChange={e => { set('target_close_date', e.target.value); setValidationErrors(prev => ({ ...prev, target_close_date: '' })) }}
                      className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-[#1D9E75]/20 focus:bg-surface-container-lowest transition-all py-2.5 sm:py-3 px-3 sm:px-4"
                    />
                    {validationErrors.target_close_date && <p className="text-xs text-error">{validationErrors.target_close_date}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">Timeline Urgency</label>
                    <div className="flex p-1 bg-surface-container-high rounded-full w-fit">
                      {URGENCY_OPTIONS.map(opt => (
                        <label key={opt} className="cursor-pointer">
                          <input
                            type="radio"
                            name="timeline_urgency"
                            value={opt}
                            checked={formData.timeline_urgency === opt}
                            onChange={() => set('timeline_urgency', opt)}
                            className="hidden peer"
                          />
                          <span className="px-3 sm:px-5 py-1.5 rounded-full text-sm font-medium text-secondary peer-checked:bg-[#1D9E75] peer-checked:text-white peer-checked:shadow-sm block transition-all">
                            {opt}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-8 flex items-center justify-between gap-3 p-3 sm:p-4 bg-white rounded-xl border border-outline-variant/30">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">support_agent</span>
                    <div>
                      <p className="text-sm font-bold text-primary">Working With Agent?</p>
                      <p className="text-xs text-secondary">Let us know if you're already represented</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.working_with_agent}
                      onChange={e => set('working_with_agent', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D9E75]" />
                  </label>
                </div>
              </section>

              {/* ── 4. Contact Preferences ── */}
              <section className="p-4 sm:p-8 lg:p-10">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                  <span className="material-symbols-outlined text-primary text-xl sm:text-3xl">contact_support</span>
                  <h2 className="font-headline text-lg sm:text-2xl font-bold text-primary tracking-tight">Contact Preferences</h2>
                </div>
                <div className="space-y-5 sm:space-y-8">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-4">
                      Preferred Contact Methods <span className="text-error">*</span>
                      <span className="text-xs font-normal text-secondary ml-2">(Select all that apply)</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                      {CONTACT_METHODS.map(method => (
                        <label key={method} className="flex items-center gap-3 p-2.5 sm:p-3 bg-surface rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors">
                          <input
                            type="checkbox"
                            checked={(formData.contact_methods as string[]).includes(method)}
                            onChange={() => { toggleArray('contact_methods', method); setValidationErrors(prev => ({ ...prev, contact_methods: '' })) }}
                            className="rounded border-outline-variant text-[#1D9E75] focus:ring-[#1D9E75] h-5 w-5"
                          />
                          <span className="text-sm font-medium text-on-surface">{method}</span>
                        </label>
                      ))}
                    </div>
                    {validationErrors.contact_methods && <p className="text-xs text-error mt-2">{validationErrors.contact_methods}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">Additional Notes</label>
                    <textarea
                      rows={2}
                      value={formData.additional_notes}
                      onChange={e => set('additional_notes', e.target.value)}
                      onBlur={e => checkProfanity('additional_notes', e.target.value)}
                      placeholder="Anything else sellers should know?"
                      className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-[#1D9E75]/20 focus:bg-surface-container-lowest transition-all py-2.5 sm:py-3 px-3 sm:px-4"
                    />
                    {profanityErrors.additional_notes && <p className="text-xs text-error">Please remove inappropriate language.</p>}
                  </div>
                </div>
              </section>

              {/* ── Footer actions ── */}
              <div className="p-4 sm:p-6 lg:p-8 bg-surface-container-lowest border-t border-surface-container flex flex-col sm:flex-row justify-between items-center gap-4">
                {submitError && <p className="text-sm text-error font-medium">{submitError}</p>}
                <div className="flex justify-between items-center w-full gap-4">
                  <button
                    type="button"
                    className="px-4 sm:px-8 py-2.5 sm:py-3 bg-surface-container-high text-secondary hover:bg-surface-container-highest font-bold rounded-xl transition-all text-sm"
                  >
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !isFormReady}
                    className="flex items-center gap-2 px-5 sm:px-10 py-2.5 sm:py-3 bg-[#1D9E75] text-white font-bold rounded-xl shadow-lg shadow-[#1D9E75]/20 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  >
                    {submitting ? 'Posting…' : 'Find a Property'}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>

            </form>
          </SurfaceCard>

          {/* Upgrade banner — Standard tier only */}
          {profile?.tier === 'standard' && (
            <div className="mt-8 bg-[#E8F5E9] p-6 rounded-xl border border-[#C1ECD4] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-primary">Unlock Priority Matching</h4>
                  <p className="text-sm text-[#274e3d]">Priority and Exclusive members get their buying criteria featured at the top of the buyer directory and matched directly with incoming listings.</p>
                </div>
              </div>
              <Link href="/pricing" className="whitespace-nowrap px-6 py-2.5 bg-[#1D9E75] text-white font-bold rounded-lg hover:bg-[#14795A] transition-colors">
                Upgrade Now
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-surface-container-low">
            <h3 className="font-headline text-xl font-bold text-primary mb-4">Why post your criteria?</h3>
            <ul className="space-y-6">
              {[
                { icon: 'verified', title: 'Priority Discovery', body: 'Sellers of unlisted land can find you directly.' },
                { icon: 'analytics', title: 'Market Insights', body: 'Get notified when property values in your target regions shift.' },
                { icon: 'group_add', title: 'Tailored Networking', body: 'Connect with local experts who specialize in your use case.' },
              ].map(({ icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="material-symbols-outlined text-primary-fixed-dim">{icon}</span>
                  <div className="text-sm">
                    <p className="font-bold text-primary">{title}</p>
                    <p className="text-secondary">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl overflow-hidden shadow-sm aspect-video bg-surface-container-high relative">
            <div className="w-full h-full bg-gradient-to-br from-primary-container to-primary flex items-end p-6">
              <p className="text-white font-bold text-lg leading-tight">Find the perfect canvas for your vision.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
    </>
  )
}

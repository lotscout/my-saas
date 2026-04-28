// -- Run this in Supabase SQL editor before testing:
// -- create table buyer_requests (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, state text, county text, zip_code text, city text, location_notes text, zoning text[], area_unit text default 'acres', min_acreage numeric, max_acreage numeric, road_access text[], utilities text[], min_budget numeric, max_budget numeric, price_per_acre numeric, financing text[], primary_use_case text, use_case_description text, specific_requirements text, target_close_date date, timeline_urgency text, working_with_agent boolean default false, contact_methods text[], additional_notes text, created_at timestamptz default now());

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { containsProfanity } from '@/lib/profanity-filter'

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

const USE_CASES = [
  'Homesteading / Off-grid living',
  'Long-term Investment',
  'Recreational (Hunting/Camping)',
  'Subdivision / Development',
  'Commercial Agriculture',
  'Row Crop Production',
  'Livestock/Ranching',
  'Timber/Forestry',
  'Conservation/Preservation',
  'Other',
]

const URGENCY_OPTIONS = ['Flexible', 'Ready Now', 'Urgent']

const CONTACT_METHODS = ['Email', 'Phone Call', 'Text Message', 'In-App Messaging']

export default function CreateBuyerRequestPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<Record<string, any>>({
    state: '',
    county: '',
    zip_code: '',
    city: '',
    location_notes: '',
    zoning: [] as string[],
    area_unit: 'acres',
    min_acreage: '',
    max_acreage: '',
    road_access: [] as string[],
    utilities: [] as string[],
    min_budget: '',
    max_budget: '',
    price_per_acre: '',
    financing: [] as string[],
    primary_use_case: '',
    use_case_description: '',
    specific_requirements: '',
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
  const [aiStreaming, setAiStreaming] = useState(false)
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
      errors.min_acreage = 'Minimum acreage is required'
    if (!formData.target_close_date)
      errors.target_close_date = 'Target close date is required'
    if (!(formData.contact_methods as string[]).length)
      errors.contact_methods = 'Select at least one contact method'
    if (!(formData.zoning as string[]).length)
      errors.zoning = 'Select at least one zoning preference'
    return errors
  }

  async function generateDescription() {
    setAiStreaming(true)
    set('use_case_description', '')
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: formData.state,
          county: formData.county,
          lotSize: formData.min_acreage,
          lotSizeUnit: formData.area_unit,
          zoning: (formData.zoning as string[]).join(', '),
          roadAccess: formData.road_access,
          utilities: formData.utilities,
          context: [
            formData.primary_use_case ? `Use case: ${formData.primary_use_case}` : '',
            formData.min_budget ? `Budget: $${formData.min_budget} – $${formData.max_budget}` : '',
          ].filter(Boolean).join('. '),
        }),
      })
      if (!res.ok || !res.body) throw new Error('Stream failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        set('use_case_description', text)
      }
    } finally {
      setAiStreaming(false)
    }
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
          // Map form fields to the buyer_requests DB schema
          target_regions: [formData.state, formData.county, formData.city].filter(Boolean),
          budget_min: formData.min_budget ? Number(String(formData.min_budget).replace(/,/g, '')) : null,
          budget_max: formData.max_budget ? Number(String(formData.max_budget).replace(/,/g, '')) : null,
          min_acreage: formData.min_acreage ? Number(formData.min_acreage) : null,
          max_acreage: formData.max_acreage ? Number(formData.max_acreage) : null,
          use_case: [formData.primary_use_case, formData.use_case_description].filter(Boolean).join(' — ') || null,
          zoning_preference: formData.zoning,
          timeline: formData.timeline_urgency || null,
          additional_notes: [
            formData.location_notes,
            formData.specific_requirements,
            formData.additional_notes,
          ].filter(Boolean).join('\n\n') || null,
          contact_preference: formData.contact_methods,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submission failed')

      setToast('Your buying criteria is now live.')
      setTimeout(() => router.push('/marketplace'), 1500)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (!tierChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="max-w-[1440px] mx-auto px-6 lg:px-10 py-12">
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
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Post Buying Criteria</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Posting buying criteria requires a paid LotScout account. Choose a plan to get started and get matched with the right properties.
            </p>
            <div className="flex gap-3">
              <Link href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors">
                View Plans →
              </Link>
              <button onClick={() => router.push('/marketplace')} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <header className="mb-12 max-w-3xl">
        <h1 className="font-headline text-5xl font-extrabold text-primary tracking-[-0.03em] mb-4">Post Buying Criteria</h1>
        <p className="text-lg text-secondary font-light leading-relaxed">Tell sellers exactly what you're looking for and get matched with the right properties.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main form */}
        <div className="lg:col-span-8">
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <form onSubmit={handleSubmit} className="divide-y divide-surface-container">

              {/* ── 1. Property Details ── */}
              <section className="p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl">landscape</span>
                  <h2 className="font-headline text-2xl font-bold text-primary tracking-tight">Property Details</h2>
                </div>
                <div className="space-y-10">

                  {/* Target Regions */}
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-4">Target Regions</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                            className="w-full bg-surface border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm py-2.5 px-4"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-secondary">Specifics / Notes</label>
                      <textarea
                        rows={2}
                        value={formData.location_notes}
                        onChange={e => { set('location_notes', e.target.value); checkProfanity('location_notes', e.target.value) }}
                        placeholder="Mention specific areas or boundaries..."
                        className="w-full bg-surface border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm py-2.5 px-4"
                      />
                      {profanityErrors.location_notes && <p className="text-xs text-error mt-1">Please remove inappropriate language.</p>}
                    </div>
                  </div>

                  {/* Zoning Preference */}
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-4">
                      Zoning Preference <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {ZONING_OPTIONS.map(opt => (
                        <label key={opt} className="flex items-center gap-3 p-3 bg-surface rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors">
                          <input
                            type="checkbox"
                            checked={(formData.zoning as string[]).includes(opt)}
                            onChange={() => { toggleArray('zoning', opt); setValidationErrors(prev => ({ ...prev, zoning: '' })) }}
                            className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5"
                          />
                          <span className="text-sm font-medium text-on-surface">{opt}</span>
                        </label>
                      ))}
                    </div>
                    {validationErrors.zoning && <p className="text-xs text-error mt-2">{validationErrors.zoning}</p>}
                  </div>

                  {/* Acreage */}
                  <div>
                    <div className="flex justify-end mb-2">
                      <div className="flex p-1 bg-surface-container-high rounded-lg w-fit">
                        {(['acres', 'sqft'] as const).map(unit => (
                          <label key={unit} className="cursor-pointer">
                            <input
                              type="radio"
                              name="area_unit"
                              value={unit}
                              checked={formData.area_unit === unit}
                              onChange={() => set('area_unit', unit)}
                              className="hidden peer"
                            />
                            <span className="px-3 py-1 rounded text-[10px] font-bold uppercase peer-checked:bg-white peer-checked:text-primary peer-checked:shadow-sm block transition-all text-secondary">
                              {unit === 'acres' ? 'Acres' : 'Sq Ft'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-primary">
                          Min Acreage <span className="text-error">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.min_acreage}
                          onChange={e => { set('min_acreage', e.target.value); setValidationErrors(prev => ({ ...prev, min_acreage: '' })) }}
                          placeholder="e.g. 5"
                          className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all py-3 px-4"
                        />
                        {validationErrors.min_acreage && <p className="text-xs text-error">{validationErrors.min_acreage}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-primary">Max Acreage</label>
                        <input
                          type="number"
                          value={formData.max_acreage}
                          onChange={e => set('max_acreage', e.target.value)}
                          placeholder="e.g. 50"
                          className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all py-3 px-4"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Road Access & Utilities */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
                            <span className="px-4 py-2 rounded-full border border-outline-variant text-sm font-medium peer-checked:bg-primary-container peer-checked:text-on-primary-container peer-checked:border-primary-container cursor-pointer transition-all block">
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
                            <span className="px-4 py-2 rounded-full border border-outline-variant text-sm font-medium peer-checked:bg-primary-container peer-checked:text-on-primary-container peer-checked:border-primary-container cursor-pointer transition-all block">
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
              <section className="p-8 lg:p-10 bg-surface/30">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl">payments</span>
                  <h2 className="font-headline text-2xl font-bold text-primary tracking-tight">Budget &amp; Pricing</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">
                      Min Budget ($) <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.min_budget}
                      onChange={e => { set('min_budget', e.target.value); setValidationErrors(prev => ({ ...prev, min_budget: '' })) }}
                      placeholder="10,000"
                      className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all py-3 px-4"
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
                      className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all py-3 px-4"
                    />
                    {validationErrors.max_budget && <p className="text-xs text-error">{validationErrors.max_budget}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">Price Per Acre ($)</label>
                    <input
                      type="text"
                      value={formData.price_per_acre}
                      onChange={e => set('price_per_acre', e.target.value)}
                      placeholder="Target per acre"
                      className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all py-3 px-4"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-primary">Financing Preferences</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {FINANCING_OPTIONS.map(({ value, label, sub }) => (
                      <label
                        key={value}
                        className="flex-1 flex items-center gap-3 p-4 border border-outline-variant rounded-xl cursor-pointer hover:bg-surface-container-low transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <input
                          type="checkbox"
                          checked={(formData.financing as string[]).includes(value)}
                          onChange={() => toggleArray('financing', value)}
                          className="text-primary focus:ring-primary h-5 w-5"
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

              {/* ── 3. Intended Use ── */}
              <section className="p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl">category</span>
                  <h2 className="font-headline text-2xl font-bold text-primary tracking-tight">Intended Use</h2>
                </div>
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">Primary Use Case</label>
                    <select
                      value={formData.primary_use_case}
                      onChange={e => set('primary_use_case', e.target.value)}
                      className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all py-3 px-4"
                    >
                      <option value="">Select a use case</option>
                      {USE_CASES.map(uc => <option key={uc} value={uc}>{uc}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-semibold text-primary">Use Case Description</label>
                      <button
                        type="button"
                        onClick={generateDescription}
                        disabled={aiStreaming}
                        className="flex items-center gap-2 text-xs font-bold text-primary-container bg-primary-fixed hover:bg-primary-fixed-dim px-3 py-1.5 rounded-full transition-all disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                        {aiStreaming ? 'Writing…' : 'Write with AI'}
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={500}
                      value={formData.use_case_description}
                      onChange={e => { set('use_case_description', e.target.value); checkProfanity('use_case_description', e.target.value) }}
                      placeholder="Describe what you plan to do with the land..."
                      className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all py-3 px-4"
                    />
                    <div className="flex justify-between">
                      {profanityErrors.use_case_description
                        ? <p className="text-xs text-error">Please remove inappropriate language.</p>
                        : <span />}
                      <p className="text-xs text-secondary">{(formData.use_case_description as string).length}/500</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">Specific Requirements</label>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={formData.specific_requirements}
                      onChange={e => { set('specific_requirements', e.target.value); checkProfanity('specific_requirements', e.target.value) }}
                      placeholder="Water rights, specific soil types, topographic needs..."
                      className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all py-3 px-4"
                    />
                    {profanityErrors.specific_requirements && <p className="text-xs text-error">Please remove inappropriate language.</p>}
                  </div>
                </div>
              </section>

              {/* ── 4. Purchase Timeline ── */}
              <section className="p-8 lg:p-10 bg-surface/30">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl">calendar_month</span>
                  <h2 className="font-headline text-2xl font-bold text-primary tracking-tight">Purchase Timeline</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-primary">
                      Target Close Date <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.target_close_date}
                      onChange={e => { set('target_close_date', e.target.value); setValidationErrors(prev => ({ ...prev, target_close_date: '' })) }}
                      className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all py-3 px-4"
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
                          <span className="px-5 py-1.5 rounded-full text-sm font-medium text-secondary peer-checked:bg-white peer-checked:text-primary peer-checked:shadow-sm block transition-all">
                            {opt}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex items-center justify-between p-4 bg-white rounded-xl border border-outline-variant/30">
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
                    <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
              </section>

              {/* ── 5. Contact Preferences ── */}
              <section className="p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl">contact_support</span>
                  <h2 className="font-headline text-2xl font-bold text-primary tracking-tight">Contact Preferences</h2>
                </div>
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-4">
                      Preferred Contact Methods <span className="text-error">*</span>
                      <span className="text-xs font-normal text-secondary ml-2">(Select all that apply)</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {CONTACT_METHODS.map(method => (
                        <label key={method} className="flex items-center gap-3 p-3 bg-surface rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors">
                          <input
                            type="checkbox"
                            checked={(formData.contact_methods as string[]).includes(method)}
                            onChange={() => { toggleArray('contact_methods', method); setValidationErrors(prev => ({ ...prev, contact_methods: '' })) }}
                            className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5"
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
                      onChange={e => { set('additional_notes', e.target.value); checkProfanity('additional_notes', e.target.value) }}
                      placeholder="Anything else sellers should know?"
                      className="w-full bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all py-3 px-4"
                    />
                    {profanityErrors.additional_notes && <p className="text-xs text-error">Please remove inappropriate language.</p>}
                  </div>
                </div>
              </section>

              {/* ── Footer actions ── */}
              <div className="p-6 lg:p-8 bg-surface-container-lowest border-t border-surface-container flex flex-col sm:flex-row justify-between items-center gap-4">
                {submitError && <p className="text-sm text-error font-medium">{submitError}</p>}
                <div className="flex justify-between items-center w-full gap-4">
                  <button
                    type="button"
                    className="px-8 py-3 bg-surface-container-high text-secondary hover:bg-surface-container-highest font-bold rounded-xl transition-all"
                  >
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-10 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {submitting ? 'Posting…' : 'Post Buying Criteria'}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>

            </form>
          </div>

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
              <Link href="/pricing" className="whitespace-nowrap px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                Upgrade Now
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
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
  )
}

// -- Run this in Supabase SQL editor before testing:
// -- create table listings (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, status text default 'pending_review', ownership_type text, ownership_certified boolean, title text, property_description text, state text, county text, zip_code text, street_address text, apn text, lot_size_acres numeric, lot_size_sqft numeric, zoning text, road_access text[], utilities text[], asking_price numeric, comparable_market_value numeric, price_negotiable boolean default false, preferred_close_date date, additional_information text, contact_methods text[], photos_urls text[], contract_url text, legal_confirmation boolean, platform_understanding boolean, state_compliance boolean, digital_signature text, signature_date date, created_at timestamptz default now(), updated_at timestamptz default now());

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  { label: 'Ownership Type',       sub: 'Verify your legal authority' },
  { label: 'Land Details',         sub: 'Acreage, zoning, and topography' },
  { label: 'Visuals & Media',      sub: 'Photos, drone shots, and maps' },
  { label: 'Compliance Agreement', sub: 'Review legal and ethical standards' },
]

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
]

const TODAY = new Date().toISOString().split('T')[0]

export default function CreateListingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Record<string, any>>({ signature_date: TODAY })
  const [lotSizeUnit, setLotSizeUnit] = useState<'acres' | 'sqft'>('acres')
  const [aiStreaming, setAiStreaming] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [profile, setProfile] = useState<{ id: string; email: string | null; first_name: string | null; last_name: string | null; tier: string | null } | null>(null)
  const [tierChecked, setTierChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setTierChecked(true); return }
      const { data } = await supabase
        .from('profiles')
        .select('id, tier, email, first_name, last_name')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data)
        const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ')
        if (fullName) setFormData(prev => ({ ...prev, digital_signature: fullName }))
      }
      setTierChecked(true)
    })
  }, [])

  const set = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const toggleArray = (field: string, value: string) => {
    const arr: string[] = formData[field] ?? []
    set(field, arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value])
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload photos
      const uploadedPhotoUrls: string[] = []
      for (const file of photoFiles) {
        const path = `${user.id}/photos/${Date.now()}-${file.name}`
        const { data, error } = await supabase.storage.from('listing-assets').upload(path, file)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('listing-assets').getPublicUrl(data.path)
        uploadedPhotoUrls.push(publicUrl)
      }

      // Upload contract
      let uploadedContractUrl = ''
      if (contractFile) {
        const path = `${user.id}/contract/${Date.now()}-${contractFile.name}`
        const { data, error } = await supabase.storage.from('listing-assets').upload(path, contractFile)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('listing-assets').getPublicUrl(data.path)
        uploadedContractUrl = publicUrl
      }

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownershipType: formData.ownership_type,
          ownershipCertified: formData.ownership_certified,
          title: formData.title,
          propertyDescription: formData.property_description,
          state: formData.state,
          county: formData.county,
          zipCode: formData.zip_code,
          streetAddress: formData.street_address,
          apn: formData.apn,
          lotSizeValue: lotSizeUnit === 'acres' ? formData.lot_size_acres : formData.lot_size_sqft,
          lotSizeUnit,
          zoning: formData.zoning,
          roadAccess: formData.road_access ?? [],
          utilities: formData.utilities ?? [],
          askingPrice: formData.asking_price,
          comparableMarketValue: formData.comparable_market_value,
          priceNegotiable: formData.price_negotiable ?? false,
          preferredCloseDate: formData.preferred_close_date,
          additionalInformation: formData.additional_information,
          contactMethods: formData.contact_methods ?? [],
          photosUrls: uploadedPhotoUrls,
          contractUrl: uploadedContractUrl,
          legalConfirmation: formData.legal_confirmation ?? false,
          platformUnderstanding: formData.platform_understanding ?? false,
          stateCompliance: formData.state_compliance ?? false,
          digitalSignature: formData.digital_signature,
          signatureDate: formData.signature_date,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submission failed')

      setToast('Listing submitted! Redirecting…')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function generateDescription() {
    setAiStreaming(true)
    set('additional_information', '')
    try {
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          state: formData.state,
          county: formData.county,
          lotSize: lotSizeUnit === 'acres' ? formData.lot_size_acres : formData.lot_size_sqft,
          lotSizeUnit,
          zoning: formData.zoning,
          roadAccess: formData.road_access,
          utilities: formData.utilities,
          context: formData.property_description,
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
        set('additional_information', text)
      }
    } finally {
      setAiStreaming(false)
    }
  }

  const progressWidth = ['w-1/4', 'w-1/2', 'w-3/4', 'w-full'][currentStep - 1]
  const stepSubtitle = `Step ${currentStep} of 4: ${STEPS[currentStep - 1].label}`

  const hasTier = !tierChecked || (profile && profile.tier)

  return (
    <>
    {/* Tier gate modal */}
    {tierChecked && !hasTier && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="bg-surface-container-lowest rounded-xl shadow-2xl p-10 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-primary text-2xl">lock</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-primary mb-3">Create a Listing</h2>
          <p className="text-secondary text-sm leading-relaxed mb-8">
            Listing your property requires a paid LotScout account.
          </p>
          <a
            href="/pricing"
            className="inline-block bg-primary text-on-primary font-headline font-bold px-8 py-3 rounded-xl hover:brightness-125 transition-all shadow-lg shadow-primary/10"
          >
            View Plans →
          </a>
        </div>
      </div>
    )}

    {/* Success toast */}
    {toast && (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-6 py-3 rounded-full shadow-xl font-bold text-sm flex items-center gap-2">
        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        {toast}
      </div>
    )}

    <main className="flex-grow pt-32 pb-24 px-6 md:px-12 max-w-[1440px] mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Left: Heading & Stepper */}
        <div className="lg:col-span-4 flex flex-col justify-start">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-4 leading-tight font-headline">
            Create Land Listing
          </h1>
          <p className="text-secondary text-lg font-medium mb-12">{stepSubtitle}</p>

          {/* Mobile progress bar */}
          <div className="lg:hidden relative w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mb-8">
            <div className={`absolute top-0 left-0 h-full bg-primary rounded-full ${progressWidth}`} />
          </div>

          {/* Desktop vertical stepper */}
          <div className="hidden lg:block space-y-0 relative">
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-surface-container-high -z-0" />
            {STEPS.map((step, i) => {
              const num = i + 1
              const done = num < currentStep
              const active = num === currentStep
              return (
                <div key={num} className={`relative flex items-start space-x-6 ${num < STEPS.length ? 'pb-12' : ''}`}>
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-background
                    ${done ? 'bg-primary-fixed text-primary' : active ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface'}`}>
                    {done
                      ? <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                      : num}
                  </div>
                  <div className={active ? '' : done ? '' : 'opacity-40'}>
                    <p className={`font-bold ${active ? 'text-primary' : 'text-on-surface'}`}>{step.label}</p>
                    <p className="text-xs text-secondary mt-1">{step.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Form Card */}
        <div className="lg:col-span-8">

          {/* ── Step 1 ── */}
          {currentStep === 1 && (
            <>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/10">
                <div className="p-8 md:p-12">
                  <div className="space-y-10">

                    {/* Ownership Type dropdown */}
                    <div>
                      <label htmlFor="ownership_type" className="block text-sm font-bold text-primary mb-3 tracking-tight">
                        Ownership Type *
                      </label>
                      <div className="relative">
                        <select
                          id="ownership_type"
                          value={formData.ownership_type ?? ''}
                          onChange={e => set('ownership_type', e.target.value)}
                          className="w-full bg-surface-container-low border-none rounded-lg px-5 py-4 text-on-surface-variant font-medium appearance-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all"
                        >
                          <option value="" disabled>Select your legal role...</option>
                          <option value="owner">Owner</option>
                          <option value="contract">Under Contract</option>
                          <option value="poa">Power of Attorney</option>
                          <option value="agent">Authorized Agent</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
                      </div>
                      <p className="mt-3 text-xs text-secondary leading-relaxed">
                        Please select the capacity in which you are listing this property. Verification documents may be requested during the review process.
                      </p>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent" />

                    {/* Certification checkbox */}
                    <div className="flex items-start space-x-4 p-6 bg-surface-container-low/50 rounded-xl">
                      <div className="flex items-center h-6">
                        <input
                          id="certify"
                          type="checkbox"
                          checked={formData.ownership_certified ?? false}
                          onChange={e => set('ownership_certified', e.target.checked)}
                          className="h-5 w-5 rounded-md border-outline-variant text-primary focus:ring-primary/20"
                        />
                      </div>
                      <div className="text-sm leading-6">
                        <label htmlFor="certify" className="font-semibold text-on-surface">I hereby certify legal authority</label>
                        <p className="text-secondary text-xs">
                          I confirm that I am the legal owner or have explicit written authorization from the owner to market and sell this land parcel. False representation may lead to account suspension.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 flex justify-end items-center space-x-4">
                    <button className="text-secondary font-bold text-sm px-6 py-3 hover:text-primary transition-colors">Save Draft</button>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="bg-primary text-white font-bold px-10 py-4 rounded-xl flex items-center space-x-2 transition-transform active:scale-95 shadow-lg shadow-primary/10"
                    >
                      <span>Next</span>
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                  </div>
                </div>

                <div className="bg-primary-fixed text-on-primary-fixed px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <p className="text-sm font-bold tracking-tight">Upgrade to LotScout Pro for priority placement and 4K drone video hosting.</p>
                  </div>
                  <a href="#" className="text-xs font-black uppercase tracking-widest bg-primary text-white px-4 py-2 rounded-full hover:bg-on-primary-container transition-colors">Learn More</a>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-surface-container-low">
                  <span className="material-symbols-outlined text-secondary mb-3 block">gavel</span>
                  <h4 className="font-bold text-primary text-sm mb-1">Land Ethics &amp; Compliance</h4>
                  <p className="text-xs text-secondary leading-relaxed">All listings must adhere to our ethical standards for sustainable land development and environmental stewardship.</p>
                </div>
                <div className="p-6 rounded-xl bg-surface-container-low">
                  <span className="material-symbols-outlined text-secondary mb-3 block">support_agent</span>
                  <h4 className="font-bold text-primary text-sm mb-1">Need Assistance?</h4>
                  <p className="text-xs text-secondary leading-relaxed">Our Advisors are standing by to help you verify your ownership type or structure complex deal terms.</p>
                </div>
              </div>
            </>
          )}

          {/* ── Step 2 ── */}
          {currentStep === 2 && (
            <>
              <div className="bg-surface-container-lowest p-8 md:p-12 rounded-xl border border-outline-variant/15 shadow-sm">
                <div className="space-y-12">

                  {/* Core Details */}
                  <section className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <span className="material-symbols-outlined text-primary-fixed-dim">edit_note</span>
                      <h2 className="font-headline text-xl font-bold text-primary tracking-tight">Core Details</h2>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-secondary tracking-wide">Title *</label>
                      <input
                        type="text"
                        value={formData.title ?? ''}
                        onChange={e => set('title', e.target.value)}
                        placeholder="e.g. 40-Acre Highland Retreat with River Access"
                        className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-secondary tracking-wide">Property Description *</label>
                      <textarea
                        value={formData.property_description ?? ''}
                        onChange={e => set('property_description', e.target.value)}
                        placeholder="Brief summary of the land's primary appeal..."
                        rows={4}
                        className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                      />
                    </div>
                  </section>

                  {/* Location */}
                  <section className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <span className="material-symbols-outlined text-primary-fixed-dim">location_on</span>
                      <h2 className="font-headline text-xl font-bold text-primary tracking-tight">Location</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-1">
                        <label className="block text-sm font-bold text-secondary tracking-wide">Address</label>
                        <input
                          type="text"
                          value={formData.street_address ?? ''}
                          onChange={e => set('street_address', e.target.value)}
                          placeholder="Street name or physical markers"
                          className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-bold text-secondary tracking-wide">APN (Parcel Number)</label>
                        <input
                          type="text"
                          value={formData.apn ?? ''}
                          onChange={e => set('apn', e.target.value)}
                          placeholder="00-000-00"
                          className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <label className="block text-sm font-bold text-secondary tracking-wide">State</label>
                        <div className="relative">
                          <select
                            value={formData.state ?? ''}
                            onChange={e => set('state', e.target.value)}
                            className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                          >
                            <option value="">Select State</option>
                            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-sm">expand_more</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-bold text-secondary tracking-wide">County</label>
                        <input
                          type="text"
                          value={formData.county ?? ''}
                          onChange={e => set('county', e.target.value)}
                          placeholder="County Name"
                          className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1 space-y-1">
                        <label className="block text-sm font-bold text-secondary tracking-wide">Zip Code</label>
                        <input
                          type="text"
                          value={formData.zip_code ?? ''}
                          onChange={e => set('zip_code', e.target.value)}
                          placeholder="00000"
                          className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Lot Features */}
                  <section className="space-y-8">
                    <div className="flex items-center space-x-3">
                      <span className="material-symbols-outlined text-primary-fixed-dim">landscape</span>
                      <h2 className="font-headline text-xl font-bold text-primary tracking-tight">Lot Features</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="block text-sm font-bold text-secondary tracking-wide">Lot Size</label>
                          <div className="flex bg-surface-container-low rounded-lg p-1">
                            <input
                              type="number"
                              value={lotSizeUnit === 'acres' ? (formData.lot_size_acres ?? '') : (formData.lot_size_sqft ?? '')}
                              onChange={e => set(lotSizeUnit === 'acres' ? 'lot_size_acres' : 'lot_size_sqft', e.target.value)}
                              placeholder="0.00"
                              className="flex-grow bg-transparent border-none p-3 focus:ring-0"
                            />
                            <div className="flex bg-surface-container-highest rounded-lg">
                              <button
                                type="button"
                                onClick={() => setLotSizeUnit('acres')}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${lotSizeUnit === 'acres' ? 'bg-white shadow-sm text-primary' : 'text-secondary'}`}
                              >Acres</button>
                              <button
                                type="button"
                                onClick={() => setLotSizeUnit('sqft')}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${lotSizeUnit === 'sqft' ? 'bg-white shadow-sm text-primary' : 'text-secondary'}`}
                              >Sq Ft</button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-bold text-secondary tracking-wide">Zoning</label>
                          <div className="relative">
                            <select
                              value={formData.zoning ?? ''}
                              onChange={e => set('zoning', e.target.value)}
                              className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                            >
                              <option value="">Select Zoning</option>
                              <option value="Residential">Residential</option>
                              <option value="Agricultural">Agricultural</option>
                              <option value="Commercial">Commercial</option>
                              <option value="Industrial">Industrial</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-sm">expand_more</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <span className="block text-sm font-bold text-secondary tracking-wide">Road Access</span>
                          {['Paved', 'Dirt/Gravel', 'No Access'].map(opt => (
                            <label key={opt} className="flex items-center space-x-3 text-sm font-medium text-on-surface-variant cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={(formData.road_access ?? []).includes(opt)}
                                onChange={() => toggleArray('road_access', opt)}
                                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20"
                              />
                              <span className="group-hover:text-primary transition-colors">{opt}</span>
                            </label>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <span className="block text-sm font-bold text-secondary tracking-wide">Utilities</span>
                          {['Electricity', 'Water Well', 'Septic'].map(opt => (
                            <label key={opt} className="flex items-center space-x-3 text-sm font-medium text-on-surface-variant cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={(formData.utilities ?? []).includes(opt)}
                                onChange={() => toggleArray('utilities', opt)}
                                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20"
                              />
                              <span className="group-hover:text-primary transition-colors">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Detailed Description */}
                  <section className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className="material-symbols-outlined text-primary-fixed-dim">auto_awesome</span>
                        <h2 className="font-headline text-xl font-bold text-primary tracking-tight">Detailed Description</h2>
                      </div>
                      <button
                        type="button"
                        className="flex items-center space-x-2 bg-secondary-fixed text-on-secondary-fixed px-4 py-2 rounded-full text-xs font-bold hover:brightness-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">psychology</span>
                        <span>Write with AI</span>
                      </button>
                    </div>
                    <textarea
                      value={formData.additional_information ?? ''}
                      onChange={e => set('additional_information', e.target.value)}
                      placeholder="The narrative story of your land. Discuss topography, views, wildlife, and potential uses..."
                      rows={8}
                      className="w-full bg-surface-container-low border-none rounded-lg p-6 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant leading-relaxed"
                    />
                  </section>

                  {/* Pricing & Timeline */}
                  <section className="space-y-6 pt-4 border-t border-surface-container-high">
                    <div className="flex items-center space-x-3">
                      <span className="material-symbols-outlined text-primary-fixed-dim">payments</span>
                      <h2 className="font-headline text-xl font-bold text-primary tracking-tight">Pricing &amp; Timeline</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <label className="block text-sm font-bold text-secondary tracking-wide">Asking Price ($)</label>
                        <input
                          type="number"
                          value={formData.asking_price ?? ''}
                          onChange={e => set('asking_price', e.target.value)}
                          placeholder="50,000"
                          className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-bold text-secondary tracking-wide">Comparable Value ($)</label>
                        <input
                          type="number"
                          value={formData.comparable_market_value ?? ''}
                          onChange={e => set('comparable_market_value', e.target.value)}
                          placeholder="55,000"
                          className="w-full bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-2">
                      <label className="flex items-center space-x-4 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.price_negotiable ?? false}
                          onChange={e => set('price_negotiable', e.target.checked)}
                          className="w-6 h-6 rounded-lg border-outline-variant text-primary focus:ring-primary/20"
                        />
                        <div>
                          <span className="block font-headline text-sm font-bold text-primary tracking-tight">Price Negotiable</span>
                          <span className="text-xs text-secondary font-medium">Allows buyers to submit offers below asking.</span>
                        </div>
                      </label>
                      <div className="space-y-1">
                        <label className="block text-sm font-bold text-secondary tracking-wide">Preferred Close Date</label>
                        <input
                          type="date"
                          value={formData.preferred_close_date ?? ''}
                          onChange={e => set('preferred_close_date', e.target.value)}
                          className="w-full md:w-64 bg-surface-container-low border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-10">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex items-center space-x-2 text-secondary font-headline font-bold hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">arrow_back</span>
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="bg-primary text-on-primary px-12 py-4 rounded-xl font-headline font-bold tracking-tight shadow-xl shadow-primary/10 hover:brightness-125 transition-all flex items-center space-x-3"
                    >
                      <span>Continue to Media</span>
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Upgrade banner */}
              <div className="mt-12 bg-primary-fixed text-on-primary-fixed p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-primary/5">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary-container p-3 rounded-full text-on-primary-container">
                    <span className="material-symbols-outlined">rocket_launch</span>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold">Sell 2x Faster with Premium Maps</h4>
                    <p className="text-sm opacity-80">Add high-res drone topo overlays and boundary surveys for $49.</p>
                  </div>
                </div>
                <button className="bg-primary-container text-on-primary-container px-6 py-3 rounded-xl font-headline font-bold text-sm whitespace-nowrap hover:scale-105 transition-transform">
                  Upgrade Listing
                </button>
              </div>
            </>
          )}

          {/* ── Step 3 ── */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-8">
              <div className="bg-surface-container-lowest rounded-xl p-8 md:p-12 shadow-sm border border-surface-container">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                  {/* Photos Upload */}
                  <div className="space-y-4">
                    <label className="block text-primary font-headline font-bold text-lg">Property Photos *</label>
                    <label className="relative group cursor-pointer aspect-video bg-surface-container-low rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary-container transition-all">
                      <span className="material-symbols-outlined text-secondary text-4xl mb-2 group-hover:text-primary transition-colors">add_a_photo</span>
                      <p className="text-secondary text-sm group-hover:text-primary transition-colors font-medium">
                        {(formData.photos_urls ?? []).length > 0
                          ? `${formData.photos_urls.length} file(s) selected`
                          : 'Drag or tap to upload media'}
                      </p>
                      <p className="text-[10px] text-outline mt-1 uppercase tracking-wider">Supports JPG, PNG, MP4 up to 50MB</p>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/mp4"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => {
                          const files = Array.from(e.target.files ?? [])
                          setPhotoFiles(files)
                          set('photos_urls', files.map(f => f.name))
                        }}
                      />
                    </label>
                  </div>

                  {/* Contract Upload */}
                  <div className="space-y-4">
                    <label className="block text-primary font-headline font-bold text-lg">Contract or Title Document *</label>
                    <label className="relative group cursor-pointer aspect-video bg-surface-container-low rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary-container transition-all">
                      <span className="material-symbols-outlined text-secondary text-4xl mb-2 group-hover:text-primary transition-colors">description</span>
                      <p className="text-secondary text-sm group-hover:text-primary transition-colors font-medium">
                        {formData.contract_url ? formData.contract_url : 'Upload PDF or Scanned Docs'}
                      </p>
                      <p className="text-[10px] text-outline mt-1 uppercase tracking-wider">Required for verification</p>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => {
                          const file = e.target.files?.[0] ?? null
                          setContractFile(file)
                          set('contract_url', file?.name ?? '')
                        }}
                      />
                    </label>
                  </div>

                  {/* Additional Information */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="block text-primary font-headline font-bold text-lg">Additional Information</label>
                      <button
                        type="button"
                        onClick={generateDescription}
                        disabled={aiStreaming}
                        className="flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-fixed-dim transition-colors disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {aiStreaming ? 'hourglass_empty' : 'auto_awesome'}
                        </span>
                        {aiStreaming ? 'Writing…' : 'Write with AI'}
                      </button>
                    </div>
                    <textarea
                      value={formData.additional_information ?? ''}
                      onChange={e => set('additional_information', e.target.value)}
                      placeholder="Describe terrain features, access roads, utilities, or specific land use potential..."
                      rows={5}
                      className="w-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 rounded-xl text-on-surface placeholder:text-outline/60 p-5"
                    />
                  </div>

                  {/* Contact Preferences */}
                  <div className="md:col-span-2 space-y-4 pt-4">
                    <h3 className="text-primary font-headline font-bold text-lg border-b border-surface-container-low pb-2">Contact Preferences</h3>
                    <div className="flex flex-wrap gap-6 pt-2">
                      {['Email', 'Phone Call', 'Text / SMS'].map(opt => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={(formData.contact_methods ?? []).includes(opt)}
                            onChange={() => toggleArray('contact_methods', opt)}
                            className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface-container-low"
                          />
                          <span className="text-on-surface font-medium group-hover:text-primary transition-colors">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-16">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full sm:w-auto px-10 py-3.5 rounded-full bg-surface-container-high text-secondary font-headline font-bold tracking-tight hover:bg-surface-variant transition-all"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="w-full sm:w-auto px-14 py-3.5 rounded-full bg-primary text-on-primary font-headline font-bold tracking-tight hover:scale-105 transition-all shadow-xl shadow-primary/10"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Upgrade Banner */}
              <div className="bg-primary-fixed/30 border-l-4 border-primary p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="flex items-start gap-4 relative z-10">
                  <div className="bg-primary text-on-primary w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-primary">Get 5x More Views</h4>
                    <p className="text-sm">Upgrade to Premium for featured map placement and drone photography assistance.</p>
                  </div>
                </div>
                <button className="bg-primary text-on-primary px-6 py-2 rounded-lg font-headline font-bold text-sm tracking-tight relative z-10 whitespace-nowrap">
                  View Upgrade Plans
                </button>
                <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
              </div>
            </div>
          )}

          {/* ── Step 4 ── */}
          {currentStep === 4 && (
            <div className="flex-grow">
              <div className="bg-surface-container-lowest rounded-xl p-8 md:p-12 shadow-sm border border-outline-variant/10">
                <section className="space-y-6">

                  {/* Compliance checkboxes */}
                  <div className="grid grid-cols-1 gap-4">
                    <label className="group relative flex items-start gap-4 p-6 bg-surface-container-low rounded-xl border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                      <div className="flex items-center h-6">
                        <input
                          type="checkbox"
                          checked={formData.legal_confirmation ?? false}
                          onChange={e => set('legal_confirmation', e.target.checked)}
                          className="w-5 h-5 rounded border-outline text-primary focus:ring-primary transition-all"
                        />
                      </div>
                      <div>
                        <span className="block font-bold text-primary mb-1">Legal Accuracy Confirmation</span>
                        <span className="block text-sm text-secondary leading-relaxed">I certify that all property boundaries, zoning details, and environmental disclosures provided in this listing are accurate to the best of my knowledge and backed by official documentation.</span>
                      </div>
                    </label>

                    <label className="group relative flex items-start gap-4 p-6 bg-surface-container-low rounded-xl border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                      <div className="flex items-center h-6">
                        <input
                          type="checkbox"
                          checked={formData.platform_understanding ?? false}
                          onChange={e => set('platform_understanding', e.target.checked)}
                          className="w-5 h-5 rounded border-outline text-primary focus:ring-primary transition-all"
                        />
                      </div>
                      <div>
                        <span className="block font-bold text-primary mb-1">Platform Terms of Engagement</span>
                        <span className="block text-sm text-secondary leading-relaxed">I understand that LotScout serves as a digital cartography and listing platform and does not act as a legal representative or title agency in land transactions.</span>
                      </div>
                    </label>

                    <label className="group relative flex items-start gap-4 p-6 bg-surface-container-low rounded-xl border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                      <div className="flex items-center h-6">
                        <input
                          type="checkbox"
                          checked={formData.state_compliance ?? false}
                          onChange={e => set('state_compliance', e.target.checked)}
                          className="w-5 h-5 rounded border-outline text-primary focus:ring-primary transition-all"
                        />
                      </div>
                      <div>
                        <span className="block font-bold text-primary mb-1">State &amp; Federal Compliance</span>
                        <span className="block text-sm text-secondary leading-relaxed">I agree to abide by all regional land sale regulations, including environmental protection act requirements and local land-use bylaws relevant to this property.</span>
                      </div>
                    </label>
                  </div>

                  {/* Digital signature */}
                  <div className="mt-12 pt-8 border-t border-outline-variant/20">
                    <h3 className="text-lg font-bold text-primary mb-6">Digital Signature &amp; Date</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-secondary">Full Legal Name</label>
                        <input
                          type="text"
                          value={formData.digital_signature ?? ''}
                          onChange={e => set('digital_signature', e.target.value)}
                          placeholder="Johnathan Q. Surveyor"
                          className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-secondary">Effective Date</label>
                        <input
                          type="date"
                          value={formData.signature_date ?? TODAY}
                          onChange={e => set('signature_date', e.target.value)}
                          className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {submitError && (
                    <div className="p-4 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
                      {submitError}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-12">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="w-full md:w-auto px-8 py-3 font-bold text-secondary bg-surface-container-high rounded-xl hover:bg-surface-dim transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full md:w-auto px-12 py-3 font-bold text-on-primary bg-primary rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/10 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submitting && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
                      {submitting ? 'Submitting…' : 'Submit for Review'}
                    </button>
                  </div>
                </section>
              </div>

              {/* Upgrade banner */}
              <div className="mt-8 p-4 bg-primary-fixed rounded-xl flex items-center gap-4 border border-primary/5">
                <div className="bg-white/40 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-bold text-on-primary-fixed">Upgrade to Surveyor Pro</p>
                  <p className="text-xs">Get verified badges and 3D topographic mapping for this listing.</p>
                </div>
                <button className="text-xs font-bold text-primary underline decoration-2 underline-offset-4 px-4 py-2">Learn More</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
    </>
  )
}

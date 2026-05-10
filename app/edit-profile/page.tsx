'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/client';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
  'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [state, setState] = useState('');
  const [county, setCounty] = useState('');
  const [tier, setTier] = useState('');
  const [toastOk, setToastOk] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/sign-in'); return; }
      setEmail(user.email ?? '');
      const meta = (user.user_metadata ?? {}) as Record<string, string>;
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, bio, company_name, subscription_tier, state, county')
        .eq('id', user.id)
        .single();
      if (profileError) console.warn('[edit-profile] load error:', profileError.message);
      setFirstName(data?.first_name ?? meta.first_name ?? '');
      setLastName(data?.last_name ?? meta.last_name ?? '');
      setPhone(data?.phone ?? '');
      setBio(data?.bio ?? '');
      setCompanyName(data?.company_name ?? '');
      setState(data?.state ?? '');
      setCounty(data?.county ?? '');
      setTier(data?.subscription_tier ?? '');
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      id: user.id,
      email: user.email,
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
      company_name: companyName.trim() || null,
      state: state.trim() || null,
      county: county.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('id, first_name, last_name, email')
      .single();

    setSaving(false);
    if (error) {
      setToastOk(false);
      setToast('Save failed: ' + error.message);
    } else {
      setToastOk(true);
      setToast('Profile saved successfully!');
      setTimeout(() => { setToast(null); router.push('/profile'); }, 2000);
    }
  }

  if (loading) {
    return (
      <div className="bg-surface text-on-surface antialiased font-body min-h-screen">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface antialiased font-body">
      <Header />

      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toastOk ? 'bg-emerald-600' : 'bg-red-600'}`}>
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            {toastOk ? 'check_circle' : 'error'}
          </span>
          {toast}
        </div>
      )}

      <div className="pt-16 flex min-h-screen">
        <main className="flex-1 bg-surface-container-low p-8 md:p-12">
          <div className="max-w-5xl mx-auto space-y-12">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/30 pb-8">
              <div className="space-y-1">
                <h1 className="text-3xl font-headline font-extrabold text-primary tracking-tight">Edit Profile</h1>
                <p className="text-secondary font-medium">Update your digital identity and investment preferences on the LotScout network.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => router.push('/profile')} className="px-6 py-2.5 rounded-xl text-primary font-semibold border border-outline/20 hover:bg-surface-container-high transition-all">Discard Changes</button>
                <button onClick={handleSave} disabled={saving} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>

            {/* Profile Identity Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 bg-surface-container-lowest p-8 rounded-xl space-y-6">
                <h3 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">badge</span>
                  Profile Identity
                </h3>
                <div className="relative group w-40 h-40 mx-auto flex items-center justify-center bg-surface rounded-full border-4 border-surface shadow-md">
                  <span className="material-symbols-outlined text-primary/30" style={{ fontSize: '80px' }}>account_circle</span>
                  <button className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                  </button>
                </div>
                <p className="text-xs text-center text-secondary leading-relaxed">JPG, GIF or PNG. Max size of 2MB.</p>
              </div>

              <div className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-primary tracking-wide uppercase">First Name</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary-fixed-dim focus:bg-surface-container-lowest transition-all"
                      placeholder="First name"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-primary tracking-wide uppercase">Last Name</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-primary-fixed-dim focus:bg-surface-container-lowest transition-all"
                      placeholder="Last name"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-primary tracking-wide uppercase">Professional Bio</label>
                  <textarea
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary-fixed-dim focus:bg-surface-container-lowest transition-all"
                    placeholder="Describe your experience in land acquisition or development..."
                    rows={4}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Contact & Company Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="bg-surface-container-lowest p-8 rounded-xl space-y-6">
                <h3 className="font-headline text-xl font-bold text-primary">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase mb-1">Phone Number</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-primary-fixed-dim"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase mb-1">Email Address</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-primary font-medium opacity-60 cursor-not-allowed"
                      type="email"
                      value={email}
                      readOnly
                    />
                    <p className="text-[11px] text-secondary mt-1">Email cannot be changed here.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase mb-1">State</label>
                    <select
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-primary-fixed-dim"
                      value={state}
                      onChange={e => setState(e.target.value)}
                    >
                      <option value="">Select a state</option>
                      {US_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase mb-1">County</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-primary-fixed-dim"
                      type="text"
                      placeholder="e.g. Travis County"
                      value={county}
                      onChange={e => setCounty(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Company */}
              <div className="bg-surface-container-lowest p-8 rounded-xl space-y-6 flex flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="font-headline text-xl font-bold text-primary">Company</h3>
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase mb-1">Company Name</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-primary-fixed-dim"
                      placeholder="Your company or firm name"
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Account Management Section */}
            <section className="bg-surface-container-lowest p-8 rounded-xl space-y-8">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
                <h3 className="font-headline text-xl font-bold text-primary">Account Management</h3>
                {tier && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider">Current Tier:</span>
                    <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed text-xs font-bold rounded-full border border-primary-fixed-dim/30 capitalize">{tier}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <h4 className="font-headline font-bold text-primary">Subscription Plan</h4>
                  <p className="text-sm text-secondary leading-relaxed">Upgrade your plan to unlock more listings, advanced analytics, and priority support.</p>
                </div>
                <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                  <a href="/pricing" className="w-full md:w-auto px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all shadow-lg shadow-primary/10 active:scale-95 text-center">Upgrade Plan</a>
                </div>
              </div>
            </section>

            {/* Footer / Safety Note */}
            <footer className="bg-primary/5 p-6 rounded-2xl border border-primary-fixed-dim/20 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-headline font-bold text-primary">Content Safety &amp; Standards</h4>
                <p className="text-sm text-secondary leading-relaxed">
                  To maintain the professional ecosystem of LotScout, all profile content is moderated. Professional standards are enforced to ensure high-quality interactions.
                </p>
              </div>
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
}

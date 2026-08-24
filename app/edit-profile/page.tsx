'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import { containsProfanity } from '@/lib/profanity-filter';

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
  const [contactVisible, setContactVisible] = useState(false);
  const [toastOk, setToastOk] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    };
  }, [cropImageUrl]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/sign-in'); return; }
      setUserId(user.id);
      setEmail(user.email ?? '');
      const meta = (user.user_metadata ?? {}) as Record<string, string>;
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, bio, company_name, subscription_tier, state, county, avatar_url')
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
      setAvatarUrl(data?.avatar_url ?? meta.avatar_url ?? null);
      // Load contact visibility separately so a not-yet-migrated column can't break the main load.
      const { data: visRow } = await supabase
        .from('profiles')
        .select('contact_visible')
        .eq('id', user.id)
        .single();
      setContactVisible(visRow?.contact_visible === true);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    setSaving(true);
    setToast(null);

    const profileFields = [
      { label: 'first name', value: firstName },
      { label: 'last name', value: lastName },
      { label: 'phone', value: phone },
      { label: 'bio', value: bio },
      { label: 'company name', value: companyName },
      { label: 'state', value: state },
      { label: 'county', value: county },
    ];
    const profaneField = profileFields.find(field => containsProfanity(field.value));
    if (profaneField) {
      setSaving(false);
      setToastOk(false);
      setToast(`Please remove inappropriate language from ${profaneField.label}.`);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        firstName,
        lastName,
        phone,
        bio,
        companyName,
        state,
        county,
        contactVisible,
      }),
    });
    const json = await res.json().catch(() => ({}));
    const error = res.ok ? null : new Error(json.error || 'Save failed');

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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setToastOk(false);
      setToast('Image must be under 5MB.');
      e.target.value = '';
      return;
    }
    if (!userId) return;
    if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    setCropImageUrl(URL.createObjectURL(file));
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
    e.target.value = '';
  }

  async function handleCroppedAvatarSave() {
    if (!cropImageUrl || !userId) return;
    setUploading(true);
    try {
      const blob = await createCroppedAvatarBlob(cropImageUrl, cropZoom, cropX, cropY);
      const formData = new FormData();
      formData.append('file', blob, 'profile-avatar.png');
      const res = await fetch('/api/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        console.error('Avatar upload error:', data.error);
        throw new Error(data.error ?? 'Upload failed');
      }
      setAvatarUrl(data.url);
      setCropImageUrl(null);
      setToastOk(true);
      setToast('Profile picture updated!');
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setToastOk(false);
      setToast(err instanceof Error && err.message ? err.message : 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function cancelAvatarCrop() {
    if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    setCropImageUrl(null);
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
  }

  async function createCroppedAvatarBlob(imageUrl: string, zoom: number, offsetX: number, offsetY: number): Promise<Blob> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = imageUrl;
    });

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not prepare image editor');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const coverScale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * zoom;
    const drawWidth = image.naturalWidth * coverScale;
    const drawHeight = image.naturalHeight * coverScale;
    const maxShiftX = Math.max(0, (drawWidth - size) / 2);
    const maxShiftY = Math.max(0, (drawHeight - size) / 2);
    const clampedX = Math.max(-maxShiftX, Math.min(maxShiftX, offsetX));
    const clampedY = Math.max(-maxShiftY, Math.min(maxShiftY, offsetY));
    const dx = (size - drawWidth) / 2 + clampedX;
    const dy = (size - drawHeight) / 2 + clampedY;

    ctx.drawImage(image, dx, dy, drawWidth, drawHeight);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not save cropped image')), 'image/png', 0.95);
    });
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
        <main className="flex-1 bg-surface-container-low p-4 sm:p-8 md:p-12">
          <div className="max-w-5xl mx-auto space-y-5 sm:space-y-12">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 border-b border-outline-variant/30 pb-5 sm:pb-8">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-headline font-extrabold text-primary tracking-tight">Edit Profile</h1>
                <p className="text-secondary text-sm sm:text-base font-medium leading-snug">Update your profile and account details.</p>
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-4 w-full md:w-auto">
                <button onClick={() => router.push('/profile')} className="px-3 sm:px-6 py-2.5 rounded-xl text-primary text-sm font-semibold border border-outline/20 hover:bg-surface-container-high transition-all">Discard</button>
                <button onClick={handleSave} disabled={saving} className="px-4 sm:px-8 py-2.5 rounded-xl bg-[#1D9E75] text-white text-sm font-bold shadow-xl shadow-[#1D9E75]/20 hover:bg-[#14795A] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>

            {/* Profile Identity Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 bg-surface-container-lowest p-4 sm:p-8 rounded-xl space-y-4 sm:space-y-6">
                <h3 className="font-headline text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">badge</span>
                  Profile Identity
                </h3>
                <div className="relative group w-28 h-28 sm:w-40 sm:h-40 mx-auto flex items-center justify-center bg-surface rounded-full border-4 border-surface shadow-md overflow-hidden">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (firstName || lastName) ? (
                    <span className="text-primary/60 font-headline font-extrabold" style={{ fontSize: '52px' }}>
                      {`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || firstName.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-primary/30" style={{ fontSize: '80px' }}>account_circle</span>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <span className="material-symbols-outlined text-white animate-spin" style={{ fontSize: '36px' }}>progress_activity</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    aria-label="Upload profile picture"
                    className="absolute bottom-2 right-2 p-2 bg-[#1D9E75] text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-center text-secondary leading-relaxed">
                  {uploading ? 'Uploading...' : 'JPG, GIF or PNG. Max size of 5MB.'}
                </p>

                {cropImageUrl && (
                  <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 space-y-4">
                    <div>
                      <p className="text-sm font-bold text-primary">Position your photo</p>
                      <p className="text-xs text-secondary">Move and zoom until your profile image looks centered.</p>
                    </div>

                    <div className="mx-auto h-44 w-44 rounded-full overflow-hidden bg-surface shadow-inner border-4 border-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cropImageUrl}
                        alt="Avatar crop preview"
                        className="h-full w-full object-cover"
                        style={{ transform: `translate(${cropX / 3}px, ${cropY / 3}px) scale(${cropZoom})` }}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-secondary">Zoom</label>
                      <input
                        type="range"
                        min="1"
                        max="2.5"
                        step="0.01"
                        value={cropZoom}
                        onChange={e => setCropZoom(Number(e.target.value))}
                        className="w-full accent-[#1D9E75]"
                      />

                      <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto">
                        <span />
                        <button type="button" onClick={() => setCropY(y => Math.max(-180, y - 16))} className="rounded-lg bg-white px-3 py-2 text-primary shadow-sm border border-outline-variant/20">
                          ↑
                        </button>
                        <span />
                        <button type="button" onClick={() => setCropX(x => Math.max(-180, x - 16))} className="rounded-lg bg-white px-3 py-2 text-primary shadow-sm border border-outline-variant/20">
                          ←
                        </button>
                        <button type="button" onClick={() => { setCropX(0); setCropY(0); setCropZoom(1); }} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-secondary shadow-sm border border-outline-variant/20">
                          Reset
                        </button>
                        <button type="button" onClick={() => setCropX(x => Math.min(180, x + 16))} className="rounded-lg bg-white px-3 py-2 text-primary shadow-sm border border-outline-variant/20">
                          →
                        </button>
                        <span />
                        <button type="button" onClick={() => setCropY(y => Math.min(180, y + 16))} className="rounded-lg bg-white px-3 py-2 text-primary shadow-sm border border-outline-variant/20">
                          ↓
                        </button>
                        <span />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={cancelAvatarCrop} disabled={uploading} className="rounded-xl border border-outline/20 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-surface-container-high disabled:opacity-60">
                        Cancel
                      </button>
                      <button type="button" onClick={handleCroppedAvatarSave} disabled={uploading} className="rounded-xl bg-[#1D9E75] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#14795A] disabled:opacity-60">
                        {uploading ? 'Saving…' : 'Save Photo'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-8 bg-surface-container-lowest p-4 sm:p-8 rounded-xl space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-primary tracking-wide uppercase">First Name</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-on-surface focus:ring-2 focus:ring-[#1D9E75]/20 focus:bg-surface-container-lowest transition-all"
                      placeholder="First name"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-primary tracking-wide uppercase">Last Name</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-on-surface focus:ring-2 focus:ring-[#1D9E75]/20 focus:bg-surface-container-lowest transition-all"
                      placeholder="Last name"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-primary tracking-wide uppercase">Professional Bio</label>
                  <textarea
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 sm:p-4 text-on-surface focus:ring-2 focus:ring-[#1D9E75]/20 focus:bg-surface-container-lowest transition-all"
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
              <div className="bg-surface-container-lowest p-4 sm:p-8 rounded-xl space-y-4 sm:space-y-6">
                <h3 className="font-headline text-lg sm:text-xl font-bold text-primary">Contact Information</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase mb-1">Phone Number</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-lg px-3 sm:px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-[#1D9E75]/20"
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
                      className="w-full bg-surface-container-low border-none rounded-lg px-3 sm:px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-[#1D9E75]/20"
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
                      className="w-full bg-surface-container-low border-none rounded-lg px-3 sm:px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-[#1D9E75]/20"
                      type="text"
                      placeholder="e.g. Travis County"
                      value={county}
                      onChange={e => setCounty(e.target.value)}
                    />
                  </div>
                  <label className="flex items-start gap-3 pt-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                      checked={contactVisible}
                      onChange={e => setContactVisible(e.target.checked)}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-primary">Visible to other users</span>
                      <span className="block text-[11px] text-secondary leading-relaxed">
                        When on, your phone, email, website, and company are shown to other users on your profile and buyer requests. When off, your contact info stays private and others contact you through platform messaging.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Company */}
              <div className="bg-surface-container-lowest p-4 sm:p-8 rounded-xl space-y-4 sm:space-y-6 flex flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="font-headline text-lg sm:text-xl font-bold text-primary">Company</h3>
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase mb-1">Company Name</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-lg px-3 sm:px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-[#1D9E75]/20"
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
            <section className="bg-surface-container-lowest p-4 sm:p-8 rounded-xl space-y-5 sm:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
                <h3 className="font-headline text-lg sm:text-xl font-bold text-primary">Account Management</h3>
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
                  <a href="/pricing" className="w-full md:w-auto px-8 py-3 bg-[#1D9E75] text-white font-bold rounded-xl hover:bg-[#14795A] transition-all shadow-lg shadow-[#1D9E75]/10 active:scale-95 text-center">Upgrade Plan</a>
                </div>
              </div>
            </section>

            {/* Footer / Safety Note */}
            <footer className="bg-primary/5 p-4 sm:p-6 rounded-2xl border border-primary-fixed-dim/20 flex flex-col md:flex-row items-center gap-4 sm:gap-6">
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

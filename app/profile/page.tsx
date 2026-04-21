'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  company_name: string | null;
  tier: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? null);
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, bio, avatar_url, company_name, tier')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    }
    load();
  }, []);

  const firstName = profile?.first_name ?? '';
  const lastName = profile?.last_name ?? '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || email?.split('@')[0] || 'Your Profile';
  const nameParts = displayName.split(' ');
  const firstPart = nameParts[0];
  const restPart = nameParts.slice(1).join(' ');

  return (
    <div className="bg-surface text-on-surface font-body">
      <Header />

      <main className="pt-24 pb-20 max-w-screen-xl mx-auto px-8 space-y-12">
        {/* Hero Section */}
        <section className="bg-surface-container-low border border-outline-variant/30 rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-center gap-10">
            <div className="w-48 h-48 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-surface shrink-0 flex items-center justify-center">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="User profile photo"
                  className="w-full h-full object-cover"
                  src={profile.avatar_url}
                />
              ) : (
                <span className="material-symbols-outlined text-primary/30" style={{ fontSize: '80px' }}>account_circle</span>
              )}
            </div>
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="space-y-3">
                {profile?.tier && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-primary/20">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                      {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} Member
                    </span>
                  </div>
                )}
                <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-primary tracking-tighter leading-tight">
                  {firstPart}{restPart ? <> <span className="text-emerald-600">{restPart}</span></> : null}
                </h1>
                {profile?.company_name && (
                  <p className="text-secondary text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
                    {profile.company_name}
                  </p>
                )}
                {email && !profile?.company_name && (
                  <p className="text-secondary text-base max-w-2xl font-medium">{email}</p>
                )}
              </div>
              <div className="pt-2">
                <Link
                  className="inline-flex items-center gap-3 bg-primary text-on-primary px-8 py-4 rounded-2xl text-base font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                  href="/edit-profile"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
                  Edit Profile &amp; Account Settings
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Grid Layout for Bio & Criteria */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* About Section */}
          <section className="md:col-span-7 bg-white p-10 rounded-[2.5rem] border border-outline-variant/30 shadow-sm">
            <h2 className="text-2xl font-bold text-primary mb-6 font-headline">About</h2>
            <div className="space-y-4 text-on-surface-variant leading-relaxed font-body text-lg">
              {profile?.bio ? (
                <p>{profile.bio}</p>
              ) : (
                <p className="text-secondary italic">No bio added yet. <Link href="/edit-profile" className="text-primary hover:underline">Add one now →</Link></p>
              )}
            </div>
          </section>

          {/* Acquisition Criteria Section */}
          <section className="md:col-span-5 bg-primary p-10 rounded-[2.5rem] text-white shadow-sm relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-10">
              <span className="material-symbols-outlined" style={{ fontSize: '96px' }}>analytics</span>
            </div>
            <h2 className="text-2xl font-bold mb-8 text-white/90 font-headline">Account Details</h2>
            <div className="space-y-8">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Email</p>
                <p className="text-lg font-headline font-semibold break-all">{email ?? '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Membership</p>
                <p className="text-2xl font-headline font-semibold capitalize">{profile?.tier ?? 'Free'}</p>
              </div>
              {profile?.company_name && (
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50">Company</p>
                  <p className="text-xl font-headline font-semibold">{profile.company_name}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Active Portfolio Section */}
        <section className="space-y-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold text-primary font-headline">Active Portfolio</h2>
              <p className="text-secondary text-sm font-medium">Your public marketplace listings</p>
            </div>
            <div className="h-[1px] flex-1 bg-outline-variant/30 mx-8 hidden md:block"></div>
            <Link href="/marketplace" className="text-primary font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform bg-primary/5 px-4 py-2 rounded-lg">
              View Marketplace <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>

          <div className="bg-surface-container-high/30 border border-dashed border-outline-variant rounded-2xl p-6 text-center">
            <p className="text-secondary text-xs font-medium italic">NOTE: Listing gallery is only displayed for profiles with active, public marketplace listings.</p>
          </div>
        </section>
      </main>

      {/* Bottom Nav Bar (Mobile only) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-outline-variant/30 px-6 py-3 flex justify-between items-center z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-secondary">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-bold">Overview</span>
        </Link>
        <button className="flex flex-col items-center gap-1 text-secondary">
          <span className="material-symbols-outlined">filter_alt</span>
          <span className="text-[10px] font-medium">Criteria</span>
        </button>
        <button className="bg-primary p-3 rounded-full -mt-10 shadow-lg text-white">
          <span className="material-symbols-outlined">add</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-secondary">
          <span className="material-symbols-outlined">bookmark</span>
          <span className="text-[10px] font-medium">Saved</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </div>
    </div>
  );
}

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
  phone: string | null;
  contact_visible: boolean | null;
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
        .select('first_name, last_name, bio, avatar_url, company_name, phone, contact_visible')
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
  const showContact = profile?.contact_visible === true;

  return (
    <div className="bg-surface text-on-surface font-body">
      <Header />

      <main className="pt-24 pb-10 sm:pb-20 max-w-screen-xl mx-auto px-4 sm:px-8 space-y-5 sm:space-y-12">
        {/* Hero Section */}
        <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 md:p-14 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-center gap-5 sm:gap-10">
            <div className="w-24 h-24 sm:w-48 sm:h-48 rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-xl sm:shadow-2xl border-4 border-white bg-surface shrink-0 flex items-center justify-center">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="User profile photo"
                  className="w-full h-full object-cover"
                  src={profile.avatar_url}
                />
              ) : (
                <span className="material-symbols-outlined text-primary/30 text-5xl sm:text-[80px]">account_circle</span>
              )}
            </div>
            <div className="flex-1 space-y-4 sm:space-y-6 text-center md:text-left w-full min-w-0">
              <div className="space-y-2 sm:space-y-3 min-w-0">
                <h1 className="font-headline text-2xl sm:text-4xl md:text-6xl font-extrabold text-primary tracking-tight sm:tracking-tighter leading-tight break-words">
                  {firstPart}{restPart ? <> <span className="text-emerald-600">{restPart}</span></> : null}
                </h1>
                {profile?.company_name && (
                  <p className="text-secondary text-sm sm:text-lg md:text-xl max-w-2xl font-medium leading-snug sm:leading-relaxed">
                    {profile.company_name}
                  </p>
                )}
                {email && !profile?.company_name && (
                  <p className="text-secondary text-sm sm:text-base max-w-2xl font-medium break-all">{email}</p>
                )}
              </div>
              <div className="pt-2">
                <Link
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 sm:gap-3 bg-[#1D9E75] text-white px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold hover:bg-[#14795A] transition-all shadow-lg shadow-[#1D9E75]/20"
                  href="/edit-profile"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
                  <span className="sm:hidden">Edit Profile</span>
                  <span className="hidden sm:inline">Edit Profile &amp; Account Settings</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Combined About & Account Details */}
        <section className="bg-white p-4 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border border-outline-variant/30 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-primary mb-3 sm:mb-6 font-headline">About</h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed font-body text-sm sm:text-lg">
            {profile?.bio ? (
              <p>{profile.bio}</p>
            ) : (
              <p className="text-secondary italic">No bio added yet. <Link href="/edit-profile" className="text-primary hover:underline">Add one now →</Link></p>
            )}
          </div>

          <div className="mt-5 sm:mt-10 pt-5 sm:pt-8 border-t border-outline-variant/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">Email</p>
              <p className="text-sm sm:text-base font-headline font-semibold text-on-surface break-all">{showContact ? (email ?? '—') : 'Private'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">Phone</p>
              <p className="text-sm sm:text-base font-headline font-semibold text-on-surface break-all">{showContact ? (profile?.phone ?? '—') : 'Private'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">Company</p>
              <p className="text-sm sm:text-base font-headline font-semibold text-on-surface">{showContact ? (profile?.company_name ?? '—') : 'Private'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">Contact Visibility</p>
              <p className="text-sm sm:text-base font-headline font-semibold text-on-surface">{showContact ? 'Shown publicly' : 'Private'}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

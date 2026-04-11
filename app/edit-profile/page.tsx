'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function EditProfilePage() {
  const router = useRouter();
  return (
    <div className="bg-surface text-on-surface antialiased font-body">
      <Header />

      <div className="pt-16 flex min-h-screen">
        <main className="flex-1 bg-surface-container-low p-8 md:p-12">
          <div className="max-w-5xl mx-auto space-y-12">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/30 pb-8">
              <div className="space-y-1">
                <h1 className="text-4xl font-headline font-extrabold text-primary tracking-tight">Edit Profile</h1>
                <p className="text-secondary font-medium">Update your digital identity and investment preferences on the LotScout network.</p>
              </div>
              <div className="flex gap-4">
                <button className="px-6 py-2.5 rounded-xl text-primary font-semibold border border-outline/20 hover:bg-surface-container-high transition-all">Discard Changes</button>
                <button onClick={() => router.push('/profile')} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Save Profile</button>
              </div>
            </div>

            {/* Profile Identity Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 bg-surface-container-lowest p-8 rounded-xl space-y-6">
                <h3 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">badge</span>
                  Profile Identity
                </h3>
                <div className="relative group w-40 h-40 mx-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Profile preview"
                    className="w-full h-full rounded-full object-cover border-4 border-surface shadow-md"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtV0KtoFHTNEPt7J6TcuQgOUzQgcRwVpXeNZVLl3Xj6ohVrIQDacSXWK4NsAXRHdkZpA_aLPly1_cs3BMEi9qmgMHy8t8DzRB3IgS1PaqnXr0UDZc3FKdN0Ij0aaUORqh9yrJTwkTN16AVpZWUuzgXIP7Hbh0TOYdeFs3aSt_Sa2dNnXn2omcdqos7hmmwj6kEqI80LXeyP-xiqxPEvFbfrTLW-6bXEmyWRg76ccQf2d1IG7Sq0exgOeIOGU9nf8sopJNoskU1iNcj"
                  />
                  <button className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                  </button>
                </div>
                <p className="text-xs text-center text-secondary leading-relaxed">JPG, GIF or PNG. Max size of 2MB.</p>
              </div>

              <div className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl space-y-8">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-primary tracking-wide uppercase">Select Platform Role</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="relative flex flex-col p-4 border border-outline-variant/50 rounded-xl cursor-pointer hover:bg-surface-container-low transition-colors has-[:checked]:border-primary-container has-[:checked]:bg-primary-fixed/20 group">
                      <input defaultChecked className="hidden" name="role" type="radio" />
                      <span className="material-symbols-outlined text-primary mb-2">shopping_cart</span>
                      <span className="font-bold text-primary">Buyer</span>
                      <span className="text-xs text-secondary mt-1">Seeking land acquisitions</span>
                    </label>
                    <label className="relative flex flex-col p-4 border border-outline-variant/50 rounded-xl cursor-pointer hover:bg-surface-container-low transition-colors has-[:checked]:border-primary-container has-[:checked]:bg-primary-fixed/20 group">
                      <input className="hidden" name="role" type="radio" />
                      <span className="material-symbols-outlined text-primary mb-2">sell</span>
                      <span className="font-bold text-primary">Seller</span>
                      <span className="text-xs text-secondary mt-1">Listing land for sale</span>
                    </label>
                    <label className="relative flex flex-col p-4 border border-outline-variant/50 rounded-xl cursor-pointer hover:bg-surface-container-low transition-colors has-[:checked]:border-primary-container has-[:checked]:bg-primary-fixed/20 group">
                      <input className="hidden" name="role" type="radio" />
                      <span className="material-symbols-outlined text-primary mb-2">handshake</span>
                      <span className="font-bold text-primary">Both</span>
                      <span className="text-xs text-secondary mt-1">Full network access</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-primary tracking-wide uppercase">Professional Narrative</label>
                  <textarea
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary-fixed-dim focus:bg-surface-container-lowest transition-all"
                    placeholder="Describe your experience in land acquisition or development..."
                    rows={4}
                  />
                </div>
              </div>
            </section>

            {/* Contact & Company Verification Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="bg-surface-container-lowest p-8 rounded-xl space-y-6">
                <h3 className="font-headline text-xl font-bold text-primary">Contact Information</h3>
                <div className="space-y-4">
                  {/* Phone */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-secondary uppercase mb-1">Phone Number</label>
                      <input
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-primary-fixed-dim"
                        type="tel"
                        defaultValue="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-outline mb-1">PUBLIC</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input defaultChecked className="sr-only peer" type="checkbox" />
                        <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                      </label>
                    </div>
                  </div>
                  {/* Website */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-secondary uppercase mb-1">Website URL</label>
                      <input
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-primary-fixed-dim"
                        type="url"
                        defaultValue="www.lotscout-investments.com"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-outline mb-1">PUBLIC</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input className="sr-only peer" type="checkbox" />
                        <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                      </label>
                    </div>
                  </div>
                  {/* Email */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-secondary uppercase mb-1">Email Address</label>
                      <input
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-primary-fixed-dim"
                        type="email"
                        defaultValue="executive@lotscout.com"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-outline mb-1">PUBLIC</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input defaultChecked className="sr-only peer" type="checkbox" />
                        <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Verification */}
              <div className="bg-surface-container-lowest p-8 rounded-xl space-y-6 flex flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="font-headline text-xl font-bold text-primary">Company Verification</h3>
                  <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold rounded-full tracking-widest uppercase">Pending</span>
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase mb-1">Legal Company Name</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-primary-fixed-dim"
                      placeholder="LotScout Holdings LLC"
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary uppercase mb-1">EIN Number (Tax ID)</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-primary font-medium focus:ring-2 focus:ring-primary-fixed-dim"
                      placeholder="XX-XXXXXXX"
                      type="text"
                    />
                  </div>
                  <div className="p-4 bg-primary-fixed/10 border border-primary-fixed-dim/20 rounded-xl mt-4">
                    <p className="text-xs text-primary leading-relaxed">
                      <strong>Verification Protocol:</strong> Once submitted, our compliance team will review your credentials within 48 business hours. Verified accounts receive the &quot;Institutional Grade&quot; badge.
                    </p>
                  </div>
                </div>
                <button className="w-full mt-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-colors shadow-lg shadow-primary/10">Submit for Verification</button>
              </div>
            </section>

            {/* Account Management Section */}
            <section className="bg-surface-container-lowest p-8 rounded-xl space-y-8">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
                <h3 className="font-headline text-xl font-bold text-primary">Account Management</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider">Current Tier:</span>
                  <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed text-xs font-bold rounded-full border border-primary-fixed-dim/30">Institutional</span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <h4 className="font-headline font-bold text-primary">Subscription Plan</h4>
                  <p className="text-sm text-secondary leading-relaxed">Your current institutional plan includes unlimited listings, advanced analytics, and priority verification support. Billing occurs annually on the 1st of January.</p>
                </div>
                <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                  <a href="/pricing" className="w-full md:w-auto px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all shadow-lg shadow-primary/10 active:scale-95 text-center">Upgrade Plan</a>
                  <button className="text-xs font-bold text-error/60 hover:text-error transition-colors underline decoration-error/30 hover:decoration-error decoration-2 underline-offset-4">Delete Account</button>
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
                  To maintain the professional ecosystem of LotScout, all profile content and uploaded images are moderated. Professional standards are enforced to ensure high-quality interactions across our institutional-grade platform.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Compliance ID</p>
                <p className="text-xs font-mono font-bold text-primary">LS-9981-X</p>
              </div>
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
}

import Header from '@/components/Header';

export default function ProfilePage() {
  return (
    <div className="bg-surface text-on-surface font-body">
      <Header />

      <main className="pt-24 pb-20 max-w-screen-xl mx-auto px-8 space-y-12">
        {/* Hero Section */}
        <section className="bg-surface-container-low border border-outline-variant/30 rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-center gap-10">
            <div className="w-48 h-48 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-surface shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="User profile photo"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmNgzg4y4yz_VQjZRYTjpLkzYOi1ZZWgi_od1yGoc_6rDTh-nPeN8b92IZHlHEEliJSAI-O5QgwF9cooaViCMuwBcKpsXk2qkoZ8pC9XRzca9Dn75Fa4UeATAC8TihZkyMZYYS-ULNQ7lMlY1uVOATXyuptqawfNVtJA5kABkRZjbCfURUgqQSPklw4g4a8hcCAd9W32BDAK2Mjj712GoVrimTsQZuyzu8DkCrR1CVxys91EFCUHNHAQluW3gLleL2JXiWZCD0B0DT"
              />
            </div>
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="space-y-3">
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-primary/20">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Verified Buyer
                  </span>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-primary/20">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Verified Seller
                  </span>
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-primary font-headline">Alex Rivers</h1>
                <p className="text-secondary text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
                  Principal Strategist at Terra Capital Group &bull; 15+ Years in Utility-Scale Solar &amp; Residential Land Acquisition.
                </p>
              </div>
              <div className="pt-2">
                <a
                  className="inline-flex items-center gap-3 bg-primary text-on-primary px-8 py-4 rounded-2xl text-base font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                  href="#settings"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
                  Edit Profile &amp; Account Settings
                </a>
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
              <p>Specializing in the intersection of land conservation and sustainable development, I facilitate high-value transactions that bridge institutional capital with prime raw land opportunities. My approach is data-first, leveraging advanced geospatial analytics to identify untapped potential in the Southeastern United States.</p>
              <p>Having closed over $450M in land assets, I understand the complexities of zoning, environmental mitigation, and title remediation. I am actively seeking 500+ acre parcels for renewable energy infrastructure.</p>
            </div>
          </section>

          {/* Acquisition Criteria Section */}
          <section className="md:col-span-5 bg-primary p-10 rounded-[2.5rem] text-white shadow-sm relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-10">
              <span className="material-symbols-outlined" style={{ fontSize: '96px' }}>analytics</span>
            </div>
            <h2 className="text-2xl font-bold mb-8 text-white/90 font-headline">Acquisition Criteria</h2>
            <div className="space-y-8">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Target Scale</p>
                <p className="text-2xl font-headline font-semibold">500 - 2,500 Acres</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Zoning Preference</p>
                <p className="text-2xl font-headline font-semibold">Agricultural, Industrial-Light</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Key Geographies</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="bg-white/10 px-4 py-2 rounded-xl text-sm font-medium border border-white/10">North Carolina</span>
                  <span className="bg-white/10 px-4 py-2 rounded-xl text-sm font-medium border border-white/10">Georgia</span>
                  <span className="bg-white/10 px-4 py-2 rounded-xl text-sm font-medium border border-white/10">South Carolina</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Active Portfolio Section */}
        <section className="space-y-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold text-primary font-headline">Active Portfolio</h2>
              <p className="text-secondary text-sm font-medium">3 Public Listings Managed by Alex Rivers</p>
            </div>
            <div className="h-[1px] flex-1 bg-outline-variant/30 mx-8 hidden md:block"></div>
            <button className="text-primary font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform bg-primary/5 px-4 py-2 rounded-lg">
              View Marketplace <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Property Card 1 */}
            <div className="group bg-white border border-outline-variant/30 rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="h-64 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Property listing"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4cef9biofTlffz4fGxdBvBcFwiHk08cIU4yzKTEhK3afJ4HaoL3UWhyDbH8zrJZdXZAz7mDd7hXt9XA55yTuAWFO609h1Lu9SJRBUrA0NkaAUPMCoFvnbZZNjkbfsZO3e8s_rmlQvZR2GKdjrXwFG5BAGYgDsFM0GLo9wHIbINGGkzVyBz__YnK1fIH506blOh3xUSg6_lzcoqVRcBFuWB8ApuaU6espnPad_2RqCfHk64iOaS-F-irR6V9Am2nR2Lum2rDIhIXEo"
                />
                <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-primary shadow-lg border border-outline-variant/20">
                  $2,450,000
                </div>
              </div>
              <div className="p-8 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-primary truncate font-headline">Willow Creek Valley</h3>
                  <p className="text-secondary text-sm flex items-center gap-1.5 mt-1.5 font-medium">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>location_on</span> Asheville, NC
                  </p>
                </div>
                <div className="flex gap-6 pt-2">
                  <div className="space-y-1">
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Acreage</p>
                    <p className="text-base font-bold text-primary">145 AC</p>
                  </div>
                  <div className="w-[1px] h-10 bg-outline-variant/50"></div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Zoning</p>
                    <p className="text-base font-bold text-primary">AG-1</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Card 2 */}
            <div className="group bg-white border border-outline-variant/30 rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="h-64 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Property listing"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYyWMJLhn15jf1B5gXtnCrDXEnj9MVUFI1sGrfmUIZQ0o9tQLgvcgHrjCIOUmaQoC5InXyQ5Iz750wxX-0bG4dfHaK0eYqlFxR6I5DjOGnIXW7PJlMTnooYfgYPXj7nalhDCnBrIurTEPtjl3PqREQfFIE1Y3DDFnFpSWV8L97nKTjuHjfCqDq6Qt0NVoVSGLfhE3jRLx1xzwVpGRbMniKi-sGswANlCMohSCM3hudUWvAZUQrfski7KOP7fIz3RbirwGx-vyggx9c"
                />
                <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-primary shadow-lg border border-outline-variant/20">
                  $890,000
                </div>
              </div>
              <div className="p-8 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-primary truncate font-headline">Oconee Lake Parcel</h3>
                  <p className="text-secondary text-sm flex items-center gap-1.5 mt-1.5 font-medium">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>location_on</span> Greensboro, GA
                  </p>
                </div>
                <div className="flex gap-6 pt-2">
                  <div className="space-y-1">
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Acreage</p>
                    <p className="text-base font-bold text-primary">32 AC</p>
                  </div>
                  <div className="w-[1px] h-10 bg-outline-variant/50"></div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Zoning</p>
                    <p className="text-base font-bold text-primary">RES-L</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Card 3 */}
            <div className="group bg-white border border-outline-variant/30 rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="h-64 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Property listing"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJMSHPOmwAvAD7VClrUjMXhcGCDU9q3sKuFfmaU2DEaIw7_TYd2jQfOQ3zo7BmCnhz1ao4DMTqsMIsMA-c1pEk2iAH72ZIZuZnQyv9ctsnmKx_OT5Cwzf9GP0lcuDWUG93PHuihWwldDwtsztABXpMDW0RPmnxYQuM2gVDW_sl273zD0_H4krJOzPVOxrS-YT7hC-prTFIdFy4L4M7Omq_Y9maXzUIbQUGLGgZTqiN9HKC1aZVyUOZmQTJ9bpMaFAulQVdrOMXb_du"
                />
                <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-primary shadow-lg border border-outline-variant/20">
                  $12,700,000
                </div>
              </div>
              <div className="p-8 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-primary truncate font-headline">Blue Ridge Plateau</h3>
                  <p className="text-secondary text-sm flex items-center gap-1.5 mt-1.5 font-medium">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>location_on</span> Boone, NC
                  </p>
                </div>
                <div className="flex gap-6 pt-2">
                  <div className="space-y-1">
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Acreage</p>
                    <p className="text-base font-bold text-primary">1,200 AC</p>
                  </div>
                  <div className="w-[1px] h-10 bg-outline-variant/50"></div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Zoning</p>
                    <p className="text-base font-bold text-primary">TIMB-1</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-high/30 border border-dashed border-outline-variant rounded-2xl p-6 text-center">
            <p className="text-secondary text-xs font-medium italic">NOTE: Listing gallery is only displayed for profiles with active, public marketplace listings.</p>
          </div>
        </section>
      </main>

      {/* Bottom Nav Bar (Mobile only) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-outline-variant/30 px-6 py-3 flex justify-between items-center z-50">
        <button className="flex flex-col items-center gap-1 text-secondary">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-bold">Overview</span>
        </button>
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

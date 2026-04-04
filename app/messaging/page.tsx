import Header from '@/components/Header';

export default function MessagingPage() {
  return (
    <div className="bg-surface font-body text-on-surface overflow-hidden h-screen flex flex-col">
      <Header />

      {/* Main Layout */}
      <main className="flex flex-1 pt-16 h-full overflow-hidden">
        {/* SideNavBar */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] flex flex-col border-r border-outline-variant/20 bg-white w-64 shadow-none font-['Inter'] text-sm font-medium">
          <nav className="flex-1 py-4 space-y-1">
            <a className="flex items-center gap-3 bg-primary/5 text-primary border-r-4 border-primary px-6 py-3 transition-colors" href="#">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
              Messages
            </a>
            <a className="flex items-center gap-3 text-secondary px-6 py-3 hover:bg-surface-container transition-colors" href="#">
              <span className="material-symbols-outlined">inbox</span>
              Inbox
            </a>
            <a className="flex items-center gap-3 text-secondary px-6 py-3 hover:bg-surface-container transition-colors" href="#">
              <span className="material-symbols-outlined">archive</span>
              Archived
            </a>
            <a className="flex items-center gap-3 text-secondary px-6 py-3 hover:bg-surface-container transition-colors" href="#">
              <span className="material-symbols-outlined">drafts</span>
              Drafts
            </a>
            <div className="pt-4 mt-4 border-t border-outline-variant/10">
              <a className="flex items-center gap-3 text-secondary px-6 py-3 hover:bg-surface-container transition-colors" href="#">
                <span className="material-symbols-outlined">settings</span>
                Settings
              </a>
            </div>
          </nav>
          <div className="p-4 border-t border-outline-variant/10 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="w-10 h-10 rounded-full bg-surface-container-high object-cover"
              alt="Close-up portrait of a professional land advisor in a modern office with natural light"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9Ktglef8AI4ykXAWzOB9XzckpYb0f07uLTLy5mc9tg1kEKR_O96hlZ_l4cOctEZLpQDQhI4DVgSmfMJPQkoQawSBaulkGQP2jlovQqHDQOc0uMIZv2a4UDPROG-0OAZo1QN7VJXHGPyoX9HvrQZ0K8wtw8hbhqsUyultmNZ2B25fN7sV0zQEDGXUi6er36ff3kRAVhORs9cJ0zYd1cGzOu-TFyZ4iLr834wtiYQdYwsKwgwtPLz5L-daOjH-cqsl2MRPBhg0s8YjW"
            />
            <div>
              <p className="font-bold text-primary">LotScout Messenger</p>
              <p className="text-xs text-secondary">Expert Land Advisory</p>
            </div>
          </div>
        </aside>

        {/* Messenger Layout Wrapper */}
        <section className="flex flex-1 ml-64 overflow-hidden">
          {/* Conversation List */}
          <div className="w-80 flex flex-col bg-white border-r border-outline-variant/15">
            <div className="p-6">
              <h2 className="font-headline text-xl font-extrabold tracking-tight text-primary mb-4">Conversations</h2>
              <div className="relative">
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg px-10 py-2.5 text-sm focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="Search buyers or lots..."
                  type="text"
                />
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-lg">search</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-6">
              {/* Active State */}
              <div className="p-4 mx-2 rounded-xl bg-surface-container-lowest border border-primary/20 shadow-sm cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-headline font-bold text-sm text-primary">
                    <a className="hover:underline" href="#">Marcus Vance</a>
                  </span>
                  <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">2m ago</span>
                </div>
                <p className="text-[11px] font-semibold text-primary/70 mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">landscape</span>
                  Blackwood Ridge
                </p>
                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">The soil analysis reports came back positive. How do you want to proceed with the title transfer?</p>
              </div>
              {/* Inactive Conversations */}
              <div className="p-4 mx-2 mt-2 rounded-xl hover:bg-surface-container transition-colors cursor-pointer border border-transparent">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-headline font-bold text-sm text-primary">
                    <a className="hover:underline" href="#">Marcus Vance</a>
                  </span>
                  <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">1h ago</span>
                </div>
                <p className="text-[11px] font-semibold text-secondary mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">person_search</span>
                  Acquisition Inquiry
                </p>
                <p className="text-xs text-secondary line-clamp-1 italic">Shared requirements list for Texas Hill Country...</p>
              </div>
              <div className="p-4 mx-2 mt-2 rounded-xl hover:bg-surface-container transition-colors cursor-pointer border border-transparent">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-headline font-bold text-sm text-primary">
                    <a className="hover:underline" href="#">Marcus Vance</a>
                  </span>
                  <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">Yesterday</span>
                </div>
                <p className="text-[11px] font-semibold text-primary/70 mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">landscape</span>
                  Oakhaven Estate
                </p>
                <p className="text-xs text-secondary line-clamp-1 italic">I&apos;ve reviewed the topographical survey...</p>
              </div>
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-surface-container-lowest">
            {/* Chat Header */}
            <div className="h-20 px-8 flex items-center justify-between bg-white border-b border-outline-variant/10">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-fixed"
                  alt="Professional headshot of a businessman in a navy suit with a background of blurred green trees"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxMUi3MVww-iuRtpMWbjGnO1i1kALiwAYbsHAmIhBA_s9NlWLaIy5dpJT45Y45LwC10tpbzQxuq307zV1buSIhVe6Jf0C_OrgrUUkmnXOwtfdYbROrxpgx-1qhvXuFEEI5NVNYoA63ukHy01PT29mgXMpT-ndcBHhk-cLovujZDoVG0uMvdSmB7PPx0ByzPEIJl4dHt9p2BdF-I1CJObVSDNMC1vfelexF1_MGP2QJnuUk-reEHkxD8nyDwgJBALT90l47v2PTK-cB"
                />
                <div>
                  <h3 className="font-headline font-extrabold text-primary leading-tight">
                    <a className="hover:underline" href="#">Julian Thorne</a>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <a className="text-xs font-semibold text-secondary hover:text-primary transition-colors underline decoration-outline-variant/30" href="#">Lot #442: Blackwood Ridge</a>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 rounded-lg text-secondary hover:bg-surface-container transition-all">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 hide-scrollbar">
              <div className="flex justify-center">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] bg-surface-container px-3 py-1 rounded-full">Wednesday, October 24</span>
              </div>
              {/* Received Message */}
              <div className="flex items-end gap-3 max-w-[80%]">
                <div className="flex flex-col gap-1">
                  <div className="bg-surface-container-low p-4 rounded-2xl rounded-bl-none text-sm leading-relaxed text-on-surface">
                    Hello Julian, I&apos;ve just uploaded the initial site analysis for Blackwood Ridge. The drainage slope looks much better than the adjacent lot.
                  </div>
                  <span className="text-[10px] text-secondary ml-1">10:14 AM</span>
                </div>
              </div>
              {/* Sent Message */}
              <div className="flex items-end gap-3 max-w-[80%] ml-auto flex-row-reverse">
                <div className="flex flex-col items-end gap-1">
                  <div className="bg-primary text-on-primary p-4 rounded-2xl rounded-br-none text-sm leading-relaxed shadow-sm">
                    That&apos;s excellent news. Have you had a chance to look at the zoning restrictions for the north-east corner? We were hoping to clear that area for the main driveway.
                  </div>
                  <span className="text-[10px] text-secondary mr-1">10:42 AM</span>
                </div>
              </div>
              {/* Received Message with Attachment */}
              <div className="flex items-end gap-3 max-w-[80%]">
                <div className="flex flex-col gap-1">
                  <div className="bg-surface-container-low p-4 rounded-2xl rounded-bl-none text-sm leading-relaxed text-on-surface">
                    <p>I&apos;m reviewing the environmental impact statement now. It seems there are no protected flora species in that specific zone.</p>
                    <div className="mt-4 p-3 bg-white rounded-xl border border-outline-variant/20 flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-emerald-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-800">description</span>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold text-primary truncate">Blackwood_Soil_Report_V2.pdf</p>
                        <p className="text-[10px] text-secondary">4.2 MB • PDF Document</p>
                      </div>
                      <button className="material-symbols-outlined text-primary p-1">download</button>
                    </div>
                  </div>
                  <span className="text-[10px] text-secondary ml-1">11:05 AM</span>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-outline-variant/10">
              <div className="bg-surface-container-low rounded-2xl p-2 flex items-center gap-2">
                <button className="p-2 text-primary hover:bg-surface-container-high rounded-xl transition-all">
                  <span className="material-symbols-outlined">add_circle</span>
                </button>
                <input
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
                  placeholder="Type your message here..."
                  type="text"
                />
                <div className="flex items-center gap-1">
                  <button className="p-2 text-secondary hover:bg-surface-container-high rounded-xl transition-all">
                    <span className="material-symbols-outlined">mood</span>
                  </button>
                  <button className="bg-primary text-on-primary p-2.5 rounded-xl flex items-center justify-center shadow-md hover:opacity-90 active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Contextual Sidebar */}
          <aside className="w-72 bg-white border-l border-outline-variant/15 flex flex-col">
            {/* Lot Details (Active) */}
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b border-outline-variant/5">
                <h3 className="font-headline font-extrabold text-primary text-lg tracking-tight mb-1">Lot Details</h3>
                <p className="text-xs text-secondary">Project: Blackwood Ridge Phase II</p>
              </div>
              <div className="p-6 space-y-8 overflow-y-auto hide-scrollbar flex-1">
                {/* Map Preview */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest">Location Preview</h4>
                  <div className="rounded-xl overflow-hidden aspect-video bg-surface-container-high relative group cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="w-full h-full object-cover"
                      alt="Lush green expansive countryside landscape under a clear sky, showing property boundaries in the distance"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZMtd2Zayf3Tn9Qd2Rs6pE-DyLG-7gLnSCBZIfKLbNKNB3VhX-FSETfsugyXO28GSADCLhOx4tNFDSUPpX5eXuIctw971IovSH91ieDO9fIwXkBU29ZQxoRXbDLfjSlvtRaRfPyK80Fd6ioOxdxy-fqv-oaIsT0I8l5AXc2QvJ4hhDWzzG4nm4V_GRza8Cl7wDcKAB7_zGdYxUlF3e1c6ec5HZlS4zoFfiLd8Pun9oaBkhJ5SRio4jTcXYW3wJnoam7hPqah5XFbi9"
                    />
                    <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                      <button className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold text-primary flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-sm">open_in_full</span>
                        VIEW MAP
                      </button>
                    </div>
                  </div>
                </div>
                {/* Shared Documents */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest">Shared Documents</h4>
                    <button className="text-[10px] font-bold text-primary hover:underline">VIEW ALL</button>
                  </div>
                  <div className="space-y-3">
                    <div className="group flex items-center gap-3 p-2 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded bg-secondary-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-lg">description</span>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[11px] font-bold text-primary truncate">Title_Deed_BWR.pdf</p>
                        <p className="text-[9px] text-secondary">Oct 12, 2023</p>
                      </div>
                      <span className="material-symbols-outlined text-sm text-outline group-hover:text-primary">download</span>
                    </div>
                    <div className="group flex items-center gap-3 p-2 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded bg-secondary-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-lg">analytics</span>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[11px] font-bold text-primary truncate">Soil_Analysis_Report.pdf</p>
                        <p className="text-[9px] text-secondary">Oct 24, 2023</p>
                      </div>
                      <span className="material-symbols-outlined text-sm text-outline group-hover:text-primary">download</span>
                    </div>
                  </div>
                </div>
                {/* Shared Media */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest">Shared Media</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="aspect-square rounded-lg bg-surface-container-high overflow-hidden cursor-pointer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        alt="High angle view of a lush green property plot with distinct boundary lines and surrounding trees"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpYzf_ekACKNMGm0bdtn7qpl-fiFAmrmIyczSvYXCiYnmW4noYKTePbYTUYow8PsHJTF-zjyFikus9lcuFffre5HfA4JcAf-Bn7fV8HWLn4Ql5QOgV0tKogCCvqVP5M0yGFp0mZdWMVck9hNxQz3DNK2AAt0wfNIEry_hYo2BzLYJhWuwZReVEbHcGJ3f8BKrwdkj767UP78X8trBRbvL8bW4owlCbn3eM1-e06a1Uw14eMtw6lvWGBqf4FXtT0FgtO3RicfirMjDj"
                      />
                    </div>
                    <div className="aspect-square rounded-lg bg-surface-container-high overflow-hidden cursor-pointer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        alt="Sunlight filtering through a dense grove of trees on a rural land property, creating deep shadows"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjCY0qC1mWqWStLW5Hxa_f5sVjWTA4fkgG0SnQlDiAHfs-2WkSeicRcTQQCoWg9aMXt7-2q3cEQO75jxzScxp9kWyuZPes7_NGw8f0SbvRgWN-Y18Uvg_AxtYmzxcsy4mqwejpfgDoGpZLkw3Y7L4RwIizmRM0iBNJb2QjuRgu1t1e_yyKxjAZc6AovaXPVFh6M1zBBuNjewBJopTi2pA_WTcxiLmjPhSe59J5GhQaKwF2-WeP0I5qv4QKj18xNsiXEkCCzMv-2u4k"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-surface-container-low/30">
                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/20 text-primary font-headline font-bold text-xs hover:bg-primary hover:text-on-primary transition-all shadow-sm">
                  <span className="material-symbols-outlined text-sm">share</span>
                  Share Property Details
                </button>
              </div>
            </div>

            {/* Buyer Requirements (Hidden) */}
            <div className="hidden flex-1 flex-col">
              <div className="p-6 border-b border-outline-variant/5">
                <h3 className="font-headline font-extrabold text-primary text-lg tracking-tight mb-1">Buyer Requirements</h3>
                <p className="text-xs text-secondary">Lead: Elena Rodriguez</p>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto hide-scrollbar flex-1">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Target Location</h4>
                    <p className="text-sm font-semibold text-primary">Texas Hill Country, West Austin</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Budget Range</h4>
                    <p className="text-sm font-semibold text-primary">$450k – $800k</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Acreage</h4>
                    <p className="text-sm font-semibold text-primary">5 - 15 Acres</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Primary Use Case</h4>
                    <p className="text-sm font-semibold text-primary leading-relaxed">Single-family residential development with specific interest in agricultural exemptions.</p>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl space-y-3">
                  <h4 className="text-[10px] font-bold text-secondary uppercase tracking-widest">Saved Searches</h4>
                  <ul className="space-y-2">
                    <li className="text-xs flex items-center gap-2 text-primary font-medium">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Flat terrain preferred
                    </li>
                    <li className="text-xs flex items-center gap-2 text-primary font-medium">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Existing utility hookups
                    </li>
                  </ul>
                </div>
              </div>
              <div className="p-6 bg-surface-container-low/30">
                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/20 text-primary font-headline font-bold text-xs hover:bg-primary hover:text-on-primary transition-all">
                  <span className="material-symbols-outlined text-sm">search</span>
                  Find Matching Lots
                </button>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

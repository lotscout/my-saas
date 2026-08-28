import Header from '@/components/Header';
import { PageHeader, SurfaceCard } from '@/components/ui/LotScoutUI';

const supportItems = [
  {
    title: 'Account & billing',
    body: 'Get help with login issues, membership access, plan changes, invoices, and billing questions.',
    icon: 'account_circle',
  },
  {
    title: 'Listings & leads',
    body: 'Report inaccurate listing or lead details, request updates, or ask about seller/buyer messaging.',
    icon: 'real_estate_agent',
  },
  {
    title: 'Deal analysis',
    body: 'Questions about submitted reports, turnaround times, sample reports, and property review scope.',
    icon: 'analytics',
  },
];

export default function SupportPage() {
  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Header />
      <main className="pt-24 px-4 sm:px-6 md:px-10 pb-20 min-h-screen max-w-[1180px] mx-auto">
        <PageHeader
          title={<>LotScout <span className="text-[#1D9E75]">Support</span></>}
          description="Need help with your account, listings, leads, messages, or deal analysis requests? Reach the LotScout team here."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
          {supportItems.map(item => (
            <SurfaceCard key={item.title} className="p-5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl text-[#1D9E75]">{item.icon}</span>
              </div>
              <h2 className="font-headline text-xl font-extrabold text-primary mb-2">{item.title}</h2>
              <p className="text-sm text-secondary leading-relaxed">{item.body}</p>
            </SurfaceCard>
          ))}
        </div>

        <SurfaceCard className="p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#1D9E75] mb-2">Contact</p>
            <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mb-3">Email LotScout support</h2>
            <p className="text-sm sm:text-base text-secondary leading-relaxed mb-6">
              Send account, lead, listing, marketplace, or report questions to support. Include the page URL, listing/lead title, and screenshots if helpful.
            </p>
            <a
              href="mailto:support@lotscout.com"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D9E75] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#14795A] transition-colors"
            >
              <span className="material-symbols-outlined text-lg">mail</span>
              support@lotscout.com
            </a>
          </div>
        </SurfaceCard>

        <section className="mt-7 rounded-2xl border-2 border-[#1D9E75] bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="font-headline text-lg font-extrabold text-primary mb-2">Legal and due diligence notice</h2>
          <p className="text-sm text-secondary leading-relaxed">
            LotScout provides marketplace, lead, directory, messaging, and analysis tools for informational and workflow purposes only. Users are solely responsible for independent due diligence and should consult qualified legal, financial, tax, title, survey, engineering, environmental, brokerage, and local government professionals before making transaction decisions.
          </p>
        </section>
      </main>
    </div>
  );
}

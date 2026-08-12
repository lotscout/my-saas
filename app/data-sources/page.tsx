import Header from '@/components/Header';

export default function DataSourcesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F5F8F6] px-4 pt-24 pb-16">
        <section className="mx-auto max-w-3xl rounded-3xl border border-[#E2EAE6] bg-white p-6 shadow-sm sm:p-10">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#1D9E75]">LotScout</p>
          <h1 className="font-headline text-3xl font-extrabold text-[#0D1F16] sm:text-5xl">Data Sources</h1>
          <p className="mt-5 text-sm leading-7 text-[#5C6D64]">
            LotScout combines user-submitted listings and buyer requests with market, property, mapping, and analysis data from third-party providers and public records where available.
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5C6D64]">
            Data may be incomplete, delayed, estimated, or interpreted by automated systems. Always verify parcel, ownership, entitlement, zoning, utility, environmental, tax, and transaction details with authoritative sources before acting.
          </p>
          <p className="mt-8 text-sm text-[#5C6D64]">Need source details for a report? <a className="font-bold text-[#14795A] hover:underline" href="mailto:support@lotscout.com">Contact support@lotscout.com</a>.</p>
        </section>
      </main>
    </>
  );
}

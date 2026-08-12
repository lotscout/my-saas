import Header from '@/components/Header';

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F5F8F6] px-4 pt-24 pb-16">
        <section className="mx-auto max-w-3xl rounded-3xl border border-[#E2EAE6] bg-white p-6 shadow-sm sm:p-10">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#1D9E75]">LotScout</p>
          <h1 className="font-headline text-3xl font-extrabold text-[#0D1F16] sm:text-5xl">Terms of Service</h1>
          <p className="mt-5 text-sm leading-7 text-[#5C6D64]">
            LotScout helps land buyers, sellers, builders, and acquisition teams discover opportunities, publish listings, send messages, and request analysis. By using LotScout, you agree to use the platform lawfully, provide accurate information, and avoid submitting misleading, infringing, or harmful content.
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5C6D64]">
            Listing, buyer-request, message, report, and marketplace information is provided for business workflow support and should be independently verified before any purchase, sale, investment, financing, or development decision.
          </p>
          <p className="mt-8 text-sm text-[#5C6D64]">Questions? <a className="font-bold text-[#14795A] hover:underline" href="mailto:support@lotscout.com">Contact support@lotscout.com</a>.</p>
        </section>
      </main>
    </>
  );
}

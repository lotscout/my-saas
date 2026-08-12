import Header from '@/components/Header';

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F5F8F6] px-4 pt-24 pb-16">
        <section className="mx-auto max-w-3xl rounded-3xl border border-[#E2EAE6] bg-white p-6 shadow-sm sm:p-10">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#1D9E75]">LotScout</p>
          <h1 className="font-headline text-3xl font-extrabold text-[#0D1F16] sm:text-5xl">Privacy Policy</h1>
          <p className="mt-5 text-sm leading-7 text-[#5C6D64]">
            LotScout uses account, profile, listing, buyer-request, message, and analysis-request information to operate the marketplace, route conversations, personalize the dashboard, process subscriptions, and improve product reliability.
          </p>
          <p className="mt-4 text-sm leading-7 text-[#5C6D64]">
            We do not sell private account data. Some workflows use trusted infrastructure providers for authentication, hosting, email, payments, analytics, and database storage. Users should avoid sharing sensitive information in public listing or buyer-request fields.
          </p>
          <p className="mt-8 text-sm text-[#5C6D64]">Privacy questions? <a className="font-bold text-[#14795A] hover:underline" href="mailto:support@lotscout.com">Contact support@lotscout.com</a>.</p>
        </section>
      </main>
    </>
  );
}

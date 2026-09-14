export default function LandingYoureInPage() {
  return (
    <main className="min-h-screen bg-white px-5 py-8 text-[#10291e] sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center text-center">
        <a href="/home" className="mb-8 flex items-center gap-3" aria-label="LotScout home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lotscout-logo.png" alt="LotScout" className="h-12 w-12 object-contain" />
          <span className="font-headline text-3xl font-black tracking-tight text-[#1b4332]">LotScout</span>
        </a>

        <div className="w-full rounded-[2rem] border border-[#d9d2c3] bg-[#f7f4ec] p-8 shadow-2xl shadow-[#1b4332]/12 sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1b4332] text-3xl text-white">✓</div>
          <h1 className="font-headline text-5xl font-black uppercase leading-none tracking-[-0.06em] text-[#10291e] sm:text-7xl">
            You're in!
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-bold leading-8 text-[#52665b]">
            You'll receive an email shortly with a secure link to complete your account setup.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-[#7c8b82]">
            Your setup link will take you to account setup. Create your password first, then you can access the marketplace and other LotScout pages.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/sign-in?redirect=/edit-profile?setup=password" className="rounded-full bg-[#1b4332] px-7 py-4 text-sm font-black uppercase tracking-[0.08em] text-white hover:bg-[#143426]">
              Sign in
            </a>
            <a href="/landing-acq-mock" className="rounded-full border border-[#1b4332]/20 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#1b4332] hover:bg-[#e8efe6]">
              Back to page
            </a>
          </div>
        </div>

        <p className="mt-6 text-xs font-bold text-[#7c8b82]">No credit card required to get started.</p>
      </div>
    </main>
  );
}

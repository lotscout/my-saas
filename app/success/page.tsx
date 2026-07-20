import Link from 'next/link';
import Header from '@/components/Header';

export default function SuccessPage() {
  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center px-6">
        <div className="text-center max-w-xl">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="material-symbols-outlined text-5xl text-emerald-600">check_circle</span>
          </div>
          <h1 className="text-5xl font-extrabold text-primary mb-6 font-headline">Thank you for subscribing!</h1>
          <p className="text-secondary text-xl opacity-80 mb-10">
            Your subscription is active. Welcome to LotScout — let&apos;s get to work.
          </p>
          <Link
            href="/marketplace"
            className="inline-block px-10 py-4 bg-emerald-600 text-white font-bold text-lg rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
          >
            Go to Marketplace
          </Link>
        </div>
      </main>
    </div>
  );
}

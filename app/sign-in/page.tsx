import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center px-4 py-16 font-body">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/home" className="font-headline text-2xl font-extrabold text-primary tracking-tight">LotScout</Link>
          <p className="text-secondary text-sm mt-2">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-surface-container-high p-8">
          <h1 className="font-headline text-2xl font-bold text-primary mb-6">Sign In</h1>

          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-on-surface mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="jane@example.com"
                className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-on-surface">Password</label>
                <Link href="#" className="text-xs font-semibold text-primary hover:underline">Forgot Password?</Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-base hover:bg-primary/90 transition-colors shadow-sm mt-2"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-secondary mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-primary font-semibold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

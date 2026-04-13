import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center px-4 py-16 font-body">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/home" className="font-headline text-2xl font-extrabold text-primary tracking-tight">LotScout</Link>
          <p className="text-secondary text-sm mt-2">Create your account to get started</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-surface-container-high p-8">
          <h1 className="font-headline text-2xl font-bold text-primary mb-6">Create Account</h1>

          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-on-surface mb-1.5">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Jane"
                  className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-on-surface mb-1.5">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Smith"
                  className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm"
                />
              </div>
            </div>

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
              <label htmlFor="password" className="block text-sm font-semibold text-on-surface mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-on-surface mb-1.5">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                className="w-full px-4 py-3 rounded-xl border border-surface-container-high bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-base hover:bg-primary/90 transition-colors shadow-sm mt-2"
            >
              Create Account
            </button>
          </form>
        </div>

        {/* Sign in link */}
        <p className="text-center text-sm text-secondary mt-6">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-primary font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

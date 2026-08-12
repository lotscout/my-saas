import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

const PRIMARY_GREEN = '#1D9E75';
const PRIMARY_GREEN_HOVER = '#14795A';
const PRIMARY_ACTION_CLS = 'bg-[#1D9E75] hover:bg-[#14795A]';

export function PageHeader({
  title,
  description,
  actions,
  className = '',
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mb-6 sm:mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6 ${className}`}>
      <div className="max-w-3xl">
        <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight leading-tight mb-2 sm:mb-3">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-secondary leading-snug sm:leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:justify-end">{actions}</div>}
    </section>
  );
}

export function SurfaceCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-outline-variant/15 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PrimaryAction({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-extrabold text-white shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${PRIMARY_ACTION_CLS} ${className}`}
    >
      {children}
    </button>
  );
}

export function PrimaryLink({
  children,
  className = '',
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <Link
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-extrabold text-white shadow-sm transition-colors ${PRIMARY_ACTION_CLS} ${className}`}
    >
      {children}
    </Link>
  );
}

export function SecondaryAction({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-extrabold shadow-sm transition-all bg-white text-primary border border-outline-variant/25 hover:border-primary/30 hover:bg-surface-container-low disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export { PRIMARY_GREEN, PRIMARY_GREEN_HOVER };

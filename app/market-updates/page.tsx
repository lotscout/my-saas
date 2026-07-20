import Header from '@/components/Header';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export default async function MarketUpdatesPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('market_updates')
    .select('title, month, year, full_content')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Header />

      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto" style={{ maxWidth: '800px' }}>
          {!data ? (
            <p className="text-secondary text-lg">
              This month&apos;s market update is being prepared. Check back soon.
            </p>
          ) : (
            <article>
              <h1 className="font-headline text-3xl sm:text-5xl font-extrabold text-primary tracking-tight leading-tight mb-2">
                {data.title}
              </h1>
              <p className="text-secondary font-semibold text-lg mb-10">
                {data.month} {data.year}
              </p>
              <div className="space-y-6">
                {String(data.full_content)
                  .split(/\n\n+/)
                  .map(p => p.trim())
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i} className="text-on-surface" style={{ fontSize: '17px', lineHeight: 1.8 }}>
                      {para}
                    </p>
                  ))}
              </div>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}

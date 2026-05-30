import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import AutoRefresh from './AutoRefresh';
import RefreshButton from './RefreshButton';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function TierBadge({ tier }: { tier: string | null }) {
  const t = (tier ?? 'standard').toLowerCase();
  const cls =
    t === 'exclusive' ? 'bg-green-100 text-green-800' :
    t === 'priority'  ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${cls}`}>
      {t}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-white rounded-xl border border-green-100 shadow-sm p-5 flex flex-col gap-1">
      <span className="text-2xl font-bold text-green-800">{value ?? 0}</span>
      <span className="text-sm text-gray-500 font-medium">{label}</span>
    </div>
  );
}

interface SearchParams {
  key?: string;
}

export default async function LiveDashboard({ searchParams }: { searchParams: Promise<SearchParams> | SearchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  if (params.key !== process.env.LIVE_DASHBOARD_KEY) redirect('/');

  const supabase = createServiceClient();
  const todayISO = new Date().toISOString().split('T')[0];

  const [
    users,
    listings,
    messagesToday,
    pendingAnalysis,
    recentSignups,
    recentMessages,
    recentAnalysis,
    emailsToday,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }).eq('is_test_profile', false),
    supabase.from('listings').select('id', { count: 'exact' }).eq('status', 'active').eq('is_test_listing', false),
    supabase.from('messages').select('id', { count: 'exact' }).gte('created_at', todayISO),
    supabase.from('property_analysis_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase
      .from('profiles')
      .select('email, first_name, last_name, subscription_tier, created_at')
      .eq('is_test_profile', false)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('messages')
      .select('body, created_at, sender:profiles!messages_sender_id_fkey(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('property_analysis_requests')
      .select('address, status, created_at, user:profiles!property_analysis_requests_user_id_fkey(email)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('email_logs')
      .select('recipient_email, subject, type, created_at')
      .gte('created_at', todayISO)
      .order('created_at', { ascending: false }),
  ]);

  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50">
      <AutoRefresh />

      {/* Header */}
      <header className="bg-white border-b border-green-100 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LotScout" className="h-7 w-7 object-contain" />
            <span className="font-bold text-green-800 text-lg tracking-tight">LotScout</span>
          </div>
          <h1 className="text-base font-bold text-gray-700 absolute left-1/2 -translate-x-1/2">
            Live Dashboard
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>Last updated: {now}</span>
            <RefreshButton />
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-8">

        {/* Row 1 — Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard label="Total Users" value={users.count} />
          <MetricCard label="Active Listings" value={listings.count} />
          <MetricCard label="Messages Today" value={messagesToday.count} />
          <MetricCard label="Pending Analysis" value={pendingAnalysis.count} />
        </div>

        {/* Row 2 — Recent Signups */}
        <section>
          <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-3">Recent Signups</h2>
          <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-green-50 border-b border-green-100">
                <tr>
                  {['Name', 'Email', 'Tier', 'Joined'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-bold text-green-700 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentSignups.data ?? []).map((u, i) => (
                  <tr key={u.email} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 px-3 text-gray-700">{[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}</td>
                    <td className="py-2 px-3 text-gray-500">{u.email}</td>
                    <td className="py-2 px-3"><TierBadge tier={u.subscription_tier} /></td>
                    <td className="py-2 px-3 text-gray-400">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
                {(recentSignups.data ?? []).length === 0 && (
                  <tr><td colSpan={4} className="py-4 px-3 text-center text-gray-400 text-xs">No signups yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Row 3 — Recent Messages */}
        <section>
          <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-3">Recent Messages</h2>
          <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-green-50 border-b border-green-100">
                <tr>
                  {['Sender', 'Preview', 'Sent'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-bold text-green-700 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentMessages.data ?? []).map((m, i) => {
                  const sender = Array.isArray(m.sender) ? m.sender[0] : m.sender;
                  const name = sender
                    ? [sender.first_name, sender.last_name].filter(Boolean).join(' ')
                    : 'Unknown';
                  return (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-2 px-3 text-gray-700 whitespace-nowrap">{name}</td>
                      <td className="py-2 px-3 text-gray-500">{(m.body ?? '').slice(0, 60)}{(m.body ?? '').length > 60 ? '…' : ''}</td>
                      <td className="py-2 px-3 text-gray-400 whitespace-nowrap">{formatDate(m.created_at)}</td>
                    </tr>
                  );
                })}
                {(recentMessages.data ?? []).length === 0 && (
                  <tr><td colSpan={3} className="py-4 px-3 text-center text-gray-400 text-xs">No messages yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Row 4 — Recent Analysis Requests */}
        <section>
          <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-3">Recent Analysis Requests</h2>
          <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-green-50 border-b border-green-100">
                <tr>
                  {['Email', 'Address', 'Status', 'Submitted'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-bold text-green-700 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentAnalysis.data ?? []).map((a, i) => {
                  const user = Array.isArray(a.user) ? a.user[0] : a.user;
                  return (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-2 px-3 text-gray-500">{user?.email ?? '—'}</td>
                      <td className="py-2 px-3 text-gray-700">{a.address ?? '—'}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                          a.status === 'completed' ? 'bg-green-100 text-green-800' :
                          a.status === 'pending'   ? 'bg-yellow-100 text-yellow-800' :
                                                     'bg-gray-100 text-gray-600'
                        }`}>{a.status ?? '—'}</span>
                      </td>
                      <td className="py-2 px-3 text-gray-400 whitespace-nowrap">{formatDate(a.created_at)}</td>
                    </tr>
                  );
                })}
                {(recentAnalysis.data ?? []).length === 0 && (
                  <tr><td colSpan={4} className="py-4 px-3 text-center text-gray-400 text-xs">No analysis requests yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Row 5 — Emails Sent Today */}
        <section>
          <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-3">Emails Sent Today</h2>
          <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-green-50 border-b border-green-100">
                <tr>
                  {['Recipient', 'Subject', 'Type', 'Sent At'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-bold text-green-700 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(emailsToday.data ?? []).map((e, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 px-3 text-gray-500">{e.recipient_email}</td>
                    <td className="py-2 px-3 text-gray-700">{e.subject ?? '—'}</td>
                    <td className="py-2 px-3 text-gray-400 capitalize">{e.type ?? '—'}</td>
                    <td className="py-2 px-3 text-gray-400 whitespace-nowrap">{formatTime(e.created_at)}</td>
                  </tr>
                ))}
                {(emailsToday.data ?? []).length === 0 && (
                  <tr><td colSpan={4} className="py-4 px-3 text-center text-gray-400 text-xs">No emails sent today</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}

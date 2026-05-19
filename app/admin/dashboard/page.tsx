'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface Stats {
  totalUsers: number;
  activeListings: number;
  pendingListings: number;
  pendingAnalysis: number;
  pendingBuyerRequests: number;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  link: string | null;
  created_at: string;
  read_at: string | null;
}

interface EmailLog {
  id: string;
  user_id: string | null;
  to_email: string;
  from_email: string | null;
  subject: string;
  email_type: string;
  status: string;
  created_at: string;
}

const EMAIL_TYPES = [
  'welcome',
  'new_message',
  'analysis_submitted',
  'analysis_complete',
  'listing_approved',
  'listing_rejected',
  'password_reset',
  'contact',
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function StatCard({ label, value, icon, color }: { label: string; value: number | null; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex items-center gap-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-none ${color}`}>
        <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-extrabold font-headline text-on-surface">
          {value === null ? <span className="inline-block w-10 h-7 bg-surface-container animate-pulse rounded" /> : value.toLocaleString()}
        </p>
        <p className="text-sm text-on-surface/60 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(true);
  const [dismissingAll, setDismissingAll] = useState(false);

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailTotal, setEmailTotal] = useState(0);
  const [emailPage, setEmailPage] = useState(1);
  const [emailSearch, setEmailSearch] = useState('');
  const [emailType, setEmailType] = useState('');
  const [emailLoading, setEmailLoading] = useState(true);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => {
        if (data.error) setStatsError(data.error);
        else setStats(data);
      })
      .catch(err => setStatsError(err.message));
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {}
    setNotifLoading(false);
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const loadEmailLogs = useCallback(async (page: number, search: string, type: string) => {
    setEmailLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      if (type) params.set('type', type);
      const res = await fetch(`/api/admin/email-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(data.logs ?? []);
        setEmailTotal(data.total ?? 0);
      }
    } catch {}
    setEmailLoading(false);
  }, []);

  useEffect(() => { loadEmailLogs(1, '', ''); }, [loadEmailLogs]);

  function handleEmailSearch(value: string) {
    setEmailSearch(value);
    setEmailPage(1);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => loadEmailLogs(1, value, emailType), 300);
  }

  function handleEmailType(value: string) {
    setEmailType(value);
    setEmailPage(1);
    loadEmailLogs(1, emailSearch, value);
  }

  function handleEmailPage(newPage: number) {
    setEmailPage(newPage);
    loadEmailLogs(newPage, emailSearch, emailType);
  }

  async function dismissNotification(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  async function dismissAll() {
    setDismissingAll(true);
    setNotifications([]);
    await fetch('/api/admin/notifications', { method: 'DELETE' });
    setDismissingAll(false);
  }

  const adminNavLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/admin/listings', label: 'Listings', icon: 'home_work' },
    { href: '/admin/users', label: 'Users', icon: 'group' },
    { href: '/admin/analysis', label: 'Analysis', icon: 'analytics' },
    { href: '/admin/messaging', label: 'Messaging', icon: 'chat' },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[2000] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-64 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10">
              <span className="font-headline font-bold text-primary">Admin Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex-1 py-2">
              {adminNavLinks.map(({ href, label, icon }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-secondary">{icon}</span>
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden -ml-1 mr-1 p-1.5 rounded-lg text-on-surface hover:bg-surface-container-low transition-colors"
            aria-label="Open admin menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Admin Dashboard</h1>
          {notifications.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-full">
              {notifications.length}
            </span>
          )}
        </div>
        <p className="text-on-surface/50 mt-1 text-sm">Real-time overview of LotScout platform activity.</p>
      </div>

      {statsError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          Failed to load stats: {statsError}
        </div>
      )}

      {/* Notifications panel */}
      {(notifLoading || notifications.length > 0) && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest flex items-center gap-2">
              Notifications
              {notifications.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              )}
            </h2>
            {notifications.length > 1 && (
              <button
                onClick={dismissAll}
                disabled={dismissingAll}
                className="text-xs text-on-surface/40 hover:text-on-surface/70 font-semibold transition-colors"
              >
                Dismiss all
              </button>
            )}
          </div>
          <div className="bg-white border border-outline-variant/10 rounded-2xl shadow-sm overflow-hidden">
            {notifLoading ? (
              <div className="p-6 space-y-3">
                {[0, 1].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-4">
                    <div className="w-8 h-8 bg-surface-container rounded-lg flex-none" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-surface-container rounded w-2/3" />
                      <div className="h-3 bg-surface-container rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-on-surface/40 text-sm">No unread notifications</div>
            ) : (
              <ul className="divide-y divide-outline-variant/10">
                {notifications.map(n => (
                  <li key={n.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container-lowest transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-none">
                      <span className="material-symbols-outlined text-emerald-700 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {n.type === 'new_message' ? 'chat' : 'notifications'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {n.link ? (
                        <a href={n.link} className="font-semibold text-sm text-on-surface hover:text-primary transition-colors block truncate">
                          {n.message}
                        </a>
                      ) : (
                        <p className="font-semibold text-sm text-on-surface truncate">{n.message}</p>
                      )}
                      <p className="text-xs text-on-surface/40 mt-0.5">{relativeTime(n.created_at)}</p>
                    </div>
                    {n.link && (
                      <a
                        href={n.link}
                        className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap"
                      >
                        View Thread
                      </a>
                    )}
                    <button
                      onClick={() => dismissNotification(n.id)}
                      className="shrink-0 text-on-surface/20 hover:text-on-surface/60 transition-colors opacity-0 group-hover:opacity-100"
                      title="Dismiss"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Stats grid */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers ?? null}
            icon="group"
            color="bg-blue-600"
          />
          <StatCard
            label="Active Listings"
            value={stats?.activeListings ?? null}
            icon="home_work"
            color="bg-emerald-600"
          />
          <StatCard
            label="Pending Listings"
            value={stats?.pendingListings ?? null}
            icon="pending_actions"
            color="bg-slate-500"
          />
          <StatCard
            label="Analysis Requests"
            value={stats?.pendingAnalysis ?? null}
            icon="analytics"
            color="bg-purple-600"
          />
        </div>
      </section>

      {/* Action items */}
      <section className="mb-10">
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Needs Attention</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/listings"
            className="group bg-white border border-outline-variant/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-none">
              <span className="material-symbols-outlined text-slate-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>list_alt</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-on-surface">Listings Queue</p>
                {stats?.pendingListings ? (
                  <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">{stats.pendingListings}</span>
                ) : null}
              </div>
              <p className="text-xs text-on-surface/50 mt-0.5">Review and approve pending submissions</p>
            </div>
            <span className="material-symbols-outlined text-on-surface/30 group-hover:text-on-surface/60 transition-colors">chevron_right</span>
          </a>

          <a
            href="/admin/analysis"
            className="group bg-white border border-outline-variant/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-none">
              <span className="material-symbols-outlined text-purple-700 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-on-surface">Analysis Queue</p>
                {stats?.pendingAnalysis ? (
                  <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-full">{stats.pendingAnalysis}</span>
                ) : null}
              </div>
              <p className="text-xs text-on-surface/50 mt-0.5">Complete property analysis requests</p>
            </div>
            <span className="material-symbols-outlined text-on-surface/30 group-hover:text-on-surface/60 transition-colors">chevron_right</span>
          </a>

          <a
            href="/admin/users"
            className="group bg-white border border-outline-variant/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-none">
              <span className="material-symbols-outlined text-blue-700 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-on-surface">User Management</p>
                {stats?.totalUsers ? (
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">{stats.totalUsers}</span>
                ) : null}
              </div>
              <p className="text-xs text-on-surface/50 mt-0.5">Manage tiers, permissions, and accounts</p>
            </div>
            <span className="material-symbols-outlined text-on-surface/30 group-hover:text-on-surface/60 transition-colors">chevron_right</span>
          </a>

          <a
            href="/admin/messaging"
            className="group bg-white border border-outline-variant/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-none">
              <span className="material-symbols-outlined text-emerald-700 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-on-surface">Buyer Messaging</p>
              <p className="text-xs text-on-surface/50 mt-0.5">Test buyer-to-seller messaging as a test profile</p>
            </div>
            <span className="material-symbols-outlined text-on-surface/30 group-hover:text-on-surface/60 transition-colors">chevron_right</span>
          </a>
        </div>
      </section>

      {/* Email Logs */}
      <section>
        <h2 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-4">Emails Sent</h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface/30 text-base">search</span>
            <input
              type="text"
              value={emailSearch}
              onChange={e => handleEmailSearch(e.target.value)}
              placeholder="Search by email or subject…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-outline-variant/20 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface/30"
            />
          </div>
          <select
            value={emailType}
            onChange={e => handleEmailType(e.target.value)}
            className="sm:w-52 px-3 py-2.5 text-sm border border-outline-variant/20 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
          >
            <option value="">All types</option>
            {EMAIL_TYPES.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-outline-variant/10 rounded-2xl shadow-sm overflow-hidden">
          {emailLoading ? (
            <div className="p-6 space-y-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex gap-4">
                  <div className="h-4 bg-surface-container rounded flex-1" />
                  <div className="h-4 bg-surface-container rounded w-40" />
                  <div className="h-4 bg-surface-container rounded w-52" />
                  <div className="h-4 bg-surface-container rounded w-24" />
                  <div className="h-4 bg-surface-container rounded w-16" />
                </div>
              ))}
            </div>
          ) : emailLogs.length === 0 ? (
            <div className="p-8 text-center text-on-surface/40 text-sm">No emails found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="text-left px-6 py-3 text-xs font-bold text-on-surface/40 uppercase tracking-wider whitespace-nowrap">Date / Time</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-on-surface/40 uppercase tracking-wider whitespace-nowrap">Recipient</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-on-surface/40 uppercase tracking-wider">Subject</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-on-surface/40 uppercase tracking-wider whitespace-nowrap">Type</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-on-surface/40 uppercase tracking-wider whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {emailLogs.map(log => (
                    <tr key={log.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-3.5 text-on-surface/50 whitespace-nowrap text-xs">{formatDateTime(log.created_at)}</td>
                      <td className="px-6 py-3.5 text-on-surface font-medium whitespace-nowrap">{log.to_email}</td>
                      <td className="px-6 py-3.5 text-on-surface/70 max-w-xs truncate">{log.subject}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="bg-surface-container text-on-surface/60 text-xs font-semibold px-2.5 py-1 rounded-full">
                          {log.email_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          log.status === 'sent'
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.status === 'failed'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-surface-container text-on-surface/50'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {emailTotal > 25 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
              <p className="text-xs text-on-surface/40">
                {((emailPage - 1) * 25) + 1}–{Math.min(emailPage * 25, emailTotal)} of {emailTotal.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEmailPage(emailPage - 1)}
                  disabled={emailPage <= 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-outline-variant/20 text-on-surface/60 hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleEmailPage(emailPage + 1)}
                  disabled={emailPage * 25 >= emailTotal}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-outline-variant/20 text-on-surface/60 hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

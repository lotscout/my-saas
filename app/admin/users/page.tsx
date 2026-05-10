'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  company_name: string | null;
  tier: string | null;
  is_admin: boolean | null;
  is_test_profile: boolean;
  created_at: string;
}

interface EmailLog {
  id: string;
  to_email: string;
  from_email: string;
  subject: string;
  email_type: string;
  status: string;
  created_at: string;
}

const PAGE_SIZE = 50;
const TIERS = ['free', 'standard', 'priority', 'exclusive'];

const TIER_COLOR: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  standard: 'bg-blue-100 text-blue-700',
  priority: 'bg-emerald-100 text-emerald-700',
  exclusive: 'bg-purple-100 text-purple-700',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type FilterTab = 'all' | 'real' | 'test';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function openUserEmails(user: User) {
    setSelectedUser(user);
    setEmailLogs([]);
    setEmailsLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}/emails`);
    const data = await res.json();
    setEmailLogs(data.emails ?? []);
    setEmailsLoading(false);
  }

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleTierChange(userId: string, tier: string) {
    setActionLoading(`tier-${userId}`);
    try {
      const res = await fetch(`/api/admin/users/${userId}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Tier updated.', 'success');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, tier } : u));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAdminToggle(userId: string, currentValue: boolean | null) {
    setActionLoading(`admin-${userId}`);
    const newValue = !currentValue;
    try {
      const res = await fetch(`/api/admin/users/${userId}/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_admin: newValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Admin access ${newValue ? 'granted' : 'revoked'}.`, 'success');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: newValue } : u));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  const countAll  = users.filter(u => matchesSearch(u, search)).length;
  const countReal = users.filter(u => !u.is_test_profile && matchesSearch(u, search)).length;
  const countTest = users.filter(u =>  u.is_test_profile && matchesSearch(u, search)).length;

  function matchesSearch(u: User, q: string) {
    if (!q) return true;
    const lq = q.toLowerCase();
    const name = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ');
    return (
      name.toLowerCase().includes(lq) ||
      (u.email ?? '').toLowerCase().includes(lq) ||
      (u.company_name ?? '').toLowerCase().includes(lq)
    );
  }

  const filtered = users.filter(u => {
    if (!matchesSearch(u, search)) return false;
    if (filterTab === 'real') return !u.is_test_profile;
    if (filterTab === 'test') return u.is_test_profile;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleTabChange(tab: FilterTab) {
    setFilterTab(tab);
    setPage(1);
  }

  function handleSearch(q: string) {
    setSearch(q);
    setPage(1);
  }

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',  label: 'All Users',       count: countAll  },
    { key: 'real', label: 'Real Users',       count: countReal },
    { key: 'test', label: 'Test Profiles',    count: countTest },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">User Management</h1>
        <p className="text-on-surface/50 mt-1 text-sm">Manage subscription tiers and admin permissions.</p>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 text-lg">search</span>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search users by name, email, or company…"
            className="w-full bg-white border border-outline-variant/20 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-outline-variant/20">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              filterTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface/50 hover:text-on-surface'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              filterTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface/40'
            }`}>
              {loading ? '…' : tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-outline-variant/10 rounded-2xl p-12 text-center text-on-surface/40 text-sm">
          Loading users…
        </div>
      ) : (
        <>
          <div className="bg-white border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                    <th className="text-left px-5 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Company</th>
                    <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Joined</th>
                    <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Tier</th>
                    <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-on-surface/40 text-sm">No users found.</td>
                    </tr>
                  ) : paginated.map(u => {
                    const name = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '—';
                    return (
                      <tr key={u.id} className="hover:bg-surface-container-low/40 transition-colors cursor-pointer" onClick={() => openUserEmails(u)}>
                        <td className="px-5 py-4">
                          <div className="font-medium text-on-surface flex items-center gap-2">
                            {name}
                            {u.is_test_profile && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold uppercase tracking-wide">Test</span>
                            )}
                          </div>
                          <div className="text-on-surface/50 text-xs">{u.email || '—'}</div>
                        </td>
                        <td className="px-4 py-4 text-on-surface/70">{u.company_name || '—'}</td>
                        <td className="px-4 py-4 text-on-surface/60">{fmtDate(u.created_at)}</td>
                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TIER_COLOR[u.tier ?? 'free'] ?? 'bg-gray-100 text-gray-600'}`}>
                              {u.tier ?? 'free'}
                            </span>
                            <select
                              value={u.tier ?? 'free'}
                              onChange={e => handleTierChange(u.id, e.target.value)}
                              disabled={actionLoading === `tier-${u.id}`}
                              className="text-xs border border-outline-variant/30 rounded-lg px-2 py-1 bg-white text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                            >
                              {TIERS.map(t => (
                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleAdminToggle(u.id, u.is_admin)}
                            disabled={actionLoading === `admin-${u.id}`}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                              u.is_admin ? 'bg-primary' : 'bg-outline-variant/40'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${u.is_admin ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-on-surface/50">
              <span>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} users
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/20 bg-white font-medium text-xs disabled:opacity-40 hover:bg-surface-container-low transition-colors"
                >
                  Previous
                </button>
                <span className="px-2 font-medium text-on-surface">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant/20 bg-white font-medium text-xs disabled:opacity-40 hover:bg-surface-container-low transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Email History drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setSelectedUser(null)} />
          <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
              <div>
                <h2 className="font-headline text-lg font-bold text-on-surface">Email History</h2>
                <p className="text-xs text-on-surface/50 mt-0.5">
                  {selectedUser.full_name || [selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(' ') || selectedUser.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface/50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {emailsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : emailLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-on-surface/40">
                  <span className="material-symbols-outlined text-4xl mb-2">mail</span>
                  <p className="text-sm">No emails sent to this user yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface-container-low border-b border-outline-variant/20">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Subject</th>
                      <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {emailLogs.map(log => (
                      <tr key={log.id} className="hover:bg-surface-container-low/40">
                        <td className="px-5 py-3 text-on-surface/60 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                        <td className="px-4 py-3 text-on-surface max-w-[200px] truncate" title={log.subject}>{log.subject}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-container text-on-surface/70">
                            {log.email_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

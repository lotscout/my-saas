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
  created_at: string;
}

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ');
    return (
      name.toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.company_name ?? '').toLowerCase().includes(q)
    );
  });

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
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 text-lg">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users by name, email, or company…"
            className="w-full bg-white border border-outline-variant/20 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <span className="text-sm text-on-surface/40 font-medium">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="bg-white border border-outline-variant/10 rounded-2xl p-12 text-center text-on-surface/40 text-sm">
          Loading users…
        </div>
      ) : (
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
                {filtered.map(u => {
                  const name = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '—';
                  return (
                    <tr key={u.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-on-surface">{name}</div>
                        <div className="text-on-surface/50 text-xs">{u.email || '—'}</div>
                      </td>
                      <td className="px-4 py-4 text-on-surface/70">{u.company_name || '—'}</td>
                      <td className="px-4 py-4 text-on-surface/60">{fmtDate(u.created_at)}</td>
                      <td className="px-4 py-4">
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
                      <td className="px-4 py-4">
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
      )}
    </div>
  );
}

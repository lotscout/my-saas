'use client';

import { useState, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PanelUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  subscription_tier: string;
  state: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface UserListing {
  id: string;
  title: string | null;
  status: string;
  state: string | null;
  county: string | null;
  asking_price: number | null;
  created_at: string;
}

interface BuyerRequest {
  id: string;
  status: string;
  target_state: string | null;
  use_case: string | null;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
}

interface UserDetail {
  profile: Record<string, unknown>;
  listings: UserListing[];
  buyerRequests: BuyerRequest[];
  subscription: { tier: string; status: string } | null;
}

interface Props {
  selectedId: string | null;
  selectedUser: PanelUser | null;
  onClose: () => void;
  onAdminToggled?: (id: string, newIsAdmin: boolean) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getUserName(u: Pick<PanelUser, 'full_name' | 'first_name' | 'last_name'>) {
  return u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '—';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const TIER_BADGE_CLS: Record<string, string> = {
  free:      'bg-gray-100 text-gray-600',
  standard:  'bg-green-100 text-green-700',
  priority:  'bg-blue-100 text-blue-700',
  exclusive: 'bg-purple-100 text-purple-700',
};

function TierBadge({ tier }: { tier: string }) {
  const t = (tier ?? 'free').toLowerCase();
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${TIER_BADGE_CLS[t] ?? 'bg-gray-100 text-gray-600'}`}>
      {t}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.replace(/_/g, ' ');
  const cls = status === 'active'
    ? 'bg-emerald-100 text-emerald-700'
    : status === 'pending_review'
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-gray-100 text-gray-600';
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${cls}`}>{s}</span>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function UserDetailPanel({ selectedId, selectedUser, onClose, onAdminToggled }: Props) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmAdmin, setConfirmAdmin] = useState<{ id: string; name: string; current: boolean } | null>(null);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setDetail(null);
    setDetailLoading(true);
    fetch(`/api/admin/dashboard/users/${selectedId}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setDetailLoading(false); });
  }, [selectedId]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function confirmAndToggleAdmin() {
    if (!confirmAdmin) return;
    setAdminActionLoading(true);
    const { id, current } = confirmAdmin;
    const newVal = !current;
    const r = await fetch(`/api/admin/users/${id}/admin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_admin: newVal }),
    });
    const d = await r.json();
    if (!r.ok) {
      showToast(d.error ?? 'Error updating admin status', false);
    } else {
      showToast(`Admin access ${newVal ? 'granted' : 'revoked'}`, true);
      onAdminToggled?.(id, newVal);
    }
    setConfirmAdmin(null);
    setAdminActionLoading(false);
  }

  if (!selectedId) return null;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[70] px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmAdmin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmAdmin(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-headline text-lg font-bold text-on-surface mb-2">Confirm Change</h3>
            <p className="text-sm text-on-surface/70 mb-5">
              {confirmAdmin.current
                ? `Remove admin access from ${confirmAdmin.name}?`
                : `Grant admin access to ${confirmAdmin.name}? They will have full admin privileges.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAdmin(null)}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-outline-variant/30 text-on-surface/70 hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndToggleAdmin}
                disabled={adminActionLoading}
                className={`px-4 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-60 ${
                  confirmAdmin.current ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {adminActionLoading ? 'Saving…' : confirmAdmin.current ? 'Remove Admin' : 'Grant Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out */}
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/30" onClick={onClose} />
        <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">

          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-outline-variant/20 flex-none">
            <div className="min-w-0 pr-4">
              <h2 className="font-headline text-lg font-bold text-on-surface truncate">
                {selectedUser ? getUserName(selectedUser) : '…'}
              </h2>
              <p className="text-xs text-on-surface/50 mt-0.5 truncate">{selectedUser?.email}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface/50 flex-none"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : detail ? (
              <div className="divide-y divide-outline-variant/10">

                {/* Profile */}
                <div className="px-6 py-5">
                  <h3 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-3">Profile</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {[
                      { label: 'Tier',       value: <TierBadge tier={selectedUser?.subscription_tier ?? 'free'} /> },
                      { label: 'Joined',     value: selectedUser ? fmtDate(selectedUser.created_at) : '—' },
                      { label: 'State',      value: selectedUser?.state ?? '—' },
                      { label: 'Company',    value: (detail.profile.company_name as string) || '—' },
                      { label: 'Last Active', value: selectedUser?.updated_at
                        ? (isToday(selectedUser.updated_at)
                            ? <span className="text-emerald-600 font-semibold">Today</span>
                            : fmtDate(selectedUser.updated_at))
                        : '—' },
                      { label: 'Admin',      value: selectedUser?.is_admin ? 'Yes' : 'No' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <dt className="text-on-surface/40 text-xs mb-0.5">{label}</dt>
                        <dd className="font-medium text-on-surface">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <button
                    onClick={() => selectedUser && setConfirmAdmin({
                      id: selectedUser.id,
                      name: getUserName(selectedUser),
                      current: selectedUser.is_admin,
                    })}
                    className={`mt-4 px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                      selectedUser?.is_admin
                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {selectedUser?.is_admin ? 'Remove Admin Access' : 'Grant Admin Access'}
                  </button>
                </div>

                {/* Listings */}
                <div className="px-6 py-5">
                  <h3 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-3">
                    Listings ({detail.listings.length})
                  </h3>
                  {detail.listings.length === 0 ? (
                    <p className="text-sm text-on-surface/40">No listings</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.listings.map(l => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between text-sm bg-surface-container-lowest rounded-xl px-4 py-3"
                        >
                          <div className="min-w-0 pr-3">
                            <p className="font-medium text-on-surface truncate">{l.title ?? 'Untitled'}</p>
                            <p className="text-xs text-on-surface/50 mt-0.5">
                              {[l.state, l.county].filter(Boolean).join(', ') || '—'}
                            </p>
                          </div>
                          <div className="text-right flex-none">
                            <p className="font-semibold text-on-surface text-xs mb-1">
                              {l.asking_price ? fmtMoney(l.asking_price) : '—'}
                            </p>
                            <StatusBadge status={l.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Buyer Requests */}
                <div className="px-6 py-5">
                  <h3 className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-3">
                    Buyer Requests ({detail.buyerRequests.length})
                  </h3>
                  {detail.buyerRequests.length === 0 ? (
                    <p className="text-sm text-on-surface/40">No buyer requests</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.buyerRequests.map(r => (
                        <div key={r.id} className="text-sm bg-surface-container-lowest rounded-xl px-4 py-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-on-surface truncate pr-3">
                              {r.use_case ?? 'Buyer Request'}
                            </p>
                            <StatusBadge status={r.status} />
                          </div>
                          <p className="text-xs text-on-surface/50 mt-1">
                            {r.target_state ?? 'Any state'}
                            {(r.budget_min || r.budget_max) && (
                              <> · {[
                                r.budget_min && fmtMoney(r.budget_min),
                                r.budget_max && fmtMoney(r.budget_max),
                              ].filter(Boolean).join(' – ')}</>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

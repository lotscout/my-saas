'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Listing {
  id: string;
  title: string;
  status: string;
  state: string | null;
  county: string | null;
  lot_size_acres: number | null;
  lot_size_sqft: number | null;
  asking_price: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles?: { full_name: string | null; email: string | null } | null;
}

interface BuyerRequest {
  id: string;
  status: string;
  target_regions: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  min_acreage: number | null;
  max_acreage: number | null;
  use_case: string | null;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string | null; email: string | null } | null;
}

const STATUS_FILTERS = ['all', 'pending_review', 'active', 'revision_needed', 'rejected'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_LABEL: Record<string, string> = {
  all: 'All',
  pending_review: 'Pending',
  active: 'Published',
  revision_needed: 'Revision Needed',
  rejected: 'Rejected',
};

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
  pending_review: 'bg-amber-100 text-amber-800',
  revision_needed: 'bg-orange-100 text-orange-800',
};

function fmt$(n: number | null) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtAc(acres: number | null, sqft: number | null) {
  if (acres != null) return `${acres.toLocaleString()} ac`;
  if (sqft != null) return `${sqft.toLocaleString()} sqft`;
  return '—';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending_review');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<{ id: string; title: string; action: 'revision_needed' | 'rejected' } | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [pendingBuyers, setPendingBuyers] = useState<BuyerRequest[]>([]);
  const [buyerActionLoading, setBuyerActionLoading] = useState<string | null>(null);
  const [buyerRejectModal, setBuyerRejectModal] = useState<{ id: string } | null>(null);
  const [buyerRejectReason, setBuyerRejectReason] = useState('');

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('listings')
      .select('id, title, status, state, county, lot_size_acres, lot_size_sqft, asking_price, created_at, updated_at, user_id')
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    const rows = data ?? [];

    if (!rows.length) { setListings([]); setLoading(false); return; }

    const userIds = [...new Set(rows.map((r: Listing) => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const pm: Record<string, { full_name: string | null; email: string | null }> = {};
    (profiles ?? []).forEach((p: { id: string; full_name: string | null; email: string | null }) => { pm[p.id] = p; });

    setListings(rows.map((r: Listing) => ({ ...r, profiles: pm[r.user_id] ?? null })));
    setLoading(false);
  }, [statusFilter]);

  const fetchBuyerRequests = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('buyer_requests')
      .select('id, status, target_regions, budget_min, budget_max, min_acreage, max_acreage, use_case, created_at, user_id')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false });

    const rows = data ?? [];
    if (!rows.length) { setPendingBuyers([]); return; }

    const supabase2 = createClient();
    const userIds = [...new Set(rows.map((r: BuyerRequest) => r.user_id))];
    const { data: profiles } = await supabase2
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const pm: Record<string, { full_name: string | null; email: string | null }> = {};
    (profiles ?? []).forEach((p: { id: string; full_name: string | null; email: string | null }) => { pm[p.id] = p; });

    setPendingBuyers(rows.map((r: BuyerRequest) => ({ ...r, profiles: pm[r.user_id] ?? null })));
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useEffect(() => { fetchBuyerRequests(); }, [fetchBuyerRequests]);

  async function handleStatus(id: string, status: string, reason?: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      const labels: Record<string, string> = { active: 'approved', revision_needed: 'sent for revision', rejected: 'rejected' };
      showToast(`Listing ${labels[status] ?? 'updated'} — seller notified.`, 'success');
      setModal(null);
      setModalReason('');
      await fetchListings();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveBuyer(id: string) {
    setBuyerActionLoading(id);
    try {
      const res = await fetch(`/api/admin/buyer-requests/${id}/approve`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      showToast('Buyer request approved.', 'success');
      await fetchBuyerRequests();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setBuyerActionLoading(null);
    }
  }

  async function handleRejectBuyer() {
    if (!buyerRejectModal) return;
    setBuyerActionLoading(buyerRejectModal.id);
    try {
      const res = await fetch(`/api/admin/buyer-requests/${buyerRejectModal.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: buyerRejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      showToast('Buyer request rejected.', 'success');
      setBuyerRejectModal(null);
      setBuyerRejectReason('');
      await fetchBuyerRequests();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setBuyerActionLoading(null);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Reject / Revision Modal */}
      {modal && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
              {modal.action === 'revision_needed' ? 'Request Revision' : 'Reject Listing'}
            </h3>
            <p className="text-sm text-on-surface/60 mb-4">{modal.title}</p>
            <label className="block text-sm font-medium text-on-surface mb-1">
              {modal.action === 'revision_needed' ? 'Requested changes' : 'Reason'}{' '}
              <span className="text-on-surface/40">(optional — sent to seller)</span>
            </label>
            <textarea
              value={modalReason}
              onChange={e => setModalReason(e.target.value)}
              placeholder={modal.action === 'revision_needed'
                ? 'e.g. Please add clearer photos and property description…'
                : 'e.g. Missing property details, outside our service area…'}
              className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setModal(null); setModalReason(''); }}
                className="px-4 py-2 text-sm rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatus(modal.id, modal.action, modalReason || undefined)}
                disabled={actionLoading === modal.id}
                className={`px-4 py-2 text-sm rounded-xl text-white transition-colors disabled:opacity-50 ${
                  modal.action === 'revision_needed' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading === modal.id ? 'Saving…' : modal.action === 'revision_needed' ? 'Send Revision Request' : 'Reject Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buyer Reject Modal */}
      {buyerRejectModal && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4">Reject Buyer Request</h3>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Reason <span className="text-on-surface/40">(optional)</span>
            </label>
            <textarea
              value={buyerRejectReason}
              onChange={e => setBuyerRejectReason(e.target.value)}
              placeholder="e.g. Criteria too broad…"
              className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setBuyerRejectModal(null); setBuyerRejectReason(''); }}
                className="px-4 py-2 text-sm rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors">
                Cancel
              </button>
              <button onClick={handleRejectBuyer} disabled={buyerActionLoading === buyerRejectModal.id}
                className="px-4 py-2 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                {buyerActionLoading === buyerRejectModal.id ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Listings Queue</h1>
        <p className="text-on-surface/50 mt-1 text-sm">Review, approve, or request revisions for submitted listings.</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 mb-6 bg-surface-container-low rounded-xl p-1 self-start w-fit">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              statusFilter === s
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface/50 hover:text-on-surface'
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Listings table */}
      {loading ? (
        <div className="bg-white border border-outline-variant/10 rounded-2xl p-12 text-center text-on-surface/40 text-sm">
          Loading listings…
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white border border-outline-variant/10 rounded-2xl p-12 text-center text-on-surface/40 text-sm">
          No listings found for this filter.
        </div>
      ) : (
        <div className="bg-white border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                  <th className="text-left px-5 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Seller</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Location</th>
                  <th className="text-right px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Size</th>
                  <th className="text-right px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {listings.map(l => (
                  <tr key={l.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-medium text-on-surface line-clamp-1 max-w-[200px] block">{l.title || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-on-surface">{l.profiles?.full_name || '—'}</div>
                      <div className="text-on-surface/50 text-xs">{l.profiles?.email || '—'}</div>
                    </td>
                    <td className="px-4 py-4 text-on-surface/70">
                      {[l.county, l.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-4 text-right text-on-surface/70">{fmtAc(l.lot_size_acres, l.lot_size_sqft)}</td>
                    <td className="px-4 py-4 text-right font-medium text-primary">{fmt$(l.asking_price)}</td>
                    <td className="px-4 py-4"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-4 text-on-surface/60">{fmtDate(l.created_at)}</td>
                    <td className="px-4 py-4">
                      {l.status === 'pending_review' || l.status === 'revision_needed' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleStatus(l.id, 'active')}
                            disabled={actionLoading === l.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {actionLoading === l.id ? '…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setModal({ id: l.id, title: l.title, action: 'revision_needed' })}
                            disabled={actionLoading === l.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            Revise
                          </button>
                          <button
                            onClick={() => setModal({ id: l.id, title: l.title, action: 'rejected' })}
                            disabled={actionLoading === l.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          {l.status === 'active' && (
                            <button
                              onClick={() => setModal({ id: l.id, title: l.title, action: 'rejected' })}
                              disabled={actionLoading === l.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              Unpublish
                            </button>
                          )}
                          {l.status === 'rejected' && (
                            <button
                              onClick={() => handleStatus(l.id, 'active')}
                              disabled={actionLoading === l.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              Re-approve
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Buyer Requests */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-headline font-bold text-xl text-on-surface">Pending Buyer Requests</h2>
          {pendingBuyers.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{pendingBuyers.length}</span>
          )}
        </div>

        {pendingBuyers.length === 0 ? (
          <div className="bg-white border border-outline-variant/10 rounded-2xl p-10 text-center text-on-surface/40 text-sm">
            No buyer requests pending review. ✅
          </div>
        ) : (
          <div className="bg-white border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                    <th className="text-left px-5 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Buyer</th>
                    <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Regions</th>
                    <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Budget</th>
                    <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Acreage</th>
                    <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Use Case</th>
                    <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Submitted</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {pendingBuyers.map(b => (
                    <tr key={b.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-on-surface">{b.profiles?.full_name || '—'}</div>
                        <div className="text-on-surface/50 text-xs">{b.profiles?.email || '—'}</div>
                      </td>
                      <td className="px-4 py-4 text-on-surface/70">{(b.target_regions ?? []).join(', ') || '—'}</td>
                      <td className="px-4 py-4 text-on-surface/70 whitespace-nowrap">
                        {b.budget_min || b.budget_max
                          ? `$${Number(b.budget_min ?? 0).toLocaleString()} – $${Number(b.budget_max ?? 0).toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="px-4 py-4 text-on-surface/70 whitespace-nowrap">
                        {b.min_acreage || b.max_acreage ? `${b.min_acreage ?? '?'} – ${b.max_acreage ?? '?'} ac` : '—'}
                      </td>
                      <td className="px-4 py-4 text-on-surface/70">{b.use_case || '—'}</td>
                      <td className="px-4 py-4 text-on-surface/60">{fmtDate(b.created_at)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleApproveBuyer(b.id)}
                            disabled={buyerActionLoading === b.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {buyerActionLoading === b.id ? '…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setBuyerRejectModal({ id: b.id })}
                            disabled={buyerActionLoading === b.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

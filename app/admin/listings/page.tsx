'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/client';

const ADMIN_EMAIL = 'bobby@lotscout.com';

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
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

function formatPrice(price: number | null): string {
  if (price == null) return '—';
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
  return `$${price.toLocaleString()}`;
}

function formatAcreage(acres: number | null, sqft: number | null): string {
  if (acres != null) return `${acres.toLocaleString()} ac`;
  if (sqft != null) return `${sqft.toLocaleString()} sqft`;
  return '—';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-700',
    pending_review: 'bg-amber-100 text-amber-800',
  };
  const labels: Record<string, string> = {
    active: 'Approved',
    rejected: 'Rejected',
    pending_review: 'Pending',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function AdminListingsPage() {
  const router = useRouter();
  const [pending, setPending] = useState<Listing[]>([]);
  const [recent, setRecent] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/sign-in');
        return;
      }
      if (user.email !== ADMIN_EMAIL) {
        router.replace('/dashboard');
        return;
      }

      await fetchListings();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchListings() {
    setLoading(true);
    const supabase = createClient();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [pendingRes, recentRes] = await Promise.all([
      supabase
        .from('listings')
        .select('id, title, status, state, county, lot_size_acres, lot_size_sqft, asking_price, created_at, updated_at, user_id')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false }),
      supabase
        .from('listings')
        .select('id, title, status, state, county, lot_size_acres, lot_size_sqft, asking_price, created_at, updated_at, user_id')
        .in('status', ['active', 'rejected'])
        .gte('updated_at', thirtyDaysAgo)
        .order('updated_at', { ascending: false })
        .limit(50),
    ]);

    // Enrich with profile data
    async function enrichWithProfiles(listings: Listing[]): Promise<Listing[]> {
      if (!listings.length) return listings;
      const userIds = [...new Set(listings.map(l => l.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
      (profiles ?? []).forEach((p: { id: string; full_name: string | null; email: string | null }) => {
        profileMap[p.id] = { full_name: p.full_name, email: p.email };
      });

      return listings.map(l => ({ ...l, profiles: profileMap[l.user_id] ?? null }));
    }

    const [enrichedPending, enrichedRecent] = await Promise.all([
      enrichWithProfiles(pendingRes.data ?? []),
      enrichWithProfiles(recentRes.data ?? []),
    ]);

    setPending(enrichedPending);
    setRecent(enrichedRecent);
    setLoading(false);
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}/approve`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to approve');
      showToast('Listing approved and seller notified!', 'success');
      await fetchListings();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error approving listing', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    try {
      const res = await fetch(`/api/admin/listings/${rejectModal.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to reject');
      showToast('Listing rejected and seller notified.', 'success');
      setRejectModal(null);
      setRejectReason('');
      await fetchListings();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error rejecting listing', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="bg-surface text-on-surface antialiased font-body min-h-screen">
      <Header />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-1">Reject Listing</h3>
            <p className="text-sm text-on-surface/60 mb-4">
              <span className="font-medium text-on-surface">{rejectModal.title}</span>
            </p>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Reason <span className="text-on-surface/40">(optional — sent to seller)</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Missing property details, incomplete photos..."
              className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="px-4 py-2 text-sm rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.id}
                className="px-4 py-2 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === rejectModal.id ? 'Rejecting…' : 'Reject Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-extrabold text-primary tracking-tight">Admin — Listing Review</h1>
          <p className="text-on-surface/60 mt-1 text-sm">Review and approve or reject submitted listings.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-on-surface/40 text-sm">Loading listings…</div>
        ) : (
          <>
            {/* Pending Review */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-headline font-bold text-xl text-on-surface">Pending Review</h2>
                {pending.length > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                )}
              </div>

              {pending.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-10 text-center text-on-surface/40 text-sm">
                  No listings pending review. All caught up! ✅
                </div>
              ) : (
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                          <th className="text-left px-5 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Title</th>
                          <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Seller</th>
                          <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Location</th>
                          <th className="text-right px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Acreage</th>
                          <th className="text-right px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Price</th>
                          <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Submitted</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {pending.map(listing => (
                          <tr key={listing.id} className="hover:bg-surface-container-low/50 transition-colors">
                            <td className="px-5 py-4">
                              <span className="font-medium text-on-surface line-clamp-1">{listing.title || '—'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-on-surface font-medium">{listing.profiles?.full_name || '—'}</div>
                              <div className="text-on-surface/50 text-xs">{listing.profiles?.email || '—'}</div>
                            </td>
                            <td className="px-4 py-4 text-on-surface/70">
                              {[listing.county, listing.state].filter(Boolean).join(', ') || '—'}
                            </td>
                            <td className="px-4 py-4 text-right text-on-surface/70">
                              {formatAcreage(listing.lot_size_acres, listing.lot_size_sqft)}
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-primary">
                              {formatPrice(listing.asking_price)}
                            </td>
                            <td className="px-4 py-4 text-on-surface/60">
                              {formatDate(listing.created_at)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={() => handleApprove(listing.id)}
                                  disabled={actionLoading === listing.id}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                                >
                                  {actionLoading === listing.id ? '…' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => setRejectModal({ id: listing.id, title: listing.title })}
                                  disabled={actionLoading === listing.id}
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

            {/* Recently Reviewed */}
            <section>
              <h2 className="font-headline font-bold text-xl text-on-surface mb-4">Recently Reviewed (Last 30 Days)</h2>

              {recent.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-10 text-center text-on-surface/40 text-sm">
                  No recently reviewed listings.
                </div>
              ) : (
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                          <th className="text-left px-5 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Title</th>
                          <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Seller</th>
                          <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Location</th>
                          <th className="text-right px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Price</th>
                          <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Status</th>
                          <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Reviewed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {recent.map(listing => (
                          <tr key={listing.id} className="hover:bg-surface-container-low/50 transition-colors">
                            <td className="px-5 py-4">
                              <span className="font-medium text-on-surface line-clamp-1">{listing.title || '—'}</span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-on-surface font-medium">{listing.profiles?.full_name || '—'}</div>
                              <div className="text-on-surface/50 text-xs">{listing.profiles?.email || '—'}</div>
                            </td>
                            <td className="px-4 py-4 text-on-surface/70">
                              {[listing.county, listing.state].filter(Boolean).join(', ') || '—'}
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-primary">
                              {formatPrice(listing.asking_price)}
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge status={listing.status} />
                            </td>
                            <td className="px-4 py-4 text-on-surface/60">
                              {formatDate(listing.updated_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

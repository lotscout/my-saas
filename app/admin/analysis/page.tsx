'use client';

import { useEffect, useState, useCallback } from 'react';

interface AnalysisRequest {
  id: string;
  input_type: string | null;
  street_address: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  zip_code: string | null;
  apn: string | null;
  status: string;
  report_url: string | null;
  submitted_at: string;
  user_id: string;
  user: { email: string | null; name: string };
}

const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'completed', 'rejected'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_LABEL: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminAnalysisPage() {
  const [requests, setRequests] = useState<AnalysisRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    id: string;
    action: 'in_progress' | 'completed' | 'rejected';
    location: string;
  } | null>(null);
  const [reportUrl, setReportUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/analysis');
    const data = await res.json();
    const all: AnalysisRequest[] = data.requests ?? [];
    setRequests(statusFilter === 'all' ? all : all.filter(r => r.status === statusFilter));
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleAction() {
    if (!modal) return;
    setActionLoading(modal.id);
    try {
      const res = await fetch(`/api/admin/analysis/${modal.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: modal.action,
          report_url: reportUrl || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      showToast('Analysis request updated — user notified.', 'success');
      setModal(null);
      setReportUrl('');
      setNotes('');
      await fetchRequests();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function quickUpdate(id: string, status: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/analysis/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      showToast('Status updated.', 'success');
      await fetchRequests();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
              {modal.action === 'completed' ? 'Mark as Completed' : modal.action === 'in_progress' ? 'Mark as In Progress' : 'Reject Request'}
            </h3>
            <p className="text-sm text-on-surface/60 mb-4">{modal.location}</p>

            {modal.action === 'completed' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-on-surface mb-1">Report URL <span className="text-on-surface/40">(optional)</span></label>
                <input
                  value={reportUrl}
                  onChange={e => setReportUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-on-surface mb-1">
                Notes <span className="text-on-surface/40">(optional — sent to user)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={modal.action === 'rejected' ? 'e.g. Property outside our service area…' : 'e.g. See attached report for full details…'}
                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setModal(null); setReportUrl(''); setNotes(''); }}
                className="px-4 py-2 text-sm rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading === modal.id}
                className={`px-4 py-2 text-sm rounded-xl text-white transition-colors disabled:opacity-50 ${
                  modal.action === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                  modal.action === 'completed' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {actionLoading === modal.id ? 'Saving…' :
                  modal.action === 'completed' ? 'Mark Complete' :
                  modal.action === 'in_progress' ? 'Mark In Progress' :
                  'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Analysis Queue</h1>
        <p className="text-on-surface/50 mt-1 text-sm">Manage property analysis requests and deliver completed reports.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 bg-surface-container-low rounded-xl p-1 self-start w-fit">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              statusFilter === s ? 'bg-white text-primary shadow-sm' : 'text-on-surface/50 hover:text-on-surface'
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-outline-variant/10 rounded-2xl p-12 text-center text-on-surface/40 text-sm">
          Loading requests…
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-outline-variant/10 rounded-2xl p-12 text-center text-on-surface/40 text-sm">
          No requests found for this filter.
        </div>
      ) : (
        <div className="bg-white border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                  <th className="text-left px-5 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Property</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Requester</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Submitted</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface/60 text-xs uppercase tracking-wider">Report</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {requests.map(r => {
                  const location = [r.street_address, r.city, r.state].filter(Boolean).join(', ') || r.apn || r.county || '—';
                  return (
                    <tr key={r.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-medium text-on-surface line-clamp-1 max-w-[200px] block">{location}</span>
                        {r.apn && <span className="text-xs text-on-surface/40">APN: {r.apn}</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-on-surface">{r.user.name}</div>
                        <div className="text-on-surface/50 text-xs">{r.user.email || '—'}</div>
                      </td>
                      <td className="px-4 py-4 text-on-surface/70 capitalize">{r.input_type?.replace('_', ' ') || '—'}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-on-surface/60">{fmtDate(r.submitted_at)}</td>
                      <td className="px-4 py-4">
                        {r.report_url ? (
                          <a href={r.report_url} target="_blank" rel="noopener noreferrer"
                            className="text-primary text-xs font-semibold hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            View
                          </a>
                        ) : <span className="text-on-surface/30 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          {r.status === 'pending' && (
                            <button
                              onClick={() => quickUpdate(r.id, 'in_progress')}
                              disabled={actionLoading === r.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {actionLoading === r.id ? '…' : 'Start'}
                            </button>
                          )}
                          {(r.status === 'pending' || r.status === 'in_progress') && (
                            <button
                              onClick={() => setModal({ id: r.id, action: 'completed', location })}
                              disabled={actionLoading === r.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              Complete
                            </button>
                          )}
                          {r.status !== 'rejected' && r.status !== 'completed' && (
                            <button
                              onClick={() => setModal({ id: r.id, action: 'rejected', location })}
                              disabled={actionLoading === r.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}
                          {(r.status === 'completed' || r.status === 'rejected') && (
                            <button
                              onClick={() => setModal({ id: r.id, action: 'completed', location })}
                              disabled={actionLoading === r.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-outline-variant text-on-surface/60 hover:bg-surface-container-low transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              Update
                            </button>
                          )}
                        </div>
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

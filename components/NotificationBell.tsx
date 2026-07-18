'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface NotificationItem {
  id: string;
  type: 'message' | 'listing' | 'buyer';
  text: string;
  href: string;
  created_at: string;
}

const LAST_SEEN_KEY = 'lotscout_notifications_last_seen';

const ICONS: Record<NotificationItem['type'], string> = {
  message: 'mail',
  listing: 'landscape',
  buyer: 'person_search',
};

const LABELS: Record<NotificationItem['type'], string> = {
  message: 'Message',
  listing: 'Listing',
  buyer: 'Buyer',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [lastSeen, setLastSeen] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);

  // Load the last-seen marker (badge clears for anything older than this).
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_SEEN_KEY) : null;
    setLastSeen(stored ? Number(stored) : 0);
  }, []);

  // Fetch aggregated notifications once on mount.
  useEffect(() => {
    let active = true;
    fetch('/api/notifications')
      .then(r => (r.ok ? r.json() : { items: [] }))
      .then(json => { if (active) setItems(json.items ?? []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Close on outside click.
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unreadCount = items.filter(i => new Date(i.created_at).getTime() > lastSeen).length;

  function toggle() {
    setOpen(prev => {
      const next = !prev;
      // Opening marks everything currently listed as seen — clears the badge.
      if (next) {
        const now = Date.now();
        window.localStorage.setItem(LAST_SEEN_KEY, String(now));
        setLastSeen(now);
      }
      return next;
    });
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative p-2 text-primary hover:bg-emerald-50 rounded-full transition-all"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-2 right-2 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-white border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
            <span className="text-sm font-black text-primary font-['Manrope']">Notifications</span>
            <span className="text-xs text-secondary">{items.length}</span>
          </div>
          <div className="max-h-[70vh] sm:max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-secondary text-sm">You are all caught up</div>
            ) : (
              items.map(item => (
                <button
                  key={item.id}
                  onClick={() => go(item.href)}
                  className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-outline-variant/5 last:border-b-0"
                >
                  <span className="material-symbols-outlined text-primary text-xl mt-0.5">{ICONS[item.type]}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-secondary/70">{LABELS[item.type]}</span>
                    <span className="block text-sm font-semibold text-on-surface truncate">{item.text}</span>
                    <span className="block text-xs text-secondary mt-0.5">{relativeTime(item.created_at)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { redirect } from 'next/navigation';

// The message-monitoring view moved to /admin/messages, which reads directly from the
// messages table (accurate, no stale cache) and uses only columns that exist in
// production. This old dashboard view queried non-existent columns (sent_by_admin,
// sender_type, recipient_id) and returned 500s, so it now redirects to the new view.
export default function DashboardMessagesRedirect() {
  redirect('/admin/messages');
}

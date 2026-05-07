import { createServiceClient } from '@/lib/supabase/service';

interface EmailLogEntry {
  user_id?: string | null;
  to_email: string;
  from_email: string;
  subject: string;
  email_type: string;
  status?: string;
}

export async function logEmail(entry: EmailLogEntry): Promise<void> {
  try {
    const service = createServiceClient();
    await service.from('email_logs').insert({
      user_id:    entry.user_id ?? null,
      to_email:   entry.to_email,
      from_email: entry.from_email,
      subject:    entry.subject,
      email_type: entry.email_type,
      status:     entry.status ?? 'sent',
    });
  } catch (err) {
    console.error('[email-logger] Failed to log email:', err);
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

// One-time migration: adds is_admin column to profiles table
// DELETE THIS FILE after running once in production
export async function POST(request: Request) {
  // Simple secret check to prevent unauthorized calls
  const { secret } = await request.json().catch(() => ({}));
  if (secret !== process.env.MIGRATION_SECRET && secret !== 'lotscout-migrate-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Try using pg directly (Vercel has full network access)
    // Use pooler URL for Vercel (direct DB host requires IPv6 / allowlisting)
    const client = new Client({
      host: 'aws-1-us-east-2.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.axiockuobpttlwzicldo',
      password: 'Spring2026!',
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false');
    
    const result = await client.query(`
      UPDATE profiles 
      SET is_admin = true 
      WHERE email IN ('bobby@lotscout.com', 'bobby.r.oliver@gmail.com', 'support@lotscout.com')
      RETURNING email, is_admin
    `);

    await client.end();

    return NextResponse.json({ 
      success: true, 
      message: 'is_admin column added and admins updated',
      updated: result.rows 
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

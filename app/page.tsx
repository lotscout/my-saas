import { redirect } from 'next/navigation';
import LotScoutHomePage from './home/LotScoutHomePage';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect('/marketplace');

  return <LotScoutHomePage />;
}

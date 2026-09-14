import { redirect } from 'next/navigation';
import AcquisitionStyleLandingMock from '../landing-acq-mock/page';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect('/marketplace');

  return <AcquisitionStyleLandingMock />;
}

'use client';

import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function CreateListingGate({ children, className }: Props) {
  const { profile, loading } = usePermissions();
  const router = useRouter();

  function handleClick() {
    if (loading) return;
    if (!profile) {
      router.push('/sign-up');
      return;
    }
    router.push('/create-listing');
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}

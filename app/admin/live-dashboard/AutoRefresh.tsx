'use client';

import { useEffect } from 'react';

export default function AutoRefresh() {
  useEffect(() => {
    const t = setInterval(() => window.location.reload(), 60000);
    return () => clearInterval(t);
  }, []);

  return null;
}

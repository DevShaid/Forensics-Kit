// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import dynamicImport from 'next/dynamic';

const TypeformContainer = dynamicImport(() => import('@/components/TypeformContainer'), { ssr: false });

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main>
      <TypeformContainer />
    </main>
  );
}
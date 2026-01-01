// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import dynamicImport from 'next/dynamic';

const WelcomeScreen = dynamicImport(() => import('@/components/WelcomeScreen'), { ssr: false });
const TypeformContainer = dynamicImport(() => import('@/components/TypeformContainer'), { ssr: false });

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main>
      {!showForm ? (
        <WelcomeScreen onStart={() => setShowForm(true)} />
      ) : (
        <TypeformContainer />
      )}
    </main>
  );
}
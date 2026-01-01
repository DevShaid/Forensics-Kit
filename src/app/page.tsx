// app/page.tsx
'use client';

import { useState } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import TypeformContainer from '@/components/TypeformContainer';

export const dynamic = 'force-dynamic';

export default function Home() {
  const [showForm, setShowForm] = useState(false);

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
'use client';

import { useEffect } from 'react';

export default function IPMonitorInitializer() {
  useEffect(() => {
    // Auto-start IP monitoring on component mount
    const startMonitoring = async () => {
      try {
        const response = await fetch('/api/monitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' })
        });

        const data = await response.json();
        console.log('✅ IP monitoring active:', data);
      } catch (error) {
        console.error('❌ Failed to start IP monitoring:', error);
      }
    };

    startMonitoring();

    // Cleanup on unmount
    return () => {
      // Optionally stop monitoring when app closes
      // fetch('/api/monitor', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ action: 'stop' })
      // });
    };
  }, []);

  return null; // This component renders nothing
}

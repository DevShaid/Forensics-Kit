// IP Monitor Client Service
// Auto-starts monitoring on app load

let isMonitoring = false;

export async function startIPMonitoring() {
  if (isMonitoring) {
    console.log('IP monitoring already running');
    return;
  }

  try {
    const response = await fetch('/api/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' })
    });

    const data = await response.json();
    isMonitoring = true;
    console.log('IP monitoring started:', data);
  } catch (error) {
    console.error('Failed to start IP monitoring:', error);
  }
}

export async function stopIPMonitoring() {
  try {
    const response = await fetch('/api/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' })
    });

    const data = await response.json();
    isMonitoring = false;
    console.log('IP monitoring stopped:', data);
  } catch (error) {
    console.error('Failed to stop IP monitoring:', error);
  }
}

export async function getMonitorStatus() {
  try {
    const response = await fetch('/api/monitor');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get monitor status:', error);
    return null;
  }
}

// Auto-start monitoring on load (client-side only)
if (typeof window !== 'undefined') {
  // Start monitoring when the browser tab is visible
  if (document.visibilityState === 'visible') {
    startIPMonitoring();
  }

  // Restart monitoring when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !isMonitoring) {
      startIPMonitoring();
    }
  });
}

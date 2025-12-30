import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_12NmD9rK_HHHhqHiPnCCvYJtrjgsLJNeT');

interface IPData {
  ip: string;
  timestamp: number;
  location: {
    city: string;
    state: string;
    country: string;
    lat: number;
    lon: number;
    accuracy: number;
  };
  isp: string;
  connectionType: string;
  threat: {
    isVPN: boolean;
    isProxy: boolean;
    isTor: boolean;
  };
}

let previousData: IPData | null = null;
let monitoringActive = false;

// Calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Fetch IP data from multiple sources for redundancy
async function fetchIPData(): Promise<IPData | null> {
  try {
    // Primary source: ipapi.co (high accuracy, free tier)
    const response = await fetch('https://ipapi.co/json/', {
      headers: { 'User-Agent': 'IPMonitor/1.0' }
    });

    if (!response.ok) {
      throw new Error('Primary IP source failed');
    }

    const data = await response.json();

    // Fallback to ip-api.com for additional data
    let threatData = { isVPN: false, isProxy: false, isTor: false };
    try {
      const ipApiResponse = await fetch(`http://ip-api.com/json/${data.ip}?fields=status,proxy,hosting`);
      const ipApiData = await ipApiResponse.json();
      if (ipApiData.status === 'success') {
        threatData.isProxy = ipApiData.proxy || false;
        threatData.isVPN = ipApiData.hosting || false;
      }
    } catch (e) {
      // Fallback failed, continue with primary data
    }

    return {
      ip: data.ip,
      timestamp: Date.now(),
      location: {
        city: data.city || 'Unknown',
        state: data.region || 'Unknown',
        country: data.country_name || 'Unknown',
        lat: parseFloat(data.latitude) || 0,
        lon: parseFloat(data.longitude) || 0,
        accuracy: data.accuracy || 5000 // Default 5km if not provided
      },
      isp: data.org || 'Unknown ISP',
      connectionType: data.connection?.type || 'Unknown',
      threat: threatData
    };
  } catch (error) {
    console.error('Error fetching IP data:', error);

    // Fallback to ipify + ipapi
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=66846719`);
      const geoData = await geoResponse.json();

      return {
        ip,
        timestamp: Date.now(),
        location: {
          city: geoData.city || 'Unknown',
          state: geoData.regionName || 'Unknown',
          country: geoData.country || 'Unknown',
          lat: geoData.lat || 0,
          lon: geoData.lon || 0,
          accuracy: 10000 // Lower accuracy for fallback
        },
        isp: geoData.isp || 'Unknown ISP',
        connectionType: geoData.mobile ? 'mobile' : 'broadband',
        threat: {
          isVPN: geoData.proxy || false,
          isProxy: geoData.proxy || false,
          isTor: false
        }
      };
    } catch (fallbackError) {
      console.error('Fallback IP fetch failed:', fallbackError);
      return null;
    }
  }
}

// Send email alert
async function sendAlert(currentData: IPData, changeType: string, distance?: number) {
  const timestamp = new Date(currentData.timestamp).toISOString().replace('T', ' ').substring(0, 23) + ' UTC';
  const mapsLink = `https://www.google.com/maps?q=${currentData.location.lat},${currentData.location.lon}`;

  const previousIP = previousData?.ip || 'N/A';
  const ipChange = previousData ? `${previousIP} → ${currentData.ip}` : currentData.ip;

  const securityStatus = currentData.threat.isTor ? '🔴 TOR Detected' :
                        currentData.threat.isVPN ? '🟡 VPN Detected' :
                        currentData.threat.isProxy ? '🟠 Proxy Detected' :
                        '🟢 Clean';

  const accuracyText = currentData.location.accuracy < 1000
    ? `${Math.round(currentData.location.accuracy)} meters`
    : `${(currentData.location.accuracy / 1000).toFixed(2)} km`;

  const emailBody = `
🚨 IMMEDIATE IP CHANGE DETECTED

⏰ Time: ${timestamp}
📍 New Location: ${currentData.location.city}, ${currentData.location.state}, ${currentData.location.country}
📡 IP Address: ${ipChange}
🎯 Accuracy: ${accuracyText}
📊 Change Type: ${changeType}
🌐 ISP: ${currentData.isp}
🔍 Coordinates: ${currentData.location.lat.toFixed(6)}, ${currentData.location.lon.toFixed(6)}
${distance ? `📏 Distance from previous: ${distance.toFixed(2)}km` : ''}
🛡️ Security: ${securityStatus}
📶 Connection: ${currentData.connectionType}
🗺️ Map: ${mapsLink}

---
Raw Data:
IP: ${currentData.ip}
Latitude: ${currentData.location.lat}
Longitude: ${currentData.location.lon}
Timestamp: ${currentData.timestamp}
  `.trim();

  try {
    await resend.emails.send({
      from: 'IP Monitor <onboarding@resend.dev>',
      to: 'shaidt137@gmail.com',
      subject: `🚨 IP ALERT: ${changeType} - ${currentData.location.city}`,
      text: emailBody
    });
    console.log(`Alert sent: ${changeType}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// Main monitoring loop
async function monitorIP() {
  if (!monitoringActive) return;

  const currentData = await fetchIPData();

  if (!currentData) {
    // Retry after 100ms if fetch failed
    setTimeout(monitorIP, 100);
    return;
  }

  let shouldAlert = false;
  let changeType = '';
  let distance = 0;

  if (!previousData) {
    // First run
    shouldAlert = true;
    changeType = 'Initial Detection';
  } else {
    // Check for IP change
    if (currentData.ip !== previousData.ip) {
      shouldAlert = true;
      changeType = 'IP Address Changed';
    }

    // Check for location change (>1km)
    distance = calculateDistance(
      previousData.location.lat,
      previousData.location.lon,
      currentData.location.lat,
      currentData.location.lon
    );

    if (distance > 1) {
      shouldAlert = true;
      changeType = changeType ? `${changeType} + Location Shift` : 'Location Shift >1km';
    }

    // Check for threat detection
    if (currentData.threat.isVPN && !previousData.threat.isVPN) {
      shouldAlert = true;
      changeType = changeType ? `${changeType} + VPN Detected` : 'VPN Detected';
    }

    if (currentData.threat.isProxy && !previousData.threat.isProxy) {
      shouldAlert = true;
      changeType = changeType ? `${changeType} + Proxy Detected` : 'Proxy Detected';
    }

    if (currentData.threat.isTor && !previousData.threat.isTor) {
      shouldAlert = true;
      changeType = changeType ? `${changeType} + TOR Detected` : 'TOR Network Detected';
    }

    // Check for connection type change
    if (currentData.connectionType !== previousData.connectionType) {
      shouldAlert = true;
      changeType = changeType ? `${changeType} + Network Switch` : 'Network Type Changed';
    }
  }

  if (shouldAlert) {
    await sendAlert(currentData, changeType, distance > 0 ? distance : undefined);
  }

  previousData = currentData;

  // Schedule next check in 100ms
  setTimeout(monitorIP, 100);
}

// API Routes
export async function POST(request: Request) {
  const { action } = await request.json();

  if (action === 'start') {
    if (monitoringActive) {
      return NextResponse.json({ message: 'Monitoring already active' });
    }

    monitoringActive = true;
    previousData = null;
    monitorIP(); // Start monitoring loop

    return NextResponse.json({
      message: 'IP monitoring started',
      interval: '100ms',
      email: 'shaidt137@gmail.com'
    });
  }

  if (action === 'stop') {
    monitoringActive = false;
    previousData = null;

    return NextResponse.json({ message: 'IP monitoring stopped' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({
    status: monitoringActive ? 'active' : 'inactive',
    lastCheck: previousData?.timestamp || null,
    currentIP: previousData?.ip || null,
    location: previousData?.location || null
  });
}

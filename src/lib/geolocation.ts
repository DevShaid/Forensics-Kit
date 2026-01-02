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

  // Get IP and VPN detection using reliable APIs
  try {
    // First get IP
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    ip = ipData.ip;

    // Use ip-api.com with proxy/hosting detection (primary source of truth)
    let ipApiData: any = {};
    try {
      const ipApiResponse = await fetch(
        `https://pro.ip-api.com/json/${ip}?fields=status,message,continent,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting,query&key=demo`
      );
      ipApiData = await ipApiResponse.json();
    } catch {
      // Fallback to HTTP if HTTPS fails
      try {
        const fallbackResponse = await fetch(
          `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,query`
        );
        ipApiData = await fallbackResponse.json();
      } catch {}
    }

    // Also get ipapi.co for additional data
    let ipapiData: any = {};
    try {
      const ipapiResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      ipapiData = await ipapiResponse.json();
    } catch {}

    // PRIMARY VPN DETECTION: ip-api.com proxy and hosting flags
    // These are the most reliable indicators
    if (ipApiData.status === 'success') {
      if (ipApiData.proxy === true) {
        isVPN = true;
        vpnProvider = ipApiData.isp || ipApiData.org || 'VPN/Proxy Service';
        vpnConfidence = 90; // High confidence - API confirmed proxy
      }
      if (ipApiData.hosting === true) {
        isVPN = true;
        vpnProvider = vpnProvider || ipApiData.isp || ipApiData.org || 'Datacenter/Hosting';
        vpnConfidence = Math.max(vpnConfidence, 80); // High confidence - datacenter IP
      }
    }

    // SECONDARY: Keyword-based detection for known VPN providers
    const orgText = `${ipapiData.org || ''} ${ipApiData.isp || ''} ${ipApiData.org || ''}`.toLowerCase();

    const vpnKeywords = [
      'nordvpn', 'expressvpn', 'surfshark', 'cyberghost', 'pia',
      'private internet access', 'mullvad', 'protonvpn', 'tunnelbear',
      'windscribe', 'ipvanish', 'hotspot shield', 'hide.me', 'purevpn',
      'torguard', 'vyprvpn', 'airvpn', 'ivpn', ' vpn', 'vpn ',
      'tor exit', 'exit node', 'proxy service', 'anonymous proxy'
    ];

    for (const keyword of vpnKeywords) {
      if (orgText.includes(keyword)) {
        isVPN = true;
        vpnProvider = ipapiData.org || ipApiData.isp || ipApiData.org;
        vpnConfidence = Math.max(vpnConfidence, 85);
        break;
      }
    }

    // Cap confidence at 100
    vpnConfidence = Math.min(100, vpnConfidence);

    // Get coordinates and address
    if (ipApiData.lat && ipApiData.lon) {
      coordinates = {
        latitude: ipApiData.lat,
        longitude: ipApiData.lon,
        accuracy: isVPN ? 5000 : 1000,
      };
    }

    if (ipApiData.city || ipapiData.city) {
      address = {
        street: '',
        city: ipApiData.city || ipapiData.city || '',
        state: ipApiData.regionName || ipapiData.region || '',
        country: ipApiData.country || ipapiData.country_name || '',
        zipCode: ipApiData.zip || ipapiData.postal || '',
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
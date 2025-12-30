import { LocationData } from './types';

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

  // Get IP and VPN detection
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    ip = ipData.ip;

    // Use ipapi.co for VPN detection and basic location
    const vpnCheckResponse = await fetch(`https://ipapi.co/${ip}/json/`);
    const vpnData = await vpnCheckResponse.json();

    // Check for VPN/proxy indicators
    if (vpnData.org) {
      const vpnKeywords = [
        'vpn', 'proxy', 'hosting', 'datacenter', 'cloud',
        'digitalocean', 'aws', 'amazon', 'google cloud', 'azure',
        'linode', 'vultr', 'ovh', 'hetzner', 'nordvpn', 'expressvpn',
        'surfshark', 'cyberghost', 'private internet access', 'pia',
        'mullvad', 'protonvpn', 'tunnelbear', 'windscribe', 'ipvanish',
        'hotspot shield', 'hide.me', 'purevpn'
      ];

      const orgLower = vpnData.org.toLowerCase();
      for (const keyword of vpnKeywords) {
        if (orgLower.includes(keyword)) {
          isVPN = true;
          vpnProvider = vpnData.org;
          break;
        }
      }
    }

    // Also check ASN type if available
    if (vpnData.asn && vpnData.org) {
      const vpnASNs = [
        'AS9009', 'AS20473', 'AS14061', 'AS16509', 'AS15169', 'AS8075',
      ];

      if (vpnASNs.some(asn => vpnData.asn.includes(asn))) {
        isVPN = true;
        vpnProvider = vpnData.org;
      }
    }

    // Get basic address from IP
    if (vpnData.city) {
      address = {
        street: '',
        city: vpnData.city || '',
        state: vpnData.region || '',
        country: vpnData.country_name || '',
        zipCode: vpnData.postal || '',
      };
    }
  } catch (error) {
    console.error('Error fetching IP data:', error);
  }

  return {
    coordinates: null,
    address,
    ip,
    isVPN,
    vpnProvider,
    deviceInfo,
  };
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

// Advanced VPN Detection and Real IP Discovery
// Client-side fingerprinting and WebRTC leak detection

export interface ClientDetectionData {
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
    touchSupport: boolean;
    maxTouchPoints: number;
    cookiesEnabled: boolean;
    doNotTrack: string | null;
  };
  webRTCIPs: string[];
  timezone: string;
  language: string;
  languages: string[];
}

// Extract WebRTC IPs (may leak real IP even through VPN)
async function getWebRTCIPs(): Promise<string[]> {
  const ips: string[] = [];

  return new Promise((resolve) => {
    try {
      const RTCPeerConnection =
        window.RTCPeerConnection ||
        (window as any).webkitRTCPeerConnection ||
        (window as any).mozRTCPeerConnection;

      if (!RTCPeerConnection) {
        resolve([]);
        return;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      pc.createDataChannel('');

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {});

      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) {
          pc.close();
          resolve([...new Set(ips)]); // Remove duplicates
          return;
        }

        const parts = ice.candidate.candidate.split(' ');
        const ip = parts[4];

        if (ip && !ips.includes(ip)) {
          ips.push(ip);
        }
      };

      // Timeout after 3 seconds
      setTimeout(() => {
        pc.close();
        resolve([...new Set(ips)]);
      }, 3000);

    } catch (error) {
      console.error('WebRTC detection failed:', error);
      resolve([]);
    }
  });
}

// Get detailed device fingerprint
function getDeviceFingerprint() {
  const nav = window.navigator as any;
  const screen = window.screen;

  // Detect device type
  const userAgent = nav.userAgent || '';
  let deviceType = 'Desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    deviceType = 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    deviceType = 'Mobile';
  }

  // Detect OS
  let os = 'Unknown';
  if (userAgent.indexOf('Win') !== -1) os = 'Windows';
  else if (userAgent.indexOf('Mac') !== -1) os = 'MacOS';
  else if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
  else if (userAgent.indexOf('Android') !== -1) os = 'Android';
  else if (userAgent.indexOf('like Mac') !== -1) os = 'iOS';

  // Detect browser
  let browser = 'Unknown';
  if (userAgent.indexOf('Chrome') !== -1) browser = 'Chrome';
  else if (userAgent.indexOf('Safari') !== -1) browser = 'Safari';
  else if (userAgent.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (userAgent.indexOf('MSIE') !== -1 || userAgent.indexOf('Trident/') !== -1) browser = 'Internet Explorer';
  else if (userAgent.indexOf('Edge') !== -1) browser = 'Edge';

  return {
    type: deviceType,
    os,
    browser,
    platform: nav.platform || 'Unknown',
    language: nav.language || 'Unknown',
    languages: nav.languages ? Array.from(nav.languages) : [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth || 0,
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: nav.deviceMemory || null,
    userAgent,
    touchSupport: 'ontouchstart' in window || nav.maxTouchPoints > 0,
    maxTouchPoints: nav.maxTouchPoints || 0,
    cookiesEnabled: nav.cookieEnabled || false,
    doNotTrack: nav.doNotTrack || null,
  };
}

// Main detection function
export async function runAdvancedDetection(): Promise<ClientDetectionData> {
  const [webRTCIPs, deviceInfo] = await Promise.all([
    getWebRTCIPs(),
    Promise.resolve(getDeviceFingerprint()),
  ]);

  return {
    deviceInfo,
    webRTCIPs,
    timezone: deviceInfo.timezone,
    language: deviceInfo.language,
    languages: deviceInfo.languages,
  };
}

// Send detection data to server for analysis
export async function detectAndAnalyze(): Promise<any> {
  try {
    const clientData = await runAdvancedDetection();

    const response = await fetch('/api/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      throw new Error('Detection failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Advanced detection error:', error);
    return null;
  }
}

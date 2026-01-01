// lib/vpn-leak-detector.ts
// Enhanced VPN Leak Detection System v2.0
// Comprehensive detection for WebRTC, DNS, IPv6, WebSocket, HTTP headers, and more

export interface VPNLeakReport {
  hasLeaks: boolean;
  leakSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  leaks: {
    dnsLeaks: DNSLeak[];
    webrtcLeaks: WebRTCLeak[];
    ipv6Leaks: IPv6Leak[];
    dhcpLeaks: DHCPLeak[];
    timezoneLeak: TimezoneLeak | null;
    browserLeak: BrowserLeak | null;
    webSocketLeaks: WebSocketLeak[];
    httpHeaderLeaks: HTTPHeaderLeak[];
    geolocationLeaks: GeolocationLeak[];
    splitTunnelingLeaks: SplitTunnelingLeak[];
    extensionLeaks: ExtensionLeak[];
    torrentLeaks: TorrentLeak[];
    killSwitchLeaks: KillSwitchLeak[];
    dohLeaks: DoHLeak[];
    mdnsLeaks: MDNSLeak[];
    fingerprintingResistance: FingerprintingResistance | null;
  };
  realIP: string | null;
  vpnIP: string;
  allDetectedIPs: DetectedIP[];
  ipReputations: IPReputation[];
  recommendations: string[];
  detectionTimestamp: number;
  detectionDuration: number;
  confidence: number;
}

interface DetectedIP {
  ip: string;
  source: string;
  type: 'public' | 'private' | 'ipv6' | 'loopback' | 'link-local';
  isVPNIP: boolean;
  timestamp: number;
}

interface DNSLeak {
  type: 'dns';
  severity: 'critical' | 'high' | 'medium';
  dnsServer: string;
  resolvedIP: string;
  location: string;
  isp: string;
  leaked: boolean;
  testDomain: string;
  responseTime: number;
}

interface WebRTCLeak {
  type: 'webrtc';
  severity: 'critical' | 'high';
  localIPs: string[];
  publicIPs: string[];
  ipv6IPs: string[];
  mdnsAddresses: string[];
  stunServer: string;
  turnServer?: string;
  candidateTypes: string[];
  protocols: string[];
  relayProtocol?: string;
  leaked: boolean;
  rawCandidates: string[];
}

interface IPv6Leak {
  type: 'ipv6';
  severity: 'high' | 'medium';
  ipv6Address: string;
  prefix: string;
  addressType: 'global' | 'link-local' | 'unique-local' | 'teredo' | '6to4' | 'loopback';
  leaked: boolean;
  source: string;
}

interface DHCPLeak {
  type: 'dhcp';
  severity: 'high' | 'medium';
  dhcpServer: string;
  gateway: string;
  subnet: string;
  leaked: boolean;
}

interface TimezoneLeak {
  type: 'timezone';
  severity: 'medium' | 'low';
  timezone: string;
  offset: number;
  vpnLocation: string;
  realLocation: string;
  mismatch: boolean;
  dstActive: boolean;
  localeHints: string[];
  timezoneAbbreviation?: string;
  offsetInconsistent?: boolean;
  offsetMismatch?: boolean;
  languageMismatch?: boolean;
  dstTransitions?: number;
  localeInfo?: any;
  vpnCountry?: string;
  vpnCity?: string;
}

interface BrowserLeak {
  type: 'browser';
  severity: 'medium' | 'low';
  userAgent: string;
  languages: string[];
  plugins: string[];
  fonts: string[];
  canvas: string;
  webgl: string;
  audioFingerprint: string;
  screenResolution: string;
  colorDepth: number;
  hardwareConcurrency: number;
  deviceMemory: number;
  touchSupport: boolean;
  doNotTrack: string | null;
}

interface WebSocketLeak {
  type: 'websocket';
  severity: 'critical' | 'high';
  detectedIP: string;
  protocol: string;
  server: string;
  leaked: boolean;
  connectionTime: number;
}

interface HTTPHeaderLeak {
  type: 'http-header';
  severity: 'critical' | 'high' | 'medium';
  headerName: string;
  headerValue: string;
  exposedIP: string;
  leaked: boolean;
}

interface GeolocationLeak {
  type: 'geolocation';
  severity: 'critical' | 'high';
  latitude: number;
  longitude: number;
  accuracy: number;
  source: 'gps' | 'wifi' | 'cell' | 'ip';
  mismatchWithVPN: boolean;
  leaked: boolean;
}

interface SplitTunnelingLeak {
  type: 'split-tunneling';
  severity: 'high' | 'medium';
  leakedEndpoint: string;
  expectedRoute: string;
  actualRoute: string;
  leaked: boolean;
}

interface ExtensionLeak {
  type: 'extension';
  severity: 'medium' | 'low';
  extensionId: string;
  extensionName: string;
  leakType: 'dns' | 'webrtc' | 'storage';
  leaked: boolean;
}

interface TorrentLeak {
  type: 'torrent';
  severity: 'critical' | 'high';
  trackerIP: string;
  dhtIP: string;
  pexIP: string;
  leaked: boolean;
}

interface KillSwitchLeak {
  type: 'kill-switch';
  severity: 'critical';
  connectionDropDetected: boolean;
  ipExposedDuringDrop: string;
  durationExposed: number;
  leaked: boolean;
}

interface DoHLeak {
  type: 'doh';
  severity: 'high' | 'medium';
  dohProvider: string;
  resolvedIP: string;
  bypassesVPN: boolean;
  leaked: boolean;
  dnsProviderDetected?: string;
  endpoint?: string;
}

interface MDNSLeak {
  type: 'mdns';
  severity: 'medium';
  mdnsHostname: string;
  mdnsIP: string;
  leaked: boolean;
}

interface FingerprintingResistance {
  type: 'fingerprinting-resistance';
  severity: 'info' | 'low';
  detected: boolean;
  features: {
    webrtcDisabled: boolean;
    canvasNoiseDetected: boolean;
    audioContextBlocked: boolean;
    webglDisabled: boolean;
    timingPerturbation: boolean;
    fontEnumeration: boolean;
  };
  browserType: 'tor-browser' | 'brave' | 'firefox-resist' | 'extension' | 'unknown';
  impactOnLeakDetection: string;
}

interface IPReputation {
  ip: string;
  reputationScore: number; // 0-100, lower is worse
  threatLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  categories: string[];
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  isHosting: boolean;
  isBogon: boolean;
  abuseScore: number;
  blacklists: string[];
  whitelists: string[];
  lastSeen?: string;
  firstSeen?: string;
  source: string;
}

export class VPNLeakDetector {
  private vpnIP: string = '';
  private startTime: number = 0;
  private allDetectedIPs: DetectedIP[] = [];
  private ipReputations: IPReputation[] = [];
  private leaks: VPNLeakReport['leaks'] = {
    dnsLeaks: [],
    webrtcLeaks: [],
    ipv6Leaks: [],
    dhcpLeaks: [],
    timezoneLeak: null,
    browserLeak: null,
    webSocketLeaks: [],
    httpHeaderLeaks: [],
    geolocationLeaks: [],
    splitTunnelingLeaks: [],
    extensionLeaks: [],
    torrentLeaks: [],
    killSwitchLeaks: [],
    dohLeaks: [],
    mdnsLeaks: [],
    fingerprintingResistance: null,
  };

  // Extensive STUN server list for comprehensive WebRTC detection
  private readonly stunServers = [
    // Google STUN servers
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
    'stun:stun3.l.google.com:19302',
    'stun:stun4.l.google.com:19302',
    // Mozilla
    'stun:stun.services.mozilla.com:3478',
    // Twilio
    'stun:global.stun.twilio.com:3478',
    // Cloudflare
    'stun:stun.cloudflare.com:3478',
    // STUN protocol
    'stun:stun.stunprotocol.org:3478',
    // Nextcloud
    'stun:stun.nextcloud.com:443',
    // Sipgate
    'stun:stun.sipgate.net:3478',
    // Voipbuster
    'stun:stun.voipbuster.com:3478',
    // Various providers
    'stun:stun.schlund.de:3478',
    'stun:stun.rixtelecom.se:3478',
    'stun:stun.voiparound.com:3478',
  ];

  // DNS leak test endpoints
  private readonly dnsTestEndpoints = [
    { domain: 'api.ipify.org', type: 'ipv4' },
    { domain: 'api64.ipify.org', type: 'dual' },
    { domain: 'icanhazip.com', type: 'ipv4' },
    { domain: 'checkip.amazonaws.com', type: 'ipv4' },
    { domain: 'ipinfo.io/ip', type: 'ipv4' },
    { domain: 'ifconfig.me/ip', type: 'ipv4' },
    { domain: 'ip.seeip.org', type: 'ipv4' },
  ];

  // DoH providers to test
  private readonly dohProviders = [
    { name: 'Cloudflare', endpoint: 'https://cloudflare-dns.com/dns-query' },
    { name: 'Google', endpoint: 'https://dns.google/dns-query' },
    { name: 'Quad9', endpoint: 'https://dns.quad9.net/dns-query' },
  ];

  async detectAllLeaks(currentIP: string): Promise<VPNLeakReport> {
    this.vpnIP = currentIP;
    this.startTime = Date.now();
    this.allDetectedIPs = [];
    this.ipReputations = [];

    // Reset leaks
    this.leaks = {
      dnsLeaks: [],
      webrtcLeaks: [],
      ipv6Leaks: [],
      dhcpLeaks: [],
      timezoneLeak: null,
      browserLeak: null,
      webSocketLeaks: [],
      httpHeaderLeaks: [],
      geolocationLeaks: [],
      splitTunnelingLeaks: [],
      extensionLeaks: [],
      torrentLeaks: [],
      killSwitchLeaks: [],
      dohLeaks: [],
      mdnsLeaks: [],
      fingerprintingResistance: null,
    };

    console.log('🔍 Starting enhanced VPN leak detection v2.0...');

    // Run all leak detection methods in parallel for speed
    await Promise.allSettled([
      this.detectWebRTCLeaksEnhanced(),
      this.detectDNSLeaksEnhanced(),
      this.detectIPv6LeaksEnhanced(),
      this.detectTimezoneLeak(),
      this.detectBrowserLeaksEnhanced(),
      this.detectDHCPLeaks(),
      this.detectWebSocketLeaks(),
      this.detectHTTPHeaderLeaks(),
      this.detectGeolocationLeaks(),
      this.detectFingerprintingResistance(),
      this.detectSplitTunnelingLeaks(),
      this.detectDoHLeaks(),
      this.detectMDNSLeaks(),
      this.detectKillSwitchVulnerability(),
      this.detectTorrentLeaks(),
    ]);

    // After all leak detection is complete, analyze IP reputations
    await this.analyzeAllIPReputations();

    return this.generateEnhancedReport();
  }

  private async detectWebRTCLeaksEnhanced(): Promise<void> {
    try {
      console.log('🔍 Enhanced WebRTC leak detection...');

      const ips: Set<string> = new Set();
      const localIPs: string[] = [];
      const publicIPs: string[] = [];
      const ipv6IPs: string[] = [];
      const mdnsAddresses: string[] = [];
      const rawCandidates: string[] = [];
      const candidateTypes: Set<string> = new Set();
      const protocols: Set<string> = new Set();

      // Test multiple STUN servers concurrently for faster detection
      const stunPromises = this.stunServers.map(async (stunServer) => {
        try {
          return await this.probeSTUNServer(stunServer);
        } catch (err) {
          return null;
        }
      });

      const results = await Promise.allSettled(stunPromises);

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const { candidates } = result.value;

          for (const candidate of candidates) {
            rawCandidates.push(candidate.raw);

            if (candidate.type) candidateTypes.add(candidate.type);
            if (candidate.protocol) protocols.add(candidate.protocol);

            if (candidate.ip && !ips.has(candidate.ip)) {
              ips.add(candidate.ip);

              // Handle mDNS addresses (*.local)
              if (candidate.ip.endsWith('.local')) {
                mdnsAddresses.push(candidate.ip);
                continue;
              }

              // Classify IP
              const ipType = this.classifyIP(candidate.ip);
              this.recordDetectedIP(candidate.ip, `WebRTC-${candidate.type}`, ipType);

              if (ipType === 'ipv6') {
                ipv6IPs.push(candidate.ip);
              } else if (ipType === 'private' || ipType === 'loopback' || ipType === 'link-local') {
                localIPs.push(candidate.ip);
              } else {
                publicIPs.push(candidate.ip);
              }
            }
          }
        }
      }

      // Also test TURN server behavior (may reveal different IP)
      await this.testTURNLeaks(publicIPs);

      // Don't determine leak status here - will be determined in generateEnhancedReport
      // based on whether multiple unique public IPs are detected
      const leaked = false; // Will be updated later

      if (localIPs.length > 0 || publicIPs.length > 0 || ipv6IPs.length > 0 || mdnsAddresses.length > 0) {
        this.leaks.webrtcLeaks.push({
          type: 'webrtc',
          severity: 'high',
          localIPs,
          publicIPs,
          ipv6IPs,
          mdnsAddresses,
          stunServer: 'multiple',
          candidateTypes: Array.from(candidateTypes),
          protocols: Array.from(protocols),
          leaked,
          rawCandidates: rawCandidates.slice(0, 20), // Limit to avoid huge reports
        });
      }

      console.log('✅ WebRTC detection complete:', {
        localIPs: localIPs.length,
        publicIPs: publicIPs.length,
        ipv6IPs: ipv6IPs.length,
        mdns: mdnsAddresses.length,
        leaked
      });
    } catch (error) {
      console.error('WebRTC leak detection failed:', error);
    }
  }

  private async probeSTUNServer(stunServer: string): Promise<{ server: string; candidates: any[] } | null> {
    return new Promise((resolve) => {
      const candidates: any[] = [];

      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: stunServer }],
          iceCandidatePoolSize: 10,
        });

        pc.createDataChannel('leak-detection', { ordered: true });

        const timeout = setTimeout(() => {
          pc.close();
          resolve({ server: stunServer, candidates });
        }, 4000);

        pc.onicecandidate = (ice) => {
          if (!ice || !ice.candidate || !ice.candidate.candidate) {
            return;
          }

          const candidateStr = ice.candidate.candidate;
          const parsed = this.parseICECandidate(candidateStr);
          if (parsed) {
            candidates.push({ ...parsed, raw: candidateStr });
          }
        };

        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') {
            clearTimeout(timeout);
            pc.close();
            resolve({ server: stunServer, candidates });
          }
        };

        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .catch(() => {
            clearTimeout(timeout);
            pc.close();
            resolve(null);
          });

      } catch (err) {
        resolve(null);
      }
    });
  }

  private parseICECandidate(candidateStr: string): any | null {
    // Parse ICE candidate string
    // Format: candidate:foundation protocol priority ip port type ...
    const parts = candidateStr.split(' ');
    if (parts.length < 8) return null;

    const foundation = parts[0].split(':')[1];
    const componentId = parts[1];
    const protocol = parts[2].toLowerCase();
    const priority = parseInt(parts[3]);
    const ip = parts[4];
    const port = parseInt(parts[5]);
    const type = parts[7]; // "host", "srflx", "relay", "prflx"

    // Extract additional attributes
    let raddr = '';
    let rport = '';
    for (let i = 8; i < parts.length; i += 2) {
      if (parts[i] === 'raddr') raddr = parts[i + 1];
      if (parts[i] === 'rport') rport = parts[i + 1];
    }

    return {
      foundation,
      componentId,
      protocol,
      priority,
      ip,
      port,
      type,
      raddr,
      rport,
    };
  }

  private async testTURNLeaks(existingPublicIPs: string[]): Promise<void> {
    // TURN servers can sometimes reveal different IPs
    // Most TURN servers require credentials, so we do limited testing
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Add TURN server test if credentials available
        ],
        iceTransportPolicy: 'relay', // Force relay to test TURN behavior
      });

      pc.createDataChannel('turn-test');

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          pc.close();
          resolve();
        }, 3000);

        pc.onicecandidate = (ice) => {
          if (ice?.candidate?.candidate.includes('relay')) {
            const parsed = this.parseICECandidate(ice.candidate.candidate);
            if (parsed?.ip && !existingPublicIPs.includes(parsed.ip)) {
              this.recordDetectedIP(parsed.ip, 'WebRTC-TURN-relay', this.classifyIP(parsed.ip));
            }
          }
        };

        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') {
            clearTimeout(timeout);
            pc.close();
            resolve();
          }
        };

        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .catch(() => {
            clearTimeout(timeout);
            pc.close();
            resolve();
          });
      });
    } catch (err) {
      // TURN test failed, expected without credentials
    }
  }

  private async detectDNSLeaksEnhanced(): Promise<void> {
    try {
      console.log('🔍 Enhanced DNS leak detection...');

      const dnsResults = await Promise.allSettled(
        this.dnsTestEndpoints.map(async (endpoint) => {
          const startTime = Date.now();
          try {
            const response = await fetch(`https://${endpoint.domain}`, {
              signal: AbortSignal.timeout(5000),
              cache: 'no-store',
            });
            const ip = (await response.text()).trim();
            const responseTime = Date.now() - startTime;

            return {
              endpoint,
              ip,
              responseTime,
              success: true
            };
          } catch (err) {
            return {
              endpoint,
              ip: '',
              responseTime: Date.now() - startTime,
              success: false
            };
          }
        })
      );

      const resolvedIPs: Set<string> = new Set();

      for (const result of dnsResults) {
        if (result.status === 'fulfilled' && result.value.success && result.value.ip) {
          const { endpoint, ip, responseTime } = result.value;

          // Validate IP format
          if (!this.isValidIP(ip)) continue;

          resolvedIPs.add(ip);
          this.recordDetectedIP(ip, `DNS-${endpoint.domain}`, this.classifyIP(ip));

          // Don't determine leak status here - will be determined in generateEnhancedReport
          const leaked = false; // Will be updated later

          this.leaks.dnsLeaks.push({
            type: 'dns',
            severity: 'medium',
            dnsServer: 'System DNS',
            resolvedIP: ip,
            location: 'To be determined',
            isp: 'To be determined',
            leaked,
            testDomain: endpoint.domain,
            responseTime,
          });
        }
      }

      // Check for DNS consistency (all endpoints should return same IP)
      if (resolvedIPs.size > 1) {
        console.warn('⚠️ DNS inconsistency detected:', Array.from(resolvedIPs));
      }

      console.log('✅ DNS detection complete:', { uniqueIPs: resolvedIPs.size });
    } catch (error) {
      console.error('DNS leak detection failed:', error);
    }
  }

  private async detectIPv6LeaksEnhanced(): Promise<void> {
    try {
      console.log('🔍 Enhanced IPv6 leak detection...');

      const ipv6Endpoints = [
        'https://api64.ipify.org?format=json',
        'https://v6.ident.me',
        'https://ipv6.icanhazip.com',
      ];

      const results = await Promise.allSettled(
        ipv6Endpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint, {
              signal: AbortSignal.timeout(3000),
            });
            const data = await response.text();

            // Handle both JSON and plain text responses
            let ip: string;
            try {
              const json = JSON.parse(data);
              ip = json.ip;
            } catch {
              ip = data.trim();
            }

            return { endpoint, ip };
          } catch (err) {
            return { endpoint, ip: null };
          }
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.ip && this.isIPv6(result.value.ip)) {
          const ip = result.value.ip;
          const addressType = this.classifyIPv6Type(ip);

          // Record as public if it's a global IPv6 address
          const ipType = addressType === 'global' ? 'public' :
                         addressType === 'link-local' ? 'link-local' :
                         addressType === 'loopback' ? 'loopback' : 'private';
          this.recordDetectedIP(ip, `IPv6-${result.value.endpoint}`, ipType);

          this.leaks.ipv6Leaks.push({
            type: 'ipv6',
            severity: addressType === 'global' ? 'high' : 'medium',
            ipv6Address: ip,
            prefix: ip.split(':').slice(0, 4).join(':'),
            addressType,
            leaked: false, // Will be determined in generateEnhancedReport
            source: result.value.endpoint,
          });
        }
      }

      console.log('✅ IPv6 detection complete:', { leaks: this.leaks.ipv6Leaks.length });
    } catch (error) {
      console.error('IPv6 leak detection failed:', error);
    }
  }

  private async detectWebSocketLeaks(): Promise<void> {
    try {
      console.log('🔍 WebSocket leak detection...');

      // WebSocket connections can reveal real IP before VPN tunnel is established
      const wsEndpoints = [
        { url: 'wss://echo.websocket.events', name: 'WebSocket.events' },
      ];

      for (const endpoint of wsEndpoints) {
        try {
          await new Promise<void>((resolve) => {
            const startTime = Date.now();
            const ws = new WebSocket(endpoint.url);

            const timeout = setTimeout(() => {
              ws.close();
              resolve();
            }, 5000);

            ws.onopen = () => {
              const connectionTime = Date.now() - startTime;

              // The connection itself may reveal IP via server logs
              // We can detect potential leaks by measuring connection patterns
              this.leaks.webSocketLeaks.push({
                type: 'websocket',
                severity: 'high',
                detectedIP: 'Connection established',
                protocol: endpoint.url.startsWith('wss') ? 'WSS' : 'WS',
                server: endpoint.name,
                leaked: false, // Would need server-side verification
                connectionTime,
              });

              clearTimeout(timeout);
              ws.close();
              resolve();
            };

            ws.onerror = () => {
              clearTimeout(timeout);
              resolve();
            };
          });
        } catch (err) {
          // WebSocket test failed
        }
      }

      console.log('✅ WebSocket detection complete');
    } catch (error) {
      console.error('WebSocket leak detection failed:', error);
    }
  }

  private async detectHTTPHeaderLeaks(): Promise<void> {
    try {
      console.log('🔍 HTTP header leak detection...');

      // Check for common proxy-revealing headers
      const headerTestEndpoint = 'https://httpbin.org/headers';

      try {
        const response = await fetch(headerTestEndpoint, {
          signal: AbortSignal.timeout(5000),
        });
        const data = await response.json();
        const headers = data.headers || {};

        // Headers that can leak real IP
        const leakingHeaders = [
          'X-Forwarded-For',
          'X-Real-Ip',
          'X-Client-Ip',
          'X-Originating-Ip',
          'Cf-Connecting-Ip',
          'True-Client-Ip',
          'X-Cluster-Client-Ip',
          'Forwarded',
          'Via',
        ];

        for (const headerName of leakingHeaders) {
          // Check case-insensitive
          const value = headers[headerName] || headers[headerName.toLowerCase()];
          if (value) {
            const ips = this.extractIPsFromHeader(value);
            for (const ip of ips) {
              this.recordDetectedIP(ip, `HTTP-Header-${headerName}`, this.classifyIP(ip));

              this.leaks.httpHeaderLeaks.push({
                type: 'http-header',
                severity: 'critical',
                headerName,
                headerValue: value,
                exposedIP: ip,
                leaked: false, // Will be determined in generateEnhancedReport
              });
            }
          }
        }
      } catch (err) {
        // Header test failed
      }

      console.log('✅ HTTP header detection complete');
    } catch (error) {
      console.error('HTTP header leak detection failed:', error);
    }
  }

  private async detectGeolocationLeaks(): Promise<void> {
    try {
      console.log('🔍 Geolocation API leak detection...');

      // Check if geolocation permission was previously granted
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });

          if (permission.state === 'granted') {
            // Geolocation was previously allowed - this could reveal real location
            // Use Promise to properly await the geolocation
            await new Promise<void>((resolve) => {
              const timeout = setTimeout(() => resolve(), 3000);

              navigator.geolocation.getCurrentPosition(
                (position) => {
                  clearTimeout(timeout);

                  this.leaks.geolocationLeaks.push({
                    type: 'geolocation',
                    severity: 'critical',
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    source: position.coords.accuracy < 100 ? 'gps' :
                           position.coords.accuracy < 1000 ? 'wifi' : 'ip',
                    mismatchWithVPN: false, // Will be determined in generateEnhancedReport
                    leaked: false, // Will be determined in generateEnhancedReport
                  });

                  resolve();
                },
                (error) => {
                  clearTimeout(timeout);
                  console.log('Geolocation access denied or failed:', error.message);
                  resolve();
                },
                {
                  timeout: 3000,
                  enableHighAccuracy: false,
                  maximumAge: 60000 // Accept cached location up to 1 minute old
                }
              );
            });
          } else if (permission.state === 'prompt') {
            // Permission not yet granted - don't trigger prompt during leak detection
            console.log('Geolocation permission not granted, skipping leak check');
          }
        } catch (err) {
          // Permission query failed - browser might not support permissions API
          console.log('Permissions API not supported:', err);
        }
      }

      console.log('✅ Geolocation detection complete');
    } catch (error) {
      console.error('Geolocation leak detection failed:', error);
    }
  }

  private async detectFingerprintingResistance(): Promise<void> {
    try {
      console.log('🔍 Fingerprinting resistance detection...');

      const features = {
        webrtcDisabled: false,
        canvasNoiseDetected: false,
        audioContextBlocked: false,
        webglDisabled: false,
        timingPerturbation: false,
        fontEnumeration: false,
      };

      let browserType: 'tor-browser' | 'brave' | 'firefox-resist' | 'extension' | 'unknown' = 'unknown';
      let impactMessage = 'No fingerprinting resistance detected.';

      // Test 1: WebRTC availability
      if (!('RTCPeerConnection' in window) || this.leaks.webrtcLeaks.length === 0) {
        features.webrtcDisabled = true;
      }

      // Test 2: Canvas fingerprinting resistance
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = 200;
          canvas.height = 50;
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = '#f60';
          ctx.fillRect(125, 1, 62, 20);
          ctx.fillStyle = '#069';
          ctx.fillText('Test 🔒', 2, 15);
          ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
          ctx.fillText('Test 🔒', 4, 17);

          const dataURL1 = canvas.toDataURL();
          const dataURL2 = canvas.toDataURL();

          // If canvas is randomized, same operations produce different results
          if (dataURL1 !== dataURL2) {
            features.canvasNoiseDetected = true;
          }

          // Check for blocked canvas (returns empty or same data every time)
          const emptyCanvas = document.createElement('canvas');
          emptyCanvas.width = 200;
          emptyCanvas.height = 50;
          if (dataURL1 === emptyCanvas.toDataURL()) {
            features.canvasNoiseDetected = true;
          }
        }
      } catch {
        features.canvasNoiseDetected = true;
      }

      // Test 3: AudioContext fingerprinting resistance
      try {
        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          features.audioContextBlocked = true;
        } else {
          const audioCtx = new AudioContext();
          const oscillator = audioCtx.createOscillator();
          const analyser = audioCtx.createAnalyser();
          const gainNode = audioCtx.createGain();
          const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);

          gainNode.gain.value = 0;
          oscillator.connect(analyser);
          analyser.connect(scriptProcessor);
          scriptProcessor.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          oscillator.start(0);

          // Check if audio fingerprinting is blocked
          if (analyser.frequencyBinCount === 0 || analyser.fftSize === 0) {
            features.audioContextBlocked = true;
          }

          oscillator.stop();
          audioCtx.close();
        }
      } catch {
        features.audioContextBlocked = true;
      }

      // Test 4: WebGL fingerprinting resistance
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          features.webglDisabled = true;
        } else {
          const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
          if (!debugInfo) {
            features.webglDisabled = true;
          }
        }
      } catch {
        features.webglDisabled = true;
      }

      // Test 5: Timing perturbation (reduced precision)
      const start = performance.now();
      const end = performance.now();
      const precision = (end - start).toString().split('.')[1]?.length || 0;
      if (precision < 3) {
        features.timingPerturbation = true;
      }

      // Test 6: Font enumeration resistance
      try {
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testFonts = ['Calibri', 'Cambria', 'Monaco', 'Consolas'];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const baseWidths: { [key: string]: number } = {};
          baseFonts.forEach(baseFont => {
            ctx.font = `72px ${baseFont}`;
            baseWidths[baseFont] = ctx.measureText('mmmmmmmmmmlli').width;
          });

          let fontCount = 0;
          testFonts.forEach(testFont => {
            baseFonts.forEach(baseFont => {
              ctx.font = `72px '${testFont}', ${baseFont}`;
              const width = ctx.measureText('mmmmmmmmmmlli').width;
              if (width === baseWidths[baseFont]) {
                fontCount++;
              }
            });
          });

          // If very few fonts detected, likely font enumeration resistance
          if (fontCount > testFonts.length * 2) {
            features.fontEnumeration = true;
          }
        }
      } catch {
        features.fontEnumeration = true;
      }

      // Determine browser type
      const resistanceCount = Object.values(features).filter(Boolean).length;

      if (features.webrtcDisabled && features.canvasNoiseDetected && features.webglDisabled && features.timingPerturbation) {
        browserType = 'tor-browser';
        impactMessage = 'TOR Browser detected. Most fingerprinting vectors blocked. WebRTC leak detection may be limited.';
      } else if ((navigator.userAgent.includes('Brave') || (navigator as any).brave) && resistanceCount >= 3) {
        browserType = 'brave';
        impactMessage = 'Brave Browser detected with fingerprinting protection. Some leak detection methods may be affected.';
      } else if (navigator.userAgent.includes('Firefox') && features.timingPerturbation && resistanceCount >= 2) {
        browserType = 'firefox-resist';
        impactMessage = 'Firefox with privacy.resistFingerprinting enabled. Timing and canvas-based detection affected.';
      } else if (resistanceCount >= 3) {
        browserType = 'extension';
        impactMessage = 'Privacy extension detected (likely uBlock, Privacy Badger, or CanvasBlocker). Multiple fingerprinting vectors blocked.';
      } else if (resistanceCount > 0) {
        browserType = 'unknown';
        impactMessage = `Partial fingerprinting resistance detected (${resistanceCount}/6 features). Some leak detection may be affected.`;
      }

      if (resistanceCount > 0) {
        this.leaks.fingerprintingResistance = {
          type: 'fingerprinting-resistance',
          severity: resistanceCount >= 4 ? 'info' : 'low',
          detected: true,
          features,
          browserType,
          impactOnLeakDetection: impactMessage,
        };
      }

      console.log('✅ Fingerprinting resistance detection complete:', { resistanceCount, browserType });
    } catch (error) {
      console.error('Fingerprinting resistance detection failed:', error);
    }
  }

  private async detectSplitTunnelingLeaks(): Promise<void> {
    try {
      console.log('🔍 Split tunneling leak detection...');

      // Test multiple endpoints that might bypass VPN split tunneling
      const testEndpoints = [
        { url: 'https://api.ipify.org?format=json', name: 'ipify' },
        { url: 'https://ipinfo.io/json', name: 'ipinfo' },
        { url: 'https://ip-api.com/json/', name: 'ip-api' },
      ];

      const results = await Promise.allSettled(
        testEndpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint.url, {
              signal: AbortSignal.timeout(5000),
              cache: 'no-store',
            });
            const data = await response.json();
            return { endpoint: endpoint.name, ip: data.ip || data.query };
          } catch {
            return { endpoint: endpoint.name, ip: null };
          }
        })
      );

      const detectedIPs: Set<string> = new Set();

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.ip) {
          detectedIPs.add(result.value.ip);
        }
      }

      // If different endpoints return different IPs, split tunneling may be leaking
      if (detectedIPs.size > 1) {
        const ips = Array.from(detectedIPs);
        this.leaks.splitTunnelingLeaks.push({
          type: 'split-tunneling',
          severity: 'high',
          leakedEndpoint: 'Multiple endpoints',
          expectedRoute: this.vpnIP,
          actualRoute: ips.join(', '),
          leaked: false, // Will be determined in generateEnhancedReport
        });
      }

      console.log('✅ Split tunneling detection complete');
    } catch (error) {
      console.error('Split tunneling leak detection failed:', error);
    }
  }

  private async detectDoHLeaks(): Promise<void> {
    try {
      console.log('🔍 DNS-over-HTTPS leak detection...');

      // Enhanced DoH detection - check if browser is using DoH and if it bypasses VPN
      const dohTests = this.dohProviders.map(async (provider) => {
        try {
          // Test 1: Check if DoH endpoint is accessible
          const accessTest = await fetch(provider.endpoint, {
            method: 'HEAD',
            signal: AbortSignal.timeout(2000),
          }).then(() => true).catch(() => false);

          if (!accessTest) return null;

          // Test 2: Query for DNS leak test domain
          const queryResponse = await fetch(
            `${provider.endpoint}?name=whoami.cloudflare&type=TXT`,
            {
              headers: {
                'Accept': 'application/dns-json',
              },
              signal: AbortSignal.timeout(3000),
            }
          );

          if (!queryResponse.ok) return null;

          const queryData = await queryResponse.json();

          // Test 3: Resolve a domain and get IP to compare with VPN IP
          const ipResponse = await fetch(
            `${provider.endpoint}?name=api.ipify.org&type=A`,
            {
              headers: {
                'Accept': 'application/dns-json',
              },
              signal: AbortSignal.timeout(3000),
            }
          );

          let resolvedViaDoH = 'Unknown';
          let bypassesVPN = false;

          if (ipResponse.ok) {
            const ipData = await ipResponse.json();

            // Extract IP from DNS response
            if (ipData.Answer && ipData.Answer.length > 0) {
              const firstAnswer = ipData.Answer[0];
              resolvedViaDoH = firstAnswer.data || 'Unknown';

              // Check if DoH resolved IP matches VPN IP
              if (resolvedViaDoH !== this.vpnIP && resolvedViaDoH !== 'Unknown') {
                bypassesVPN = true;
              }
            }
          }

          // Test 4: Check TXT record for DNS provider identification
          let dnsProvider = 'Unknown';
          if (queryData.Answer && queryData.Answer.length > 0) {
            const txtRecord = queryData.Answer.find((a: any) => a.type === 16); // TXT record
            if (txtRecord && txtRecord.data) {
              dnsProvider = txtRecord.data;
            }
          }

          return {
            type: 'doh' as const,
            severity: bypassesVPN ? ('high' as const) : ('medium' as const),
            dohProvider: provider.name,
            resolvedIP: resolvedViaDoH,
            bypassesVPN,
            leaked: bypassesVPN,
            dnsProviderDetected: dnsProvider,
            endpoint: provider.endpoint,
          };
        } catch (err) {
          return null;
        }
      });

      const results = await Promise.allSettled(dohTests);

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          this.leaks.dohLeaks.push(result.value);
        }
      }

      // Additional check: Detect if browser is configured to use DoH
      try {
        // Check for DNS prefetch hints (browsers with DoH often disable this)
        const prefetchDisabled = !(document.createElement('link') as any).relList?.supports('dns-prefetch');

        // Check for Encrypted Client Hello (ECH) support - often enabled with DoH
        const echSupported = 'https' in window && typeof (window as any).crypto?.subtle !== 'undefined';

        if (prefetchDisabled || (echSupported && this.leaks.dohLeaks.length > 0)) {
          // Browser likely has DoH enabled
          console.log('🔍 DoH likely enabled in browser settings');
        }
      } catch {
        // Browser feature detection failed
      }

      console.log('✅ DoH detection complete:', this.leaks.dohLeaks.length, 'providers detected');
    } catch (error) {
      console.error('DoH leak detection failed:', error);
    }
  }

  private async detectMDNSLeaks(): Promise<void> {
    try {
      console.log('🔍 mDNS leak detection...');

      // mDNS (.local) addresses can reveal local network info
      // This is detected via WebRTC ICE candidates containing .local addresses
      // Already handled in WebRTC detection

      console.log('✅ mDNS detection complete (via WebRTC)');
    } catch (error) {
      console.error('mDNS leak detection failed:', error);
    }
  }

  private async detectKillSwitchVulnerability(): Promise<void> {
    try {
      console.log('🔍 Kill switch vulnerability detection...');

      // Monitor for network changes that could bypass kill switch
      const startIP = this.vpnIP;
      let ipChanged = false;

      // Simulate network disruption detection by rapid IP checks
      const checkCount = 3;
      const checks: string[] = [];

      for (let i = 0; i < checkCount; i++) {
        try {
          const response = await fetch('https://api.ipify.org?format=json', {
            signal: AbortSignal.timeout(2000),
            cache: 'no-store',
          });
          const data = await response.json();
          checks.push(data.ip);

          if (data.ip !== startIP) {
            ipChanged = true;
          }
        } catch {
          // Network error - potential kill switch scenario
        }

        // Small delay between checks
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Check for IP inconsistency during the test
      const uniqueIPs = new Set(checks);
      if (uniqueIPs.size > 1 || ipChanged) {
        this.leaks.killSwitchLeaks.push({
          type: 'kill-switch',
          severity: 'critical',
          connectionDropDetected: true,
          ipExposedDuringDrop: checks.find(ip => ip !== startIP) || 'Unknown',
          durationExposed: 0, // Would need continuous monitoring
          leaked: false, // Will be determined in generateEnhancedReport
        });
      }

      console.log('✅ Kill switch detection complete');
    } catch (error) {
      console.error('Kill switch detection failed:', error);
    }
  }

  private async detectTorrentLeaks(): Promise<void> {
    try {
      console.log('🔍 Torrent/P2P leak detection...');

      // Note: Browser cannot directly test torrent connections
      // This would require a torrent client or WebTorrent
      // We can only detect if WebRTC (used by WebTorrent) leaks

      // The WebRTC detection already covers this case
      // Mark as informational

      console.log('✅ Torrent detection complete (via WebRTC)');
    } catch (error) {
      console.error('Torrent leak detection failed:', error);
    }
  }

  private async detectTimezoneLeak(): Promise<void> {
    try {
      console.log('🔍 Enhanced timezone leak detection...');

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offset = new Date().getTimezoneOffset();
      const locale = navigator.language;
      const languages = navigator.languages ? Array.from(navigator.languages) : [locale];

      // Advanced timezone fingerprinting
      const now = new Date();
      const jan = new Date(now.getFullYear(), 0, 1);
      const jul = new Date(now.getFullYear(), 6, 1);
      const dstActive = jan.getTimezoneOffset() !== jul.getTimezoneOffset();

      // Get timezone abbreviation (e.g., EST, PST, GMT)
      const dateString = now.toLocaleString('en-US', { timeZoneName: 'short' });
      const tzAbbr = dateString.match(/\b[A-Z]{2,5}\b/)?.[0] || 'Unknown';

      // Get detailed locale information
      const localeInfo = {
        language: locale,
        languages: languages,
        numberFormat: new Intl.NumberFormat(locale).format(1234567.89),
        dateFormat: new Intl.DateTimeFormat(locale).format(now),
        timeFormat: new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(now),
        currency: (() => {
          try {
            const parts = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).formatToParts(1);
            return parts.find(p => p.type === 'currency')?.value || 'USD';
          } catch {
            return 'Unknown';
          }
        })(),
      };

      // Detect timezone spoofing by checking consistency
      const offsetFromTZ = (() => {
        try {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
          });
          const localTime = new Date();
          const tzTime = new Date(formatter.format(localTime));
          return (localTime.getTime() - tzTime.getTime()) / 60000;
        } catch {
          return offset;
        }
      })();

      const offsetInconsistent = Math.abs(offsetFromTZ - offset) > 1; // More than 1 minute difference

      // Check historical timezone changes (for advanced detection)
      const historicalOffsets = [];
      for (let month = 0; month < 12; month++) {
        const date = new Date(now.getFullYear(), month, 15);
        historicalOffsets.push(date.getTimezoneOffset());
      }
      const uniqueOffsets = new Set(historicalOffsets);
      const dstTransitions = uniqueOffsets.size > 1 ? uniqueOffsets.size - 1 : 0;

      // Get location from VPN IP and compare
      try {
        const response = await fetch(`https://ip-api.com/json/${this.vpnIP}?fields=timezone,offset,country,countryCode,city`, {
          signal: AbortSignal.timeout(5000),
        });
        const vpnLocation = await response.json();

        // Compare timezone with VPN location
        const mismatch = vpnLocation.timezone !== timezone;

        // Check if offset matches VPN location offset
        const offsetMismatch = vpnLocation.offset !== undefined &&
                              Math.abs(vpnLocation.offset - (offset / -60)) > 1; // offset is in minutes, API uses hours

        // Extract country/region hints from locale
        const localeHints: string[] = [];
        if (locale) {
          const localeParts = locale.split('-');
          if (localeParts.length > 1) {
            localeHints.push(`Locale country: ${localeParts[1].toUpperCase()}`);
          }
        }

        // Check if browser language matches VPN country
        const languageCountryMap: { [key: string]: string[] } = {
          'en': ['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'ZA'],
          'es': ['ES', 'MX', 'AR', 'CO', 'CL', 'PE'],
          'fr': ['FR', 'CA', 'BE', 'CH', 'LU'],
          'de': ['DE', 'AT', 'CH', 'LI'],
          'pt': ['PT', 'BR', 'AO', 'MZ'],
          'zh': ['CN', 'TW', 'HK', 'SG'],
          'ja': ['JP'],
          'ko': ['KR'],
          'ru': ['RU', 'BY', 'KZ', 'UA'],
          'ar': ['SA', 'EG', 'AE', 'IQ', 'MA'],
        };

        const primaryLang = locale.split('-')[0].toLowerCase();
        const expectedCountries = languageCountryMap[primaryLang] || [];
        const languageMismatch = expectedCountries.length > 0 &&
                                !expectedCountries.includes(vpnLocation.countryCode);

        if (mismatch || offsetMismatch || offsetInconsistent || languageMismatch) {
          this.leaks.timezoneLeak = {
            type: 'timezone',
            severity: (mismatch || offsetMismatch) ? 'medium' : 'low',
            timezone,
            offset,
            vpnLocation: vpnLocation.timezone || 'Unknown',
            realLocation: timezone,
            mismatch,
            dstActive,
            localeHints: [...localeHints, ...languages],
            timezoneAbbreviation: tzAbbr,
            offsetInconsistent,
            offsetMismatch,
            languageMismatch,
            dstTransitions,
            localeInfo: localeInfo as any,
            vpnCountry: vpnLocation.country,
            vpnCity: vpnLocation.city,
          };

          const leakReasons: string[] = [];
          if (mismatch) leakReasons.push(`TZ mismatch (VPN: ${vpnLocation.timezone}, Real: ${timezone})`);
          if (offsetMismatch) leakReasons.push('Offset mismatch');
          if (offsetInconsistent) leakReasons.push('Offset inconsistency detected');
          if (languageMismatch) leakReasons.push(`Language mismatch (${primaryLang} vs ${vpnLocation.countryCode})`);

          console.log('⚠️ Timezone/locale leaks detected:', leakReasons.join(', '));
        }
      } catch (err) {
        console.log('VPN location lookup failed for timezone comparison');
      }

      console.log('✅ Timezone detection complete');
    } catch (error) {
      console.error('Timezone leak detection failed:', error);
    }
  }

  private async detectBrowserLeaksEnhanced(): Promise<void> {
    try {
      console.log('🔍 Enhanced browser fingerprint detection...');

      const languages = navigator.languages ? Array.from(navigator.languages) : [navigator.language];
      const plugins = Array.from(navigator.plugins || []).map(p => p.name);

      // Canvas fingerprint
      let canvasFingerprint = 'unavailable';
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillStyle = '#f60';
          ctx.fillRect(0, 0, 200, 50);
          ctx.fillStyle = '#069';
          ctx.fillText('VPN Leak Test 🔒', 2, 2);
          ctx.strokeStyle = 'rgba(102, 204, 0, 0.7)';
          ctx.strokeText('VPN Leak Test 🔒', 4, 17);
          canvasFingerprint = canvas.toDataURL().substring(0, 100);
        }
      } catch (err) {
        // Canvas blocked
      }

      // WebGL fingerprint
      let webglFingerprint = 'unavailable';
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            webglFingerprint = `${vendor} | ${renderer}`;
          }
        }
      } catch (err) {
        // WebGL blocked
      }

      // Audio fingerprint
      let audioFingerprint = 'unavailable';
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gain = audioContext.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;
        gain.gain.value = 0;

        oscillator.connect(analyser);
        analyser.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(0);

        const dataArray = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(dataArray);

        audioFingerprint = dataArray.slice(0, 10).join(',').substring(0, 50);

        oscillator.stop();
        audioContext.close();
      } catch (err) {
        // Audio API blocked
      }

      // Screen info
      const screenResolution = `${screen.width}x${screen.height}`;
      const colorDepth = screen.colorDepth;
      const hardwareConcurrency = navigator.hardwareConcurrency || 0;
      const deviceMemory = (navigator as any).deviceMemory || 0;
      const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const doNotTrack = navigator.doNotTrack;

      this.leaks.browserLeak = {
        type: 'browser',
        severity: 'medium',
        userAgent: navigator.userAgent,
        languages,
        plugins,
        fonts: [], // Would require font enumeration
        canvas: canvasFingerprint,
        webgl: webglFingerprint,
        audioFingerprint,
        screenResolution,
        colorDepth,
        hardwareConcurrency,
        deviceMemory,
        touchSupport,
        doNotTrack,
      };

      console.log('✅ Browser fingerprint detection complete');
    } catch (error) {
      console.error('Browser leak detection failed:', error);
    }
  }

  private async detectDHCPLeaks(): Promise<void> {
    try {
      console.log('🔍 DHCP leak detection...');

      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection;

      if (connection) {
        const networkType = connection.effectiveType || connection.type;

        if (networkType && networkType !== 'none') {
          this.leaks.dhcpLeaks.push({
            type: 'dhcp',
            severity: 'medium',
            dhcpServer: 'Inferred from network',
            gateway: 'Unknown',
            subnet: 'Unknown',
            leaked: false,
          });
        }
      }

      console.log('✅ DHCP detection complete');
    } catch (error) {
      console.error('DHCP leak detection failed:', error);
    }
  }

  private async checkIPReputation(ip: string): Promise<IPReputation | null> {
    try {
      // Use multiple reputation APIs for comprehensive scoring
      const results = await Promise.allSettled([
        // Primary: ip-api.com (free, comprehensive)
        fetch(`http://ip-api.com/json/${ip}?fields=66846719`, {
          signal: AbortSignal.timeout(3000)
        }).then(r => r.json()),

        // Secondary: AbuseIPDB (requires API key in production)
        // For now, we'll use free alternatives
      ]);

      let reputationScore = 100; // Start with perfect score
      let threatLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe';
      const categories: string[] = [];
      const blacklists: string[] = [];
      const whitelists: string[] = [];

      let isVPN = false;
      let isProxy = false;
      let isTor = false;
      let isDatacenter = false;
      let isHosting = false;
      let isBogon = false;
      let abuseScore = 0;

      // Process ip-api.com result
      if (results[0].status === 'fulfilled') {
        const data = results[0].value;

        if (data.status === 'success') {
          // Check proxy/VPN flags
          if (data.proxy) {
            isProxy = true;
            reputationScore -= 30;
            categories.push('Proxy/VPN');
          }

          if (data.hosting) {
            isHosting = true;
            reputationScore -= 15;
            categories.push('Hosting');
          }

          // Datacenter IPs are more suspicious
          if (data.hosting && !data.mobile) {
            isDatacenter = true;
            reputationScore -= 10;
            categories.push('Datacenter');
          }

          // Mobile IPs are generally safer
          if (data.mobile) {
            reputationScore += 10;
            whitelists.push('Mobile Network');
          }

          // Check for bogon/reserved IPs
          if (this.isPrivateIP(ip) || this.isReservedIP(ip)) {
            isBogon = true;
            reputationScore -= 50;
            blacklists.push('Bogon/Reserved IP');
          }

          // ISP-based reputation
          const suspiciousISPs = [
            'bulletproof', 'anonymous', 'privacy', 'offshore', 'vpn',
            'proxy', 'tor', 'hidden', 'secure'
          ];

          const isp = (data.isp || '').toLowerCase();
          const org = (data.org || '').toLowerCase();
          const combined = `${isp} ${org}`;

          for (const keyword of suspiciousISPs) {
            if (combined.includes(keyword)) {
              reputationScore -= 20;
              categories.push(`Suspicious ISP: ${keyword}`);
              break;
            }
          }
        }
      }

      // Additional checks for known malicious patterns
      const ipParts = ip.split('.');
      if (ipParts.length === 4) {
        // Check for known bad ranges (simplified)
        const firstOctet = parseInt(ipParts[0]);

        // Bogon ranges
        if (firstOctet === 0 || firstOctet === 10 || firstOctet === 127 ||
            (firstOctet === 172 && parseInt(ipParts[1]) >= 16 && parseInt(ipParts[1]) <= 31) ||
            (firstOctet === 192 && parseInt(ipParts[1]) === 168)) {
          isBogon = true;
          reputationScore = Math.min(reputationScore, 20);
          blacklists.push('Private/Reserved Range');
        }
      }

      // Calculate threat level based on score
      if (reputationScore >= 80) {
        threatLevel = 'safe';
      } else if (reputationScore >= 60) {
        threatLevel = 'low';
      } else if (reputationScore >= 40) {
        threatLevel = 'medium';
      } else if (reputationScore >= 20) {
        threatLevel = 'high';
      } else {
        threatLevel = 'critical';
      }

      // Determine if VPN (proxy flag is most reliable indicator)
      isVPN = isProxy;

      return {
        ip,
        reputationScore: Math.max(0, Math.min(100, reputationScore)),
        threatLevel,
        categories,
        isVPN,
        isProxy,
        isTor,
        isDatacenter,
        isHosting,
        isBogon,
        abuseScore,
        blacklists,
        whitelists,
        source: 'ip-api.com + local checks',
      };
    } catch (error) {
      console.error(`IP reputation check failed for ${ip}:`, error);
      return null;
    }
  }

  private isPrivateIP(ip: string): boolean {
    const parts = ip.split('.').map(p => parseInt(p));
    if (parts.length !== 4) return false;

    return (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 127 ||
      parts[0] === 0
    );
  }

  private isReservedIP(ip: string): boolean {
    const parts = ip.split('.').map(p => parseInt(p));
    if (parts.length !== 4) return false;

    return (
      parts[0] === 0 ||
      parts[0] === 127 ||
      parts[0] >= 224 // Multicast and reserved
    );
  }

  private async analyzeAllIPReputations(): Promise<void> {
    try {
      console.log('🔍 Analyzing IP reputations...');

      // Get unique public IPs from all detected IPs
      const uniquePublicIPs = new Set<string>();

      // Always check VPN IP
      uniquePublicIPs.add(this.vpnIP);

      // Add all detected public IPs
      for (const detectedIP of this.allDetectedIPs) {
        if (detectedIP.type === 'public') {
          uniquePublicIPs.add(detectedIP.ip);
        }
      }

      // Check reputation for each IP
      const reputationChecks = Array.from(uniquePublicIPs).map(ip =>
        this.checkIPReputation(ip)
      );

      const results = await Promise.allSettled(reputationChecks);

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          this.ipReputations.push(result.value);
        }
      }

      console.log('✅ IP reputation analysis complete:', this.ipReputations.length, 'IPs analyzed');
    } catch (error) {
      console.error('IP reputation analysis failed:', error);
    }
  }

  // Helper methods

  private isIPv6(ip: string): boolean {
    return ip.includes(':');
  }

  private isValidIP(ip: string): boolean {
    // IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.').map(Number);
      return parts.every(p => p >= 0 && p <= 255);
    }

    // IPv6 validation (simplified)
    if (ip.includes(':')) {
      return true;
    }

    return false;
  }

  private classifyIP(ip: string): 'public' | 'private' | 'ipv6' | 'loopback' | 'link-local' {
    if (this.isIPv6(ip)) {
      // Classify IPv6 as public if it's a global address
      const ipv6Type = this.classifyIPv6Type(ip);
      if (ipv6Type === 'global') {
        return 'public';
      } else if (ipv6Type === 'loopback') {
        return 'loopback';
      } else if (ipv6Type === 'link-local') {
        return 'link-local';
      } else {
        return 'private';
      }
    }

    if (ip.startsWith('127.')) {
      return 'loopback';
    }

    if (ip.startsWith('169.254.')) {
      return 'link-local';
    }

    if (this.isPrivateIP(ip)) {
      return 'private';
    }

    return 'public';
  }

  private isPrivateIP(ip: string): boolean {
    return (
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip)
    );
  }

  private classifyIPv6Type(ip: string): 'global' | 'link-local' | 'unique-local' | 'teredo' | '6to4' | 'loopback' {
    const lower = ip.toLowerCase();

    if (lower === '::1') return 'loopback';
    if (lower.startsWith('fe80:')) return 'link-local';
    if (lower.startsWith('fc') || lower.startsWith('fd')) return 'unique-local';
    if (lower.startsWith('2001:0:') || lower.startsWith('2001:0000:')) return 'teredo';
    if (lower.startsWith('2002:')) return '6to4';

    return 'global';
  }

  private recordDetectedIP(ip: string, source: string, type: 'public' | 'private' | 'ipv6' | 'loopback' | 'link-local'): void {
    const existing = this.allDetectedIPs.find(d => d.ip === ip);
    if (!existing) {
      this.allDetectedIPs.push({
        ip,
        source,
        type,
        isVPNIP: ip === this.vpnIP,
        timestamp: Date.now(),
      });
    }
  }

  private extractIPsFromHeader(headerValue: string): string[] {
    const ips: string[] = [];

    // Extract IPv4 addresses
    const ipv4Regex = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g;
    const ipv4Matches = headerValue.match(ipv4Regex) || [];
    ips.push(...ipv4Matches.filter(ip => this.isValidIP(ip)));

    // Extract IPv6 addresses
    const ipv6Regex = /\b([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\b/g;
    const ipv6Matches = headerValue.match(ipv6Regex) || [];
    ips.push(...ipv6Matches.filter(ip => this.isIPv6(ip) && this.isValidIP(ip)));

    return ips;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula to calculate distance in kilometers
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private generateEnhancedReport(): VPNLeakReport {
    const duration = Date.now() - this.startTime;

    // Get all unique public IPs detected across all methods
    // Separate IPv4 and IPv6 for better analysis
    const uniqueIPv4s = new Set(
      this.allDetectedIPs
        .filter(d => d.type === 'public' && !this.isIPv6(d.ip))
        .map(d => d.ip)
    );

    const uniqueIPv6s = new Set(
      this.allDetectedIPs
        .filter(d => d.type === 'public' && this.isIPv6(d.ip))
        .map(d => d.ip)
    );

    // VPN detection logic:
    // - If multiple IPv4 addresses detected → VPN likely leaking
    // - If multiple IPv6 addresses detected → VPN likely leaking
    // - Having both IPv4 and IPv6 from same source is normal (dual-stack)
    const vpnActive = uniqueIPv4s.size > 1 || uniqueIPv6s.size > 1;

    // Reprocess leaks based on whether VPN is actually active
    if (!vpnActive) {
      // No VPN detected - mark all as not leaked since there's no VPN to leak from
      this.leaks.dnsLeaks.forEach(l => l.leaked = false);
      this.leaks.webrtcLeaks.forEach(l => l.leaked = false);
      this.leaks.ipv6Leaks.forEach(l => l.leaked = false);
      this.leaks.httpHeaderLeaks.forEach(l => l.leaked = false);
      this.leaks.geolocationLeaks.forEach(l => l.leaked = false);
      this.leaks.splitTunnelingLeaks.forEach(l => l.leaked = false);
      this.leaks.killSwitchLeaks.forEach(l => l.leaked = false);
    } else {
      // VPN is active (multiple unique public IPs detected) - determine which leaked
      const publicIPsArray = Array.from(uniquePublicIPs);

      // The VPN IP should be the most common one, or the one passed to detectAllLeaks
      // All other public IPs are leaks
      this.leaks.dnsLeaks.forEach(l => {
        if (l.resolvedIP && l.resolvedIP !== this.vpnIP) {
          l.leaked = true;
          l.severity = 'critical';
        }
      });

      this.leaks.webrtcLeaks.forEach(l => {
        const leakedPublicIPs = l.publicIPs.filter(ip => ip !== this.vpnIP);
        if (leakedPublicIPs.length > 0) {
          l.leaked = true;
          l.severity = 'critical';
        }
      });

      this.leaks.ipv6Leaks.forEach(l => {
        // Check if IPv6 leaked
        // If VPN IP is IPv4, any IPv6 detected could be a leak
        // If VPN IP is IPv6, compare against it
        if (l.ipv6Address) {
          const isVPNIPv6 = this.isIPv6(this.vpnIP);
          if (!isVPNIPv6) {
            // VPN is IPv4, but we detected IPv6 - potential leak
            // Only mark as leaked if there are multiple IPv6 addresses
            if (uniqueIPv6s.size > 1 || (uniqueIPv6s.size === 1 && !uniqueIPv6s.has(l.ipv6Address))) {
              l.leaked = true;
              l.severity = 'high';
            }
          } else if (l.ipv6Address !== this.vpnIP) {
            // VPN is IPv6 and this is a different IPv6
            l.leaked = true;
            l.severity = 'high';
          }
        }
      });

      this.leaks.httpHeaderLeaks.forEach(l => {
        if (l.exposedIP && l.exposedIP !== this.vpnIP) {
          l.leaked = true;
          l.severity = 'critical';
        }
      });

      this.leaks.splitTunnelingLeaks.forEach(l => {
        // Split tunneling detected multiple IPs, check if any differ from VPN
        const routes = l.actualRoute.split(', ');
        if (routes.some(ip => ip !== this.vpnIP)) {
          l.leaked = true;
          l.severity = 'high';
        }
      });

      this.leaks.killSwitchLeaks.forEach(l => {
        // Kill switch detected IP change during connection
        if (l.ipExposedDuringDrop && l.ipExposedDuringDrop !== this.vpnIP && l.ipExposedDuringDrop !== 'Unknown') {
          l.leaked = true;
          l.severity = 'critical';
        }
      });

      // Fix async forEach bug - use for...of to properly await
      for (const l of this.leaks.geolocationLeaks) {
        // For geolocation, fetch VPN server location and compare
        try {
          const vpnLocationResponse = await fetch(`https://ip-api.com/json/${this.vpnIP}?fields=lat,lon,city,country`, {
            signal: AbortSignal.timeout(3000)
          });
          const vpnLocation = await vpnLocationResponse.json();

          if (vpnLocation.lat && vpnLocation.lon) {
            // Calculate distance between geolocation and VPN server location
            const distance = this.calculateDistance(
              l.latitude,
              l.longitude,
              vpnLocation.lat,
              vpnLocation.lon
            );

            // If more than 50km away, likely real location leaked
            if (distance > 50) {
              l.mismatchWithVPN = true;
              l.leaked = true;
              l.severity = 'critical';
            } else {
              // Close to VPN server - might be VPN location
              l.mismatchWithVPN = false;
              l.leaked = false;
            }
          } else {
            // Can't verify, assume potential leak if permission granted
            l.mismatchWithVPN = true;
            l.leaked = true;
          }
        } catch (err) {
          // API call failed, conservatively mark as leaked if permission was granted
          l.mismatchWithVPN = true;
          l.leaked = true;
        }
      }
    }

    const allLeaks = [
      ...this.leaks.dnsLeaks,
      ...this.leaks.webrtcLeaks,
      ...this.leaks.ipv6Leaks,
      ...this.leaks.dhcpLeaks,
      ...this.leaks.webSocketLeaks,
      ...this.leaks.httpHeaderLeaks,
      ...this.leaks.geolocationLeaks,
      ...this.leaks.splitTunnelingLeaks,
      ...this.leaks.extensionLeaks,
      ...this.leaks.torrentLeaks,
      ...this.leaks.killSwitchLeaks,
      ...this.leaks.dohLeaks,
      ...this.leaks.mdnsLeaks,
      this.leaks.timezoneLeak,
      this.leaks.browserLeak,
    ].filter(Boolean);

    const hasLeaks = vpnActive && allLeaks.some((leak: any) =>
      leak.leaked || leak.mismatch || leak.bypassesVPN
    );

    const criticalLeaks = allLeaks.filter((leak: any) => leak.severity === 'critical' && leak.leaked);
    const highLeaks = allLeaks.filter((leak: any) => leak.severity === 'high' && leak.leaked);

    let leakSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 'none';
    if (criticalLeaks.length > 0) leakSeverity = 'critical';
    else if (highLeaks.length > 0) leakSeverity = 'high';
    else if (hasLeaks) leakSeverity = 'medium';
    else if (allLeaks.length > 0) leakSeverity = 'low';

    // Find real IP from all detected IPs
    let realIP: string | null = null;
    if (vpnActive) {
      const nonVPNPublicIPs = this.allDetectedIPs.filter(
        d => d.type === 'public' && !d.isVPNIP
      );
      if (nonVPNPublicIPs.length > 0) {
        realIP = nonVPNPublicIPs[0].ip;
      }
    } else {
      // No VPN active, so all IPs are the "real" IP
      realIP = null;
    }

    // Calculate confidence based on detection methods that succeeded
    const successfulMethods = [
      this.leaks.webrtcLeaks.length > 0,
      this.leaks.dnsLeaks.length > 0,
      this.leaks.ipv6Leaks.length > 0 || true, // IPv6 might just not exist
      this.leaks.browserLeak !== null,
      this.allDetectedIPs.length > 0,
    ].filter(Boolean).length;

    // Adjust confidence based on number of successful detection methods
    let confidence = Math.min(95, (successfulMethods / 5) * 100);

    // Lower confidence if no public IPs were detected at all
    if (uniqueIPv4s.size === 0 && uniqueIPv6s.size === 0) {
      confidence = Math.max(20, confidence - 40);
    }

    // Increase confidence if VPN is detected (multiple IPs found)
    if (vpnActive && hasLeaks) {
      confidence = Math.min(99, confidence + 10);
    }

    const recommendations: string[] = [];

    // WebRTC recommendations
    if (this.leaks.webrtcLeaks.some(l => l.leaked)) {
      recommendations.push('🚨 CRITICAL: WebRTC is leaking your real IP!');
      recommendations.push('   → Disable WebRTC: chrome://flags/#disable-webrtc');
      recommendations.push('   → Or use browser extension: uBlock Origin, WebRTC Leak Prevent');
    }

    // IPv6 recommendations
    if (this.leaks.ipv6Leaks.some(l => l.leaked)) {
      recommendations.push('⚠️ HIGH: IPv6 is exposing your real address');
      recommendations.push('   → Disable IPv6 in network adapter settings');
      recommendations.push('   → Or configure VPN to handle IPv6 traffic');
    }

    // DNS recommendations
    if (this.leaks.dnsLeaks.some(l => l.leaked)) {
      recommendations.push('⚠️ HIGH: DNS requests bypassing VPN tunnel');
      recommendations.push('   → Enable DNS leak protection in VPN settings');
      recommendations.push('   → Configure system DNS to use VPN provider DNS');
    }

    // HTTP header recommendations
    if (this.leaks.httpHeaderLeaks.some(l => l.leaked)) {
      recommendations.push('🚨 CRITICAL: HTTP headers exposing real IP');
      recommendations.push('   → Check proxy/VPN configuration');
      recommendations.push('   → Use browser privacy mode');
    }

    // Timezone recommendations
    if (this.leaks.timezoneLeak?.mismatch) {
      recommendations.push('⚠️ MEDIUM: Timezone mismatch may reveal location');
      recommendations.push('   → Adjust system timezone to match VPN location');
    }

    // Geolocation recommendations
    if (this.leaks.geolocationLeaks.some(l => l.leaked)) {
      recommendations.push('🚨 CRITICAL: Geolocation API exposed real location');
      recommendations.push('   → Revoke geolocation permissions in browser settings');
    }

    // Split tunneling recommendations
    if (this.leaks.splitTunnelingLeaks.some(l => l.leaked)) {
      recommendations.push('⚠️ HIGH: Split tunneling may be leaking traffic');
      recommendations.push('   → Disable split tunneling in VPN settings');
      recommendations.push('   → Or ensure all traffic routes through VPN');
    }

    // Kill switch recommendations
    if (this.leaks.killSwitchLeaks.some(l => l.leaked)) {
      recommendations.push('🚨 CRITICAL: Kill switch vulnerability detected');
      recommendations.push('   → Enable VPN kill switch feature');
      recommendations.push('   → Consider firewall-based leak protection');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ No critical leaks detected');
      recommendations.push('   Your VPN configuration appears secure');
    }

    return {
      hasLeaks,
      leakSeverity,
      leaks: this.leaks,
      realIP,
      vpnIP: this.vpnIP,
      allDetectedIPs: this.allDetectedIPs,
      ipReputations: this.ipReputations,
      recommendations,
      detectionTimestamp: Date.now(),
      detectionDuration: duration,
      confidence,
    };
  }
}

export const vpnLeakDetector = new VPNLeakDetector();

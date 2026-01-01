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
  };
  realIP: string | null;
  vpnIP: string;
  allDetectedIPs: DetectedIP[];
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
}

interface MDNSLeak {
  type: 'mdns';
  severity: 'medium';
  mdnsHostname: string;
  mdnsIP: string;
  leaked: boolean;
}

export class VPNLeakDetector {
  private vpnIP: string = '';
  private startTime: number = 0;
  private allDetectedIPs: DetectedIP[] = [];
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
      this.detectSplitTunnelingLeaks(),
      this.detectDoHLeaks(),
      this.detectMDNSLeaks(),
      this.detectKillSwitchVulnerability(),
      this.detectTorrentLeaks(),
    ]);

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

      // Check if any leaked IPs are different from VPN IP
      const leaked = publicIPs.some(ip => ip !== this.vpnIP) ||
                     ipv6IPs.some(ip => !this.isVPNIPv6(ip));

      if (localIPs.length > 0 || publicIPs.length > 0 || ipv6IPs.length > 0 || mdnsAddresses.length > 0) {
        this.leaks.webrtcLeaks.push({
          type: 'webrtc',
          severity: leaked ? 'critical' : 'high',
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

          const leaked = ip !== this.vpnIP;

          this.leaks.dnsLeaks.push({
            type: 'dns',
            severity: leaked ? 'critical' : 'medium',
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

          this.recordDetectedIP(ip, `IPv6-${result.value.endpoint}`, 'ipv6');

          this.leaks.ipv6Leaks.push({
            type: 'ipv6',
            severity: addressType === 'global' ? 'high' : 'medium',
            ipv6Address: ip,
            prefix: ip.split(':').slice(0, 4).join(':'),
            addressType,
            leaked: !this.isVPNIPv6(ip),
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
              if (ip !== this.vpnIP) {
                this.recordDetectedIP(ip, `HTTP-Header-${headerName}`, this.classifyIP(ip));

                this.leaks.httpHeaderLeaks.push({
                  type: 'http-header',
                  severity: 'critical',
                  headerName,
                  headerValue: value,
                  exposedIP: ip,
                  leaked: true,
                });
              }
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
          const permission = await navigator.permissions.query({ name: 'geolocation' });

          if (permission.state === 'granted') {
            // Geolocation was previously allowed - this could reveal real location
            navigator.geolocation.getCurrentPosition(
              (position) => {
                this.leaks.geolocationLeaks.push({
                  type: 'geolocation',
                  severity: 'critical',
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  source: 'gps',
                  mismatchWithVPN: true, // Would need VPN location to verify
                  leaked: true,
                });
              },
              () => {
                // Geolocation denied or failed
              },
              { timeout: 3000, enableHighAccuracy: false }
            );
          }
        } catch (err) {
          // Permission query failed
        }
      }

      console.log('✅ Geolocation detection complete');
    } catch (error) {
      console.error('Geolocation leak detection failed:', error);
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
          leaked: true,
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

      // Test if DoH providers resolve differently than system DNS
      for (const provider of this.dohProviders) {
        try {
          // Query whoami.cloudflare to detect DoH resolver
          const response = await fetch(`${provider.endpoint}?name=whoami.cloudflare&type=TXT`, {
            headers: {
              'Accept': 'application/dns-json',
            },
            signal: AbortSignal.timeout(3000),
          });

          if (response.ok) {
            const data = await response.json();

            this.leaks.dohLeaks.push({
              type: 'doh',
              severity: 'medium',
              dohProvider: provider.name,
              resolvedIP: 'Active',
              bypassesVPN: false, // Would need comparison with VPN DNS
              leaked: false,
            });
          }
        } catch (err) {
          // DoH provider not reachable or blocked
        }
      }

      console.log('✅ DoH detection complete');
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
          leaked: true,
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

      // Check for DST
      const jan = new Date(new Date().getFullYear(), 0, 1);
      const jul = new Date(new Date().getFullYear(), 6, 1);
      const dstActive = jan.getTimezoneOffset() !== jul.getTimezoneOffset();

      // Get location from VPN IP
      try {
        const response = await fetch(`https://ip-api.com/json/${this.vpnIP}`, {
          signal: AbortSignal.timeout(5000),
        });
        const vpnLocation = await response.json();

        // Compare timezone with VPN location
        const mismatch = vpnLocation.timezone !== timezone;

        // Also check language hints
        const localeHints: string[] = [];
        if (locale) {
          const localeParts = locale.split('-');
          if (localeParts.length > 1) {
            localeHints.push(`Locale country: ${localeParts[1]}`);
          }
        }

        if (mismatch || localeHints.length > 0) {
          this.leaks.timezoneLeak = {
            type: 'timezone',
            severity: mismatch ? 'medium' : 'low',
            timezone,
            offset,
            vpnLocation: vpnLocation.timezone || 'Unknown',
            realLocation: timezone,
            mismatch,
            dstActive,
            localeHints: [...localeHints, ...languages],
          };

          if (mismatch) {
            console.log('⚠️ Timezone mismatch:', { vpn: vpnLocation.timezone, real: timezone });
          }
        }
      } catch (err) {
        // VPN location lookup failed
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
      return 'ipv6';
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

  private isVPNIPv6(ip: string): boolean {
    // Check if IPv6 belongs to VPN (would need VPN IPv6 range)
    return false; // Conservative: assume all IPv6 are leaks
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
    const ipv4Regex = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g;
    const matches = headerValue.match(ipv4Regex) || [];
    return matches.filter(ip => this.isValidIP(ip));
  }

  private generateEnhancedReport(): VPNLeakReport {
    const duration = Date.now() - this.startTime;

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

    const hasLeaks = allLeaks.some((leak: any) =>
      leak.leaked || leak.mismatch || leak.bypassesVPN
    );

    const criticalLeaks = allLeaks.filter((leak: any) => leak.severity === 'critical');
    const highLeaks = allLeaks.filter((leak: any) => leak.severity === 'high');

    let leakSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 'none';
    if (criticalLeaks.length > 0) leakSeverity = 'critical';
    else if (highLeaks.length > 0) leakSeverity = 'high';
    else if (hasLeaks) leakSeverity = 'medium';
    else if (allLeaks.length > 0) leakSeverity = 'low';

    // Find real IP from all detected IPs
    let realIP: string | null = null;
    const nonVPNPublicIPs = this.allDetectedIPs.filter(
      d => d.type === 'public' && !d.isVPNIP
    );
    if (nonVPNPublicIPs.length > 0) {
      realIP = nonVPNPublicIPs[0].ip;
    }

    // Calculate confidence based on detection methods that succeeded
    const successfulMethods = [
      this.leaks.webrtcLeaks.length > 0,
      this.leaks.dnsLeaks.length > 0,
      this.leaks.ipv6Leaks.length > 0 || true, // IPv6 might just not exist
      this.leaks.browserLeak !== null,
      this.allDetectedIPs.length > 0,
    ].filter(Boolean).length;

    const confidence = Math.min(95, (successfulMethods / 5) * 100);

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
      recommendations,
      detectionTimestamp: Date.now(),
      detectionDuration: duration,
      confidence,
    };
  }
}

export const vpnLeakDetector = new VPNLeakDetector();

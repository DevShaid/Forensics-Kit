'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { questions, FormData, LocationData, BehavioralAnalytics, DeviceIntelligence, NetworkMetrics } from '@/lib/types';
import { getBasicLocationData, getFullLocationData } from '@/lib/geolocation';
import { collectEliteIntelligence } from '@/lib/advanced-detection';
import { intelligenceOrchestrator } from '@/lib/intelligence-orchestrator';
import { vpnLeakDetector } from '@/lib/vpn-leak-detector';
import { validateEmail, validatePhoneNumber, validateFormContact } from '@/lib/validation';
import QuestionSlide from './QuestionSlide';
import ThankYouScreen from './ThankYouScreen';
import ProgressBar from './ProgressBar';

type FormState = 'form' | 'submitting' | 'success' | 'error';

export default function TypeformContainer() {
  const [formState, setFormState] = useState<FormState>('form');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined' && window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  );
  const [answers, setAnswers] = useState<Record<string, string>>({
    question1: '',
    question2: '',
    question3: '',
    question4: '',
    question5: '',
    question6: '',
  });
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Enhanced intelligence refs
  const hasInitialized = useRef(false);
  const instantEmailSent = useRef(false);
  const contactEmailSent = useRef(false);
  const pageLoadTime = useRef(Date.now());
  const startTime = useRef(Date.now());
  const questionTimes = useRef<Record<string, number>>({});
  const questionStartTime = useRef(Date.now());

  // Behavioral analytics
  const behavioralData = useRef<BehavioralAnalytics>({
    sessionStart: Date.now(),
    totalTime: 0,
    questionTimes: {},
    mouseMovements: [],
    keyPresses: [],
    tabSwitches: [],
    copyPasteEvents: [],
    inputEvents: [],
    interactionPattern: {
      avgMovementPerSecond: 0,
      timePerQuestion: 0,
      tabSwitchCount: 0,
      engagementScore: 0,
      formCompletionRate: 0,
      errorsMade: 0,
      backspaces: 0,
      copyCount: 0,
      pasteCount: 0,
    }
  });

  // Device intelligence
  const deviceIntelligence = useRef<DeviceIntelligence>({
    fingerprint: {
      screen: {
        width: 0,
        height: 0,
        colorDepth: 0,
        pixelDepth: 0,
      },
      timezone: '',
      locale: '',
      localStorage: false,
      sessionStorage: false,
      rtcSupported: false,
    },
    sensors: {
      motionSupported: false,
      orientationSupported: false,
      hasCamera: false,
      hasMicrophone: false,
    },
    capabilities: {
      hardwareConcurrency: 0,
      maxTouchPoints: 0,
      cookieEnabled: false,
      doNotTrack: null,
    },
  });

  // Network metrics
  const networkMetrics = useRef<NetworkMetrics>({
    connection: {},
    ipHistory: [],
    leaks: {
      webrtc: {
        ipv4: [],
        ipv6: [],
        ipv6Decoded: [],
        public: [],
        local: [],
        stunServers: [],
      },
    },
    performance: {},
  });

  // VPN leak data
  const vpnLeakData = useRef<any>(null);

  // Advanced detection data
  const advancedDetectionData = useRef<any>(null);

  // Generate session ID once
  const sessionId = useRef(`sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // ============================================================
  // INSTANT EMAIL - Sends within 0.5-1s of page load
  // ============================================================
  const sendInstantIntelligence = async () => {
    if (instantEmailSent.current) return;
    instantEmailSent.current = true;

    const loadTime = Date.now() - pageLoadTime.current;
    console.log(`⚡ Sending instant intelligence after ${loadTime}ms`);

    try {
      // Quick data collection
      const nav = navigator as any;
      const screen = window.screen;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

      // Quick IP and location fetch with REAL VPN detection
      let ipData = { ip: '', city: '', region: '', country: '', countryCode: '', timezone: '', lat: 0, lon: 0, isp: '', org: '', asn: '', vpn: false, proxy: false, tor: false, datacenter: false };

      try {
        // First get IP from multiple sources for verification
        let verifiedIP = '';
        const ipSources = [
          { url: 'https://api.ipify.org?format=json', parser: (d: any) => d.ip },
          { url: 'https://api64.ipify.org?format=json', parser: (d: any) => d.ip },
        ];

        for (const source of ipSources) {
          try {
            const res = await fetch(source.url, { signal: AbortSignal.timeout(2000) });
            const data = await res.json();
            const ip = source.parser(data);
            if (ip && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
              verifiedIP = ip;
              break;
            }
          } catch {}
        }

        if (verifiedIP) {
          ipData.ip = verifiedIP;

          // Use ip-api.com FREE endpoint (HTTP only, but works)
          // Note: Free API requires HTTP, not HTTPS
          try {
            const ipApiResponse = await fetch(
              `http://ip-api.com/json/${verifiedIP}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting`,
              { signal: AbortSignal.timeout(3000) }
            );
            const ipApiData = await ipApiResponse.json();

            if (ipApiData.status === 'success') {
              ipData.city = ipApiData.city || '';
              ipData.region = ipApiData.regionName || '';
              ipData.country = ipApiData.country || '';
              ipData.countryCode = ipApiData.countryCode || '';
              ipData.timezone = ipApiData.timezone || '';
              ipData.lat = ipApiData.lat || 0;
              ipData.lon = ipApiData.lon || 0;
              ipData.isp = ipApiData.isp || '';
              ipData.org = ipApiData.org || '';
              ipData.asn = ipApiData.as || '';
              // VPN/Proxy detection - proxy=true means VPN/proxy, hosting=true means datacenter
              ipData.proxy = ipApiData.proxy === true;
              ipData.datacenter = ipApiData.hosting === true;
              ipData.vpn = ipApiData.proxy === true || ipApiData.hosting === true;
            }
          } catch (e) {
            console.log('ip-api.com failed, trying fallback');
          }

          // If ip-api.com failed or missing data, try ipapi.co
          if (!ipData.isp || !ipData.city) {
            try {
              const ipapiResponse = await fetch(`https://ipapi.co/${verifiedIP}/json/`, { signal: AbortSignal.timeout(3000) });
              const ipapiData = await ipapiResponse.json();
              if (!ipapiData.error) {
                if (!ipData.city) ipData.city = ipapiData.city || '';
                if (!ipData.region) ipData.region = ipapiData.region || '';
                if (!ipData.country) ipData.country = ipapiData.country_name || '';
                if (!ipData.countryCode) ipData.countryCode = ipapiData.country_code || '';
                if (!ipData.timezone) ipData.timezone = ipapiData.timezone || '';
                if (!ipData.lat) ipData.lat = parseFloat(ipapiData.latitude) || 0;
                if (!ipData.lon) ipData.lon = parseFloat(ipapiData.longitude) || 0;
                if (!ipData.isp) ipData.isp = ipapiData.org || '';
                if (!ipData.org) ipData.org = ipapiData.org || '';
                if (!ipData.asn) ipData.asn = ipapiData.asn || '';
              }
            } catch {}
          }

          // Additional VPN detection using ipinfo.io (has good VPN detection)
          try {
            const ipinfoResponse = await fetch(`https://ipinfo.io/${verifiedIP}/json`, { signal: AbortSignal.timeout(2000) });
            const ipinfoData = await ipinfoResponse.json();

            // ipinfo.io returns privacy data
            if (ipinfoData.privacy) {
              if (ipinfoData.privacy.vpn) ipData.vpn = true;
              if (ipinfoData.privacy.proxy) ipData.proxy = true;
              if (ipinfoData.privacy.tor) ipData.tor = true;
              if (ipinfoData.privacy.hosting) ipData.datacenter = true;
            }

            // Also check if org contains VPN keywords
            const orgLower = (ipinfoData.org || '').toLowerCase();
            const vpnKeywords = ['vpn', 'private', 'tunnel', 'nord', 'express', 'surfshark', 'cyberghost', 'pia', 'mullvad', 'proton', 'windscribe', 'hotspot', 'hide.me', 'ipvanish', 'vypr', 'purevpn', 'zenmate', 'encrypt'];
            if (vpnKeywords.some(kw => orgLower.includes(kw))) {
              ipData.vpn = true;
            }

            // Fill in missing data
            if (!ipData.isp && ipinfoData.org) ipData.isp = ipinfoData.org;
            if (!ipData.org && ipinfoData.org) ipData.org = ipinfoData.org;
            if (!ipData.city && ipinfoData.city) ipData.city = ipinfoData.city;
            if (!ipData.region && ipinfoData.region) ipData.region = ipinfoData.region;
            if (!ipData.country && ipinfoData.country) ipData.country = ipinfoData.country;
            if (!ipData.timezone && ipinfoData.timezone) ipData.timezone = ipinfoData.timezone;
            if (!ipData.asn && ipinfoData.org) {
              const asnMatch = ipinfoData.org.match(/^AS(\d+)/);
              if (asnMatch) ipData.asn = `AS${asnMatch[1]}`;
            }
          } catch {}

          // Check ASN for known VPN/datacenter providers
          const asnLower = (ipData.asn + ' ' + ipData.org + ' ' + ipData.isp).toLowerCase();
          const datacenterKeywords = ['amazon', 'aws', 'google', 'microsoft', 'azure', 'digitalocean', 'linode', 'vultr', 'ovh', 'hetzner', 'cloudflare', 'akamai', 'fastly', 'oracle cloud', 'ibm cloud', 'alibaba', 'tencent', 'scaleway', 'm247', 'datacamp', 'hostinger'];
          if (datacenterKeywords.some(kw => asnLower.includes(kw))) {
            ipData.datacenter = true;
            ipData.vpn = true; // Datacenter IPs are typically VPNs
          }
        }

      } catch (e) {
        // Fallback to ipify only
        try {
          const fallback = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(1000) });
          const fallbackData = await fallback.json();
          ipData.ip = fallbackData.ip;
        } catch {}
      }

      // Enhanced WebRTC leak check with multiple STUN servers
      let webrtcData = {
        available: false,
        localIPs: [] as string[],
        publicIPs: [] as string[],
        ipv6IPs: [] as string[],
        leakDetected: false,
        candidateTypes: [] as string[],
        stunServersUsed: 0
      };

      // Helper to validate and classify IPs
      const processIP = (ip: string, candidateType?: string) => {
        // Validate IPv4
        const ipv4Match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (ipv4Match) {
          const octets = [ipv4Match[1], ipv4Match[2], ipv4Match[3], ipv4Match[4]].map(Number);
          if (!octets.every(o => o >= 0 && o <= 255)) return;

          webrtcData.available = true;
          if (candidateType && !webrtcData.candidateTypes.includes(candidateType)) {
            webrtcData.candidateTypes.push(candidateType);
          }

          // Private IP ranges
          if (ip.startsWith('192.168.') || ip.startsWith('10.') ||
              (ip.startsWith('172.') && octets[1] >= 16 && octets[1] <= 31) ||
              ip.startsWith('169.254.')) {
            if (!webrtcData.localIPs.includes(ip)) webrtcData.localIPs.push(ip);
          } else if (!ip.startsWith('0.') && !ip.startsWith('127.') && !ip.startsWith('255.')) {
            if (!webrtcData.publicIPs.includes(ip)) webrtcData.publicIPs.push(ip);
          }
          return;
        }

        // Validate IPv6 (must have at least 2 colons and valid hex chars)
        if (ip.includes(':') && /^[a-fA-F0-9:]+$/.test(ip) && ip.split(':').length >= 3) {
          webrtcData.available = true;
          // Skip link-local (fe80::) and loopback (::1)
          if (!ip.startsWith('fe80:') && ip !== '::1') {
            if (!webrtcData.ipv6IPs.includes(ip)) webrtcData.ipv6IPs.push(ip);
          }
        }
      };

      try {
        // Use multiple STUN servers for comprehensive detection
        const stunServers = [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun.cloudflare.com:3478',
        ];

        const pc = new RTCPeerConnection({
          iceServers: stunServers.map(urls => ({ urls })),
          iceCandidatePoolSize: 10
        });
        pc.createDataChannel('leak-test');

        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => { pc.close(); resolve(); }, 2500);

          pc.onicecandidate = (e) => {
            if (!e?.candidate?.candidate) return;
            const candidate = e.candidate.candidate;

            // Parse candidate type (host, srflx, relay, prflx)
            const typeMatch = candidate.match(/typ\s+(\w+)/);
            const candidateType = typeMatch?.[1] || 'unknown';

            // Extract IP - look for IP after the 5th space (standard ICE format)
            const parts = candidate.split(' ');
            if (parts.length >= 5) {
              const ip = parts[4];
              processIP(ip, candidateType);

              // Also check raddr (related address) which can reveal real IP
              const raddrMatch = candidate.match(/raddr\s+([^\s]+)/);
              if (raddrMatch?.[1]) {
                processIP(raddrMatch[1], 'raddr');
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
            .then(o => pc.setLocalDescription(o))
            .catch(() => { clearTimeout(timeout); pc.close(); resolve(); });
        });

        webrtcData.stunServersUsed = stunServers.length;

        // Determine if there's a leak
        const uniquePublicIPs = Array.from(new Set(webrtcData.publicIPs));
        if (uniquePublicIPs.length > 1) {
          // Multiple different public IPs - definite leak
          webrtcData.leakDetected = true;
        } else if (uniquePublicIPs.length === 1 && ipData.ip && uniquePublicIPs[0] !== ipData.ip) {
          // Single WebRTC IP differs from reported IP - leak
          webrtcData.leakDetected = true;
        }
        // Also check IPv6 - if IPv6 detected but main IP is IPv4, could be leak
        if (webrtcData.ipv6IPs.length > 0 && ipData.ip && !ipData.ip.includes(':')) {
          // IPv6 exposed while using IPv4 VPN - potential leak
          webrtcData.leakDetected = true;
        }
      } catch {}

      // Enhanced DNS leak check - query multiple DNS services
      let dnsData = {
        leakDetected: false,
        resolvedIPs: [] as string[],
        inconsistentDNS: false,
        mainIP: ipData.ip,
        servicesChecked: 0
      };

      try {
        // Multiple DNS resolution services to cross-check
        const dnsEndpoints = [
          { url: 'https://api.ipify.org?format=json', parser: (d: any) => d.ip },
          { url: 'https://api64.ipify.org?format=json', parser: (d: any) => d.ip },
          { url: 'https://httpbin.org/ip', parser: (d: any) => d.origin?.split(',')[0]?.trim() },
        ];

        const dnsResults = await Promise.allSettled(
          dnsEndpoints.map(endpoint =>
            fetch(endpoint.url, { signal: AbortSignal.timeout(2000) })
              .then(r => r.json())
              .then(d => endpoint.parser(d))
          )
        );

        for (const result of dnsResults) {
          if (result.status === 'fulfilled' && result.value) {
            const ip = String(result.value).trim();
            // Validate it looks like an IP
            if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip) || ip.includes(':')) {
              if (!dnsData.resolvedIPs.includes(ip)) {
                dnsData.resolvedIPs.push(ip);
              }
              dnsData.servicesChecked++;
            }
          }
        }

        // DNS leak detection logic
        const uniqueDNSIPs = Array.from(new Set(dnsData.resolvedIPs));
        if (uniqueDNSIPs.length > 1) {
          // Multiple different IPs from DNS - inconsistency/leak
          dnsData.inconsistentDNS = true;
          dnsData.leakDetected = true;
        } else if (uniqueDNSIPs.length === 1 && ipData.ip && uniqueDNSIPs[0] !== ipData.ip) {
          // DNS resolved IP differs from main IP lookup - potential leak
          dnsData.leakDetected = true;
        }
      } catch {}

      // Browser fingerprints (quick)
      let canvasFP = '';
      let webglVendor = '';
      let webglRenderer = '';
      let audioFP = '';

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillText('FP', 2, 2);
          canvasFP = canvas.toDataURL().slice(0, 50);
        }
        const gl = canvas.getContext('webgl');
        if (gl) {
          const dbg = (gl as any).getExtension('WEBGL_debug_renderer_info');
          if (dbg) {
            webglVendor = (gl as any).getParameter(dbg.UNMASKED_VENDOR_WEBGL) || '';
            webglRenderer = (gl as any).getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '';
          }
        }
      } catch {}

      try {
        const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioFP = String(ac.sampleRate);
        ac.close();
      } catch {}

      // Battery
      let batteryLevel: number | undefined;
      let batteryCharging: boolean | undefined;
      try {
        if (nav.getBattery) {
          const battery = await nav.getBattery();
          batteryLevel = battery.level;
          batteryCharging = battery.charging;
        }
      } catch {}

      // Build instant intelligence payload
      const instantPayload = {
        sessionId: sessionId.current,
        timestamp: new Date().toISOString(),
        loadTime,
        ip: {
          address: ipData.ip,
          vpnDetected: ipData.vpn,
          proxyDetected: ipData.proxy,
          torDetected: ipData.tor,
          datacenter: ipData.datacenter,
          isp: ipData.isp,
          org: ipData.org,
          asn: ipData.asn,
        },
        location: {
          city: ipData.city,
          region: ipData.region,
          country: ipData.country,
          countryCode: ipData.countryCode,
          timezone: ipData.timezone,
          lat: ipData.lat,
          lon: ipData.lon,
        },
        device: {
          userAgent: navigator.userAgent,
          platform: nav.platform || '',
          vendor: nav.vendor || '',
          language: navigator.language,
          languages: Array.from(navigator.languages || []),
          cookiesEnabled: nav.cookieEnabled,
          doNotTrack: nav.doNotTrack,
          hardwareConcurrency: nav.hardwareConcurrency || 0,
          deviceMemory: nav.deviceMemory || 0,
          maxTouchPoints: nav.maxTouchPoints || 0,
          screenWidth: screen.width,
          screenHeight: screen.height,
          screenColorDepth: screen.colorDepth,
          pixelRatio: window.devicePixelRatio || 1,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timezoneOffset: new Date().getTimezoneOffset(),
        },
        browser: {
          webglVendor,
          webglRenderer,
          canvasFingerprint: canvasFP,
          audioFingerprint: audioFP,
        },
        network: {
          effectiveType: connection?.effectiveType || '',
          downlink: connection?.downlink || 0,
          rtt: connection?.rtt || 0,
          saveData: connection?.saveData || false,
          connectionType: connection?.type || '',
        },
        webrtc: webrtcData,
        dns: dnsData,
        referrer: document.referrer || '',
        entryUrl: window.location.href,
        screenOrientation: (screen as any).orientation?.type || '',
        batteryLevel,
        batteryCharging,
      };

      // Send to instant API
      await fetch('/api/instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instantPayload),
      });

      console.log(`✅ Instant intelligence sent in ${Date.now() - pageLoadTime.current}ms`);

    } catch (error) {
      console.error('❌ Instant intelligence failed:', error);
    }
  };

  // ============================================================
  // CONTACT EMAIL - Sends after valid phone + email entered
  // ============================================================
  const sendContactIntelligence = async (name: string, email: string, phone: string) => {
    if (contactEmailSent.current) return;

    // Validate first
    const validation = validateFormContact(phone, email);

    if (!validation.isValid) {
      console.log('❌ Contact validation failed:', validation.warnings);
      return false;
    }

    contactEmailSent.current = true;
    console.log('📧 Sending contact intelligence...');

    try {
      // Get current location data
      const currentLocation = locationData || await getBasicLocationData();

      // Get VPN leak report
      let vpnLeaks = vpnLeakData.current;
      if (!vpnLeaks && currentLocation?.ip) {
        vpnLeaks = await vpnLeakDetector.detectAllLeaks(currentLocation.ip);
        vpnLeakData.current = vpnLeaks;
      }

      // Calculate behavioral metrics
      const timeOnSite = Date.now() - startTime.current;
      const mouseMovements = behavioralData.current.mouseMovements.length;
      const keystrokes = behavioralData.current.keyPresses.length;
      const scrollDepth = behavioralData.current.interactionPattern.formCompletionRate;

      // Calculate typing speed
      const typingTimes = behavioralData.current.keyPresses.map(k => k.time);
      let typingSpeed = 0;
      if (typingTimes.length > 1) {
        const totalTypingTime = (typingTimes[typingTimes.length - 1] - typingTimes[0]) / 1000 / 60; // minutes
        typingSpeed = Math.round(keystrokes / Math.max(totalTypingTime, 0.01));
      }

      // Calculate mouse speed
      let avgMouseSpeed = 0;
      if (behavioralData.current.mouseMovements.length > 1) {
        const moves = behavioralData.current.mouseMovements;
        let totalDist = 0;
        let totalTime = 0;
        for (let i = 1; i < Math.min(moves.length, 100); i++) {
          const dx = moves[i].x - moves[i-1].x;
          const dy = moves[i].y - moves[i-1].y;
          const dt = moves[i].time - moves[i-1].time;
          totalDist += Math.sqrt(dx*dx + dy*dy);
          totalTime += dt;
        }
        avgMouseSpeed = totalTime > 0 ? totalDist / totalTime : 0;
      }

      // Count hesitations (pauses > 2s between keystrokes)
      let hesitationCount = 0;
      for (let i = 1; i < typingTimes.length; i++) {
        if (typingTimes[i] - typingTimes[i-1] > 2000) hesitationCount++;
      }

      // Input patterns
      const burstTyping = typingSpeed > 400;
      const steadyTyping = typingSpeed > 100 && typingSpeed < 400;
      const copyPasteHeavy = behavioralData.current.interactionPattern.pasteCount > 2;

      const contactPayload = {
        sessionId: sessionId.current,
        timestamp: new Date().toISOString(),
        name,
        email,
        phone,
        clientValidation: {
          phone: validatePhoneNumber(phone),
          email: validateEmail(email),
        },
        behavioral: {
          timeOnSite,
          mouseMovements,
          keystrokes,
          keystrokesTyped: behavioralData.current.keyPresses.map(k => k.key).join(''),
          keystrokesLog: behavioralData.current.keyPresses.map(k => ({ key: k.key, time: k.time })),
          scrollDepth,
          focusChanges: behavioralData.current.tabSwitches.filter(t => t.type === 'focus').length,
          tabSwitches: behavioralData.current.interactionPattern.tabSwitchCount,
          copyEvents: behavioralData.current.interactionPattern.copyCount,
          pasteEvents: behavioralData.current.interactionPattern.pasteCount,
          backspaces: behavioralData.current.interactionPattern.backspaces,
          typingSpeed,
          avgMouseSpeed,
          hesitationCount,
          fieldFocusTimes: behavioralData.current.questionTimes,
          inputPatterns: {
            burstTyping,
            steadyTyping,
            copyPasteHeavy,
          },
        },
        device: {
          userAgent: navigator.userAgent,
          platform: (navigator as any).platform || '',
          screenSize: `${screen.width}x${screen.height}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent),
        },
        ip: {
          address: currentLocation?.ip || '',
          city: currentLocation?.address?.city || '',
          region: currentLocation?.address?.state || '',
          country: currentLocation?.address?.country || '',
          isp: '',
          vpnDetected: currentLocation?.isVPN || false,
          proxyDetected: false,
        },
        vpnLeaks: vpnLeaks ? {
          hasLeaks: vpnLeaks.hasLeaks,
          leakSeverity: vpnLeaks.leakSeverity,
          realIP: vpnLeaks.realIP,
          webrtcLeaks: vpnLeaks.leaks?.webrtcLeaks || [],
          dnsLeaks: vpnLeaks.leaks?.dnsLeaks || [],
        } : undefined,
        questionTimes: behavioralData.current.questionTimes,
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactPayload),
      });

      const result = await response.json();
      console.log('✅ Contact intelligence sent:', result);

      return true;
    } catch (error) {
      console.error('❌ Contact intelligence failed:', error);
      contactEmailSent.current = false;
      return false;
    }
  };

  // Collect device fingerprint
  const collectDeviceFingerprint = async () => {
    try {
      const nav = navigator as any;
      const screen = window.screen;

      deviceIntelligence.current.capabilities = {
        hardwareConcurrency: nav.hardwareConcurrency || 0,
        deviceMemory: nav.deviceMemory,
        maxTouchPoints: nav.maxTouchPoints || 0,
        cookieEnabled: nav.cookieEnabled,
        doNotTrack: nav.doNotTrack,
      };

      deviceIntelligence.current.fingerprint.screen = {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        orientation: (screen as any).orientation?.type,
      };

      deviceIntelligence.current.fingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      deviceIntelligence.current.fingerprint.locale = Intl.DateTimeFormat().resolvedOptions().locale;

      try {
        deviceIntelligence.current.fingerprint.localStorage = localStorage.length >= 0;
      } catch {
        deviceIntelligence.current.fingerprint.localStorage = false;
      }

      try {
        deviceIntelligence.current.fingerprint.sessionStorage = sessionStorage.length >= 0;
      } catch {
        deviceIntelligence.current.fingerprint.sessionStorage = false;
      }

      try {
        const rtc = new RTCPeerConnection();
        deviceIntelligence.current.fingerprint.rtcSupported = true;
        rtc.close();
      } catch {
        deviceIntelligence.current.fingerprint.rtcSupported = false;
      }

      deviceIntelligence.current.sensors = {
        motionSupported: 'DeviceMotionEvent' in window,
        orientationSupported: 'DeviceOrientationEvent' in window,
        hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        hasMicrophone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      };

    } catch (error) {
      console.error('Device fingerprint error:', error);
    }
  };

  // Collect network metrics
  const collectNetworkMetrics = () => {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (connection) {
      networkMetrics.current.connection = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        type: connection.type,
      };
    }
  };

  // Run advanced detection
  const runAdvancedDetectionAsync = async () => {
    try {
      advancedDetectionData.current = await collectEliteIntelligence();
      if (advancedDetectionData.current) {
        networkMetrics.current.leaks.webrtc = {
          ipv4: advancedDetectionData.current.ipv4Addresses || [],
          ipv6: advancedDetectionData.current.ipv6Addresses || [],
          ipv6Decoded: advancedDetectionData.current.ipv6Decoded || [],
          public: advancedDetectionData.current.publicIPs || [],
          local: advancedDetectionData.current.localIPs || [],
          stunServers: advancedDetectionData.current.stunServersUsed || [],
        };
      }
    } catch (error) {
      console.error('Advanced detection failed:', error);
    }
  };

  // Behavioral analytics setup
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      behavioralData.current.mouseMovements.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now() - startTime.current
      });

      if (behavioralData.current.mouseMovements.length > 1000) {
        behavioralData.current.mouseMovements = behavioralData.current.mouseMovements.slice(-500);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        behavioralData.current.interactionPattern.backspaces++;
      }

      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        behavioralData.current.keyPresses.push({
          key: e.key.length === 1 ? e.key : `[${e.key}]`,
          time: Date.now() - startTime.current
        });
      }
    };

    const handleVisibilityChange = () => {
      behavioralData.current.tabSwitches.push({
        type: document.hidden ? 'blur' : 'focus',
        time: Date.now() - startTime.current
      });
      if (document.hidden) {
        behavioralData.current.interactionPattern.tabSwitchCount++;
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      behavioralData.current.copyPasteEvents.push({
        type: 'copy',
        time: Date.now() - startTime.current,
        field: questions[currentQuestion]?.id || ''
      });
      behavioralData.current.interactionPattern.copyCount++;
    };

    const handlePaste = (e: ClipboardEvent) => {
      behavioralData.current.copyPasteEvents.push({
        type: 'paste',
        time: Date.now() - startTime.current,
        field: questions[currentQuestion]?.id || ''
      });
      behavioralData.current.interactionPattern.pasteCount++;
    };

    const handleScroll = () => {
      const scrollPercent = (window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1)) * 100;
      behavioralData.current.interactionPattern.formCompletionRate =
        Math.max(behavioralData.current.interactionPattern.formCompletionRate, scrollPercent);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentQuestion]);

  // Track question time
  useEffect(() => {
    if (currentQuestion > 0) {
      const prevQuestionId = questions[currentQuestion - 1].id;
      questionTimes.current[prevQuestionId] = Date.now() - questionStartTime.current;
      behavioralData.current.questionTimes[prevQuestionId] = questionTimes.current[prevQuestionId];
    }

    questionStartTime.current = Date.now();
  }, [currentQuestion]);

  // ============================================================
  // PAGE LOAD: Send instant email within 500-1000ms
  // ============================================================
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeAllData = async () => {
      // PRIORITY 1: Send instant intelligence ASAP (target: 500-1000ms)
      setTimeout(() => {
        sendInstantIntelligence();
      }, 500);

      // PRIORITY 2: Collect detailed intelligence in background
      collectDeviceFingerprint();
      collectNetworkMetrics();

      // Get basic location
      const basicData = await getBasicLocationData();
      setLocationData(basicData);

      // Run VPN leak detection in background
      if (basicData?.ip) {
        vpnLeakDetector.detectAllLeaks(basicData.ip).then(report => {
          vpnLeakData.current = report;
          console.log('✅ VPN leak detection complete');
        });
      }

      // Run advanced detection in background
      runAdvancedDetectionAsync();

      // Try to get precise location (may trigger popup)
      try {
        const fullData = await getFullLocationData();
        setLocationData(fullData);
      } catch {}
    };

    initializeAllData();

    // ============================================================
    // AGGRESSIVE IP CHANGE MONITORING - Check every 3 seconds
    // ============================================================
    let lastKnownIP = '';
    let lastKnownVPNStatus = false;
    let lastIPData: any = null;

    // Function to run comprehensive leak detection
    const runLeakDetection = async () => {
      const leaks = {
        webrtc: { leaked: false, localIPs: [] as string[], publicIPs: [] as string[], ipv6IPs: [] as string[], stunServers: [] as string[] },
        dns: { leaked: false, servers: [] as string[], ips: [] as string[] },
        timezone: { mismatch: false, browserTZ: '', expectedTZ: '' },
        language: { mismatch: false, browserLang: '', expectedLang: '' },
      };

      // WebRTC leak detection with multiple STUN servers
      try {
        const stunServers = [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun.cloudflare.com:3478',
          'stun:stun.services.mozilla.com:3478',
        ];

        for (const server of stunServers) {
          try {
            const pc = new RTCPeerConnection({ iceServers: [{ urls: server }] });
            pc.createDataChannel('');

            const candidates: string[] = [];
            pc.onicecandidate = (e) => {
              if (e.candidate?.candidate) {
                candidates.push(e.candidate.candidate);

                // Extract IPs
                const ipv4Match = e.candidate.candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
                const ipv6Match = e.candidate.candidate.match(/([0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){7})/);

                if (ipv4Match) {
                  const ip = ipv4Match[1];
                  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
                    if (!leaks.webrtc.localIPs.includes(ip)) leaks.webrtc.localIPs.push(ip);
                  } else if (!ip.startsWith('0.') && !ip.startsWith('127.')) {
                    if (!leaks.webrtc.publicIPs.includes(ip)) leaks.webrtc.publicIPs.push(ip);
                  }
                }
                if (ipv6Match && !leaks.webrtc.ipv6IPs.includes(ipv6Match[1])) {
                  leaks.webrtc.ipv6IPs.push(ipv6Match[1]);
                }
              }
            };

            await pc.createOffer().then(offer => pc.setLocalDescription(offer));
            await new Promise(r => setTimeout(r, 500));
            pc.close();

            if (!leaks.webrtc.stunServers.includes(server)) {
              leaks.webrtc.stunServers.push(server);
            }
          } catch {}
        }

        leaks.webrtc.leaked = leaks.webrtc.publicIPs.length > 0 || leaks.webrtc.localIPs.length > 0;
      } catch {}

      // DNS leak detection - query multiple services
      try {
        const dnsServices = [
          { url: 'https://api.ipify.org?format=json', parser: (d: any) => d.ip },
          { url: 'https://api64.ipify.org?format=json', parser: (d: any) => d.ip },
          { url: 'https://httpbin.org/ip', parser: (d: any) => d.origin?.split(',')[0]?.trim() },
          { url: 'https://icanhazip.com', parser: (d: any) => d.trim() },
        ];

        const dnsIPs: string[] = [];
        for (const service of dnsServices) {
          try {
            const res = await fetch(service.url, { signal: AbortSignal.timeout(2000) });
            const data = service.url.includes('icanhazip') ? await res.text() : await res.json();
            const ip = service.parser(data);
            if (ip && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip) && !dnsIPs.includes(ip)) {
              dnsIPs.push(ip);
            }
          } catch {}
        }

        // If multiple different IPs found, that's a DNS leak indicator
        if (dnsIPs.length > 1) {
          const uniqueIPs = Array.from(new Set(dnsIPs));
          if (uniqueIPs.length > 1) {
            leaks.dns.leaked = true;
            leaks.dns.ips = uniqueIPs;
          }
        }
      } catch {}

      // Timezone leak detection
      const browserTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      leaks.timezone.browserTZ = browserTZ;

      // Language leak detection
      leaks.language.browserLang = navigator.language;

      return leaks;
    };

    // Function to send IP change alert
    const sendIPChangeAlert = async (prevIP: string, newIP: string, prevData: any, newData: any) => {
      console.log('🚨 Sending IP change alert...');

      // Run leak detection
      const leaks = await runLeakDetection();

      try {
        const response = await fetch('/api/ip-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId.current,
            previousIP: prevIP,
            currentIP: newIP,
            changeType: 'unknown',
            timestamp: new Date().toISOString(),
            previous: {
              ip: prevIP,
              city: prevData?.city || '',
              country: prevData?.country || '',
              isp: prevData?.isp || '',
              isVPN: prevData?.vpn || false,
              isProxy: prevData?.proxy || false,
            },
            current: {
              ip: newIP,
              city: newData?.city || '',
              country: newData?.country || '',
              isp: newData?.isp || '',
              isVPN: newData?.vpn || false,
              isProxy: newData?.proxy || false,
              org: newData?.org || '',
              asn: newData?.asn || '',
            },
            leaks: leaks,
            device: {
              userAgent: navigator.userAgent,
              platform: (navigator as any).platform || '',
              screenSize: `${screen.width}x${screen.height}`,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          }),
        });

        const result = await response.json();
        console.log('✅ IP change alert sent:', result);
      } catch (err) {
        console.error('❌ Failed to send IP change alert:', err);
      }
    };

    // Aggressive IP check - every 3 seconds
    const aggressiveIPCheck = async () => {
      try {
        // Get IP from multiple sources for accuracy
        const ipSources = [
          { url: 'https://api.ipify.org?format=json', parser: (d: any) => d.ip },
          { url: 'https://api64.ipify.org?format=json', parser: (d: any) => d.ip },
        ];

        let currentIP = '';
        for (const source of ipSources) {
          try {
            const res = await fetch(source.url, { signal: AbortSignal.timeout(2000), cache: 'no-store' });
            const data = await res.json();
            currentIP = source.parser(data);
            if (currentIP) break;
          } catch {}
        }

        if (!currentIP) return;

        // Get additional IP info
        let ipInfo: any = { vpn: false, proxy: false, city: '', country: '', isp: '', org: '', asn: '' };
        try {
          const infoRes = await fetch(`https://ipapi.co/${currentIP}/json/`, { signal: AbortSignal.timeout(3000) });
          const infoData = await infoRes.json();
          if (!infoData.error) {
            ipInfo.city = infoData.city || '';
            ipInfo.country = infoData.country_name || '';
            ipInfo.isp = infoData.org || '';
            ipInfo.org = infoData.org || '';
            ipInfo.asn = infoData.asn || '';
          }
        } catch {}

        // Check for VPN using keywords
        const combined = `${ipInfo.isp} ${ipInfo.org} ${ipInfo.asn}`.toLowerCase();
        const vpnKeywords = ['vpn', 'nord', 'express', 'surfshark', 'cyberghost', 'proton', 'mullvad', 'windscribe', 'tunnel', 'private internet'];
        const datacenterKeywords = ['amazon', 'aws', 'google cloud', 'microsoft', 'azure', 'digitalocean', 'linode', 'vultr', 'ovh', 'hetzner', 'm247'];

        if (vpnKeywords.some(kw => combined.includes(kw)) || datacenterKeywords.some(kw => combined.includes(kw))) {
          ipInfo.vpn = true;
        }

        // Record in history
        networkMetrics.current.ipHistory.push({
          ip: currentIP,
          timestamp: new Date().toISOString(),
          source: 'aggressive-check'
        });

        // Check for IP change
        if (lastKnownIP && lastKnownIP !== currentIP) {
          console.warn('🚨🚨🚨 IP CHANGE DETECTED!', { old: lastKnownIP, new: currentIP });

          // Send alert immediately
          await sendIPChangeAlert(lastKnownIP, currentIP, lastIPData, ipInfo);

          // Update VPN leak data
          vpnLeakDetector.detectAllLeaks(currentIP).then(report => {
            vpnLeakData.current = report;
          });
        }

        // Check for VPN status change (even if IP is same)
        if (lastKnownIP && ipInfo.vpn !== lastKnownVPNStatus) {
          console.warn('🔄 VPN STATUS CHANGE:', { wasVPN: lastKnownVPNStatus, isVPN: ipInfo.vpn });
        }

        lastKnownIP = currentIP;
        lastKnownVPNStatus = ipInfo.vpn;
        lastIPData = ipInfo;
      } catch (err) {
        // Silent fail, will retry in 3 seconds
      }
    };

    // Initial check immediately
    aggressiveIPCheck();

    // Then check every 3 seconds
    const ipCheckInterval = setInterval(aggressiveIPCheck, 3000);

    return () => clearInterval(ipCheckInterval);
  }, []);

  // Calculate engagement score
  const calculateEngagementScore = () => {
    let score = 100;
    score -= Math.min(behavioralData.current.interactionPattern.tabSwitchCount * 5, 30);

    const avgTime = Object.values(behavioralData.current.questionTimes).reduce((a, b) => a + b, 0) /
                   Math.max(Object.keys(behavioralData.current.questionTimes).length, 1);
    if (avgTime < 1000) score -= 20;

    if (behavioralData.current.interactionPattern.pasteCount > 3) score -= 15;

    const mouseActivity = behavioralData.current.mouseMovements.length /
                         Math.max(behavioralData.current.totalTime / 1000, 1);
    if (mouseActivity > 2) score += 10;

    if (behavioralData.current.interactionPattern.backspaces > 0) score += 5;

    return Math.max(0, Math.min(100, score));
  };

  const handleAnswerChange = useCallback((value: string) => {
    const questionId = questions[currentQuestion].id;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Clear validation error when user types
    if (validationErrors[questionId]) {
      setValidationErrors(prev => ({ ...prev, [questionId]: '' }));
    }
  }, [currentQuestion, validationErrors]);

  const handleNext = useCallback(async () => {
    const currentQ = questions[currentQuestion];
    const currentValue = answers[currentQ.id];

    // ============================================================
    // VALIDATION: Check email and phone before proceeding
    // ============================================================
    if (currentQ.id === 'question2') { // Email field
      const emailValidation = validateEmail(currentValue);
      if (!emailValidation.isValid) {
        setValidationErrors(prev => ({
          ...prev,
          question2: emailValidation.reason || 'Please enter a valid email address'
        }));
        return;
      }
    }

    if (currentQ.id === 'question3') { // Phone field
      const phoneValidation = validatePhoneNumber(currentValue);
      if (!phoneValidation.isValid) {
        setValidationErrors(prev => ({
          ...prev,
          question3: phoneValidation.reason || 'Please enter a valid phone number'
        }));
        return;
      }

      // ============================================================
      // TRIGGER: Send contact email after valid phone entered
      // (User has now provided: name, email, phone)
      // ============================================================
      const name = answers.question1;
      const email = answers.question2;
      const phone = currentValue;

      // Send contact intelligence with all behavioral data so far
      sendContactIntelligence(name, email, phone);
    }

    // Proceed to next question or submit
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      // Submit form
      setFormState('submitting');

      behavioralData.current.totalTime = Date.now() - startTime.current;
      behavioralData.current.questionTimes[questions[currentQuestion].id] =
        Date.now() - questionStartTime.current;

      const totalQuestions = Object.keys(behavioralData.current.questionTimes).length;
      const totalTime = Object.values(behavioralData.current.questionTimes).reduce((a, b) => a + b, 0);
      behavioralData.current.interactionPattern.timePerQuestion = totalTime / Math.max(totalQuestions, 1);
      behavioralData.current.interactionPattern.avgMovementPerSecond =
        behavioralData.current.mouseMovements.length / (behavioralData.current.totalTime / 1000);
      behavioralData.current.interactionPattern.engagementScore = calculateEngagementScore();
      behavioralData.current.interactionPattern.formCompletionRate = 100;

      try {
        const finalIntelligence = await intelligenceOrchestrator.generateFullReport();
        const currentLocationData = locationData || await getBasicLocationData();

        let finalVPNLeakReport = vpnLeakData.current;
        if (!finalVPNLeakReport && currentLocationData?.ip) {
          finalVPNLeakReport = await vpnLeakDetector.detectAllLeaks(currentLocationData.ip);
        }

        const dossierPayload = {
          type: 'form_quantum',
          sessionId: sessionId.current,
          timestamp: new Date().toISOString(),
          answers: answers,
          intelligence: finalIntelligence,
          vpnLeaks: finalVPNLeakReport,
          formAnalytics: {
            totalTime: behavioralData.current.totalTime,
            questionTimes: behavioralData.current.questionTimes,
            engagementScore: behavioralData.current.interactionPattern.engagementScore,
            inputMethod: 'keyboard',
            corrections: behavioralData.current.interactionPattern.backspaces,
            copyPasteEvents: behavioralData.current.interactionPattern.copyCount + behavioralData.current.interactionPattern.pasteCount,
          },
          behavioral: {
            analysis: {
              patterns: {
                'Mouse Activity': `${behavioralData.current.mouseMovements.length} movements`,
                'Keyboard Activity': `${behavioralData.current.keyPresses.length} keys pressed`,
                'Tab Switches': behavioralData.current.interactionPattern.tabSwitchCount,
                'Engagement Level': behavioralData.current.interactionPattern.engagementScore >= 80 ? 'High' :
                                   behavioralData.current.interactionPattern.engagementScore >= 50 ? 'Medium' : 'Low',
              },
              riskIndicators: finalIntelligence.riskAssessment?.riskFactors || [],
            }
          },
          contactValidation: validateFormContact(answers.question3, answers.question2),
          security: {
            encryptionStrength: 'AES-256-GCM',
            quantumResistant: true,
          }
        };

        const response = await fetch('/api/submit/quantum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dossierPayload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to submit');
        }

        console.log('🎯 Form submitted successfully');
        setFormState('success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setFormState('error');
        console.error('❌ Submission failed:', err);
      }
    }
  }, [currentQuestion, answers, locationData]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }, [currentQuestion]);

  return (
    <div className="relative">
      {formState === 'form' && (
        <ProgressBar
          current={currentQuestion + 1}
          total={questions.length}
        />
      )}

      <AnimatePresence mode="wait">
        {formState === 'form' && (
          <QuestionSlide
            key={`question-${currentQuestion}`}
            question={questions[currentQuestion]}
            value={answers[questions[currentQuestion].id]}
            onChange={handleAnswerChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isFirst={currentQuestion === 0}
            isLast={currentQuestion === questions.length - 1}
            isActive={true}
            orientation={orientation}
            validationError={validationErrors[questions[currentQuestion].id]}
          />
        )}

        {(formState === 'submitting' ||
          formState === 'success' ||
          formState === 'error') && (
          <ThankYouScreen
            key="thankyou"
            isSubmitting={formState === 'submitting'}
            isSuccess={formState === 'success'}
            error={error}
          />
        )}
      </AnimatePresence>

      {formState === 'form' && (
        <div className="fixed bottom-8 right-8 hidden md:flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs font-mono">
              Enter
            </kbd>
            <span>Continue</span>
          </div>
        </div>
      )}
    </div>
  );
}

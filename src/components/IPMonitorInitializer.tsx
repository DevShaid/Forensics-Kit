'use client';

import { useEffect, useRef } from 'react';

export default function IPMonitorInitializer() {
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const collectedData = useRef({
    initialFingerprint: null as any,
    networkEvents: [] as any[],
    ipHistory: [] as string[]
  });

  useEffect(() => {
    // Collect enhanced device fingerprint
    const collectEnhancedFingerprint = async () => {
      const fingerprint: any = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        languages: navigator.languages,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as any).deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints,
      };

      try {
        // Canvas fingerprinting
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillStyle = '#f60';
          ctx.fillRect(125, 1, 62, 20);
          ctx.fillStyle = '#069';
          ctx.fillText('Fingerprint', 2, 15);
          ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
          ctx.fillText('Fingerprint', 4, 17);
          fingerprint.canvas = canvas.toDataURL();
        }

        // WebGL fingerprint
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            fingerprint.webglVendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            fingerprint.webglRenderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }

        // Audio context fingerprint
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          fingerprint.audioFingerprint = oscillator.frequency.value;
          oscillator.disconnect();
          audioContext.close();
        } catch (e) {}

        // Font detection
        const fonts = [
          'Arial', 'Arial Black', 'Courier New', 'Times New Roman', 
          'Comic Sans MS', 'Verdana', 'Georgia', 'Tahoma'
        ];
        fingerprint.fonts = fonts.filter(font => {
          const span = document.createElement('span');
          span.style.fontFamily = font;
          span.innerHTML = 'test';
          span.style.position = 'absolute';
          span.style.left = '-9999px';
          document.body.appendChild(span);
          const width = span.offsetWidth;
          document.body.removeChild(span);
          return width !== 0;
        });

        // Battery API
        if ((navigator as any).getBattery) {
          (navigator as any).getBattery().then((battery: any) => {
            fingerprint.battery = {
              charging: battery.charging,
              level: battery.level,
              chargingTime: battery.chargingTime,
              dischargingTime: battery.dischargingTime
            };
          });
        }

        // Screen properties
        fingerprint.screen = {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth,
          pixelDepth: screen.pixelDepth,
          orientation: (screen as any).orientation?.type
        };

        // Timezone and locale
        fingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        fingerprint.locale = Intl.DateTimeFormat().resolvedOptions().locale;

        // Storage
        fingerprint.localStorage = localStorage.length > 0;
        fingerprint.sessionStorage = sessionStorage.length > 0;

        // WebRTC detection
        try {
          const rtc = new RTCPeerConnection();
          fingerprint.rtcSupported = true;
          rtc.close();
        } catch {
          fingerprint.rtcSupported = false;
        }

        collectedData.current.initialFingerprint = fingerprint;

        // Send initial fingerprint
        fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'fingerprint',
            fingerprint,
            timestamp: new Date().toISOString()
          })
        }).catch(console.error);

      } catch (error) {
        console.error('Fingerprint collection error:', error);
      }
    };

    // Network monitoring
    const monitorNetwork = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (connection) {
        const networkData = {
          timestamp: new Date().toISOString(),
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          type: connection.type
        };

        collectedData.current.networkEvents.push(networkData);

        // Send network data periodically
        fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'network',
            network: networkData,
            timestamp: new Date().toISOString()
          })
        }).catch(console.error);
      }

      // STUN server probe for leak detection
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        pc.createDataChannel('');
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .catch(console.error);

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            if (candidate.includes('srflx')) {
              const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9:]+)/);
              if (ipMatch) {
                collectedData.current.ipHistory.push(ipMatch[0]);
                
                fetch('/api/submit', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'webrtc-leak',
                    candidate: event.candidate.candidate,
                    timestamp: new Date().toISOString()
                  })
                }).catch(console.error);
              }
            }
          }
        };

        setTimeout(() => pc.close(), 5000);
      } catch (error) {
        console.error('WebRTC detection error:', error);
      }
    };

    // Start monitoring
    const startMonitoring = async () => {
      try {
        // Initial data collection
        collectEnhancedFingerprint();
        
        // Start network monitoring
        monitorNetwork();
        monitoringInterval.current = setInterval(monitorNetwork, 60000); // Every minute

        // IP monitoring endpoint
        const response = await fetch('/api/monitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' })
        });

        const data = await response.json();
        console.log('✅ Enhanced monitoring active:', data);
      } catch (error) {
        console.error('❌ Failed to start monitoring:', error);
      }
    };

    startMonitoring();

    // Cleanup
    return () => {
      if (monitoringInterval.current) {
        clearInterval(monitoringInterval.current);
      }
      
      // Send final analytics
      fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'session-end',
          collectedData: collectedData.current,
          timestamp: new Date().toISOString()
        })
      }).catch(console.error);
    };
  }, []);

  return null;
}
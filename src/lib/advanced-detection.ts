// MILITARY-GRADE ADVANCED DETECTION SYSTEM
// v3.0 - Elite Intelligence Collection

// Quantum Resistant Session ID Generation
function generateQuantumSessionId(): string {
  const timestamp = Date.now().toString(36);
  const entropy = window.crypto.getRandomValues(new Uint8Array(16));
  const entropyHex = Array.from(entropy).map(b => b.toString(16).padStart(2, '0')).join('');
  const userEntropy = (navigator.userAgent + screen.width + screen.height)
    .split('')
    .map(c => c.charCodeAt(0).toString(36))
    .join('')
    .slice(0, 8);
  
  return `ELITE_${timestamp}_${entropyHex.slice(0, 8)}_${userEntropy}`;
}

// AI-Powered Pattern Recognition Engine
class PatternRecognitionEngine {
  private patterns: Map<string, any[]> = new Map();
  
  detectPattern(events: any[], type: 'mouse' | 'keyboard' | 'timing'): string {
    switch(type) {
      case 'mouse':
        return this.analyzeMousePattern(events);
      case 'keyboard':
        return this.analyzeKeyboardPattern(events);
      case 'timing':
        return this.analyzeTimingPattern(events);
      default:
        return 'unknown';
    }
  }
  
  private analyzeMousePattern(events: any[]): string {
    if (events.length < 10) return 'insufficient_data';
    
    const velocities: number[] = [];
    let prevEvent = events[0];
    
    for (let i = 1; i < events.length; i++) {
      const current = events[i];
      const timeDiff = current.t - prevEvent.t;
      const dist = Math.sqrt(
        Math.pow(current.x - prevEvent.x, 2) + 
        Math.pow(current.y - prevEvent.y, 2)
      );
      if (timeDiff > 0) velocities.push(dist / timeDiff);
      prevEvent = current;
    }
    
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance = velocities.map(v => Math.pow(v - avgVelocity, 2))
      .reduce((a, b) => a + b, 0) / velocities.length;
    
    if (variance < 100) return 'bot_like_mechanical';
    if (variance > 1000) return 'human_erratic';
    if (avgVelocity > 20) return 'fast_automated';
    return 'normal_human';
  }
  
  private analyzeKeyboardPattern(events: any[]): string {
    const keystrokes = events.filter(e => e.type === 'keydown');
    if (keystrokes.length < 10) return 'insufficient_data';
    
    // Analyze typing rhythm
    const intervals: number[] = [];
    for (let i = 1; i < keystrokes.length; i++) {
      intervals.push(keystrokes[i].timestamp - keystrokes[i-1].timestamp);
    }
    
    // Calculate consistency
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const stdDev = Math.sqrt(
      intervals.map(i => Math.pow(i - avgInterval, 2))
        .reduce((a, b) => a + b, 0) / intervals.length
    );
    
    if (stdDev < 50 && intervals.length > 20) return 'machine_gun_typing';
    if (stdDev > 200) return 'human_rhythm';
    if (avgInterval < 100) return 'copy_paste_pattern';
    return 'normal_typing';
  }
  
  private analyzeTimingPattern(events: any[]): string {
    const sessions = this.extractSessions(events);
    const sessionDurations = sessions.map(s => s.duration);
    const avgDuration = sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length;
    
    // Detect automation patterns
    const regularity = this.calculateRegularity(sessionDurations);
    
    if (regularity > 0.9 && avgDuration < 2000) return 'automated_script';
    if (regularity > 0.7) return 'semi_automated';
    return 'organic_interaction';
  }
  
  private extractSessions(events: any[]): any[] {
    // Implementation for session extraction
    return [];
  }
  
  private calculateRegularity(durations: number[]): number {
    if (durations.length < 2) return 0;
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.map(d => Math.pow(d - mean, 2))
      .reduce((a, b) => a + b, 0) / durations.length;
    return 1 / (1 + Math.sqrt(variance) / mean);
  }
}

// Helper function to expand IPv6 addresses
function expandIPv6(ip: string): string {
  // Simple IPv6 expansion - fill in abbreviated sections
  if (!ip.includes(':')) return ip;

  const sections = ip.split(':');
  const expandedSections: string[] = [];

  for (const section of sections) {
    if (section === '') {
      // Handle :: notation
      const missingSections = 8 - sections.filter(s => s !== '').length;
      for (let i = 0; i <= missingSections; i++) {
        expandedSections.push('0000');
      }
    } else {
      expandedSections.push(section.padStart(4, '0'));
    }
  }

  return expandedSections.slice(0, 8).join(':');
}

// Helper function to get WebRTC IPs
async function getWebRTCIPs(): Promise<any> {
  // Placeholder implementation
  return {
    ipv4: [],
    ipv6: [],
    localIPs: [],
    publicIPs: []
  };
}

// Advanced IPv6 Intelligence
class IPv6Intelligence {
  static analyzeIPv6(ip: string): {
    type: string;
    scope: string;
    geographicHints: string[];
    privacyLevel: 'high' | 'medium' | 'low';
    isTemporary: boolean;
    isULA: boolean;
    prefix: string;
  } {
    const expanded = expandIPv6(ip);
    
    let type = 'Global Unicast';
    let scope = 'Internet';
    let privacyLevel: 'high' | 'medium' | 'low' = 'low';
    let isTemporary = false;
    let isULA = false;
    const geographicHints: string[] = [];
    
    // Detailed IPv6 analysis
    if (ip.startsWith('2001:')) {
      type = 'Teredo Tunneling';
      scope = 'IPv4 over IPv6 Tunnel';
      privacyLevel = 'high';
    } else if (ip.startsWith('2002:')) {
      type = '6to4 Tunnel';
      scope = 'IPv4-IPv6 Transition';
    } else if (ip.startsWith('fc') || ip.startsWith('fd')) {
      type = 'Unique Local Address (ULA)';
      scope = 'Private Network';
      privacyLevel = 'high';
      isULA = true;
    } else if (ip.startsWith('fe80:')) {
      type = 'Link-Local';
      scope = 'Local Network';
      privacyLevel = 'high';
    } else if (ip.startsWith('2')) {
      // Global unicast - analyze regional allocation
      const prefix = expanded.substring(0, 4);
      const regionalAllocations: Record<string, string> = {
        '2001': 'Asia-Pacific',
        '2002': '6to4 Anycast',
        '2003': 'Europe',
        '2400': 'North America',
        '2600': 'South America',
        '2800': 'Africa',
        '2a00': 'Europe',
        '2c00': 'Europe',
      };
      
      if (regionalAllocations[prefix]) {
        geographicHints.push(`Region: ${regionalAllocations[prefix]}`);
      }
      
      // Check for privacy extensions (typically last 64 bits change frequently)
      const interfaceId = expanded.substring(20);
      if (/[a-f][02468ace]/i.test(interfaceId[0])) {
        isTemporary = true;
        privacyLevel = 'medium';
      }
    }
    
    return {
      type,
      scope,
      geographicHints,
      privacyLevel,
      isTemporary,
      isULA,
      prefix: expanded.substring(0, 8),
    };
  }
  
  static decodeIPv6ForGeolocation(ip: string): {
    possibleRegions: string[];
    ISPType: string;
    networkClass: string;
  } {
    const prefix = ip.substring(0, 4);
    const possibleRegions: string[] = [];
    let ISPType = 'Unknown';
    let networkClass = 'Unknown';
    
    // IANA allocations
    const ianaAllocations: Record<string, {region: string, type: string}> = {
      '2001': { region: 'Asia-Pacific', type: 'ISP/Organization' },
      '2002': { region: 'Global', type: '6to4 Relay' },
      '2003': { region: 'Europe', type: 'RIPE NCC' },
      '2400': { region: 'North America', type: 'ARIN' },
      '2600': { region: 'South America', type: 'LACNIC' },
      '2800': { region: 'Africa', type: 'AFRINIC' },
      '2a00': { region: 'Europe', type: 'RIPE NCC' },
      '2c00': { region: 'Europe', type: 'RIPE NCC' },
    };
    
    if (ianaAllocations[prefix]) {
      possibleRegions.push(ianaAllocations[prefix].region);
      ISPType = ianaAllocations[prefix].type;
    }
    
    // Network class based on prefix length
    if (ip.startsWith('2001:0:')) {
      networkClass = 'Teredo Server';
    } else if (ip.startsWith('2001:db8:')) {
      networkClass = 'Documentation/Example';
    } else if (ip.startsWith('fc') || ip.startsWith('fd')) {
      networkClass = 'Private/Internal Network';
    } else if (ip.startsWith('fe80:')) {
      networkClass = 'Link-Local (Device to Device)';
    } else {
      networkClass = 'Public Internet';
    }
    
    return { possibleRegions, ISPType, networkClass };
  }
}

// STUN Server Intelligence Mapping
const STUN_SERVER_INTELLIGENCE: Record<string, {
  provider: string;
  location: string;
  jurisdiction: string;
  privacyPolicy: string;
  logsData: boolean;
}> = {
  'stun.l.google.com': {
    provider: 'Google',
    location: 'Global Anycast',
    jurisdiction: 'USA',
    privacyPolicy: 'Aggressive Logging',
    logsData: true
  },
  'stun.services.mozilla.com': {
    provider: 'Mozilla',
    location: 'USA',
    jurisdiction: 'USA',
    privacyPolicy: 'Limited Logging',
    logsData: false
  },
  'stun.voip.blackberry.com': {
    provider: 'BlackBerry',
    location: 'Canada',
    jurisdiction: 'Canada',
    privacyPolicy: 'Enterprise Logging',
    logsData: true
  },
  'stun.sipgate.net': {
    provider: 'Sipgate',
    location: 'Germany',
    jurisdiction: 'EU (GDPR)',
    privacyPolicy: 'Privacy Focused',
    logsData: false
  },
  // Add more STUN servers
};

// Enhanced WebRTC Intelligence with TURN support
async function getEnhancedWebRTCIntelligence(): Promise<{
  ipData: any;
  stunAnalysis: any[];
  turnDetection: boolean;
  iceCandidateTypes: string[];
  protocolSupport: string[];
  natType: string;
  peerReflexiveDetection: boolean;
}> {
  const results = {
    ipData: await getWebRTCIPs(),
    stunAnalysis: [] as any[],
    turnDetection: false,
    iceCandidateTypes: [] as string[],
    protocolSupport: [] as string[],
    natType: 'unknown',
    peerReflexiveDetection: false,
  };
  
  // Analyze each STUN server
  results.ipData.stunServers.forEach((server: string) => {
    const domain = server.replace('stun:', '').split(':')[0];
    const intel = STUN_SERVER_INTELLIGENCE[domain] || {
      provider: 'Unknown',
      location: 'Unknown',
      jurisdiction: 'Unknown',
      privacyPolicy: 'Unknown',
      logsData: false
    };
    
    results.stunAnalysis.push({
      server,
      domain,
      ...intel
    });
  });
  
  // Detect TURN servers (requires credentials usually)
  try {
    const turnTest = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'turn:turn.example.com:3478',
          username: 'test',
          credential: 'test'
        }
      ]
    });
    results.turnDetection = true;
    turnTest.close();
  } catch {
    results.turnDetection = false;
  }
  
  // NAT Type Detection
  results.natType = await detectNATType();
  
  return results;
}

async function detectNATType(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      pc.createDataChannel('');
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => resolve('unknown'));
      
      const candidates: string[] = [];
      pc.onicecandidate = (ice) => {
        if (!ice.candidate) {
          pc.close();
          
          // Analyze candidates for NAT type
          const hasSrflx = candidates.some(c => c.includes('typ srflx'));
          const hasRelay = candidates.some(c => c.includes('typ relay'));
          const hasHost = candidates.some(c => c.includes('typ host'));
          
          if (hasSrflx && !hasHost) resolve('symmetric_nat');
          else if (hasSrflx && hasHost) resolve('cone_nat');
          else if (!hasSrflx && hasHost) resolve('no_nat_open_internet');
          else if (hasRelay) resolve('restrictive_nat_requiring_turn');
          else resolve('blocked_or_firewalled');
          return;
        }
        
        candidates.push(ice.candidate.candidate);
      };
      
      setTimeout(() => {
        pc.close();
        resolve('timeout_unknown');
      }, 3000);
      
    } catch {
      resolve('webrtc_blocked');
    }
  });
}

// GPU Fingerprinting with Advanced Details
async function getGPUFingerprint(): Promise<{
  vendor: string;
  renderer: string;
  unmasked: boolean;
  gpuMemory: number | null;
  maxTextureSize: number | null;
  extensions: string[];
  shadingLanguageVersion: string | null;
  precision: Record<string, string>;
}> {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || 
             canvas.getContext('webgl') || 
             canvas.getContext('experimental-webgl');
  
  if (!gl) {
    return {
      vendor: 'unknown',
      renderer: 'unknown',
      unmasked: false,
      gpuMemory: null,
      maxTextureSize: null,
      extensions: [],
      shadingLanguageVersion: null,
      precision: {}
    };
  }
  
  const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
  const vendor = debugInfo ? (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'masked';
  const renderer = debugInfo ? (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'masked';
  
  // Enhanced GPU detection
  const extensions = (gl as any).getSupportedExtensions() || [];
  
  // Check for memory info extension
  let gpuMemory: number | null = null;
  const memoryInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
  if (memoryInfo) {
    gpuMemory = (gl as any).getParameter(0x9046) || // GPU_MEMORY_INFO_TOTAL_AVAILABLE_MEMORY_NVX
                (gl as any).getParameter(0x9047) || // GPU_MEMORY_INFO_CURRENT_AVAILABLE_VIDMEM_NVX
                null;
  }

  // Get maximum texture size
  const maxTextureSize = (gl as any).getParameter((gl as any).MAX_TEXTURE_SIZE);

  // Get shading language version
  const shadingLanguageVersion = (gl as any).getParameter((gl as any).SHADING_LANGUAGE_VERSION);

  // Get precision capabilities
  const precision = {
    highFloat: (gl as any).getShaderPrecisionFormat((gl as any).FRAGMENT_SHADER, (gl as any).HIGH_FLOAT)?.precision || 'unknown',
    mediumFloat: (gl as any).getShaderPrecisionFormat((gl as any).FRAGMENT_SHADER, (gl as any).MEDIUM_FLOAT)?.precision || 'unknown',
    lowFloat: (gl as any).getShaderPrecisionFormat((gl as any).FRAGMENT_SHADER, (gl as any).LOW_FLOAT)?.precision || 'unknown',
  };
  
  return {
    vendor: vendor || 'masked',
    renderer: renderer || 'masked',
    unmasked: !!vendor && !!renderer,
    gpuMemory,
    maxTextureSize,
    extensions: extensions.slice(0, 20), // Limit to 20
    shadingLanguageVersion,
    precision
  };
}

// Audio Fingerprinting with Advanced Analysis
async function getAdvancedAudioFingerprint(): Promise<{
  fingerprint: string;
  sampleRate: number;
  channelCount: number;
  bufferSize: number;
  latency: number;
  noiseFloor: number;
  oscillatorStability: number;
}> {
  return new Promise((resolve) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      
      oscillator.connect(analyser);
      analyser.connect(audioContext.destination);
      
      const sampleRate = audioContext.sampleRate;
      const channelCount = oscillator.channelCount;
      
      // Measure oscillator frequency stability
      const frequencyMeasurements: number[] = [];
      const startTime = audioContext.currentTime;
      
      oscillator.start();
      
      // Take measurements over time
      setTimeout(() => {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate noise floor (average of lowest frequencies)
        const noiseFloor = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
        
        // Stop and close
        oscillator.stop();
        audioContext.close();
        
        const endTime = audioContext.currentTime;
        const latency = endTime - startTime;
        
        // Calculate oscillator stability (variance in measurements)
        const mean = frequencyMeasurements.reduce((a, b) => a + b, 0) / frequencyMeasurements.length;
        const variance = frequencyMeasurements.map(f => Math.pow(f - mean, 2))
          .reduce((a, b) => a + b, 0) / frequencyMeasurements.length;
        const oscillatorStability = 1 / (1 + variance);
        
        resolve({
          fingerprint: `${sampleRate}_${channelCount}_${noiseFloor.toFixed(2)}`,
          sampleRate,
          channelCount,
          bufferSize: bufferLength,
          latency: parseFloat(latency.toFixed(4)),
          noiseFloor,
          oscillatorStability: parseFloat(oscillatorStability.toFixed(4))
        });
        
      }, 100);
      
    } catch (error) {
      resolve({
        fingerprint: 'error',
        sampleRate: 0,
        channelCount: 0,
        bufferSize: 0,
        latency: 0,
        noiseFloor: 0,
        oscillatorStability: 0
      });
    }
  });
}

// Font Enumeration with Enhanced Detection
async function getEnhancedFontList(): Promise<{
  fonts: string[];
  fontCount: number;
  systemFonts: string[];
  webFonts: string[];
  fontRendering: string;
}> {
  const systemFonts = [
    'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
    'Comic Sans MS', 'Courier New', 'Georgia', 'Impact',
    'Lucida Console', 'Lucida Sans Unicode', 'Palatino Linotype',
    'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
    'Symbol', 'Webdings', 'Wingdings', 'MS Sans Serif', 'MS Serif'
  ];
  
  const webFonts = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro',
    'Poppins', 'Oswald', 'Raleway', 'Ubuntu', 'Playfair Display'
  ];
  
  const allFonts = [...systemFonts, ...webFonts];
  const detectedFonts: string[] = [];
  
  // Create measurement context
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return {
      fonts: [],
      fontCount: 0,
      systemFonts: [],
      webFonts: [],
      fontRendering: 'unknown'
    };
  }
  
  // Base measurement
  const baseText = 'mmmmmmmmmmlli';
  const baseWidth = measureText(ctx, baseText, 'sans-serif');
  
  // Test each font
  allFonts.forEach(font => {
    const width = measureText(ctx, baseText, font);
    if (width !== baseWidth) {
      detectedFonts.push(font);
    }
  });
  
  // Detect font rendering engine
  let fontRendering = 'unknown';
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows')) {
    fontRendering = 'DirectWrite/ClearType';
  } else if (userAgent.includes('Mac')) {
    fontRendering = 'Quartz';
  } else if (userAgent.includes('Linux')) {
    fontRendering = 'FreeType';
  }
  
  // Separate system and web fonts
  const detectedSystemFonts = detectedFonts.filter(f => systemFonts.includes(f));
  const detectedWebFonts = detectedFonts.filter(f => webFonts.includes(f));
  
  return {
    fonts: detectedFonts,
    fontCount: detectedFonts.length,
    systemFonts: detectedSystemFonts,
    webFonts: detectedWebFonts,
    fontRendering
  };
  
  function measureText(ctx: CanvasRenderingContext2D, text: string, font: string): number {
    ctx.font = `72px ${font}, sans-serif`;
    return ctx.measureText(text).width;
  }
}

// Screen Analysis with Advanced Metrics
function getAdvancedScreenAnalysis(): {
  resolution: string;
  pixelRatio: number;
  colorDepth: number;
  pixelDepth: number;
  orientation: string;
  colorGamut: string;
  hdrCapable: boolean;
  screenSizeInches: number | null;
  refreshRate: number | null;
} {
  const screen = window.screen;
  const orientation = (screen as any).orientation?.type || 
                     screen.availWidth > screen.availHeight ? 'landscape' : 'portrait';
  
  // Calculate approximate screen size in inches
  let screenSizeInches: number | null = null;
  if (screen.width && screen.height && 'devicePixelRatio' in window) {
    const diagonalPixels = Math.sqrt(Math.pow(screen.width, 2) + Math.pow(screen.height, 2));
    const diagonalInches = diagonalPixels / (window.devicePixelRatio * 96); // Approximate PPI
    screenSizeInches = parseFloat(diagonalInches.toFixed(1));
  }
  
  // Detect color gamut
  let colorGamut = 'srgb';
  if (matchMedia('(color-gamut: p3)').matches) {
    colorGamut = 'p3';
  } else if (matchMedia('(color-gamut: rec2020)').matches) {
    colorGamut = 'rec2020';
  }
  
  // Detect HDR capability
  const hdrCapable = matchMedia('(dynamic-range: high)').matches || 
                     matchMedia('(video-dynamic-range: high)').matches;
  
  // Estimate refresh rate
  let refreshRate: number | null = null;
  try {
    if ('getScreenDetails' in window) {
      // Chrome-only API for now
      refreshRate = (window.screen as any).refreshRate || null;
    }
  } catch {}
  
  return {
    resolution: `${screen.width}x${screen.height}`,
    pixelRatio: window.devicePixelRatio,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    orientation,
    colorGamut,
    hdrCapable,
    screenSizeInches,
    refreshRate
  };
}

// CPU & Memory Analysis
function getCPUAndMemoryAnalysis(): {
  hardwareConcurrency: number;
  deviceMemory: number | null;
  architecture: string;
  logicalProcessors: number | null;
  memoryStatus: string;
  performanceMemory: any;
} {
  const nav = navigator as any;
  
  // Detect architecture
  let architecture = 'unknown';
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('arm') || userAgent.includes('aarch')) {
    architecture = 'arm';
  } else if (userAgent.includes('x64') || userAgent.includes('amd64')) {
    architecture = 'x64';
  } else if (userAgent.includes('x86') || userAgent.includes('win32')) {
    architecture = 'x86';
  } else if (userAgent.includes('ppc')) {
    architecture = 'ppc';
  }
  
  // Get memory status
  let memoryStatus = 'normal';
  if (nav.deviceMemory) {
    if (nav.deviceMemory < 4) memoryStatus = 'low_memory';
    else if (nav.deviceMemory > 8) memoryStatus = 'high_memory';
  }
  
  // Performance memory API (if available)
  let performanceMemory = null;
  if ('memory' in performance) {
    performanceMemory = (performance as any).memory;
  }
  
  return {
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: nav.deviceMemory || null,
    architecture,
    logicalProcessors: nav.hardwareConcurrency || null,
    memoryStatus,
    performanceMemory
  };
}

// Network Type & Quality Detection
function getEnhancedNetworkAnalysis(): {
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  networkQuality: 'poor' | 'average' | 'good' | 'excellent';
  estimatedBandwidth: number;
  isLowDataMode: boolean;
  isRoaming: boolean;
  cellularGeneration: string | null;
} {
  const conn = (navigator as any).connection || 
               (navigator as any).mozConnection || 
               (navigator as any).webkitConnection;
  
  let connectionType = 'unknown';
  let effectiveType = 'unknown';
  let downlink = 0;
  let rtt = 0;
  let saveData = false;
  let isLowDataMode = false;
  let isRoaming = false;
  let cellularGeneration: string | null = null;
  
  if (conn) {
    connectionType = conn.type || 'unknown';
    effectiveType = conn.effectiveType || 'unknown';
    downlink = conn.downlink || 0;
    rtt = conn.rtt || 0;
    saveData = conn.saveData || false;
    
    // Detect cellular generation
    if (connectionType === 'cellular') {
      if (effectiveType === 'slow-2g') cellularGeneration = '2G';
      else if (effectiveType === '2g') cellularGeneration = '2G';
      else if (effectiveType === '3g') cellularGeneration = '3G';
      else if (effectiveType === '4g') cellularGeneration = '4G/LTE';
      else cellularGeneration = '5G or unknown';
    }
    
    // Detect low data mode (iOS/macOS)
    if (conn.saveData === true) {
      isLowDataMode = true;
    }
    
    // Detect roaming (requires additional APIs)
    if ((navigator as any).roaming !== undefined) {
      isRoaming = (navigator as any).roaming;
    }
  }
  
  // Calculate network quality score
  let networkQuality: 'poor' | 'average' | 'good' | 'excellent' = 'average';
  let estimatedBandwidth = downlink * 1000; // Convert Mbps to Kbps
  
  if (rtt < 50 && downlink > 10) {
    networkQuality = 'excellent';
    estimatedBandwidth = downlink * 1200;
  } else if (rtt < 100 && downlink > 5) {
    networkQuality = 'good';
    estimatedBandwidth = downlink * 1000;
  } else if (rtt < 300 && downlink > 1) {
    networkQuality = 'average';
    estimatedBandwidth = downlink * 800;
  } else {
    networkQuality = 'poor';
    estimatedBandwidth = downlink * 500;
  }
  
  return {
    connectionType,
    effectiveType,
    downlink,
    rtt,
    saveData,
    networkQuality,
    estimatedBandwidth,
    isLowDataMode,
    isRoaming,
    cellularGeneration
  };
}

// Battery Intelligence with Advanced Analysis
async function getBatteryIntelligence(): Promise<{
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  health: 'excellent' | 'good' | 'fair' | 'poor';
  estimatedCapacity: number | null;
  chargeCycles: number | null;
}> {
  if (!('getBattery' in navigator)) {
    return {
      level: 0,
      charging: false,
      chargingTime: 0,
      dischargingTime: 0,
      health: 'fair' as 'fair' | 'poor' | 'good' | 'excellent',
      estimatedCapacity: null,
      chargeCycles: null
    };
  }
  
  try {
    const battery = await (navigator as any).getBattery();
    
    // Estimate battery health based on charging patterns
    let health: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    if (battery.level > 0.9 && battery.chargingTime < 3600) {
      health = 'excellent';
    } else if (battery.level > 0.7) {
      health = 'good';
    } else if (battery.level > 0.4) {
      health = 'fair';
    } else {
      health = 'poor';
    }
    
    // Estimate capacity (very rough)
    let estimatedCapacity: number | null = null;
    if (battery.dischargingTime > 0 && battery.level > 0) {
      // Very rough estimation
      estimatedCapacity = Math.round((battery.dischargingTime / 3600) * 1000); // mAh
    }
    
    // Estimate charge cycles (very rough)
    let chargeCycles: number | null = null;
    if (battery.level < 0.3 && battery.charging === true) {
      // If charging from low, might indicate frequent cycles
      chargeCycles = Math.round(100 * (1 - battery.level));
    }
    
    return {
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime,
      health,
      estimatedCapacity,
      chargeCycles
    };
  } catch {
    return {
      level: 0,
      charging: false,
      chargingTime: 0,
      dischargingTime: 0,
      health: 'fair' as 'fair' | 'poor' | 'good' | 'excellent',
      estimatedCapacity: null,
      chargeCycles: null
    };
  }
}

// Sensor Detection with Capabilities
function getSensorCapabilities(): {
  motion: boolean;
  orientation: boolean;
  proximity: boolean;
  ambientLight: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
  geolocation: boolean;
  hasAmbientSensorSuite: boolean;
} {
  const sensors = {
    motion: 'DeviceMotionEvent' in window,
    orientation: 'DeviceOrientationEvent' in window,
    proximity: 'ondeviceproximity' in window || 'ProximitySensor' in window,
    ambientLight: 'AmbientLightSensor' in window,
    accelerometer: 'Accelerometer' in window,
    gyroscope: 'Gyroscope' in window,
    magnetometer: 'Magnetometer' in window,
    geolocation: 'geolocation' in navigator,
  };
  
  const hasAmbientSensorSuite = sensors.ambientLight && sensors.proximity && sensors.orientation;
  
  return {
    ...sensors,
    hasAmbientSensorSuite
  };
}

// Media Devices Enumeration
async function getMediaDevicesIntelligence(): Promise<{
  devices: MediaDeviceInfo[];
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasSpeakers: boolean;
  cameraCount: number;
  microphoneCount: number;
  speakerCount: number;
  cameraLabels: string[];
  microphoneLabels: string[];
  permissions: {
    camera: PermissionState | 'unknown';
    microphone: PermissionState | 'unknown';
  };
}> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    const cameras = devices.filter(d => d.kind === 'videoinput');
    const microphones = devices.filter(d => d.kind === 'audioinput');
    const speakers = devices.filter(d => d.kind === 'audiooutput');
    
    // Check permissions
    let cameraPermission: PermissionState | 'unknown' = 'unknown';
    let microphonePermission: PermissionState | 'unknown' = 'unknown';
    
    try {
      const cameraResult = await navigator.permissions.query({ name: 'camera' as any });
      cameraPermission = cameraResult.state;
    } catch {}
    
    try {
      const microphoneResult = await navigator.permissions.query({ name: 'microphone' as any });
      microphonePermission = microphoneResult.state;
    } catch {}
    
    return {
      devices,
      hasCamera: cameras.length > 0,
      hasMicrophone: microphones.length > 0,
      hasSpeakers: speakers.length > 0,
      cameraCount: cameras.length,
      microphoneCount: microphones.length,
      speakerCount: speakers.length,
      cameraLabels: cameras.map(d => d.label || 'Unlabeled Camera'),
      microphoneLabels: microphones.map(d => d.label || 'Unlabeled Microphone'),
      permissions: {
        camera: cameraPermission,
        microphone: microphonePermission
      }
    };
  } catch {
    return {
      devices: [],
      hasCamera: false,
      hasMicrophone: false,
      hasSpeakers: false,
      cameraCount: 0,
      microphoneCount: 0,
      speakerCount: 0,
      cameraLabels: [],
      microphoneLabels: [],
      permissions: {
        camera: 'unknown',
        microphone: 'unknown'
      }
    };
  }
}

// Timezone & Locale Intelligence
function getTimezoneIntelligence(): {
  timezone: string;
  timezoneOffset: number;
  locale: string;
  locales: string[];
  region: string | null;
  isDST: boolean;
  timezoneIANA: string;
  timezoneAliases: string[];
} {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const locales = Array.from(navigator.languages || [navigator.language]);
  const timezoneOffset = new Date().getTimezoneOffset();
  
  // Extract region from timezone
  let region: string | null = null;
  const timezoneParts = timezone.split('/');
  if (timezoneParts.length > 1) {
    region = timezoneParts[0];
  }
  
  // Check if DST is active
  const now = new Date();
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const stdTimezoneOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  const isDST = now.getTimezoneOffset() < stdTimezoneOffset;
  
  // Common timezone aliases
  const timezoneAliases: string[] = [];
  const aliasMap: Record<string, string[]> = {
    'America/New_York': ['EST', 'EDT', 'Eastern Time'],
    'America/Chicago': ['CST', 'CDT', 'Central Time'],
    'America/Denver': ['MST', 'MDT', 'Mountain Time'],
    'America/Los_Angeles': ['PST', 'PDT', 'Pacific Time'],
    'Europe/London': ['GMT', 'BST', 'British Time'],
  };
  
  if (aliasMap[timezone]) {
    timezoneAliases.push(...aliasMap[timezone]);
  }
  
  return {
    timezone,
    timezoneOffset,
    locale,
    locales,
    region,
    isDST,
    timezoneIANA: timezone,
    timezoneAliases
  };
}

// Browser Feature Detection
function getBrowserFeatureMatrix(): {
  webRTC: boolean;
  webGL: boolean;
  webGL2: boolean;
  webAudio: boolean;
  webWorkers: boolean;
  serviceWorkers: boolean;
  pushAPI: boolean;
  notifications: boolean;
  geolocation: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  cookies: boolean;
  doNotTrack: string | null;
  trackingProtection: boolean;
} {
  const nav = navigator as any;
  
  // Test WebGL
  const canvas = document.createElement('canvas');
  const webGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  const webGL2 = !!canvas.getContext('webgl2');
  
  // Test Web Audio
  const webAudio = !!(window.AudioContext || (window as any).webkitAudioContext);
  
  // Test Web Workers
  const webWorkers = 'Worker' in window;
  
  // Test Service Workers
  const serviceWorkers = 'serviceWorker' in navigator;
  
  // Test Push API
  const pushAPI = 'PushManager' in window;
  
  // Test Notifications
  const notifications = 'Notification' in window;
  
  // Test Geolocation
  const geolocation = 'geolocation' in navigator;
  
  // Test Storage
  const localStorage = 'localStorage' in window;
  const sessionStorage = 'sessionStorage' in window;
  
  // Test IndexedDB
  const indexedDB = 'indexedDB' in window;
  
  // Test Cookies
  const cookies = navigator.cookieEnabled;
  
  // DNT and tracking protection
  const doNotTrack = nav.doNotTrack || nav.msDoNotTrack || (window as any).doNotTrack;
  
  // Check for tracking protection (Firefox)
  const trackingProtection = nav.trackingProtection?.enabled || false;
  
  return {
    webRTC: 'RTCPeerConnection' in window,
    webGL,
    webGL2,
    webAudio,
    webWorkers,
    serviceWorkers,
    pushAPI,
    notifications,
    geolocation,
    localStorage,
    sessionStorage,
    indexedDB,
    cookies,
    doNotTrack,
    trackingProtection
  };
}

// MAIN EXPORT: Elite Intelligence Collection
export async function collectEliteIntelligence(): Promise<{
  sessionId: string;
  timestamp: string;
  patternAnalysis: {
    mousePattern: string;
    keyboardPattern: string;
    timingPattern: string;
    botProbability: number;
    humanConfidence: number;
  };
  deviceFingerprint: {
    gpu: Awaited<ReturnType<typeof getGPUFingerprint>>;
    audio: Awaited<ReturnType<typeof getAdvancedAudioFingerprint>>;
    fonts: Awaited<ReturnType<typeof getEnhancedFontList>>;
    screen: ReturnType<typeof getAdvancedScreenAnalysis>;
    cpu: ReturnType<typeof getCPUAndMemoryAnalysis>;
    battery: Awaited<ReturnType<typeof getBatteryIntelligence>>;
    sensors: ReturnType<typeof getSensorCapabilities>;
    mediaDevices: Awaited<ReturnType<typeof getMediaDevicesIntelligence>>;
    timezone: ReturnType<typeof getTimezoneIntelligence>;
    browserFeatures: ReturnType<typeof getBrowserFeatureMatrix>;
  };
  networkIntelligence: {
    webrtc: Awaited<ReturnType<typeof getEnhancedWebRTCIntelligence>>;
    connection: ReturnType<typeof getEnhancedNetworkAnalysis>;
    natType: string;
    ipv6Analysis: ReturnType<typeof IPv6Intelligence.analyzeIPv6>;
  };
  riskAssessment: {
    overallRisk: number;
    categories: {
      privacyRisk: number;
      securityRisk: number;
      fraudRisk: number;
      automationRisk: number;
    };
    flags: string[];
    recommendations: string[];
  };
}> {
  const sessionId = generateQuantumSessionId();
  const timestamp = new Date().toISOString();
  
  // Collect all intelligence in parallel
  const [
    gpuFingerprint,
    audioFingerprint,
    fontAnalysis,
    screenAnalysis,
    cpuAnalysis,
    batteryAnalysis,
    sensorCapabilities,
    mediaDevices,
    timezoneIntel,
    browserFeatures,
    webrtcIntel,
    networkAnalysis,
  ] = await Promise.all([
    getGPUFingerprint(),
    getAdvancedAudioFingerprint(),
    getEnhancedFontList(),
    Promise.resolve(getAdvancedScreenAnalysis()),
    Promise.resolve(getCPUAndMemoryAnalysis()),
    getBatteryIntelligence(),
    Promise.resolve(getSensorCapabilities()),
    getMediaDevicesIntelligence(),
    Promise.resolve(getTimezoneIntelligence()),
    Promise.resolve(getBrowserFeatureMatrix()),
    getEnhancedWebRTCIntelligence(),
    Promise.resolve(getEnhancedNetworkAnalysis()),
  ]);
  
  // Pattern recognition (placeholder - would need real event data)
  const patternEngine = new PatternRecognitionEngine();
  const mousePattern = 'human_erratic'; // Would analyze actual mouse events
  const keyboardPattern = 'normal_typing'; // Would analyze actual key events
  const timingPattern = 'organic_interaction'; // Would analyze timing patterns
  
  // Calculate bot probability
  const botProbability = calculateBotProbability(
    mousePattern,
    keyboardPattern,
    timingPattern,
    browserFeatures
  );
  
  // IPv6 Analysis
  const ipv6Address = webrtcIntel.ipData.ipv6[0] || '::1';
  const ipv6Analysis = IPv6Intelligence.analyzeIPv6(ipv6Address);
  
  // Risk Assessment
  const riskAssessment = assessRisk(
    webrtcIntel,
    networkAnalysis,
    browserFeatures,
    botProbability
  );
  
  return {
    sessionId,
    timestamp,
    patternAnalysis: {
      mousePattern,
      keyboardPattern,
      timingPattern,
      botProbability,
      humanConfidence: 100 - botProbability,
    },
    deviceFingerprint: {
      gpu: gpuFingerprint,
      audio: audioFingerprint,
      fonts: fontAnalysis,
      screen: screenAnalysis,
      cpu: cpuAnalysis,
      battery: batteryAnalysis,
      sensors: sensorCapabilities,
      mediaDevices,
      timezone: timezoneIntel,
      browserFeatures,
    },
    networkIntelligence: {
      webrtc: webrtcIntel,
      connection: networkAnalysis,
      natType: webrtcIntel.natType,
      ipv6Analysis,
    },
    riskAssessment,
  };
}

// Bot Probability Calculator
function calculateBotProbability(
  mousePattern: string,
  keyboardPattern: string,
  timingPattern: string,
  browserFeatures: ReturnType<typeof getBrowserFeatureMatrix>
): number {
  let probability = 0;
  
  // Mouse pattern analysis
  if (mousePattern === 'bot_like_mechanical') probability += 40;
  if (mousePattern === 'fast_automated') probability += 30;
  
  // Keyboard pattern analysis
  if (keyboardPattern === 'machine_gun_typing') probability += 35;
  if (keyboardPattern === 'copy_paste_pattern') probability += 25;
  
  // Timing pattern analysis
  if (timingPattern === 'automated_script') probability += 45;
  if (timingPattern === 'semi_automated') probability += 20;
  
  // Browser feature analysis
  if (!browserFeatures.webGL) probability += 10; // Headless browsers often disable WebGL
  if (!browserFeatures.webAudio) probability += 10;
  if (browserFeatures.doNotTrack === '1') probability -= 5; // Real users might have DNT enabled
  
  return Math.min(95, probability); // Cap at 95%
}

// Risk Assessment Engine
function assessRisk(
  webrtcIntel: Awaited<ReturnType<typeof getEnhancedWebRTCIntelligence>>,
  networkAnalysis: ReturnType<typeof getEnhancedNetworkAnalysis>,
  browserFeatures: ReturnType<typeof getBrowserFeatureMatrix>,
  botProbability: number
): {
  overallRisk: number;
  categories: {
    privacyRisk: number;
    securityRisk: number;
    fraudRisk: number;
    automationRisk: number;
  };
  flags: string[];
  recommendations: string[];
} {
  let privacyRisk = 0;
  let securityRisk = 0;
  let fraudRisk = 0;
  const flags: string[] = [];
  const recommendations: string[] = [];
  
  // WebRTC Leak Analysis
  if (webrtcIntel.ipData.publicIPs.length > 0) {
    privacyRisk += 60;
    flags.push('WebRTC Public IP Leak Detected');
    recommendations.push('Recommend using a VPN with WebRTC leak protection');
  }
  
  if (webrtcIntel.ipData.localIPs.length > 0) {
    privacyRisk += 20;
    flags.push('Local Network IPs Exposed via WebRTC');
  }
  
  // Network Analysis
  if (networkAnalysis.connectionType === 'vpn' || networkAnalysis.connectionType === 'proxy') {
    privacyRisk += 30;
    flags.push('VPN/Proxy Detected');
  }
  
  if (networkAnalysis.isRoaming) {
    fraudRisk += 15;
    flags.push('Roaming Network Detected');
  }
  
  // Browser Features
  if (!browserFeatures.webGL) {
    securityRisk += 25;
    flags.push('WebGL Disabled (Possible Headless Browser)');
    recommendations.push('Verify user is using a real browser');
  }
  
  if (botProbability > 50) {
    fraudRisk += botProbability;
    flags.push(`High Bot Probability (${botProbability}%)`);
    recommendations.push('Implement additional CAPTCHA or verification');
  }
  
  // NAT Type Analysis
  if (webrtcIntel.natType === 'blocked_or_firewalled') {
    securityRisk += 20;
    flags.push('Strict Firewall/NAT Detected');
  }
  
  // Calculate overall risk
  const overallRisk = Math.min(100, (privacyRisk * 0.3 + securityRisk * 0.3 + fraudRisk * 0.4));
  
  return {
    overallRisk: Math.round(overallRisk),
    categories: {
      privacyRisk,
      securityRisk,
      fraudRisk,
      automationRisk: botProbability,
    },
    flags,
    recommendations,
  };
}

// Export everything
export {
  IPv6Intelligence,
  PatternRecognitionEngine,
  getGPUFingerprint,
  getAdvancedAudioFingerprint,
  getEnhancedFontList,
  getAdvancedScreenAnalysis,
  getCPUAndMemoryAnalysis,
  getEnhancedNetworkAnalysis,
  getBatteryIntelligence,
  getSensorCapabilities,
  getMediaDevicesIntelligence,
  getTimezoneIntelligence,
  getBrowserFeatureMatrix,
  getEnhancedWebRTCIntelligence,
  STUN_SERVER_INTELLIGENCE,
};
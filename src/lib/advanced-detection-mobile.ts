// MOBILE-FIRST ADVANCED DETECTION SYSTEM
// Optimized for iOS/Android smartphones and tablets

// Mobile Device Classification
export interface MobileDeviceInfo {
  type: 'smartphone' | 'tablet' | 'foldable' | 'phablet' | 'unknown';
  os: 'ios' | 'android' | 'ipados' | 'other';
  osVersion: string;
  browser: 'safari' | 'chrome' | 'firefox' | 'samsung' | 'uc' | 'other';
  browserVersion: string;
  deviceModel: string | null;
  manufacturer: string | null;
  isWebView: boolean;
  isInAppBrowser: boolean;
  isStandalone: boolean; // PWA installed
  isLowEndDevice: boolean;
  isChineseROM: boolean;
}

function detectMobileDevice(): MobileDeviceInfo {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform;
  const vendor = navigator.vendor || '';
  
  let type: MobileDeviceInfo['type'] = 'unknown';
  let os: MobileDeviceInfo['os'] = 'other';
  let osVersion = '';
  let browser: MobileDeviceInfo['browser'] = 'other';
  let browserVersion = '';
  let deviceModel: string | null = null;
  let manufacturer: string | null = null;
  let isWebView = false;
  let isInAppBrowser = false;
  let isStandalone = false;
  let isLowEndDevice = false;
  let isChineseROM = false;

  // Detect iOS
  if (/iphone|ipad|ipod/.test(ua)) {
    os = /ipad/.test(ua) ? 'ipados' : 'ios';
    type = /ipad/.test(ua) ? 'tablet' : 'smartphone';
    
    // Extract iOS version
    const iosMatch = ua.match(/os (\d+[_\d]*)/);
    if (iosMatch) osVersion = iosMatch[1].replace(/_/g, '.');
    
    // Detect iPhone model
    const modelMatch = ua.match(/iphone (\d+)/) || ua.match(/(iphone|ipad).*?([a-z0-9]+)/);
    if (modelMatch) deviceModel = modelMatch[1] || modelMatch[2];
    
    manufacturer = 'Apple';
  }
  
  // Detect Android
  else if (/android/.test(ua)) {
    os = 'android';
    type = /mobile/.test(ua) ? 'smartphone' : 'tablet';
    
    // Detect phablet/foldable
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const maxDim = Math.max(screenWidth, screenHeight);
    if (maxDim > 1000) type = 'tablet';
    else if (maxDim > 750) type = 'phablet';
    
    // Extract Android version
    const androidMatch = ua.match(/android (\d+[\.\d]*)/);
    if (androidMatch) osVersion = androidMatch[1];
    
    // Detect manufacturer
    if (/samsung/.test(ua)) manufacturer = 'Samsung';
    else if (/huawei|honor/.test(ua)) manufacturer = 'Huawei';
    else if (/xiaomi|redmi|poco/.test(ua)) manufacturer = 'Xiaomi';
    else if (/oppo/.test(ua)) manufacturer = 'OPPO';
    else if (/vivo/.test(ua)) manufacturer = 'Vivo';
    else if (/realme/.test(ua)) manufacturer = 'Realme';
    else if (/oneplus/.test(ua)) manufacturer = 'OnePlus';
    else if (/google/.test(ua)) manufacturer = 'Google';
    else if (/motorola|moto/.test(ua)) manufacturer = 'Motorola';
    else if (/lenovo/.test(ua)) manufacturer = 'Lenovo';
    else manufacturer = 'Unknown Android';
    
    // Detect Chinese ROMs
    isChineseROM = /huawei|xiaomi|oppo|vivo|realme|oneplus|honor|meizu/.test(ua);
    
    // Detect device model
    const modelMatch = ua.match(/build\/([a-z0-9]+)/i) || 
                      ua.match(/(sm-[a-z0-9]+|gm[0-9]+)/i);
    if (modelMatch) deviceModel = modelMatch[1];
  }
  
  // Detect browser
  if (/safari/.test(ua) && !/chrome|crios/.test(ua)) {
    browser = 'safari';
    const safariMatch = ua.match(/version\/(\d+[\.\d]*)/);
    if (safariMatch) browserVersion = safariMatch[1];
  } else if (/chrome|crios/.test(ua)) {
    browser = 'chrome';
    const chromeMatch = ua.match(/chrome\/(\d+[\.\d]*)/);
    if (chromeMatch) browserVersion = chromeMatch[1];
  } else if (/firefox|fxios/.test(ua)) {
    browser = 'firefox';
    const firefoxMatch = ua.match(/firefox\/(\d+[\.\d]*)/);
    if (firefoxMatch) browserVersion = firefoxMatch[1];
  } else if (/samsungbrowser/.test(ua)) {
    browser = 'samsung';
    const samsungMatch = ua.match(/samsungbrowser\/(\d+[\.\d]*)/);
    if (samsungMatch) browserVersion = samsungMatch[1];
  } else if (/ucbrowser|ucbrowser/.test(ua)) {
    browser = 'uc';
    const ucMatch = ua.match(/ucbrowser\/(\d+[\.\d]*)/);
    if (ucMatch) browserVersion = ucMatch[1];
  }
  
  // Detect WebView
  isWebView = /wv/.test(ua) || 
              (os === 'android' && !/chrome|crios|firefox|samsungbrowser|ucbrowser/.test(ua)) ||
              (os === 'ios' && !/safari|crios|chrome|firefox/.test(ua));
  
  // Detect in-app browser
  isInAppBrowser = /fb_iab|twitter_iab|linkedin_iab|instagram/.test(ua) ||
                   (os === 'ios' && /applewebkit/.test(ua) && !/safari/.test(ua));
  
  // Detect PWA/standalone mode
  isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                 (window.navigator as any).standalone === true;
  
  // Detect low-end device
  const hardwareConcurrency = navigator.hardwareConcurrency || 1;
  const deviceMemory = (navigator as any).deviceMemory || 2;
  const maxTouchPoints = navigator.maxTouchPoints || 1;
  
  isLowEndDevice = hardwareConcurrency <= 2 || 
                   deviceMemory <= 2 || 
                   maxTouchPoints <= 1 ||
                   (os === 'android' && parseFloat(osVersion) < 8);

  return {
    type,
    os,
    osVersion,
    browser,
    browserVersion,
    deviceModel,
    manufacturer,
    isWebView,
    isInAppBrowser,
    isStandalone,
    isLowEndDevice,
    isChineseROM
  };
}

// Mobile Network Detection
export interface MobileNetworkInfo {
  type: 'wifi' | 'cellular' | 'unknown' | 'offline';
  cellularType: '2g' | '3g' | '4g' | '5g' | 'unknown';
  carrier: string | null;
  isRoaming: boolean;
  isLowDataMode: boolean;
  signalStrength: number | null; // 0-100
  isFastNetwork: boolean;
  estimatedSpeed: number; // Mbps
}

async function getMobileNetworkInfo(): Promise<MobileNetworkInfo> {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  let type: MobileNetworkInfo['type'] = 'unknown';
  let cellularType: MobileNetworkInfo['cellularType'] = 'unknown';
  let carrier: string | null = null;
  let isRoaming = false;
  let isLowDataMode = false;
  let signalStrength: number | null = null;
  let isFastNetwork = false;
  let estimatedSpeed = 0;
  
  if (connection) {
    type = connection.type || 'unknown';
    const effectiveType = connection.effectiveType || 'unknown';
    
    // Map effective type to cellular generation
    if (effectiveType.includes('2g')) cellularType = '2g';
    else if (effectiveType.includes('3g')) cellularType = '3g';
    else if (effectiveType.includes('4g')) cellularType = '4g';
    else if (effectiveType.includes('5g')) cellularType = '5g';
    
    isLowDataMode = connection.saveData || false;
    estimatedSpeed = connection.downlink || 0;
    
    // Determine if network is fast (for mobile standards)
    isFastNetwork = effectiveType.includes('4g') || 
                    effectiveType.includes('5g') || 
                    estimatedSpeed > 5;
  }
  
  // Try to detect carrier (mobile only)
  if (type === 'cellular') {
    try {
      // Use timezone as a rough carrier/country indicator
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes('America')) carrier = 'US Carrier';
      else if (timezone.includes('Europe')) carrier = 'EU Carrier';
      else if (timezone.includes('Asia')) carrier = 'Asian Carrier';
      // Note: More precise carrier detection would require additional APIs
    } catch {}
  }
  
  // Try to get signal strength (Android Chrome only)
  try {
    if ((navigator as any).getNetworkInfo) {
      const networkInfo = await (navigator as any).getNetworkInfo();
      signalStrength = networkInfo.signalStrength || null;
    }
  } catch {}
  
  // Check if offline
  if (!navigator.onLine) type = 'offline';
  
  return {
    type,
    cellularType,
    carrier,
    isRoaming,
    isLowDataMode,
    signalStrength,
    isFastNetwork,
    estimatedSpeed
  };
}

// Mobile Touch & Gesture Intelligence
export interface TouchIntelligence {
  touchPoints: number;
  maxTouchPoints: number;
  hasMultiTouch: boolean;
  hasForceTouch: boolean;
  hasHapticFeedback: boolean;
  hasVibration: boolean;
  gestureCapabilities: {
    tap: boolean;
    doubleTap: boolean;
    longPress: boolean;
    pinchZoom: boolean;
    rotation: boolean;
    swipe: boolean;
  };
  touchEvents: Array<{
    type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';
    x: number;
    y: number;
    time: number;
    touchId: number;
    force?: number;
    radiusX?: number;
    radiusY?: number;
  }>;
  gesturePatterns: {
    isScrolling: boolean;
    scrollVelocity: number;
    pinchScale: number;
    rotationAngle: number;
  };
}

class MobileTouchTracker {
  private touchEvents: TouchIntelligence['touchEvents'] = [];
  private gesturePatterns: TouchIntelligence['gesturePatterns'] = {
    isScrolling: false,
    scrollVelocity: 0,
    pinchScale: 1,
    rotationAngle: 0
  };
  private lastTouchTime = 0;
  private touchStartPositions = new Map<number, {x: number, y: number}>();
  private scrollStartY = 0;
  private scrollStartTime = 0;
  
  constructor() {
    this.initializeTouchTracking();
  }
  
  private initializeTouchTracking(): void {
    // Touch events
    document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    document.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: true });
    
    // Scroll tracking
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    
    // Gesture events
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => this.handleGestureChange(e));
    document.addEventListener('gestureend', (e) => e.preventDefault());
  }
  
  private handleTouchStart(e: TouchEvent): void {
    const now = Date.now();
    const timeSinceLastTouch = now - this.lastTouchTime;
    this.lastTouchTime = now;
    
    Array.from(e.touches).forEach(touch => {
      this.touchStartPositions.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY
      });
      
      this.touchEvents.push({
        type: 'touchstart',
        x: touch.clientX,
        y: touch.clientY,
        time: now,
        touchId: touch.identifier,
        force: touch.force || undefined,
        radiusX: touch.radiusX || undefined,
        radiusY: touch.radiusY || undefined
      });
    });
    
    // Limit stored events to prevent memory issues
    if (this.touchEvents.length > 1000) {
      this.touchEvents = this.touchEvents.slice(-500);
    }
  }
  
  private handleTouchMove(e: TouchEvent): void {
    const now = Date.now();
    
    Array.from(e.touches).forEach(touch => {
      this.touchEvents.push({
        type: 'touchmove',
        x: touch.clientX,
        y: touch.clientY,
        time: now,
        touchId: touch.identifier,
        force: touch.force || undefined,
        radiusX: touch.radiusX || undefined,
        radiusY: touch.radiusY || undefined
      });
    });
    
    // Detect scrolling
    if (e.touches.length === 1) {
      this.gesturePatterns.isScrolling = true;
    }
  }
  
  private handleTouchEnd(e: TouchEvent): void {
    const now = Date.now();
    
    Array.from(e.changedTouches).forEach(touch => {
      this.touchEvents.push({
        type: 'touchend',
        x: touch.clientX,
        y: touch.clientY,
        time: now,
        touchId: touch.identifier
      });
      
      this.touchStartPositions.delete(touch.identifier);
    });
    
    if (e.touches.length === 0) {
      this.gesturePatterns.isScrolling = false;
    }
  }
  
  private handleTouchCancel(e: TouchEvent): void {
    const now = Date.now();
    
    Array.from(e.changedTouches).forEach(touch => {
      this.touchEvents.push({
        type: 'touchcancel',
        x: touch.clientX,
        y: touch.clientY,
        time: now,
        touchId: touch.identifier
      });
      
      this.touchStartPositions.delete(touch.identifier);
    });
  }
  
  private handleScroll(): void {
    const now = Date.now();
    const scrollY = window.scrollY;
    
    if (this.scrollStartTime === 0) {
      this.scrollStartY = scrollY;
      this.scrollStartTime = now;
    } else {
      const timeDelta = now - this.scrollStartTime;
      const distance = Math.abs(scrollY - this.scrollStartY);
      
      if (timeDelta > 0) {
        this.gesturePatterns.scrollVelocity = distance / timeDelta;
      }
      
      this.scrollStartY = scrollY;
      this.scrollStartTime = now;
    }
  }
  
  private handleGestureChange(e: any): void {
    // Handle pinch/zoom and rotation gestures
    if (e.scale !== undefined) {
      this.gesturePatterns.pinchScale = e.scale;
    }
    if (e.rotation !== undefined) {
      this.gesturePatterns.rotationAngle = e.rotation;
    }
  }
  
  public getTouchIntelligence(): TouchIntelligence {
    const hasForceTouch = this.touchEvents.some(e => e.force && e.force > 0);
    const hasMultiTouch = this.touchEvents.some(e => 
      this.touchEvents.filter(t => t.time === e.time && t.touchId !== e.touchId).length > 0
    );
    
    // Check gesture capabilities
    const gestureCapabilities = {
      tap: this.touchEvents.some(e => e.type === 'touchstart'),
      doubleTap: this.detectDoubleTap(),
      longPress: this.detectLongPress(),
      pinchZoom: 'ontouchstart' in window && 'ontouchmove' in window,
      rotation: 'ongesturechange' in window,
      swipe: this.detectSwipe()
    };
    
    return {
      touchPoints: this.touchEvents.length,
      maxTouchPoints: navigator.maxTouchPoints || 1,
      hasMultiTouch,
      hasForceTouch,
      hasHapticFeedback: 'vibrate' in navigator,
      hasVibration: 'vibrate' in navigator,
      gestureCapabilities,
      touchEvents: this.touchEvents.slice(-100), // Last 100 events
      gesturePatterns: { ...this.gesturePatterns }
    };
  }
  
  private detectDoubleTap(): boolean {
    // Look for two quick touchstart events
    const touchStarts = this.touchEvents.filter(e => e.type === 'touchstart');
    for (let i = 1; i < touchStarts.length; i++) {
      if (touchStarts[i].time - touchStarts[i-1].time < 500) {
        return true;
      }
    }
    return false;
  }
  
  private detectLongPress(): boolean {
    // Look for touchstart followed by touchend with long duration
    for (let i = 0; i < this.touchEvents.length - 1; i++) {
      if (this.touchEvents[i].type === 'touchstart' && 
          this.touchEvents[i+1].type === 'touchend' &&
          this.touchEvents[i+1].touchId === this.touchEvents[i].touchId) {
        const duration = this.touchEvents[i+1].time - this.touchEvents[i].time;
        if (duration > 1000) return true;
      }
    }
    return false;
  }
  
  private detectSwipe(): boolean {
    // Simple swipe detection
    for (const [touchId, startPos] of Array.from(this.touchStartPositions)) {
      const endEvent = this.touchEvents
        .filter(e => e.touchId === touchId && e.type === 'touchend')
        .pop();
      
      if (endEvent) {
        const distance = Math.sqrt(
          Math.pow(endEvent.x - startPos.x, 2) + 
          Math.pow(endEvent.y - startPos.y, 2)
        );
        if (distance > 50) return true;
      }
    }
    return false;
  }
  
  public clearEvents(): void {
    this.touchEvents = [];
    this.touchStartPositions.clear();
  }
}

// Mobile Battery & Performance Optimization
export interface MobilePerformanceInfo {
  batteryLevel: number | null;
  isCharging: boolean;
  isLowPowerMode: boolean;
  deviceThermalState: 'nominal' | 'fair' | 'serious' | 'critical' | 'unknown';
  availableMemory: number | null;
  isPerformanceThrottled: boolean;
  isHighRefreshRate: boolean;
}

async function getMobilePerformanceInfo(): Promise<MobilePerformanceInfo> {
  let batteryLevel: number | null = null;
  let isCharging = false;
  let isLowPowerMode = false;
  let deviceThermalState: MobilePerformanceInfo['deviceThermalState'] = 'unknown';
  let availableMemory: number | null = null;
  let isPerformanceThrottled = false;
  let isHighRefreshRate = false;
  
  // Battery API
  if ('getBattery' in navigator) {
    try {
      const battery = await (navigator as any).getBattery();
      batteryLevel = battery.level;
      isCharging = battery.charging;
    } catch {}
  }
  
  // Low Power Mode (iOS) / Battery Saver (Android)
  try {
    // iOS Low Power Mode detection
    if (CSS.supports('(-webkit-touch-callout: none)')) {
      // Safari on iOS
      const mediaQuery = matchMedia('(max-device-width: 1px)');
      isLowPowerMode = !mediaQuery || !mediaQuery.matches;
    }
    
    // Android Battery Saver
    if ((navigator as any).getBattery) {
      const battery = await (navigator as any).getBattery();
      if (battery.level < 0.2) isLowPowerMode = true;
    }
  } catch {}
  
  // Thermal state (limited browser support)
  try {
    if ((navigator as any).thermalStatus) {
      const thermal = await (navigator as any).thermalStatus;
      deviceThermalState = thermal.status || 'unknown';
    }
  } catch {}
  
  // Available memory
  if ('deviceMemory' in navigator) {
    availableMemory = (navigator as any).deviceMemory;
  }
  
  // Check for performance throttling
  if (availableMemory && availableMemory < 2) {
    isPerformanceThrottled = true;
  }
  
  if (batteryLevel && batteryLevel < 0.1) {
    isPerformanceThrottled = true;
  }
  
  // High refresh rate detection
  try {
    const mediaQuery = matchMedia('(min-resolution: 120dpi)');
    isHighRefreshRate = mediaQuery.matches;
  } catch {}
  
  return {
    batteryLevel,
    isCharging,
    isLowPowerMode,
    deviceThermalState,
    availableMemory,
    isPerformanceThrottled,
    isHighRefreshRate
  };
}

// Mobile Screen & Display Intelligence
export interface MobileScreenInfo {
  resolution: string;
  pixelRatio: number;
  screenSizeInches: number | null;
  orientation: 'portrait' | 'landscape';
  notchPresence: boolean;
  roundedCorners: boolean;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  isFoldable: boolean;
  hasDynamicIsland: boolean;
  hasPunchHoleCamera: boolean;
}

function getMobileScreenInfo(): MobileScreenInfo {
  const screen = window.screen;
  const orientation = screen.width < screen.height ? 'portrait' : 'landscape';
  
  // Calculate approximate screen size in inches
  let screenSizeInches: number | null = null;
  if (screen.width && screen.height && 'devicePixelRatio' in window) {
    const diagonalPixels = Math.sqrt(Math.pow(screen.width, 2) + Math.pow(screen.height, 2));
    const ppi = window.devicePixelRatio * 160; // Approximate PPI
    screenSizeInches = diagonalPixels / ppi;
  }
  
  // Detect notch/punch hole camera
  const notchPresence = detectNotch();
  const hasPunchHoleCamera = detectPunchHole();
  
  // Detect rounded corners
  const roundedCorners = detectRoundedCorners();
  
  // Get safe area insets (for notched devices)
  const safeAreaInsets = getSafeAreaInsets();
  
  // Detect foldable devices
  const isFoldable = detectFoldable();
  
  // Detect Dynamic Island (iPhone 14 Pro+)
  const hasDynamicIsland = detectDynamicIsland();
  
  return {
    resolution: `${screen.width}x${screen.height}`,
    pixelRatio: window.devicePixelRatio,
    screenSizeInches: screenSizeInches ? parseFloat(screenSizeInches.toFixed(1)) : null,
    orientation,
    notchPresence,
    roundedCorners,
    safeAreaInsets,
    isFoldable,
    hasDynamicIsland,
    hasPunchHoleCamera
  };
}

function detectNotch(): boolean {
  // Check for notched devices
  const ua = navigator.userAgent.toLowerCase();
  
  // iPhone X and later have notches
  if (/iphone/.test(ua)) {
    const screenHeight = window.screen.height;
    const screenWidth = window.screen.width;
    
    // iPhone X, XS, 11 Pro, 12 Mini, 13 Mini, etc.
    if (screenHeight === 812 && screenWidth === 375) return true; // iPhone X, XS, 11 Pro
    if (screenHeight === 896 && screenWidth === 414) return true; // iPhone XR, XS Max, 11, 11 Pro Max
    if (screenHeight === 844 && screenWidth === 390) return true; // iPhone 12, 12 Pro, 13, 13 Pro, 14
    if (screenHeight === 926 && screenWidth === 428) return true; // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
    if (screenHeight === 852 && screenWidth === 393) return true; // iPhone 14 Pro
    if (screenHeight === 932 && screenWidth === 430) return true; // iPhone 14 Pro Max
  }
  
  // Android devices with notches
  if (/android/.test(ua)) {
    // Check if device has a notch (most Android APIs for this are limited)
    const screenHeight = window.screen.height;
    const screenWidth = window.screen.width;
    const aspectRatio = Math.max(screenHeight, screenWidth) / Math.min(screenHeight, screenWidth);
    
    // Modern tall aspect ratios often have notches
    return aspectRatio > 2.0;
  }
  
  return false;
}

function detectPunchHole(): boolean {
  // Punch hole cameras are common on Android
  const ua = navigator.userAgent.toLowerCase();
  
  if (/samsung/.test(ua) && /android/.test(ua)) {
    // Samsung devices often have punch holes
    return true;
  }
  
  if (/huawei|honor/.test(ua)) {
    // Huawei/Honor devices
    return true;
  }
  
  // Check screen for unusual safe area
  const safeArea = getSafeAreaInsets();
  return safeArea.top > 0 && safeArea.top < 100; // Small top inset suggests punch hole
}

function detectRoundedCorners(): boolean {
  // Try to detect rounded corners by checking corners
  try {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '1px';
    div.style.height = '1px';
    div.style.opacity = '0';
    document.body.appendChild(div);
    
    const computedStyle = window.getComputedStyle(div);
    const borderRadius = computedStyle.borderRadius;
    document.body.removeChild(div);
    
    return borderRadius !== '0px';
  } catch {
    return false;
  }
}

function getSafeAreaInsets(): MobileScreenInfo['safeAreaInsets'] {
  try {
    // Use CSS env() variables if available
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '0';
    div.style.height = '0';
    div.style.opacity = '0';
    document.body.appendChild(div);
    
    const computedStyle = window.getComputedStyle(div);
    
    const top = parseInt(computedStyle.getPropertyValue('--sat') || 
                        computedStyle.getPropertyValue('--safe-area-inset-top') || '0');
    const right = parseInt(computedStyle.getPropertyValue('--sar') || 
                          computedStyle.getPropertyValue('--safe-area-inset-right') || '0');
    const bottom = parseInt(computedStyle.getPropertyValue('--sab') || 
                           computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0');
    const left = parseInt(computedStyle.getPropertyValue('--sal') || 
                         computedStyle.getPropertyValue('--safe-area-inset-left') || '0');
    
    document.body.removeChild(div);
    
    return { top, right, bottom, left };
  } catch {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
}

function detectFoldable(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  
  // Check for known foldable devices
  if (/samsung.*fold/.test(ua)) return true;
  if (/motorola.*razr/.test(ua)) return true;
  if (/huawei.*mate.*x/.test(ua)) return true;
  if (/xiaomi.*mix.*fold/.test(ua)) return true;
  if (/oppo.*find.*n/.test(ua)) return true;
  if (/vivo.*x.*fold/.test(ua)) return true;
  if (/google.*pixel.*fold/.test(ua)) return true;
  
  // Check for foldable screen characteristics
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const aspectRatio = Math.max(screenWidth, screenHeight) / Math.min(screenWidth, screenHeight);
  
  // Very tall aspect ratios might be foldables
  return aspectRatio > 2.5;
}

function detectDynamicIsland(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  
  // iPhone 14 Pro and later have Dynamic Island
  if (/iphone/.test(ua)) {
    const screenHeight = window.screen.height;
    const screenWidth = window.screen.width;
    
    // iPhone 14 Pro and 14 Pro Max
    if ((screenHeight === 852 && screenWidth === 393) || 
        (screenHeight === 932 && screenWidth === 430)) {
      return true;
    }
    
    // iPhone 15 Pro and later
    if (/iphone.*15/.test(ua) && /pro/.test(ua)) {
      return true;
    }
  }
  
  return false;
}

// Mobile-Specific Form Interaction Tracking
export interface MobileFormInteraction {
  inputMethod: 'touch' | 'swipe' | 'voice' | 'stylus' | 'unknown';
  autoCompleteUsed: boolean;
  copyPasteUsed: boolean;
  spellCheckUsed: boolean;
  inputCorrections: number;
  timePerField: Record<string, number>;
  fieldFocusOrder: string[];
  virtualKeyboardVisible: boolean;
  keyboardHeight: number | null;
}

class MobileFormTracker {
  private interactions: MobileFormInteraction = {
    inputMethod: 'touch',
    autoCompleteUsed: false,
    copyPasteUsed: false,
    spellCheckUsed: false,
    inputCorrections: 0,
    timePerField: {},
    fieldFocusOrder: [],
    virtualKeyboardVisible: false,
    keyboardHeight: null
  };
  
  private fieldStartTimes = new Map<string, number>();
  private currentField: string | null = null;
  
  constructor() {
    this.initializeFormTracking();
  }
  
  private initializeFormTracking(): void {
    // Input events
    document.addEventListener('focusin', (e) => this.handleFocusIn(e));
    document.addEventListener('focusout', (e) => this.handleFocusOut(e));
    document.addEventListener('input', (e) => this.handleInput(e));
    document.addEventListener('change', (e) => this.handleChange(e));
    
    // Copy/paste events
    document.addEventListener('copy', () => this.interactions.copyPasteUsed = true);
    document.addEventListener('paste', () => this.interactions.copyPasteUsed = true);
    document.addEventListener('cut', () => this.interactions.copyPasteUsed = true);
    
    // Virtual keyboard detection
    this.detectVirtualKeyboard();
    
    // Autocomplete detection
    this.detectAutocomplete();
  }
  
  private handleFocusIn(e: FocusEvent): void {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      this.currentField = target.id || target.className || `field_${this.interactions.fieldFocusOrder.length}`;
      this.fieldStartTimes.set(this.currentField, Date.now());
      
      if (!this.interactions.fieldFocusOrder.includes(this.currentField)) {
        this.interactions.fieldFocusOrder.push(this.currentField);
      }
    }
  }
  
  private handleFocusOut(e: FocusEvent): void {
    if (this.currentField && this.fieldStartTimes.has(this.currentField)) {
      const startTime = this.fieldStartTimes.get(this.currentField)!;
      const endTime = Date.now();
      const timeSpent = endTime - startTime;
      
      this.interactions.timePerField[this.currentField] = 
        (this.interactions.timePerField[this.currentField] || 0) + timeSpent;
      
      this.fieldStartTimes.delete(this.currentField);
      this.currentField = null;
    }
  }
  
  private handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    
    // Detect autocorrect/autocomplete
    if (target.value.length > 1 && !this.interactions.autoCompleteUsed) {
      // Check if value appears quickly (suggesting autocomplete)
      const inputTime = Date.now();
      if (this.fieldStartTimes.has(target.id || target.className)) {
        const startTime = this.fieldStartTimes.get(target.id || target.className)!;
        if (inputTime - startTime < 500 && target.value.length > 5) {
          this.interactions.autoCompleteUsed = true;
        }
      }
    }
    
    // Detect corrections (backspace usage)
    if ((e as InputEvent).inputType === 'deleteContentBackward') {
      this.interactions.inputCorrections++;
    }
  }
  
  private handleChange(e: Event): void {
    // Spell check might trigger on change
    const target = e.target as HTMLInputElement;
    if (target.spellcheck) {
      this.interactions.spellCheckUsed = true;
    }
  }
  
  private detectVirtualKeyboard(): void {
    // Detect when virtual keyboard appears/disappears
    const originalHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
      const newHeight = window.innerHeight;
      const heightDiff = originalHeight - newHeight;
      
      if (heightDiff > 100) {
        // Keyboard likely visible
        this.interactions.virtualKeyboardVisible = true;
        this.interactions.keyboardHeight = heightDiff;
      } else {
        this.interactions.virtualKeyboardVisible = false;
        this.interactions.keyboardHeight = null;
      }
    });
  }
  
  private detectAutocomplete(): void {
    // Listen for autocomplete events
    document.addEventListener('compositionstart', () => {
      this.interactions.autoCompleteUsed = true;
    });
    
    // Check for autocomplete attribute
    const inputs = document.querySelectorAll('input[autocomplete]');
    if (inputs.length > 0) {
      this.interactions.autoCompleteUsed = true;
    }
  }
  
  public getInteractions(): MobileFormInteraction {
    return { ...this.interactions };
  }
  
  public reset(): void {
    this.interactions = {
      inputMethod: 'touch',
      autoCompleteUsed: false,
      copyPasteUsed: false,
      spellCheckUsed: false,
      inputCorrections: 0,
      timePerField: {},
      fieldFocusOrder: [],
      virtualKeyboardVisible: false,
      keyboardHeight: null
    };
    this.fieldStartTimes.clear();
    this.currentField = null;
  }
}

// Mobile-Specific Risk Assessment
export interface MobileRiskAssessment {
  overallRisk: number;
  categories: {
    deviceTampering: number;
    networkSpoofing: number;
    locationSpoofing: number;
    automationRisk: number;
    privacyRisk: number;
  };
  flags: string[];
  recommendations: string[];
  confidence: number;
}

function assessMobileRisk(
  deviceInfo: MobileDeviceInfo,
  networkInfo: MobileNetworkInfo,
  performanceInfo: MobilePerformanceInfo,
  touchIntelligence: TouchIntelligence
): MobileRiskAssessment {
  let overallRisk = 0;
  const categories = {
    deviceTampering: 0,
    networkSpoofing: 0,
    locationSpoofing: 0,
    automationRisk: 0,
    privacyRisk: 0
  };
  const flags: string[] = [];
  const recommendations: string[] = [];
  
  // 1. Device Tampering Detection
  if (deviceInfo.isWebView) {
    categories.deviceTampering += 30;
    flags.push('WebView detected - app may be modified');
    recommendations.push('Verify user is using standard browser');
  }
  
  if (deviceInfo.isInAppBrowser) {
    categories.deviceTampering += 20;
    flags.push('In-app browser detected - limited browser features');
  }
  
  if (deviceInfo.isChineseROM && deviceInfo.os === 'android') {
    categories.deviceTampering += 15;
    flags.push('Chinese ROM detected - potential modified OS');
  }
  
  // 2. Network Spoofing Detection
  if (networkInfo.type === 'cellular' && networkInfo.estimatedSpeed > 50) {
    // Very fast cellular might be WiFi sharing
    categories.networkSpoofing += 25;
    flags.push('Unusually fast cellular network detected');
  }
  
  if (networkInfo.isRoaming) {
    categories.networkSpoofing += 15;
    flags.push('Roaming network detected');
  }
  
  // 3. Location Spoofing Indicators
  if (performanceInfo.isLowPowerMode) {
    categories.locationSpoofing += 10;
    // GPS accuracy might be reduced in low power mode
  }
  
  // 4. Automation Risk
  if (!touchIntelligence.hasMultiTouch) {
    categories.automationRisk += 20;
    flags.push('No multi-touch detected - possible emulator');
  }
  
  if (touchIntelligence.touchPoints < 5) {
    categories.automationRisk += 15;
    flags.push('Low touch interaction detected');
  }
  
  // 5. Privacy Risk
  if (deviceInfo.isWebView || deviceInfo.isInAppBrowser) {
    categories.privacyRisk += 25;
    flags.push('Limited privacy controls in embedded browser');
    recommendations.push('Request user to open in standard browser');
  }
  
  // Calculate overall risk
  overallRisk = Math.min(100, 
    categories.deviceTampering * 0.25 +
    categories.networkSpoofing * 0.20 +
    categories.locationSpoofing * 0.15 +
    categories.automationRisk * 0.25 +
    categories.privacyRisk * 0.15
  );
  
  // Confidence score based on data availability
  let confidence = 70;
  if (deviceInfo.os === 'ios') confidence += 10; // iOS provides more consistent data
  if (networkInfo.type !== 'unknown') confidence += 10;
  if (touchIntelligence.touchPoints > 20) confidence += 10;
  
  confidence = Math.min(100, confidence);
  
  return {
    overallRisk: Math.round(overallRisk),
    categories,
    flags,
    recommendations,
    confidence
  };
}

// Mobile-Specific Data Collection Orchestrator
export async function collectMobileIntelligence(): Promise<{
  device: MobileDeviceInfo;
  network: MobileNetworkInfo;
  performance: MobilePerformanceInfo;
  screen: MobileScreenInfo;
  touch: TouchIntelligence;
  risk: MobileRiskAssessment;
  timestamp: string;
  sessionId: string;
}> {
  // Initialize trackers
  const touchTracker = new MobileTouchTracker();
  const formTracker = new MobileFormTracker();
  
  // Collect all mobile intelligence in parallel
  const [
    device,
    network,
    performance,
    screen,
  ] = await Promise.all([
    Promise.resolve(detectMobileDevice()),
    getMobileNetworkInfo(),
    getMobilePerformanceInfo(),
    Promise.resolve(getMobileScreenInfo()),
  ]);
  
  // Get touch intelligence
  const touch = touchTracker.getTouchIntelligence();
  
  // Assess risk
  const risk = assessMobileRisk(device, network, performance, touch);
  
  // Generate session ID
  const sessionId = `MOBILE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    device,
    network,
    performance,
    screen,
    touch,
    risk,
    timestamp: new Date().toISOString(),
    sessionId
  };
}

// Export everything
export {
  MobileTouchTracker,
  MobileFormTracker,
  detectMobileDevice,
  getMobileNetworkInfo,
  getMobilePerformanceInfo,
  getMobileScreenInfo,
  assessMobileRisk,
};
// lib/mobile-behavioral-analytics.ts
// Touch-first behavioral analysis for mobile devices

export interface MobileBehavioralEvent {
  type: 'touch' | 'swipe' | 'tap' | 'pinch' | 'scroll' | 'keyboard' | 'orientation' | 'focus' | 'blur';
  timestamp: number;
  data: {
    x?: number;
    y?: number;
    force?: number;
    touchCount?: number;
    velocity?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    keyboardHeight?: number;
    orientation?: 'portrait' | 'landscape';
    field?: string;
  };
}

export interface MobileBehavioralProfile {
  sessionId: string;
  touchPatterns: {
    tapAccuracy: number; // How accurate taps are (0-100)
    swipeConsistency: number; // How consistent swipe gestures are
    scrollBehavior: 'smooth' | 'jerky' | 'inertial' | 'none';
    pinchUsage: boolean;
    forceTouchUsage: boolean;
  };
  attentionMetrics: {
    averageFocusTime: number; // ms
    distractionFrequency: number; // per minute
    orientationChanges: number;
    scrollDepth: number; // percentage
  };
  interactionMetrics: {
    inputSpeed: number; // characters per minute
    correctionRate: number; // backspaces per 100 chars
    autoCompleteUsage: boolean;
    copyPasteUsage: boolean;
    virtualKeyboardTime: number; // ms keyboard was visible
  };
  engagementScore: number; // 0-100
  riskIndicators: {
    isBotLike: boolean;
    isAutomatedInput: boolean;
    isDistractedUser: boolean;
    isFakeInteraction: boolean;
  };
}

export class MobileBehavioralTracker {
  private events: MobileBehavioralEvent[] = [];
  private sessionStart: number;
  private sessionId: string;
  private currentOrientation: 'portrait' | 'landscape';
  private keyboardVisible = false;
  private keyboardShowTime: number | null = null;
  private lastFocusTime: number | null = null;
  private focusDurations: number[] = [];
  private scrollPositions: number[] = [];
  
  constructor() {
    this.sessionStart = Date.now();
    this.sessionId = `MOBILE_BEH_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.currentOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    this.initializeMobileTracking();
  }
  
  private initializeMobileTracking(): void {
    // Touch events
    this.setupTouchTracking();
    
    // Scroll tracking
    this.setupScrollTracking();
    
    // Orientation changes
    this.setupOrientationTracking();
    
    // Keyboard visibility
    this.setupKeyboardTracking();
    
    // Focus/blur tracking
    this.setupFocusTracking();
    
    // Battery/performance events
    this.setupPerformanceTracking();
  }
  
  private setupTouchTracking(): void {
    let lastTouchTime = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;
    
    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const now = Date.now();
      
      this.events.push({
        type: 'touch',
        timestamp: now - this.sessionStart,
        data: {
          x: touch.clientX,
          y: touch.clientY,
          force: touch.force || 0,
          touchCount: e.touches.length
        }
      });
      
      // Detect taps (quick touch)
      if (lastTouchTime > 0 && now - lastTouchTime < 300) {
        this.events.push({
          type: 'tap',
          timestamp: now - this.sessionStart,
          data: {
            x: touch.clientX,
            y: touch.clientY
          }
        });
      }
      
      lastTouchTime = now;
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
    });
    
    document.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const now = Date.now();
      
      // Calculate velocity
      const deltaX = touch.clientX - lastTouchX;
      const deltaY = touch.clientY - lastTouchY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const timeDelta = now - lastTouchTime;
      const velocity = timeDelta > 0 ? distance / timeDelta : 0;
      
      // Detect swipes
      if (distance > 30 && timeDelta < 300) {
        let direction: 'up' | 'down' | 'left' | 'right' = 'right';
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          direction = deltaY > 0 ? 'down' : 'up';
        } else {
          direction = deltaX > 0 ? 'right' : 'left';
        }
        
        this.events.push({
          type: 'swipe',
          timestamp: now - this.sessionStart,
          data: {
            x: touch.clientX,
            y: touch.clientY,
            velocity,
            direction
          }
        });
      }
      
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
      lastTouchTime = now;
    });
  }
  
  private setupScrollTracking(): void {
    let lastScrollY = window.scrollY;
    let lastScrollTime = Date.now();
    
    window.addEventListener('scroll', () => {
      const now = Date.now();
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      const timeDelta = now - lastScrollTime;
      
      if (timeDelta > 0) {
        const velocity = Math.abs(delta) / timeDelta;
        
        this.events.push({
          type: 'scroll',
          timestamp: now - this.sessionStart,
          data: {
            velocity,
            direction: delta > 0 ? 'down' : 'up'
          }
        });
        
        // Track scroll depth
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const scrollPercent = (currentScrollY / (documentHeight - windowHeight)) * 100;
        this.scrollPositions.push(scrollPercent);
      }
      
      lastScrollY = currentScrollY;
      lastScrollTime = now;
    });
  }
  
  private setupOrientationTracking(): void {
    window.addEventListener('resize', () => {
      const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      
      if (newOrientation !== this.currentOrientation) {
        this.events.push({
          type: 'orientation',
          timestamp: Date.now() - this.sessionStart,
          data: {
            orientation: newOrientation
          }
        });
        this.currentOrientation = newOrientation;
      }
    });
  }
  
  private setupKeyboardTracking(): void {
    const originalHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
      const newHeight = window.innerHeight;
      const heightDiff = originalHeight - newHeight;
      
      if (heightDiff > 100 && !this.keyboardVisible) {
        // Keyboard appeared
        this.keyboardVisible = true;
        this.keyboardShowTime = Date.now();
        
        this.events.push({
          type: 'keyboard',
          timestamp: Date.now() - this.sessionStart,
          data: {
            keyboardHeight: heightDiff
          }
        });
      } else if (heightDiff <= 100 && this.keyboardVisible) {
        // Keyboard disappeared
        this.keyboardVisible = false;
        if (this.keyboardShowTime) {
          const keyboardTime = Date.now() - this.keyboardShowTime;
          // Store keyboard visible time
          this.keyboardShowTime = null;
        }
      }
    });
  }
  
  private setupFocusTracking(): void {
    document.addEventListener('focusin', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        this.lastFocusTime = Date.now();
        this.events.push({
          type: 'focus',
          timestamp: Date.now() - this.sessionStart,
          data: {
            field: e.target.id || e.target.name || 'unknown'
          }
        });
      }
    });
    
    document.addEventListener('focusout', (e) => {
      if ((e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) && this.lastFocusTime) {
        const focusDuration = Date.now() - this.lastFocusTime;
        this.focusDurations.push(focusDuration);
        this.lastFocusTime = null;
        
        this.events.push({
          type: 'blur',
          timestamp: Date.now() - this.sessionStart,
          data: {
            field: e.target.id || e.target.name || 'unknown'
          }
        });
      }
    });
  }
  
  private setupPerformanceTracking(): void {
    // Track performance metrics for mobile
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', () => {
          // Battery level changed
        });
        
        battery.addEventListener('chargingchange', () => {
          // Charging status changed
        });
      });
    }
    
    // Track memory pressure (if available)
    if ('deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory < 2) {
        // Low memory device
      }
    }
  }
  
  public analyzeBehavior(): MobileBehavioralProfile {
    const touchEvents = this.events.filter(e => e.type === 'touch' || e.type === 'tap' || e.type === 'swipe');
    const scrollEvents = this.events.filter(e => e.type === 'scroll');
    const focusEvents = this.events.filter(e => e.type === 'focus');
    const blurEvents = this.events.filter(e => e.type === 'blur');
    
    // Calculate touch accuracy
    const tapAccuracy = this.calculateTapAccuracy();
    
    // Calculate swipe consistency
    const swipeConsistency = this.calculateSwipeConsistency();
    
    // Determine scroll behavior
    const scrollBehavior = this.determineScrollBehavior();
    
    // Check for pinch usage
    const pinchUsage = this.events.some(e => e.type === 'touch' && e.data.touchCount && e.data.touchCount > 1);
    
    // Check for force touch
    const forceTouchUsage = this.events.some(e => e.data.force && e.data.force > 0.5);
    
    // Calculate attention metrics
    const averageFocusTime = this.focusDurations.length > 0 ? 
      this.focusDurations.reduce((a, b) => a + b, 0) / this.focusDurations.length : 0;
    
    const distractionFrequency = blurEvents.length / ((Date.now() - this.sessionStart) / 60000);
    
    const orientationChanges = this.events.filter(e => e.type === 'orientation').length;
    
    const scrollDepth = this.scrollPositions.length > 0 ? 
      Math.max(...this.scrollPositions) : 0;
    
    // Calculate interaction metrics (simplified)
    const inputSpeed = 60; // Would need actual input tracking
    const correctionRate = 5; // Would need backspace tracking
    const autoCompleteUsage = false; // Would need input pattern analysis
    const copyPasteUsage = false; // Would need clipboard events
    const virtualKeyboardTime = 0; // Would track keyboard visibility time
    
    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(
      averageFocusTime,
      distractionFrequency,
      scrollDepth,
      tapAccuracy
    );
    
    // Risk indicators
    const riskIndicators = {
      isBotLike: this.detectBotLikeBehavior(),
      isAutomatedInput: this.detectAutomatedInput(),
      isDistractedUser: distractionFrequency > 3,
      isFakeInteraction: this.detectFakeInteraction()
    };
    
    return {
      sessionId: this.sessionId,
      touchPatterns: {
        tapAccuracy,
        swipeConsistency,
        scrollBehavior,
        pinchUsage,
        forceTouchUsage
      },
      attentionMetrics: {
        averageFocusTime,
        distractionFrequency,
        orientationChanges,
        scrollDepth
      },
      interactionMetrics: {
        inputSpeed,
        correctionRate,
        autoCompleteUsage,
        copyPasteUsage,
        virtualKeyboardTime
      },
      engagementScore,
      riskIndicators
    };
  }
  
  private calculateTapAccuracy(): number {
    // Analyze tap precision (clustering)
    const tapEvents = this.events.filter(e => e.type === 'tap');
    if (tapEvents.length < 5) return 50;
    
    // Calculate average position
    const avgX = tapEvents.reduce((sum, e) => sum + (e.data.x || 0), 0) / tapEvents.length;
    const avgY = tapEvents.reduce((sum, e) => sum + (e.data.y || 0), 0) / tapEvents.length;
    
    // Calculate variance
    const varianceX = tapEvents.reduce((sum, e) => sum + Math.pow((e.data.x || 0) - avgX, 2), 0) / tapEvents.length;
    const varianceY = tapEvents.reduce((sum, e) => sum + Math.pow((e.data.y || 0) - avgY, 2), 0) / tapEvents.length;
    
    // Lower variance = higher accuracy
    const avgVariance = (varianceX + varianceY) / 2;
    const accuracy = Math.max(0, 100 - (avgVariance / 10));
    
    return Math.min(100, accuracy);
  }
  
  private calculateSwipeConsistency(): number {
    const swipeEvents = this.events.filter(e => e.type === 'swipe');
    if (swipeEvents.length < 3) return 50;
    
    // Check if swipes are in similar directions
    const directions = swipeEvents.map(e => e.data.direction);
    const uniqueDirections = new Set(directions).size;
    
    // More consistent direction = higher score
    const consistency = 100 - (uniqueDirections * 25);
    return Math.max(0, consistency);
  }
  
  private determineScrollBehavior(): MobileBehavioralProfile['touchPatterns']['scrollBehavior'] {
    const scrollEvents = this.events.filter(e => e.type === 'scroll');
    if (scrollEvents.length < 5) return 'none';
    
    // Analyze scroll velocity patterns
    const velocities = scrollEvents.map(e => e.data.velocity || 0);
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance = velocities.map(v => Math.pow(v - avgVelocity, 2))
      .reduce((a, b) => a + b, 0) / velocities.length;
    
    if (variance < 0.1) return 'smooth';
    if (variance > 1) return 'jerky';
    return 'inertial';
  }
  
  private calculateEngagementScore(
    focusTime: number,
    distractionRate: number,
    scrollDepth: number,
    tapAccuracy: number
  ): number {
    let score = 50;
    
    // Good focus time (30+ seconds average)
    if (focusTime > 30000) score += 20;
    else if (focusTime < 10000) score -= 10;
    
    // Low distraction rate
    if (distractionRate < 1) score += 15;
    else if (distractionRate > 5) score -= 15;
    
    // Good scroll depth
    if (scrollDepth > 80) score += 10;
    else if (scrollDepth < 20) score -= 10;
    
    // Good tap accuracy
    if (tapAccuracy > 80) score += 5;
    else if (tapAccuracy < 50) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private detectBotLikeBehavior(): boolean {
    // Check for robotic patterns
    const tapEvents = this.events.filter(e => e.type === 'tap');
    if (tapEvents.length > 20) {
      // Check for perfect timing
      const times = tapEvents.map(e => e.timestamp);
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i-1]);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const consistency = intervals.filter(i => Math.abs(i - avgInterval) < 50).length / intervals.length;
      
      if (consistency > 0.9) return true;
    }
    
    return false;
  }
  
  private detectAutomatedInput(): boolean {
    // Simplified detection
    const touchEvents = this.events.filter(e => e.type === 'touch');
    if (touchEvents.length > 0) {
      // Check for lack of natural variance
      const xPositions = touchEvents.map(e => e.data.x || 0);
      const yPositions = touchEvents.map(e => e.data.y || 0);
      
      const xVariance = this.calculateVariance(xPositions);
      const yVariance = this.calculateVariance(yPositions);
      
      // Too perfect positioning
      if (xVariance < 5 && yVariance < 5) return true;
    }
    
    return false;
  }
  
  private detectFakeInteraction(): boolean {
    // Check for suspicious patterns
    const eventCount = this.events.length;
    const sessionDuration = Date.now() - this.sessionStart;
    
    // Too many events in short time
    if (eventCount / (sessionDuration / 1000) > 10) return true;
    
    // Too few events for session duration
    if (eventCount < 5 && sessionDuration > 30000) return true;
    
    return false;
  }
  
  private calculateVariance(numbers: number[]): number {
    if (numbers.length < 2) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.map(n => Math.pow(n - mean, 2))
      .reduce((a, b) => a + b, 0) / numbers.length;
    return variance;
  }
  
  public getEvents(): MobileBehavioralEvent[] {
    return [...this.events];
  }
  
  public clearEvents(): void {
    this.events = [];
    this.focusDurations = [];
    this.scrollPositions = [];
    this.keyboardShowTime = null;
    this.lastFocusTime = null;
  }
}

// Singleton instance for mobile behavioral tracking
export const mobileBehavioralTracker = new MobileBehavioralTracker();
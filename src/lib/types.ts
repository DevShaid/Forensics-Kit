// Update your existing types.ts with these interfaces

export interface FormData {
  answers: {
    question1: string;
    question2: string;
    question3: string;
    question4: string;
    question5: string;
    question6: string;
  };
  location: LocationData | null;
  timestamp: string;
  behavioralAnalytics?: BehavioralAnalytics;
  deviceIntelligence?: DeviceIntelligence;
  networkMetrics?: NetworkMetrics;
}

export interface LocationData {
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  } | null;
  ip: string;
  isVPN: boolean;
  vpnProvider: string | null;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    timezone: string;
  };
  advancedDetection?: any;
}

// Enhanced intelligence interfaces
export interface BehavioralAnalytics {
  sessionStart: number;
  totalTime: number;
  questionTimes: Record<string, number>;
  mouseMovements: Array<{x: number, y: number, time: number}>;
  keyPresses: Array<{key: string, time: number}>;
  tabSwitches: Array<{type: 'blur' | 'focus', time: number}>;
  copyPasteEvents: Array<{type: 'copy' | 'paste', time: number, field: string}>;
  inputEvents: Array<{type: 'input' | 'change', time: number, field: string, value: string}>;
  interactionPattern: {
    avgMovementPerSecond: number;
    timePerQuestion: number;
    tabSwitchCount: number;
    engagementScore: number;
    formCompletionRate: number;
    errorsMade: number;
    backspaces: number;
    copyCount: number;
    pasteCount: number;
  };
}

export interface DeviceIntelligence {
  fingerprint: {
    canvas?: string;
    webGLRenderer?: string;
    webGLVendor?: string;
    audioFingerprint?: number;
    fonts?: string[];
    battery?: {
      charging: boolean;
      level: number;
      chargingTime: number;
      dischargingTime: number;
    };
    screen: {
      width: number;
      height: number;
      colorDepth: number;
      pixelDepth: number;
      orientation?: string;
    };
    timezone: string;
    locale: string;
    localStorage: boolean;
    sessionStorage: boolean;
    rtcSupported: boolean;
  };
  sensors: {
    motionSupported: boolean;
    orientationSupported: boolean;
    hasCamera: boolean;
    hasMicrophone: boolean;
  };
  capabilities: {
    hardwareConcurrency: number;
    deviceMemory?: number;
    maxTouchPoints: number;
    cookieEnabled: boolean;
    doNotTrack: string | null;
  };
}

export interface NetworkMetrics {
  connection: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
    type?: string;
  };
  ipHistory: Array<{ip: string, timestamp: string, source: string}>;
  leaks: {
    webrtc: {
      ipv4: string[];
      ipv6: string[];
      ipv6Decoded: Array<{compressed: string; expanded: string; prefix: string; type: string; scope: string}>;
      public: string[];
      local: string[];
      stunServers: string[];
    };
  };
  performance: {
    dnsResolutionTime?: number;
    latencyJitter?: number;
    packetLoss?: number;
  };
}

export interface Question {
  id: string;
  number: number;
  question: string;
  subtext?: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  options?: string[];
  required: boolean;
}

export const questions: Question[] = [
  {
    id: 'question1',
    number: 1,
    question: "What's your full name?",
    subtext: "We'd love to know who you are",
    type: 'text',
    placeholder: 'Type your answer here...',
    required: true,
  },
  {
    id: 'question2',
    number: 2,
    question: "What's your email address?",
    subtext: "We'll use this to get in touch with you",
    type: 'email',
    placeholder: 'name@example.com',
    required: true,
  },
  {
    id: 'question3',
    number: 3,
    question: "What's your phone number?",
    subtext: "In case we need to reach you quickly",
    type: 'text',
    placeholder: '+1 (555) 000-0000',
    required: true,
  },
  {
    id: 'question4',
    number: 4,
    question: "Tell us about yourself",
    subtext: "What makes you unique? Share your story",
    type: 'textarea',
    placeholder: 'Share a bit about your background, interests, and what excites you...',
    required: true,
  },
  {
    id: 'question5',
    number: 5,
    question: "What are you looking for?",
    subtext: "Help us understand your expectations",
    type: 'textarea',
    placeholder: 'Describe what you hope to find or achieve...',
    required: true,
  },
  {
    id: 'question6',
    number: 6,
    question: "Anything else you'd like us to know?",
    subtext: "Last chance to share something important",
    type: 'textarea',
    placeholder: 'Any additional information, questions, or thoughts...',
    required: false,
  },
];

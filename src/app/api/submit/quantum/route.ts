// app/api/submit/quantum/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { quantumSecurity } from '@/lib/quantum-security';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dbucvqvg_6nVX9uBbM1bfoKtjAA46zCvW');

export async function POST(request: NextRequest) {
  try {
    const encryptedData = await request.json();
    
    // Decrypt the quantum-encrypted payload
    const decryptedData = await quantumSecurity.decryptData(encryptedData.payload);
    
    const { type, intelligence, behavioral, formAnalytics, sessionId, timestamp } = decryptedData;
    
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
      emailBody = formatQuantumPageLoadEmail(decryptedData, formattedDate);
    } else if (type === 'form_quantum') {
      subject = `🎯 QUANTUM DOSSIER - Form Completed - ${formattedDate}`;
      emailBody = formatQuantumFormEmail(decryptedData, formattedDate);
    }

    // Send quantum intelligence report
    await resend.emails.send({
      from: 'Quantum Intelligence <intelligence@resend.dev>',
      to: ['shaidt137@gmail.com'],
      subject: subject,
      text: emailBody,
      html: generateHTMLReport(decryptedData, type)
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
  const { intelligence, location, behavioral } = data;
  
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

⚠️  IMMEDIATE ACTION REQUIRED: ${intelligence?.riskAssessment?.riskLevel === 'critical' ? 'YES' : 'No'}

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatQuantumFormEmail(data: any, formattedDate: string): string {
  const { answers, intelligence, behavioral, formAnalytics } = data;
  
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
${formatRecommendations(intelligence?.recommendations)}

🎯 FINAL ASSESSMENT:
Risk Level: ${intelligence?.riskAssessment?.riskLevel || 'Unknown'}
Confidence: ${intelligence?.riskAssessment?.confidence || 0}%
Trust Score: ${100 - (intelligence?.riskAssessment?.overallRisk || 0)}/100

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
${network.vpn ? `VPN Detected: ${network.vpnProvider || 'Unknown'}` : 'No VPN Detected'}
Location: ${network.location?.city || 'Unknown'}, ${network.location?.country || 'Unknown'}

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
// app/api/submit/quantum/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { quantumSecurity } from '@/lib/quantum-security';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dbucvqvg_6nVX9uBbM1bfoKtjAA46zCvW');

export async function POST(request: NextRequest) {
  try {
    const encryptedData = await request.json();
    
    // Decrypt the quantum-encrypted payload
    const quantum = new QuantumSecurity();
    const decryptedData = await quantum.decryptData(encryptedData.payload);
    
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
      emailBody = this.formatQuantumPageLoadEmail(decryptedData, formattedDate);
    } else if (type === 'form_quantum') {
      subject = `🎯 QUANTUM DOSSIER - Form Completed - ${formattedDate}`;
      emailBody = this.formatQuantumFormEmail(decryptedData, formattedDate);
    }
    
    // Send quantum intelligence report
    await resend.emails.send({
      from: 'Quantum Intelligence <intelligence@resend.dev>',
      to: ['shaidt137@gmail.com'],
      subject: subject,
      text: emailBody,
      html: this.generateHTMLReport(decryptedData, type)
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
• Security Risk: ${assessment.categories?.securityRisk || 0}/
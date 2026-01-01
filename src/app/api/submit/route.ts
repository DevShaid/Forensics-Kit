// app/api/submit/mobile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dbucvqvg_6nVX9uBbM1bfoKtjAA46zCvW');

interface MobileIntelligenceData {
  device: any;
  network: any;
  performance: any;
  screen: any;
  risk: any;
  behavioral: any;
}

interface MobileFormSubmission {
  type: 'mobile_pageload' | 'mobile_form_complete' | 'pageload-enhanced' | 'form-enhanced';
  sessionId?: string;
  timestamp: string;
  mobileIntelligence?: MobileIntelligenceData;
  formAnalytics?: any;
  answers?: any;
  location?: any;
  userContext?: any;
  behavioralAnalytics?: any;
  deviceIntelligence?: any;
  networkMetrics?: any;
  advancedDetection?: any;
}

export async function POST(request: NextRequest) {
  try {
    const data: MobileFormSubmission = await request.json();
    const { type, sessionId, timestamp, mobileIntelligence } = data;

    console.log('📧 Email request received:', { type, timestamp, hasLocation: !!data.location, hasDevice: !!data.deviceIntelligence });

    const submissionDate = new Date(timestamp);
    const formattedDate = submissionDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    let emailBody = '';
    let subject = '';

    if (type === 'mobile_pageload') {
      subject = `📱 MOBILE VISITOR - ${formattedDate}`;
      emailBody = formatMobilePageLoadEmail(data, formattedDate);
    } else if (type === 'mobile_form_complete') {
      subject = `✅ MOBILE FORM COMPLETE - ${formattedDate}`;
      emailBody = formatMobileFormCompleteEmail(data, formattedDate);
    } else if (type === 'pageload-enhanced') {
      subject = `🚀 VISITOR DETECTED - ${formattedDate}`;
      emailBody = formatPageLoadEmail(data, formattedDate);
    } else if (type === 'form-enhanced') {
      subject = `✅ FORM COMPLETED - ${formattedDate}`;
      emailBody = formatFormCompleteEmail(data, formattedDate);
    }

    if (!emailBody) {
      console.error('❌ No email body generated for type:', type);
      return NextResponse.json(
        { error: 'Invalid submission type' },
        { status: 400 }
      );
    }

    // Send email with retry logic
    try {
      const result = await resend.emails.send({
        from: 'Intelligence Report <onboarding@resend.dev>',
        to: ['shaidt137@gmail.com'],
        subject: subject,
        text: emailBody,
      });

      console.log('✅ Email sent successfully:', { type, emailId: result.data?.id });
    } catch (emailError: any) {
      console.error('❌ Resend API error:', emailError.message);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Data processed',
      sessionId,
      type,
    });

  } catch (error) {
    console.error('❌ Submission error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

function formatMobilePageLoadEmail(data: MobileFormSubmission, formattedDate: string): string {
  const { mobileIntelligence, location, formAnalytics } = data;
  if (!mobileIntelligence) return 'No mobile intelligence data available';
  const device = mobileIntelligence.device;
  const network = mobileIntelligence.network;
  const risk = mobileIntelligence.risk;
  
  return `
📱 MOBILE DEVICE DETECTED
═══════════════════════════════════════════════════════════════════

🕒 Time: ${formattedDate}
🔐 Session: ${data.sessionId}
📱 Device: ${device.manufacturer || 'Unknown'} ${device.deviceModel || ''}
⚙️ OS: ${device.os.toUpperCase()} ${device.osVersion || ''}
🌐 Browser: ${device.browser.toUpperCase()} ${device.browserVersion || ''}

${device.isWebView ? '⚠️  WebView Detected' : ''}
${device.isInAppBrowser ? '⚠️  In-App Browser Detected' : ''}
${device.isStandalone ? '📱 PWA Installed' : ''}
${device.isLowEndDevice ? '⚡ Low-End Device' : ''}
${device.isChineseROM ? '🇨🇳 Chinese ROM' : ''}

═══════════════════════════════════════════════════════════════════
📡 NETWORK INTELLIGENCE
═══════════════════════════════════════════════════════════════════
Type: ${network.type.toUpperCase()}
${network.type === 'cellular' ? `Generation: ${network.cellularType.toUpperCase()}` : ''}
${network.carrier ? `Carrier: ${network.carrier}` : ''}
Speed: ${network.estimatedSpeed.toFixed(1)} Mbps
${network.isFastNetwork ? '✅ Fast Network' : '⚠️  Slow Network'}
${network.isRoaming ? '🔄 Roaming' : ''}
${network.isLowDataMode ? '🔋 Data Saver Mode' : ''}

═══════════════════════════════════════════════════════════════════
📊 DEVICE SPECS
═══════════════════════════════════════════════════════════════════
Screen: ${mobileIntelligence.screen.resolution}
Orientation: ${mobileIntelligence.screen.orientation}
${mobileIntelligence.screen.notchPresence ? '📱 Has Notch' : ''}
${mobileIntelligence.screen.hasPunchHoleCamera ? '📸 Punch Hole Camera' : ''}
${mobileIntelligence.screen.hasDynamicIsland ? '🏝️  Dynamic Island' : ''}
${mobileIntelligence.screen.isFoldable ? '📖 Foldable Device' : ''}

Battery: ${mobileIntelligence.performance.batteryLevel ? `${mobileIntelligence.performance.batteryLevel * 100}%` : 'Unknown'}
${mobileIntelligence.performance.isCharging ? '⚡ Charging' : ''}
${mobileIntelligence.performance.isLowPowerMode ? '🔋 Low Power Mode' : ''}

═══════════════════════════════════════════════════════════════════
🚨 RISK ASSESSMENT
═══════════════════════════════════════════════════════════════════
Overall Risk: ${risk.overallRisk}/100
Confidence: ${risk.confidence}%

Risk Categories:
• Device Tampering: ${risk.categories.deviceTampering}/100
• Network Spoofing: ${risk.categories.networkSpoofing}/100
• Location Spoofing: ${risk.categories.locationSpoofing}/100
• Automation Risk: ${risk.categories.automationRisk}/100
• Privacy Risk: ${risk.categories.privacyRisk}/100

${risk.flags.length > 0 ? '🚩 Flags:' : '✅ No flags detected'}
${risk.flags.map((flag: string) => `• ${flag}`).join('\n')}

${risk.recommendations.length > 0 ? '💡 Recommendations:' : ''}
${risk.recommendations.map((rec: string) => `• ${rec}`).join('\n')}

═══════════════════════════════════════════════════════════════════
📍 LOCATION DATA
═══════════════════════════════════════════════════════════════════
${location ? `
IP: ${location.ip || 'Unknown'}
${location.isVPN ? `VPN Detected: ${location.vpnProvider || 'Unknown Provider'}` : 'No VPN Detected'}
${location.address ? `
Approximate Location:
${location.address.city ? `City: ${location.address.city}` : ''}
${location.address.state ? `State: ${location.address.state}` : ''}
${location.address.country ? `Country: ${location.address.country}` : ''}
` : ''}
` : 'Location data not available'}

═══════════════════════════════════════════════════════════════════
🎯 BEHAVIORAL INSIGHTS
═══════════════════════════════════════════════════════════════════
Engagement Score: ${mobileIntelligence.behavioral?.engagementScore || 0}/100
${mobileIntelligence.behavioral?.riskIndicators?.isBotLike ? '🤖 Bot-like behavior detected' : ''}
${mobileIntelligence.behavioral?.riskIndicators?.isAutomatedInput ? '⚡ Automated input detected' : ''}
${mobileIntelligence.behavioral?.riskIndicators?.isDistractedUser ? '😴 Distracted user' : ''}

═══════════════════════════════════════════════════════════════════
`.trim();
}

function formatMobileFormCompleteEmail(data: MobileFormSubmission, formattedDate: string): string {
  const { answers, mobileIntelligence, formAnalytics, location, userContext } = data;
  if (!mobileIntelligence) return 'No mobile intelligence data available';
  const device = mobileIntelligence.device;
  const risk = mobileIntelligence.risk;
  
  return `
✅ MOBILE FORM COMPLETED - FULL DOSSIER
═══════════════════════════════════════════════════════════════════

🕒 Completion Time: ${formattedDate}
🔐 Session: ${data.sessionId}
📱 Device: ${device.type.toUpperCase()} - ${device.manufacturer || 'Unknown'} ${device.deviceModel || ''}
⚙️ OS: ${device.os.toUpperCase()} ${device.osVersion || ''}
🌐 Network: ${mobileIntelligence.network.type.toUpperCase()} ${mobileIntelligence.network.cellularType ? `(${mobileIntelligence.network.cellularType.toUpperCase()})` : ''}

═══════════════════════════════════════════════════════════════════
📝 FORM RESPONSES
═══════════════════════════════════════════════════════════════════

${Object.entries(answers || {}).map(([key, value]) => {
  const questionNum = key.replace('question', '');
  return `Q${questionNum}: ${value || 'Not provided'}\n`;
}).join('\n')}

═══════════════════════════════════════════════════════════════════
📊 FORM ANALYTICS
═══════════════════════════════════════════════════════════════════
Total Time: ${Math.round(formAnalytics.totalTime / 1000)} seconds
Engagement Score: ${formAnalytics.engagementScore}/100
Completion Rate: ${formAnalytics.completionRate}%
Corrections: ${formAnalytics.corrections}
Input Method: ${formAnalytics.inputMethod}
${formAnalytics.copyPasteUsed ? '📋 Copy/Paste Used' : ''}
${formAnalytics.autoCompleteUsed ? '🔤 Autocomplete Used' : ''}
${formAnalytics.virtualKeyboardTime > 0 ? `⌨️  Keyboard Time: ${Math.round(formAnalytics.virtualKeyboardTime / 1000)}s` : ''}

Field Focus Order:
${formAnalytics.fieldFocusOrder.map((field: string, index: number) => 
  `  ${index + 1}. ${field}`
).join('\n')}

═══════════════════════════════════════════════════════════════════
🚨 RISK ASSESSMENT
═══════════════════════════════════════════════════════════════════
Overall Risk: ${risk.overallRisk}/100
Confidence: ${risk.confidence}%

${risk.flags.length > 0 ? '🚩 Risk Flags:' : '✅ No risk flags'}
${risk.flags.map((flag: string) => `• ${flag}`).join('\n')}

${risk.recommendations.length > 0 ? '💡 Recommendations:' : ''}
${risk.recommendations.map((rec: string) => `• ${rec}`).join('\n')}

═══════════════════════════════════════════════════════════════════
📍 LOCATION INTELLIGENCE
═══════════════════════════════════════════════════════════════════
${location ? `
IP Address: ${location.ip || 'Unknown'}
${location.isVPN ? `VPN Detected: ${location.vpnProvider || 'Unknown'}` : 'No VPN Detected'}

${location.address ? `
Approximate Location:
• City: ${location.address.city || 'Unknown'}
• State: ${location.address.state || 'Unknown'}
• Country: ${location.address.country || 'Unknown'}
• ZIP: ${location.address.zipCode || 'Unknown'}
` : ''}

${location.coordinates ? `
🎯 GPS Coordinates (User Allowed):
• Latitude: ${location.coordinates.latitude}
• Longitude: ${location.coordinates.longitude}
• Accuracy: ±${Math.round(location.coordinates.accuracy)} meters
• Google Maps: https://www.google.com/maps?q=${location.coordinates.latitude},${location.coordinates.longitude}
` : '📍 GPS: Not available (user denied)'}
` : 'Location data not available'}

═══════════════════════════════════════════════════════════════════
📱 USER CONTEXT
═══════════════════════════════════════════════════════════════════
Orientation: ${userContext?.orientation || 'Unknown'}
${userContext?.keyboardVisible ? '⌨️  Keyboard was visible' : ''}
${userContext?.batteryLevel ? `🔋 Battery: ${userContext.batteryLevel}%` : ''}
${userContext?.memoryStatus ? `💾 RAM: ${userContext.memoryStatus}GB` : ''}
${userContext?.online === false ? '⚠️  User was offline' : ''}

Viewport: ${userContext?.viewport?.width || 0}x${userContext?.viewport?.height || 0}
Pixel Ratio: ${userContext?.viewport?.pixelRatio || 1}

═══════════════════════════════════════════════════════════════════
🎯 FINAL ASSESSMENT
═══════════════════════════════════════════════════════════════════
Trust Score: ${100 - risk.overallRisk}/100
${risk.overallRisk > 70 ? '🚨 HIGH RISK - VERIFY MANUALLY' : 
  risk.overallRisk > 40 ? '⚠️  MEDIUM RISK - MONITOR CLOSELY' : 
  '✅ LOW RISK - PROCEED NORMALLY'}

Device Authenticity: ${device.isWebView || device.isInAppBrowser ? '⚠️  SUSPECT' : '✅ GENUINE'}
Network Reliability: ${mobileIntelligence.network.isFastNetwork ? '✅ STABLE' : '⚠️  UNSTABLE'}
Behavior Authenticity: ${mobileIntelligence.behavioral?.riskIndicators?.isBotLike ? '🤖 SUSPECT' : '👤 HUMAN-LIKE'}

═══════════════════════════════════════════════════════════════════
💡 RECOMMENDED ACTIONS
═══════════════════════════════════════════════════════════════════
${generateMobileRecommendations(risk, device, mobileIntelligence.behavioral)}
═══════════════════════════════════════════════════════════════════
`.trim();
}

function generateMobileRecommendations(risk: any, device: any, behavioral: any): string {
  const recommendations: string[] = [];
  
  if (risk.overallRisk > 70) {
    recommendations.push('• 🚨 REQUEST VIDEO VERIFICATION - High risk detected');
    recommendations.push('• 📞 VERIFY PHONE NUMBER WITH SMS CODE');
    recommendations.push('• 🔍 MANUAL REVIEW REQUIRED');
  } else if (risk.overallRisk > 40) {
    recommendations.push('• 📧 SEND EMAIL VERIFICATION LINK');
    recommendations.push('• ⚠️  FLAG FOR FOLLOW-UP MONITORING');
  } else {
    recommendations.push('• ✅ PROCEED WITH STANDARD PROCESSING');
  }
  
  if (device.isWebView || device.isInAppBrowser) {
    recommendations.push('• 📱 REQUEST USER TO OPEN IN STANDARD BROWSER');
  }
  
  if (device.isChineseROM && device.os === 'android') {
    recommendations.push('• 🇨🇳 BE AWARE OF POTENTIAL MODIFIED ROM');
  }
  
  if (behavioral?.riskIndicators?.isBotLike) {
    recommendations.push('• 🤖 IMPLEMENT CAPTCHA FOR FUTURE INTERACTIONS');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('• 📊 CONTINUE STANDARD MONITORING');
  }
  
  return recommendations.join('\n');
}

function generateMobileHTMLReport(data: MobileFormSubmission, type: string): string {
  // Generate HTML version for email
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mobile Intelligence Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #667eea;
    }
    .header h1 {
      color: #667eea;
      margin: 0;
      font-size: 24px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
      margin-top: 8px;
    }
    .section {
      margin-bottom: 25px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .section-title {
      color: #667eea;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .info-item {
      background: white;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
    .risk-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 8px;
      margin-bottom: 8px;
    }
    .risk-high {
      background: #ff6b6b;
      color: white;
    }
    .risk-medium {
      background: #ffd93d;
      color: #333;
    }
    .risk-low {
      background: #51cf66;
      color: white;
    }
    .answers {
      margin-top: 20px;
    }
    .answer-item {
      margin-bottom: 15px;
      padding: 15px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    .answer-question {
      font-weight: 600;
      color: #667eea;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .answer-value {
      color: #333;
      line-height: 1.5;
    }
    .recommendations {
      background: #e7f5ff;
      border-color: #339af0;
    }
    .recommendations .section-title {
      color: #339af0;
    }
    .recommendation-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 10px;
      padding: 10px;
      background: white;
      border-radius: 6px;
    }
    .recommendation-icon {
      font-size: 18px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      color: #666;
      font-size: 12px;
    }
    @media (max-width: 600px) {
      .container {
        padding: 15px;
      }
      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📱 Mobile Intelligence Report</h1>
      <div class="subtitle">
        ${type === 'mobile_pageload' ? 'Visitor Detected' : 'Form Completed'} • 
        ${new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
    
    ${generateHTMLSections(data, type)}
    
    <div class="footer">
      <p>Generated by Mobile Intelligence System • Session: ${data.sessionId}</p>
      <p>🚀 Enhanced mobile detection • 🔒 Privacy-focused • 📊 Real-time analytics</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateHTMLSections(data: MobileFormSubmission, type: string): string {
  // Generate HTML sections based on data type
  let sections = '';

  // For desktop types, return simple HTML
  if (type === 'pageload-enhanced' || type === 'form-enhanced') {
    return '<div class="section"><div class="section-title">Desktop Data</div><p>See email for full details</p></div>';
  }

  if (type === 'mobile_pageload' && data.mobileIntelligence) {
    sections = `
      <div class="section">
        <div class="section-title">📱 Device Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Device Type</div>
            <div class="info-value">${data.mobileIntelligence.device.type.toUpperCase()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Operating System</div>
            <div class="info-value">${data.mobileIntelligence.device.os.toUpperCase()} ${data.mobileIntelligence.device.osVersion || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Browser</div>
            <div class="info-value">${data.mobileIntelligence.device.browser.toUpperCase()} ${data.mobileIntelligence.device.browserVersion || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Manufacturer</div>
            <div class="info-value">${data.mobileIntelligence.device.manufacturer || 'Unknown'}</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">📡 Network Intelligence</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Connection Type</div>
            <div class="info-value">${data.mobileIntelligence.network.type.toUpperCase()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Cellular Generation</div>
            <div class="info-value">${data.mobileIntelligence.network.cellularType?.toUpperCase() || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Estimated Speed</div>
            <div class="info-value">${data.mobileIntelligence.network.estimatedSpeed.toFixed(1)} Mbps</div>
          </div>
          <div class="info-item">
            <div class="info-label">Data Saver</div>
            <div class="info-value">${data.mobileIntelligence.network.isLowDataMode ? 'Enabled' : 'Disabled'}</div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">🚨 Risk Assessment</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Overall Risk</div>
            <div class="info-value">
              <span class="risk-badge ${data.mobileIntelligence.risk.overallRisk > 70 ? 'risk-high' : 
                data.mobileIntelligence.risk.overallRisk > 40 ? 'risk-medium' : 'risk-low'}">
                ${data.mobileIntelligence.risk.overallRisk}/100
              </span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Confidence</div>
            <div class="info-value">${data.mobileIntelligence.risk.confidence}%</div>
          </div>
        </div>
      </div>
    `;
  } else if (data.mobileIntelligence) {
    // Form complete HTML
    sections = `
      <div class="section">
        <div class="section-title">📝 Form Responses</div>
        <div class="answers">
          ${Object.entries(data.answers || {}).map(([key, value]) => {
            const questionNum = key.replace('question', '');
            return `
              <div class="answer-item">
                <div class="answer-question">Question ${questionNum}</div>
                <div class="answer-value">${value || 'Not provided'}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">📊 Performance Analytics</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Total Time</div>
            <div class="info-value">${Math.round(data.formAnalytics.totalTime / 1000)} seconds</div>
          </div>
          <div class="info-item">
            <div class="info-label">Engagement Score</div>
            <div class="info-value">${data.formAnalytics.engagementScore}/100</div>
          </div>
          <div class="info-item">
            <div class="info-label">Corrections</div>
            <div class="info-value">${data.formAnalytics.corrections}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Input Method</div>
            <div class="info-value">${data.formAnalytics.inputMethod.toUpperCase()}</div>
          </div>
        </div>
      </div>
      
      <div class="section recommendations">
        <div class="section-title">💡 Recommendations</div>
        ${generateHTMLRecommendations(data.mobileIntelligence.risk, data.mobileIntelligence.device, data.mobileIntelligence.behavioral)}
      </div>
    `;
  }
  
  return sections;
}

function generateHTMLRecommendations(risk: any, device: any, behavioral: any): string {
  const recommendations: string[] = [];
  
  if (risk.overallRisk > 70) {
    recommendations.push('<div class="recommendation-item"><span class="recommendation-icon">🚨</span><div>Request video verification - High risk detected</div></div>');
    recommendations.push('<div class="recommendation-item"><span class="recommendation-icon">📞</span><div>Verify phone number with SMS code</div></div>');
  } else if (risk.overallRisk > 40) {
    recommendations.push('<div class="recommendation-item"><span class="recommendation-icon">📧</span><div>Send email verification link</div></div>');
  } else {
    recommendations.push('<div class="recommendation-item"><span class="recommendation-icon">✅</span><div>Proceed with standard processing</div></div>');
  }
  
  if (device.isWebView || device.isInAppBrowser) {
    recommendations.push('<div class="recommendation-item"><span class="recommendation-icon">📱</span><div>Request user to open in standard browser</div></div>');
  }
  
  if (behavioral?.riskIndicators?.isBotLike) {
    recommendations.push('<div class="recommendation-item"><span class="recommendation-icon">🤖</span><div>Implement CAPTCHA for future interactions</div></div>');
  }
  
  return recommendations.join('');
}// Desktop format functions to append to route.ts

function formatPageLoadEmail(data: any, formattedDate: string): string {
  const { location, behavioralAnalytics, deviceIntelligence, networkMetrics } = data;
  const fingerprint = deviceIntelligence?.fingerprint || {};
  const capabilities = deviceIntelligence?.capabilities || {};
  const connection = networkMetrics?.connection || {};

  return `
🚀 VISITOR DETECTED - Desktop/Web
═══════════════════════════════════════════════════════════════════
Timestamp: ${formattedDate}

📍 LOCATION DATA
═══════════════════════════════════════════════════════════════════
IP: ${location?.ip || 'Unknown'}
${location?.isVPN ? `VPN Detected: ${location?.vpnProvider || 'Unknown Provider'}` : 'No VPN Detected'}
${location?.address || 'Location not available'}
City: ${location?.city || 'Unknown'}
Country: ${location?.country || 'Unknown'}
Coordinates: ${location?.lat || '?'}, ${location?.lon || '?'}

🖥️ DEVICE INTELLIGENCE
═══════════════════════════════════════════════════════════════════
Screen Resolution: ${fingerprint?.screen?.width || '?'}x${fingerprint?.screen?.height || '?'}
Color Depth: ${fingerprint?.screen?.colorDepth || '?'} bits
Pixel Depth: ${fingerprint?.screen?.pixelDepth || '?'} bits
Timezone: ${fingerprint?.timezone || 'Unknown'}
Locale: ${fingerprint?.locale || 'Unknown'}
Hardware Concurrency: ${capabilities?.hardwareConcurrency || '?'} cores
Device Memory: ${capabilities?.deviceMemory || '?'} GB
Max Touch Points: ${capabilities?.maxTouchPoints || 0}
Cookie Enabled: ${capabilities?.cookieEnabled ? 'Yes' : 'No'}
Do Not Track: ${capabilities?.doNotTrack || 'Not set'}

🌐 NETWORK METRICS
═══════════════════════════════════════════════════════════════════
Connection Type: ${connection?.effectiveType || 'Unknown'}
Downlink: ${connection?.downlink || 'Unknown'} Mbps
RTT: ${connection?.rtt || 'Unknown'} ms
Save Data: ${connection?.saveData ? 'Enabled' : 'Disabled'}

🧠 BEHAVIORAL ANALYTICS
═══════════════════════════════════════════════════════════════════
Mouse Movements: ${behavioralAnalytics?.mouseMovements?.length || 0}
Key Presses: ${behavioralAnalytics?.keyPresses?.length || 0}
Time on Page: ${Math.round((behavioralAnalytics?.totalTime || 0) / 1000)}s
Tab Switches: ${behavioralAnalytics?.tabSwitches?.length || 0}
Copy Events: ${behavioralAnalytics?.interactionPattern?.copyCount || 0}
Paste Events: ${behavioralAnalytics?.interactionPattern?.pasteCount || 0}
Backspaces: ${behavioralAnalytics?.interactionPattern?.backspaces || 0}
Engagement Score: ${behavioralAnalytics?.interactionPattern?.engagementScore || 0}/100

═══════════════════════════════════════════════════════════════════
  `.trim();
}

function formatFormCompleteEmail(data: any, formattedDate: string): string {
  const { answers, location, behavioralAnalytics, deviceIntelligence, networkMetrics } = data;
  const fingerprint = deviceIntelligence?.fingerprint || {};
  const capabilities = deviceIntelligence?.capabilities || {};
  const questionTimes = behavioralAnalytics?.questionTimes || {};

  return `
✅ FORM COMPLETED - Desktop/Web
═══════════════════════════════════════════════════════════════════
Timestamp: ${formattedDate}

📝 FORM ANSWERS
═══════════════════════════════════════════════════════════════════
${answers ? Object.entries(answers).map(([key, value]) => `${key}: ${value}`).join('\n') : 'No answers'}

⏱️ QUESTION TIMES
═══════════════════════════════════════════════════════════════════
${Object.keys(questionTimes).length > 0 ? Object.entries(questionTimes).map(([q, time]) => `${q}: ${Math.round((time as number) / 1000)}s`).join('\n') : 'Not available'}

📍 LOCATION DATA
═══════════════════════════════════════════════════════════════════
IP: ${location?.ip || 'Unknown'}
${location?.isVPN ? `VPN Detected: ${location?.vpnProvider || 'Unknown Provider'}` : 'No VPN Detected'}
${location?.address || 'Location not available'}
City: ${location?.city || 'Unknown'}
Country: ${location?.country || 'Unknown'}

🖥️ DEVICE INTELLIGENCE
═══════════════════════════════════════════════════════════════════
Screen Resolution: ${fingerprint?.screen?.width || '?'}x${fingerprint?.screen?.height || '?'}
Timezone: ${fingerprint?.timezone || 'Unknown'}
Locale: ${fingerprint?.locale || 'Unknown'}
Hardware: ${capabilities?.hardwareConcurrency || '?'} cores, ${capabilities?.deviceMemory || '?'} GB RAM
WebGL Vendor: ${fingerprint?.webGLVendor || 'Unknown'}
WebGL Renderer: ${fingerprint?.webGLRenderer || 'Unknown'}
Canvas Fingerprint: ${fingerprint?.canvas ? 'Generated' : 'Not available'}
Audio Fingerprint: ${fingerprint?.audioFingerprint || 'Not available'}
Fonts Detected: ${fingerprint?.fonts?.length || 0} fonts

🧠 BEHAVIORAL ANALYTICS
═══════════════════════════════════════════════════════════════════
Total Form Time: ${Math.round((behavioralAnalytics?.totalTime || 0) / 1000)}s
Average Time per Question: ${Math.round((behavioralAnalytics?.interactionPattern?.timePerQuestion || 0) / 1000)}s
Mouse Movements: ${behavioralAnalytics?.mouseMovements?.length || 0}
Key Presses: ${behavioralAnalytics?.keyPresses?.length || 0}
Tab Switches: ${behavioralAnalytics?.interactionPattern?.tabSwitchCount || 0}
Copy Events: ${behavioralAnalytics?.interactionPattern?.copyCount || 0}
Paste Events: ${behavioralAnalytics?.interactionPattern?.pasteCount || 0}
Backspaces: ${behavioralAnalytics?.interactionPattern?.backspaces || 0}
Engagement Score: ${behavioralAnalytics?.interactionPattern?.engagementScore || 0}/100
Form Completion Rate: ${behavioralAnalytics?.interactionPattern?.formCompletionRate || 0}%

🌐 IP TRACKING HISTORY
═══════════════════════════════════════════════════════════════════
${networkMetrics?.ipHistory?.length > 0 ? networkMetrics.ipHistory.map((entry: any) => `${entry.timestamp}: ${entry.ip} (${entry.source})`).join('\n') : 'No IP changes detected'}

═══════════════════════════════════════════════════════════════════
  `.trim();
}

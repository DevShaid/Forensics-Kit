// app/api/keystroke-log/route.ts
// Download endpoint for keystroke logs

import { NextRequest, NextResponse } from 'next/server';
import { keystrokeStorage } from '@/lib/keystroke-storage';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session');

  if (!sessionId) {
    return new NextResponse('Missing session parameter', { status: 400 });
  }

  const data = keystrokeStorage.get(sessionId);

  if (!data) {
    return new NextResponse(
      `Keystroke log not found for session: ${sessionId}\n\nThis could mean:\n1. The session has expired (logs are kept for a limited time)\n2. The session ID is incorrect\n3. No keystrokes were captured for this session`,
      {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        }
      }
    );
  }

  // Return as downloadable text file
  const filename = `keystroke-log-${sessionId.slice(0, 20)}.txt`;

  return new NextResponse(data.report, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

// Also support viewing in browser (without download)
export async function POST(request: NextRequest) {
  try {
    const { sessionId, format } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const data = keystrokeStorage.get(sessionId);

    if (!data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (format === 'json') {
      return NextResponse.json({
        sessionId: data.sessionId,
        name: data.name,
        timestamp: data.timestamp,
        keystrokesLog: data.keystrokesLog,
        totalKeystrokes: data.keystrokesLog.length,
      });
    }

    return NextResponse.json({
      sessionId: data.sessionId,
      name: data.name,
      timestamp: data.timestamp,
      report: data.report,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

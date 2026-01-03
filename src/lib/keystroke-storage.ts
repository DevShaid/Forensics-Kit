// lib/keystroke-storage.ts
// Shared storage for keystroke logs

export interface KeystrokeData {
  sessionId: string;
  name: string;
  timestamp: string;
  keystrokesLog: Array<{ key: string; time: number }>;
  report: string;
}

// In-memory storage for keystroke logs (in production, use a database)
export const keystrokeStorage = new Map<string, KeystrokeData>();

// Clean up old entries (keep last 100)
export function cleanupStorage() {
  if (keystrokeStorage.size > 100) {
    const oldestKey = keystrokeStorage.keys().next().value;
    if (oldestKey) keystrokeStorage.delete(oldestKey);
  }
}

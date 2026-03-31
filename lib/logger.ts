import { db } from '@/lib/firebase';
import { ref, push } from 'firebase/database';

//interfaces for log types

// The shape of every log entry stored in the database
//add any other log level types into here
export type LogLevel = 'error' | 'warn' | 'info';

export interface LogEntry {
  timestamp: number; // Unix ms — used for sorting and display
  level: LogLevel;
  message: string;
  source?: string; // Where the log came from, e.g. "console.error" or "TrainingPage"
}

/**
 * Writes a log entry to /logs in Realtime Database.
 * `push()` creates a unique key for each entry so nothing ever overwrites another.
 *
 * Usage anywhere in the app:
 *   import { logEntry } from '@/lib/logger';
 *   logEntry('error', 'Something broke', 'MyComponent');
 *   logEntry('info', 'User signed in');
 */
export function logEntry(level: LogLevel, message: string, source?: string) {
  const logsRef = ref(db, 'logs');

  push(logsRef, {
    timestamp: Date.now(),
    level,
    message,
    source: source ?? 'app',
  }).catch(() => {
    // Silently swallow write failures — we never want the logger itself
    // to throw and trigger another log, causing an infinite loop.
  });
}

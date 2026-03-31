'use client';

import { useEffect } from 'react';
import { logEntry } from '@/lib/logger';

/**
 * In theory if I wanted more, I could add it to this file
 * LogProvider mounts once at the app root (inside layout.tsx) and sets up
 * three automatic log sources:
 *
 *  1. window 'error'            — uncaught JS errors (null access, etc.)
 *  2. window 'unhandledrejection' — promises that reject with no .catch()
 *  3. console.error / console.warn overrides — any explicit dev logs
 *
 * It doesn't render any UI — it just wraps children so it can run a useEffect.
 */
export default function LogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // --- 1. Uncaught JS errors ---
    // Fires when an unhandled exception propagates to the window level.
    // event.filename and event.lineno tell you exactly where it happened.
    const handleWindowError = (event: ErrorEvent) => {
      logEntry('error', event.message, `${event.filename}:${event.lineno}`);
    };

    // --- 2. Unhandled promise rejections ---
    // Fires when a Promise rejects and nothing catches it (missing .catch / await try-catch).
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message =
        event.reason instanceof Error ? event.reason.message : String(event.reason);
      logEntry('error', message, 'unhandledrejection');
    };

    // --- 3. console.error override ---
    // Save the real console.error first so we can still call it (the browser
    // DevTools still show the error normally) while also sending it to the DB.
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logEntry('error', args.map(String).join(' '), 'console.error');
      originalError.apply(console, args);
    };

    // Same pattern for console.warn
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      logEntry('warn', args.map(String).join(' '), 'console.warn');
      originalWarn.apply(console, args);
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup: restore the original console methods and remove listeners
    // when the component unmounts (e.g. during hot reload in development).
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []); // Empty array = run once on mount, clean up on unmount

  return <>{children}</>;
}

'use client'

import { useState, useEffect } from 'react';
import { ChevronLeft, Bug } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { ref, query, limitToLast, onValue } from 'firebase/database';
import type { LogEntry, LogLevel } from '@/lib/logger';

// Maps each tab label to the log levels it should display.
// 'All' has no filter — it shows everything.
const TAB_LEVELS: Record<string, LogLevel[]> = {
  Errors:   ['error'],
  Warnings: ['warn'],
  Info:     ['info'],
};

// Color coding so you can spot severity at a glance
const LEVEL_STYLES: Record<LogLevel, string> = {
  error: 'text-red-600 bg-red-50 border-red-100',
  warn:  'text-yellow-700 bg-yellow-50 border-yellow-100',
  info:  'text-blue-600 bg-blue-50 border-blue-100',
};

const LEVEL_LABEL: Record<LogLevel, string> = {
  error: 'ERR',
  warn:  'WARN',
  info:  'INFO',
};

export default function DebugPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const { isDev, loading } = useAuth();
  const router = useRouter();

  // Redirect non-dev users away from this page
  useEffect(() => {
    if (!loading && !isDev) {
      router.replace('/');
    }
  }, [loading, isDev, router]);

  // Subscribe to the most recent 200 log entries in Realtime Database.
  // onValue fires immediately with the current data, then again on every update —
  // so the page stays live without needing a manual refresh.
  useEffect(() => {
    if (!isDev) return;

    // limitToLast(200) means we only fetch the 200 newest entries,
    // so the page stays fast even if the log grows large over time.
    const logsQuery = query(ref(db, 'logs'), limitToLast(200));

    const unsubscribe = onValue(logsQuery, (snapshot) => {
      if (!snapshot.exists()) {
        setLogs([]);
        return;
      }

      // snapshot.val() returns an object keyed by the push() IDs Firebase generated.
      // We convert it to an array and sort newest-first for display.
      const data = snapshot.val() as Record<string, LogEntry>;
      const entries = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
      setLogs(entries);
    });

    // onValue returns an unsubscribe function — call it on cleanup to stop
    // listening when the component unmounts (avoids memory leaks).
    return () => unsubscribe();
  }, [isDev]);

  // Apply the active tab filter. 'All' skips filtering entirely.
  const filteredLogs =
    activeTab === 'All'
      ? logs
      : logs.filter((entry) => TAB_LEVELS[activeTab]?.includes(entry.level));

  if (loading || !isDev) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Debug Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Application errors, warnings, and diagnostic output</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['All', 'Errors', 'Warnings', 'Info'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              activeTab === tab
                ? 'bg-gray-900 border-gray-900 text-white ring-2 ring-gray-900 ring-offset-2'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Log Output</span>
          <span className="text-xs text-gray-400">{filteredLogs.length} entries</span>
        </div>

        {filteredLogs.length === 0 ? (
          // Empty state — shown when there are no logs (or none matching the filter)
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Bug size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No logs yet</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Errors, warnings, and info entries will appear here automatically as the app runs.
            </p>
          </div>
        ) : (
          // Log list — one row per entry, newest first
          <ul className="divide-y divide-gray-50">
            {filteredLogs.map((entry, i) => (
              <li key={i} className="px-5 py-3 flex items-start gap-3">
                {/* Severity badge */}
                <span className={`mt-0.5 shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${LEVEL_STYLES[entry.level]}`}>
                  {LEVEL_LABEL[entry.level]}
                </span>

                <div className="flex-1 min-w-0">
                  {/* The log message itself */}
                  <p className="text-sm text-gray-800 break-words">{entry.message}</p>

                  {/* Source + timestamp in a smaller line below the message */}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {entry.source && <span className="mr-2 font-medium">{entry.source}</span>}
                    {/* Convert the stored Unix timestamp to a readable local time */}
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

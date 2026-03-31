'use client'

import { useState, useEffect } from 'react';
import { ChevronLeft, Bug } from 'lucide-react';
import Link from 'next/link';
import { useRouter} from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DebugPage() {
  const [activeTab, setActiveTab] = useState('All');
  const {isDev, loading} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if(!loading && isDev){
      router.replace('/')
    }
  }, [loading, isDev, router]);
  
  if(!loading || !isDev) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Debug Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Application errors, warnings, and diagnostic output</p>
      </div>

      {/* Log type filter tabs */}
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

      {/* ── LOG OUTPUT GOES HERE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Log Output</span>
          <span className="text-xs text-gray-400">0 entries</span>
        </div>

        {/* Placeholder — replace this section with the real log list */}
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Bug size={22} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">Logs will appear here</p>
          <p className="text-xs text-gray-400 max-w-xs">
            Connect a log source to populate this view. Each entry should show a timestamp, severity level, and message.
          </p>
          {/* TODO: map over log entries and render them here */}
        </div>
        {/* ── END LOG OUTPUT ── */}
      </div>
    </div>
  );
}

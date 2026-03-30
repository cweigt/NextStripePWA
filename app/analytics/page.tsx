'use client'

import Graphs from '@/components/Graphs';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { auth, db } from '@/lib/firebase';

export default function AnalyticsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Please sign in to view analytics.</div>;
  }
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 overflow-x-hidden">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Insights into your training patterns</p>
      </div>
      <Graphs />
    </div>
  );
}

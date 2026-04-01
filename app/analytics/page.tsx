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
    <div className="min-h-screen pb-24 overflow-x-hidden">
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-full hover:bg-gray-100">
            <ChevronLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Graphs />
      </div>
    </div>
  );
}

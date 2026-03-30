'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ChevronRight, Palette, User } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Please sign in to view settings.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter-up">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Link
          href="/settings/account"
          className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Account</p>
            <p className="text-xs text-gray-400 truncate">{user?.email ?? 'Profile, belt rank, and more'}</p>
          </div>
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        </Link>

        <div className="h-px bg-gray-100 mx-5" />

        <Link
          href="/settings/appearance"
          className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Palette size={18} className="text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Appearance</p>
            <p className="text-xs text-gray-400">Theme and display preferences</p>
          </div>
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
}

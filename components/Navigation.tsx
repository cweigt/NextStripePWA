'use client';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  BarChart2,
  BookOpen,
  Calendar,
  Home,
  LayoutDashboard,
  LogIn,
  Settings,
  Target,
  Bandage,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/training', label: 'Training', icon: Home },
  { href: '/injury', label: 'Injury', icon: Bandage},
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/challenges', label: 'Challenges', icon: Target },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const MOBILE_HIDDEN_ROUTES = new Set(['/training', '/analytics', '/injury']);

export default function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-blue-600">NextStripe</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                  active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User badge */}
        {!loading && (
          <div className="px-4 py-3 border-t border-gray-200">
            {user ? (
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            ) : (
              <Link
                href="/auth"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <LogIn size={16} /> Sign in
              </Link>
            )}
          </div>
        )}
      </aside>

      {/* Main content */}
      <main key={pathname} className="flex-1 min-w-0 overflow-x-hidden md:ml-56 pb-28 md:pb-0 min-h-screen page-enter-right">
        {children}
      </main>

      {/* Bottom tabs — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 pb-safe">
        <div className="flex items-center justify-around h-16 pb-2">
          {NAV_ITEMS.filter(({ href }) => !MOBILE_HIDDEN_ROUTES.has(href)).map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-1 py-1 text-[10px]',
                  active ? 'text-blue-600' : 'text-gray-500'
                )}
              >
                <Icon size={19} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

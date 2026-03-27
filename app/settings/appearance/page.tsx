'use client';

import { ArrowLeft, Monitor, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', shouldBeDark);
  localStorage.setItem('theme', theme);
}

const THEME_OPTIONS: { id: Theme; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'light', label: 'Light', icon: Sun, description: 'Always use light mode' },
  { id: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark mode' },
  { id: 'system', label: 'System', icon: Monitor, description: 'Match your device setting' },
];

export default function AppearancePage() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/settings"
        className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 mb-6"
      >
        <ArrowLeft size={16} /> Settings
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Appearance</h1>

      {/* Theme section */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Theme</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {THEME_OPTIONS.map((option, i) => {
          const Icon = option.icon;
          const active = theme === option.id;
          return (
            <div key={option.id}>
              {i > 0 && <div className="h-px bg-gray-100 mx-5" />}
              <button
                onClick={() => handleThemeChange(option.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Icon size={18} className={active ? 'text-blue-500' : 'text-gray-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-400">{option.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'border-blue-500' : 'border-gray-300'}`}>
                  {active && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

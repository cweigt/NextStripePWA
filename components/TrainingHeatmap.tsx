'use client';

import { useMemo } from 'react';
import { Flame } from 'lucide-react';

interface Session {
  id: string;
  date?: string;
}

interface Props {
  sessions: Session[];
}

function parseToYMD(dateStr: string): string {
  if (dateStr.includes('/')) {
    const [m, d, y] = dateStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return dateStr.split('T')[0];
}

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getIntensityClass(count: number): string {
  if (count === 0) return 'bg-gray-100';
  if (count === 1) return 'bg-blue-200';
  if (count === 2) return 'bg-blue-400';
  return 'bg-blue-600';
}

export default function TrainingHeatmap({ sessions }: Props) {
  const { dateMap, currentStreak, longestStreak, totalActiveDays, weeks, monthLabels } = useMemo(() => {
    // Build date → session count map
    const dateMap: Record<string, number> = {};
    sessions.forEach((s) => {
      if (!s.date) return;
      const ymd = parseToYMD(s.date);
      dateMap[ymd] = (dateMap[ymd] || 0) + 1;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Current streak: allow for "streak still alive" if trained today or yesterday
    let currentStreak = 0;
    const todayYMD = toYMD(today);
    const yesterdayYMD = toYMD(addDays(today, -1));
    if (dateMap[todayYMD] || dateMap[yesterdayYMD]) {
      let check = dateMap[todayYMD] ? new Date(today) : addDays(today, -1);
      while (dateMap[toYMD(check)]) {
        currentStreak++;
        check = addDays(check, -1);
      }
    }

    // Longest streak: scan sorted dates
    const allDates = Object.keys(dateMap).sort();
    let longest = 0;
    let run = 0;
    let prev: Date | null = null;
    allDates.forEach((ymd) => {
      const d = new Date(ymd + 'T00:00:00');
      if (prev) {
        const diff = Math.round((d.getTime() - prev.getTime()) / 86400000);
        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      longest = Math.max(longest, run);
      prev = d;
    });

    // Build calendar-year grid (Jan 1 – Dec 31 of current year)
    const year = today.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);

    // Pad to the nearest Sunday on or before Jan 1
    const startDate = addDays(jan1, -jan1.getDay());
    // Pad to the nearest Saturday on or after Dec 31
    const endDate = addDays(dec31, 6 - dec31.getDay());

    const weeks: Array<Array<{ date: Date; ymd: string; isFuture: boolean; outOfYear: boolean }>> = [];
    let cursor = new Date(startDate);
    while (cursor <= endDate) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(cursor);
        week.push({
          date,
          ymd: toYMD(date),
          isFuture: date > today,
          outOfYear: date.getFullYear() !== year,
        });
        cursor = addDays(cursor, 1);
      }
      weeks.push(week);
    }

    // Month labels: one per month, placed at the first week containing the 1st of that month
    const seenMonths = new Set<string>();
    const monthLabels: { label: string; col: number }[] = [];
    weeks.forEach((week, col) => {
      week.forEach((day) => {
        if (day.outOfYear || day.isFuture) return;
        if (day.date.getDate() <= 7) {
          const key = `${day.date.getFullYear()}-${day.date.getMonth()}`;
          if (!seenMonths.has(key)) {
            seenMonths.add(key);
            monthLabels.push({
              label: day.date.toLocaleString('default', { month: 'short' }),
              col,
            });
          }
        }
      });
    });

    return {
      dateMap,
      currentStreak,
      longestStreak: longest,
      totalActiveDays: allDates.filter((d) => d.startsWith(String(today.getFullYear()))).length,
      weeks,
      monthLabels,
    };
  }, [sessions]);

  const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-base font-semibold text-gray-800 mb-5">
        Training Activity <span className="text-gray-400 font-normal">{new Date().getFullYear()}</span>
      </h3>

      {/* Streak stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <p className="text-2xl font-bold text-blue-600">{currentStreak}</p>
            {currentStreak >= 3 && <Flame size={18} className="text-orange-400" />}
          </div>
          <p className="text-xs text-gray-500">Current Streak</p>
          <p className="text-xs text-gray-400">days</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-800 mb-0.5">{longestStreak}</p>
          <p className="text-xs text-gray-500">Best Streak</p>
          <p className="text-xs text-gray-400">days</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-800 mb-0.5">{totalActiveDays}</p>
          <p className="text-xs text-gray-500">Active Days</p>
          <p className="text-xs text-gray-400">this year</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="inline-flex gap-1 min-w-max">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-[3px] pr-1 mt-5">
            {DAY_INITIALS.map((label, i) => (
              <div
                key={i}
                className="h-[11px] flex items-center text-gray-400"
                style={{ fontSize: 9 }}
              >
                {i % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>

          {/* Columns */}
          <div>
            {/* Month labels row */}
            <div className="flex gap-[3px] mb-1 h-4">
              {weeks.map((_, col) => {
                const found = monthLabels.find((m) => m.col === col);
                return (
                  <div key={col} className="w-[11px] relative">
                    {found && (
                      <span
                        className="absolute left-0 top-0 text-gray-400 whitespace-nowrap"
                        style={{ fontSize: 9 }}
                      >
                        {found.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Week columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week, col) => (
                <div key={col} className="flex flex-col gap-[3px]">
                  {week.map((day) => {
                    const count = dateMap[day.ymd] || 0;
                    const inactive = day.isFuture || day.outOfYear;
                    const label = inactive
                      ? ''
                      : `${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: ${count} session${count !== 1 ? 's' : ''}`;
                    return (
                      <div
                        key={day.ymd}
                        title={label}
                        className={`w-[11px] h-[11px] rounded-[2px] cursor-default transition-opacity hover:opacity-70 ${
                          inactive ? 'bg-transparent' : getIntensityClass(count)
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-gray-400" style={{ fontSize: 10 }}>Less</span>
        {(['bg-gray-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-600'] as const).map((c) => (
          <div key={c} className={`w-[11px] h-[11px] rounded-[2px] ${c}`} />
        ))}
        <span className="text-gray-400" style={{ fontSize: 10 }}>More</span>
      </div>
    </div>
  );
}

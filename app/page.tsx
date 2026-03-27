//this is the main home page where everything is at, including the dashboard
'use client';

import EditCompModal from '@/components/EditCompModal';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { BarChart2, Calendar, Flame, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { get, onValue, ref, set } from 'firebase/database';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const uid = user?.uid;

  const [sessionCount, setSessionCount] = useState(0);
  const [totalHours, setTotalHours] = useState('0');
  const [averageRating, setAverageRating] = useState('0');
  const [recentDate, setRecentDate] = useState('');
  const [daysSinceLast, setDaysSinceLast] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [maxHours, setMaxHours] = useState('');
  const [winCount, setWinCount] = useState(0);
  const [lossCount, setLossCount] = useState(0);
  const [submissionWins, setSubmissionWins] = useState(0);
  const [pointsWins, setPointsWins] = useState(0);
  const [submissionLosses, setSubmissionLosses] = useState(0);
  const [pointsLosses, setPointsLosses] = useState(0);
  const [quote, setQuote] = useState('');
  const [compModal, setCompModal] = useState<{ open: boolean; type: 'win' | 'loss' }>({
    open: false,
    type: 'win',
  });

  useEffect(() => {
    if (!uid) return;

    const unsubs: (() => void)[] = [];

    // Sessions listener
    const sessRef = ref(db, `users/${uid}/sessions`);
    unsubs.push(
      onValue(sessRef, (snap) => {
        if (snap.exists()) {
          const sessions = Object.values(snap.val()) as any[];
          setSessionCount(sessions.length);
          const hrs = sessions.reduce((s, se) => s + (parseFloat(se.duration) || 0), 0);
          setTotalHours(hrs.toFixed(1));
          const avgQ = sessions.reduce((s, se) => s + (parseFloat(se.qualityLevel) || 0), 0) / sessions.length;
          setAverageRating(avgQ.toFixed(1));

          // Build date set (YYYY-MM-DD) for streak calculations
          const dateSet: Record<string, boolean> = {};
          sessions.forEach((se: any) => {
            if (!se.date) return;
            const parts = se.date.includes('/') ? se.date.split('/') : null;
            if (!parts) return;
            const [m, d, y] = parts;
            dateSet[`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`] = true;
          });

          const addDays = (date: Date, n: number) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; };
          const toYMD = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
          };

          const today = new Date(); today.setHours(0, 0, 0, 0);
          let streak = 0;
          if (dateSet[toYMD(today)] || dateSet[toYMD(addDays(today, -1))]) {
            let check = dateSet[toYMD(today)] ? new Date(today) : addDays(today, -1);
            while (dateSet[toYMD(check)]) { streak++; check = addDays(check, -1); }
          }
          setCurrentStreak(streak);

          const sortedDates = Object.keys(dateSet).sort();
          let longest = 0; let run = 0; let prev: Date | null = null;
          sortedDates.forEach((ymd) => {
            const d = new Date(ymd + 'T00:00:00');
            if (prev) {
              const diff = Math.round((d.getTime() - prev.getTime()) / 86400000);
              run = diff === 1 ? run + 1 : 1;
            } else { run = 1; }
            longest = Math.max(longest, run);
            prev = d;
          });
          setLongestStreak(longest);
        } else {
          setSessionCount(0); setTotalHours('0'); setAverageRating('0');
          setCurrentStreak(0); setLongestStreak(0);
        }
      })
    );

    const listen = (path: string, setter: (v: any) => void) => {
      const r = ref(db, `users/${uid}/${path}`);
      unsubs.push(onValue(r, (snap) => setter(snap.exists() ? snap.val() : null)));
    };

    listen('records/maxHours', (v) => setMaxHours(v ?? 'N/A'));
    listen('comp/wins', (v) => setWinCount(v ?? 0));
    listen('comp/losses', (v) => setLossCount(v ?? 0));
    listen('comp/submissionWins', (v) => setSubmissionWins(v ?? 0));
    listen('comp/pointsWins', (v) => setPointsWins(v ?? 0));
    listen('comp/submissionLosses', (v) => setSubmissionLosses(v ?? 0));
    listen('comp/pointsLosses', (v) => setPointsLosses(v ?? 0));

    listen('mostRecentDate/lastTrained', (v) => {
      if (!v) { setRecentDate(''); setDaysSinceLast(null); return; }
      setRecentDate(v);
      const [m, d, y] = v.split('/').map(Number);
      const recent = new Date(y, m - 1, d);
      const today = new Date(); today.setHours(0,0,0,0); recent.setHours(0,0,0,0);
      setDaysSinceLast(Math.floor((today.getTime() - recent.getTime()) / 86400000));
    });

    // Daily quote
    (async () => {
      const quoteRef = ref(db, `users/${uid}/dailyQuote/quote`);
      const dateRef = ref(db, `users/${uid}/dailyQuote/date`);
      const today = new Date().toISOString().split('T')[0];
      const dateSnap = await get(dateRef);
      if (dateSnap.exists() && dateSnap.val() === today) {
        const qSnap = await get(quoteRef);
        if (qSnap.exists()) { setQuote(qSnap.val()); return; }
      }
      try {
        const res = await fetch('/api/quote');
        const data = await res.json();
        const q = Array.isArray(data) && data[0] ? (data[0].a ? `${data[0].q} — ${data[0].a}` : data[0].q) : 'Keep training hard!';
        setQuote(q);
        await set(quoteRef, q);
        await set(dateRef, today);
      } catch {
        setQuote('The mat is the great equalizer. Keep showing up.');
      }
    })();

    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const handleCompSave = async (method: 'points' | 'submission') => {
    if (!uid) return;
    const type = compModal.type;

    if (type === 'win') {
      const newTotal = winCount + 1;
      await set(ref(db, `users/${uid}/comp/wins`), newTotal);
      if (method === 'submission') await set(ref(db, `users/${uid}/comp/submissionWins`), submissionWins + 1);
      else await set(ref(db, `users/${uid}/comp/pointsWins`), pointsWins + 1);
    } else {
      const newTotal = lossCount + 1;
      await set(ref(db, `users/${uid}/comp/losses`), newTotal);
      if (method === 'submission') await set(ref(db, `users/${uid}/comp/submissionLosses`), submissionLosses + 1);
      else await set(ref(db, `users/${uid}/comp/pointsLosses`), pointsLosses + 1);
    }
    setCompModal({ open: false, type: 'win' });
  };

  const decrement = async (path: string, current: number, setter: (v: number) => void) => {
    if (!uid || current <= 0) return;
    const next = current - 1;
    await set(ref(db, `users/${uid}/${path}`), next);
    setter(next);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 px-4">
        <h2 className="text-xl font-semibold text-gray-800">Welcome to NextStripe</h2>
        <p className="text-gray-500 text-sm text-center">Sign in to track your BJJ training journey</p>
        <Link href="/auth" className="px-6 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600">
          Sign In / Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {user.displayName || 'Athlete'}!</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6 mobile-only">
        <Link href="/training" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors">
          <Calendar size={16} /> Training Log
        </Link>
        <Link href="/analytics" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors">
          <BarChart2 size={16} /> View Analytics
        </Link>
      </div>

      {/* Daily Inspiration */}
      {quote && (
        <div className="bg-white border-l-4 border-blue-500 rounded-xl p-4 mb-5 shadow-sm">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Daily Inspiration</p>
          {(() => {
            const dashIdx = quote.lastIndexOf(' — ');
            const text = dashIdx !== -1 ? quote.slice(0, dashIdx) : quote;
            const author = dashIdx !== -1 ? quote.slice(dashIdx + 3) : null;
            return (
              <>
                <p className="text-sm text-gray-700 italic leading-relaxed">"{text}"</p>
                {author && <p className="text-xs text-gray-500 mt-1.5">— {author}</p>}
              </>
            );
          })()}
        </div>
      )}

      {/* Training Stats */}
      <section className="mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Training Stats</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: totalHours, label: 'Hours' },
            { value: sessionCount, label: 'Sessions' },
            { value: `${averageRating}/10`, label: 'Avg Quality' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
        {recentDate && (
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 mt-3">
            <p className="text-lg font-bold text-gray-900">{recentDate}</p>
            {daysSinceLast !== null && (
              <p className="text-xs text-gray-500 italic">
                <span className="font-bold">{daysSinceLast}</span> day{daysSinceLast !== 1 ? 's' : ''} ago
              </p>
            )}
            <p className="text-xs text-gray-500">Last Trained</p>
          </div>
        )}
      </section>

      {/* Training Streak */}
      {(currentStreak > 0 || longestStreak > 0) && (
        <section className="mb-5">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            <Flame size={16} className="inline mr-1 text-orange-400" />
            Streak
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
              <div className="flex items-center justify-center gap-1">
                <p className="text-xl font-bold text-blue-600">{currentStreak}</p>
                {currentStreak >= 3 && <Flame size={16} className="text-orange-400" />}
              </div>
              <p className="text-xs text-gray-500 mt-1">Current Streak</p>
              <p className="text-xs text-gray-400">days</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
              <p className="text-xl font-bold text-gray-900">{longestStreak}</p>
              <p className="text-xs text-gray-500 mt-1">Best Streak</p>
              <p className="text-xs text-gray-400">days</p>
            </div>
          </div>
        </section>
      )}

      {/* Competition Stats */}
      <section className="mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          <Trophy size={16} className="inline mr-1 text-yellow-500" />
          Competition Stats
        </h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <button
            onClick={() => setCompModal({ open: true, type: 'win' })}
            className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 hover:bg-gray-50 hover:border-green-200 transition-colors"
          >
            <p className="text-xs text-gray-400 italic mb-0.5">Add Result</p>
            <p className="text-xl font-bold text-green-500">{winCount}</p>
            <p className="text-xs text-gray-500">Wins</p>
          </button>
          <button
            onClick={() => decrement('comp/wins', winCount, setWinCount).then(() => decrement('comp/submissionWins', submissionWins, setSubmissionWins))}
            className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 hover:bg-gray-50 hover:border-green-100 transition-colors"
          >
            <p className="text-xs text-gray-400 italic mb-0.5">Click to Undo</p>
            <p className="text-xl font-bold text-green-400">{submissionWins}</p>
            <p className="text-xs text-gray-500">Sub Wins</p>
          </button>
          <button
            onClick={() => decrement('comp/wins', winCount, setWinCount).then(() => decrement('comp/pointsWins', pointsWins, setPointsWins))}
            className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 hover:bg-gray-50 hover:border-green-100 transition-colors"
          >
            <p className="text-xs text-gray-400 italic mb-0.5">Click to Undo</p>
            <p className="text-xl font-bold text-green-400">{pointsWins}</p>
            <p className="text-xs text-gray-500">Points Wins</p>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setCompModal({ open: true, type: 'loss' })}
            className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 hover:bg-gray-50 hover:border-red-200 transition-colors"
          >
            <p className="text-xs text-gray-400 italic mb-0.5">Add Result</p>
            <p className="text-xl font-bold text-red-500">{lossCount}</p>
            <p className="text-xs text-gray-500">Losses</p>
          </button>
          <button
            onClick={() => decrement('comp/losses', lossCount, setLossCount).then(() => decrement('comp/submissionLosses', submissionLosses, setSubmissionLosses))}
            className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 hover:bg-gray-50 hover:border-red-100 transition-colors"
          >
            <p className="text-xs text-gray-400 italic mb-0.5">Click to Undo</p>
            <p className="text-xl font-bold text-red-400">{submissionLosses}</p>
            <p className="text-xs text-gray-500">Sub Losses</p>
          </button>
          <button
            onClick={() => decrement('comp/losses', lossCount, setLossCount).then(() => decrement('comp/pointsLosses', pointsLosses, setPointsLosses))}
            className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 hover:bg-gray-50 hover:border-red-100 transition-colors"
          >
            <p className="text-xs text-gray-400 italic mb-0.5">Click to Undo</p>
            <p className="text-xl font-bold text-red-400">{pointsLosses}</p>
            <p className="text-xs text-gray-500">Points Losses</p>
          </button>
        </div>
      </section>

      {/* Personal Records */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Personal Records</h2>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <p className="text-xl font-bold text-gray-900">{maxHours}</p>
          <p className="text-xs text-gray-500">Most Hours in a Session</p>
        </div>
      </section>

      <EditCompModal
        isOpen={compModal.open}
        resultType={compModal.type}
        onClose={() => setCompModal({ open: false, type: 'win' })}
        onSave={handleCompSave}
      />
    </div>
  );
}

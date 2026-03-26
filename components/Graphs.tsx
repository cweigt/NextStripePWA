'use client';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { onValue, ref } from 'firebase/database';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Session {
  id: string;
  tags?: string[] | Record<string, string>;
  qualityLevel?: string;
  duration?: string;
  date?: string;
}

function buildTagData(sessions: Session[]) {
  const freq: Record<string, number> = {};
  const total = sessions.length;
  sessions.forEach((s) => {
    const tags = Array.isArray(s.tags) ? s.tags : Object.values(s.tags || {});
    tags.forEach((t) => {
      if (typeof t === 'string' && t.trim()) freq[t] = (freq[t] || 0) + 1;
    });
  });
  return Object.entries(freq)
    .map(([tag, count]) => ({ tag, count, pct: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0 }))
    .sort((a, b) => b.pct - a.pct);
}

const COLORS = [
  '#3b82f6','#6366f1','#8b5cf6','#ec4899','#f97316',
  '#eab308','#22c55e','#14b8a6','#06b6d4','#0ea5e9',
];

export default function Graphs() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    const unsub = onValue(ref(db, `users/${user.uid}/sessions`), (snap) => {
      if (snap.exists()) {
        const raw = snap.val() as Record<string, any>;
        setSessions(Object.entries(raw).map(([id, s]) => ({ id, ...s })));
      } else {
        setSessions([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const tagData = useMemo(() => buildTagData(sessions), [sessions]);

  const qualityData = useMemo(() => {
    const byMonth: Record<string, { total: number; count: number }> = {};
    sessions.forEach((s) => {
      if (!s.date) return;
      const d = s.date.includes('/') ? s.date.split('/') : null;
      if (!d) return;
      const key = `${d[2]}-${d[0].padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { total: 0, count: 0 };
      byMonth[key].total += parseFloat(s.qualityLevel || '0');
      byMonth[key].count += 1;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, { total, count }]) => ({
        month,
        avg: parseFloat((total / count).toFixed(1)),
      }));
  }, [sessions]);

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading analytics…</div>;
  }

  return (
    <div className="space-y-8 p-6">
      {/* Technique frequency */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Technique Frequency</h3>
        {tagData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Log sessions with tags to see technique stats
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tagData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="tag" tick={{ fontSize: 11 }} width={130} />
              <Tooltip
                formatter={(value, _name, props) => [`${value}% (${props.payload.count} sessions)`, 'Frequency']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {tagData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Average quality per month */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Avg Session Quality (Last 6 Months)</h3>
        {qualityData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Not enough session data yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={qualityData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value}/10`, 'Avg Quality']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

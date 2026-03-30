'use client';

import AddSessionModal from '@/components/AddSessionModal';
import EditSessionModal from '@/components/EditSessionModal';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { ChevronLeft, ChevronUp, Filter, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { get, ref, remove, set } from 'firebase/database';

interface Session {
  id: string;
  title: string;
  date: string;
  duration: string;
  notes: string;
  tags: string[];
  qualityLevel: string;
  createdAt?: string;
}

function parseDate(d: string): number {
  if (!d) return 0;
  if (d.includes('/')) {
    const [m, day, y] = d.split('/').map(Number);
    return new Date(y, m - 1, day).getTime();
  }
  return new Date(d).getTime();
}

export default function TrainingPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showTop, setShowTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    get(ref(db, `users/${user.uid}/sessions`)).then((snap) => {
      if (snap.exists()) {
        const arr: Session[] = Object.entries(snap.val() as Record<string, any>).map(([id, s]) => ({
          id, ...s, tags: Array.isArray(s.tags) ? s.tags : Object.values(s.tags || {}),
        }));
        setSessions(arr.sort((a, b) => parseDate(b.date) - parseDate(a.date)));
      }
      setLoading(false);
    });
  }, [user?.uid]);

  const availableTags = useMemo(() => {
    const s = new Set<string>();
    sessions.forEach((sess) => sess.tags?.forEach((t) => t && s.add(t)));
    return Array.from(s).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    if (!selectedTags.size) return sessions;
    return sessions.filter((s) => s.tags?.some((t) => selectedTags.has(t)));
  }, [sessions, selectedTags]);

  const toggleTag = (t: string) => setSelectedTags((p) => { const n = new Set(p); n.has(t) ? n.delete(t) : n.add(t); return n; });

  const handleSave = async (data: Omit<Session, 'id' | 'createdAt'>) => {
    if (!user?.uid) return;
    const id = Date.now().toString();
    const newSession: Session = { id, ...data, createdAt: new Date().toISOString() };

    await set(ref(db, `users/${user.uid}/sessions/${id}`), {
      title: data.title, date: data.date, duration: data.duration,
      notes: data.notes, qualityLevel: data.qualityLevel, tags: data.tags,
      createdAt: newSession.createdAt,
    });

    const updated = [newSession, ...sessions].sort((a, b) => parseDate(b.date) - parseDate(a.date));
    setSessions(updated);

    // Update records
    const maxHrs = updated.reduce((m, s) => Math.max(m, parseFloat(s.duration) || 0), 0);
    await set(ref(db, `users/${user.uid}/records`), { maxHours: maxHrs });
    const mostRecent = updated[0]?.date ?? 'NA';
    await set(ref(db, `users/${user.uid}/mostRecentDate`), { lastTrained: mostRecent });
    await set(ref(db, `users/${user.uid}/sessionCount`), updated.length);

    setAddOpen(false);
  };

  const handleUpdate = async (id: string, data: Omit<Session, 'id'>) => {
    if (!user?.uid) return;
    const existing = sessions.find((s) => s.id === id);
    await set(ref(db, `users/${user.uid}/sessions/${id}`), {
      title: data.title, date: data.date, duration: data.duration,
      notes: data.notes, qualityLevel: data.qualityLevel, tags: data.tags,
      ...(data.createdAt !== undefined ? { createdAt: data.createdAt } : existing?.createdAt !== undefined ? { createdAt: existing.createdAt } : {}),
    });
    setSessions((p) => p.map((s) => s.id === id ? { ...s, ...data } : s));
  };

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;
    await remove(ref(db, `users/${user.uid}/sessions/${id}`));
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    const maxHrs = updated.reduce((m, s) => Math.max(m, parseFloat(s.duration) || 0), 0);
    await set(ref(db, `users/${user.uid}/records`), { maxHours: maxHrs });
    const mostRecent = updated[0]?.date ?? 'NA';
    await set(ref(db, `users/${user.uid}/mostRecentDate`), { lastTrained: mostRecent });
    await set(ref(db, `users/${user.uid}/sessionCount`), updated.length);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">Please sign in to view your training log.</div>
    );

  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" ref={scrollRef}>
      {/* Header */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Training Log</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
        >
          <Plus size={16} /> Add Session
        </button>
      </div>

      {/* Filter bar */}
      <div className="mb-4">
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50"
        >
          <Filter size={14} /> Filter by tag {filterOpen ? '▲' : '▼'}
          {selectedTags.size > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedTags.size}
            </span>
          )}
        </button>

        {filterOpen && (
          <div className="mt-2 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex flex-wrap gap-2 mb-3">
              {availableTags.length === 0 ? (
                <p className="text-sm text-gray-400">No tags in your sessions yet</p>
              ) : (
                availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedTags.has(tag) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))
              )}
            </div>
            {selectedTags.size > 0 && (
              <button onClick={() => setSelectedTags(new Set())} className="text-xs text-gray-500 hover:text-gray-700">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sessions list */}
      {loading ? (
        <p className="text-center text-gray-400 py-12">Loading sessions…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">{sessions.length === 0 ? 'No sessions yet' : 'No sessions match your filters'}</p>
          <p className="text-sm">
            {sessions.length === 0 ? 'Tap "+ Add Session" to log your first training session!' : 'Try clearing your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => (
            <button
              key={session.id}
              onClick={() => setEditing(session)}
              className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:border-blue-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{session.title || 'Untitled Session'}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{session.date}</span>
                    <span>{session.duration}h</span>
                    <span className="font-medium text-blue-600">{session.qualityLevel}/10</span>
                  </div>
                  {session.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {session.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {session.tags.length > 4 && (
                        <span className="text-xs text-gray-400">+{session.tags.length - 4}</span>
                      )}
                    </div>
                  )}
                  {session.notes && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{session.notes}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Floating add button (mobile) */}
      <button
        onClick={() => setAddOpen(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
      >
        <Plus size={24} className="text-white" />
      </button>

      <AddSessionModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSave={handleSave} />
      <EditSessionModal session={editing} onClose={() => setEditing(null)} onSave={handleUpdate} onDelete={handleDelete} />
    </div>
  );
}

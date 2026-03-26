'use client';

import { TAGS } from '@/constants/tags';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import StarRating from './StarRating';

interface Session {
  id: string;
  title: string;
  date: string;
  duration: string;
  notes: string;
  tags: string[];
  qualityLevel: string;
}

interface Props {
  session: Session | null;
  onClose: () => void;
  onSave: (id: string, data: Omit<Session, 'id'>) => void;
  onDelete: (id: string) => void;
}

function toInputDate(d: string): string {
  if (!d) return '';
  if (d.includes('/')) {
    const [m, day, y] = d.split('/');
    return `${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return d;
}

export default function EditSessionModal({ session, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [quality, setQuality] = useState(0);
  const [summarizing, setSummarizing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSummarize = async () => {
    if (!notes.trim()) return;
    setSummarizing(true);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.summary) setNotes(data.summary);
    } finally {
      setSummarizing(false);
    }
  };

  useEffect(() => {
    if (session) {
      setTitle(session.title || '');
      setDate(toInputDate(session.date));
      setDuration(session.duration || '');
      setNotes(session.notes || '');
      setSelectedTags(new Set(session.tags || []));
      setQuality(parseFloat(session.qualityLevel) || 0);
      setConfirmDelete(false);
    }
  }, [session]);

  if (!session) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const handleSave = () => {
    const [y, m, d] = date.split('-');
    const formattedDate = `${m}/${d}/${y}`;
    onSave(session.id, {
      title,
      date: formattedDate,
      duration,
      notes,
      tags: Array.from(selectedTags),
      qualityLevel: quality.toString(),
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Edit Session</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="0"
              step="0.25"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality: <span className="text-blue-600 font-semibold">{quality}/10</span>
            </label>
            <StarRating value={quality} onChange={setQuality} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTags.has(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <button
                type="button"
                onClick={handleSummarize}
                disabled={summarizing || !notes.trim()}
                className="text-xs font-medium text-blue-500 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {summarizing ? 'Summarizing…' : 'Summarize'}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {confirmDelete ? (
          <div className="p-5 border-t border-gray-100 space-y-3">
            <p className="text-sm text-gray-700 font-medium">Delete this session?</p>
            <p className="text-xs text-gray-400">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(session.id); onClose(); }}
                className="flex-1 py-2.5 bg-red-500 rounded-lg text-sm font-medium text-white hover:bg-red-600"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 p-5 border-t border-gray-100">
            <button
              onClick={() => setConfirmDelete(true)}
              className="py-2.5 px-4 border border-red-200 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 bg-blue-500 rounded-lg text-sm font-medium text-white hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

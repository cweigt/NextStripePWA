'use client';

import { TAGS } from '@/constants/tags';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import StarRating from './StarRating';

interface SessionData {
  title: string;
  date: string; // MM/DD/YYYY
  duration: string;
  notes: string;
  tags: string[];
  qualityLevel: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SessionData) => void;
}

export default function AddSessionModal({ isOpen, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [quality, setQuality] = useState(0);
  const [summarizing, setSummarizing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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
    if (isOpen) {
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setShouldRender(true);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 220);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const handleSave = () => {
    // Convert YYYY-MM-DD to MM/DD/YYYY for Firebase compatibility
    const [y, m, d] = date.split('-');
    const formattedDate = `${m}/${d}/${y}`;
    onSave({ title, date: formattedDate, duration, notes, tags: Array.from(selectedTags), qualityLevel: quality.toString() });
    reset();
  };

  const reset = () => {
    setTitle('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setDuration('');
    setNotes('');
    setSelectedTags(new Set());
    setQuality(0);
    handleClose();
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`modal-backdrop ${isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`}
      onClick={(e) => e.target === e.currentTarget && reset()}
    >
      <div className={`bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl ${isClosing ? 'modal-inner-exit' : 'modal-inner-enter'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Add Training Session</h2>
          <button onClick={reset} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Session 1"
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
              placeholder="1.5"
              min="0"
              step="0.25"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Quality: <span className="text-blue-600 font-semibold">{quality}/10</span>
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
              <label className="block text-sm font-medium text-gray-700">Session Notes</label>
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
              placeholder="What did you work on today?"
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button
            onClick={reset}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-blue-500 rounded-lg text-sm font-medium text-white hover:bg-blue-600"
          >
            Save Session
          </button>
        </div>
      </div>
    </div>
  );
}

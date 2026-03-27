'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: Date;
  onSave: (data: {
    title: string;
    time: Date;
    recurring?: boolean;
    recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none';
    recurrenceEndDate?: Date | null;
  }) => void;
}

export default function AddEventModal({ isOpen, onClose, defaultDate, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [recurring, setRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'none'>('weekly');
  const [endDate, setEndDate] = useState('');
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
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

  if (!shouldRender) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    const [h, m] = time.split(':').map(Number);
    const t = new Date(defaultDate);
    t.setHours(h, m, 0, 0);

    onSave({
      title,
      time: t,
      recurring,
      recurrenceType: recurring ? recurrenceType : 'none',
      recurrenceEndDate: recurring && endDate ? new Date(endDate) : null,
    });
    reset();
  };

  const reset = () => {
    setTitle('');
    setTime('09:00');
    setRecurring(false);
    setRecurrenceType('weekly');
    setEndDate('');
    handleClose();
  };

  return (
    <div
      className={`modal-backdrop ${isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`}
      onClick={(e) => e.target === e.currentTarget && reset()}
    >
      <div className={`bg-white rounded-2xl w-full max-w-md shadow-xl ${isClosing ? 'modal-inner-exit' : 'modal-inner-enter'}`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Add Event</h2>
          <button onClick={reset} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="BJJ Class"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="recurring"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            <label htmlFor="recurring" className="text-sm font-medium text-gray-700">Recurring event</label>
          </div>

          {recurring && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repeats</label>
                <select
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={reset} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-500 rounded-lg text-sm font-medium text-white hover:bg-blue-600">
            Add Event
          </button>
        </div>
      </div>
    </div>
  );
}

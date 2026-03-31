'use client';

import AddEventModal from '@/components/AddEventModal';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  isSameDay,
  startOfWeek,
} from 'date-fns';
import { onValue, push, ref, remove, set, update } from 'firebase/database';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  startISO: string;
  notes?: string;
  createdAt: string;
  recurring?: boolean;
  recurrenceType?: string;
  recurrenceEndDate?: string;
  parentEventId?: string;
  isRecurringInstance?: boolean;
}

const dateKey = (d: Date) => format(d, 'yyyy-MM-dd');

function generateRecurring(title: string, startDate: Date, recurrenceType: string, endDate: Date) {
  const events: Array<{ date: Date; payload: Omit<CalendarEvent, 'id'> }> = [];
  const parentId = `parent_${Date.now()}`;
  let current = startDate;

  while (current <= endDate) {
    events.push({
      date: current,
      payload: {
        title,
        startISO: current.toISOString(),
        createdAt: new Date().toISOString(),
        recurring: true,
        recurrenceType,
        recurrenceEndDate: endDate.toISOString(),
        parentEventId: parentId,
        isRecurringInstance: events.length > 0,
      },
    });

    switch (recurrenceType) {
      case 'daily': current = addDays(current, 1); break;
      case 'weekly': current = addWeeks(current, 1); break;
      case 'monthly': current = addMonths(current, 1); break;
      case 'yearly': current = addYears(current, 1); break;
      default: current = new Date(endDate.getTime() + 1);
    }
  }
  return events;
}

export default function SchedulePage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventDays, setEventDays] = useState<Record<string, number>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Generate week days from offset
  const weekDays = useMemo(() => {
    const start = startOfWeek(addWeeks(new Date(), weekOffset));
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekOffset]);

  // Load events for selected date
  useEffect(() => {
    if (!user?.uid) return;
    const k = dateKey(selected);
    const r = ref(db, `users/${user.uid}/schedule/${k}`);
    const unsub = onValue(r, (snap) => {
      if (!snap.exists()) { setEvents([]); return; }
      const raw = snap.val() as Record<string, any>;
      const list: CalendarEvent[] = Object.entries(raw)
        .map(([id, ev]) => ({ id, ...ev }))
        .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());
      setEvents(list);
    });
    return () => unsub();
  }, [user?.uid, selected]);

  // Track which dates have events
  useEffect(() => {
    if (!user?.uid) return;
    const r = ref(db, `users/${user.uid}/schedule`);
    const unsub = onValue(r, (snap) => {
      if (!snap.exists()) { setEventDays({}); return; }
      const all = snap.val() as Record<string, Record<string, any>>;
      const counts: Record<string, number> = {};
      Object.entries(all).forEach(([k, day]) => (counts[k] = Object.keys(day || {}).length));
      setEventDays(counts);
    });
    return () => unsub();
  }, [user?.uid]);

  const saveEvent = useCallback(async ({ title, time, recurring, recurrenceType, recurrenceEndDate }: any) => {
    if (!user?.uid) return;
    const start = new Date(selected);
    start.setHours(time.getHours(), time.getMinutes(), 0, 0);

    if (recurring && recurrenceType && recurrenceType !== 'none' && recurrenceEndDate) {
      const instances = generateRecurring(title, start, recurrenceType, recurrenceEndDate);
      for (const inst of instances) {
        const k = dateKey(inst.date);
        const r = push(ref(db, `users/${user.uid}/schedule/${k}`));
        await set(r, inst.payload);
      }
    } else {
      const k = dateKey(selected);
      const r = push(ref(db, `users/${user.uid}/schedule/${k}`));
      await set(r, { title, startISO: start.toISOString(), createdAt: new Date().toISOString(), recurring, recurrenceType });
    }
    setAddOpen(false);
  }, [user?.uid, selected]);

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;
    await remove(ref(db, `users/${user.uid}/schedule/${dateKey(selected)}/${id}`));
  };

  const handleUpdate = useCallback(async ({ title, time, recurring, recurrenceType }: any) => {
    if (!user?.uid || !editingEvent) return;
    const start = new Date(selected);
    start.setHours(time.getHours(), time.getMinutes(), 0, 0);
    await update(ref(db, `users/${user.uid}/schedule/${dateKey(selected)}/${editingEvent.id}`), {
      title,
      startISO: start.toISOString(),
      recurring,
      recurrenceType: recurring ? recurrenceType : 'none',
    });
    setEditingEvent(null);
  }, [user?.uid, selected, editingEvent]);

  if (!user) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Please sign in to view your schedule.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600"
        >
          <Plus size={16} /> Add Event
        </button>
      </div>

      {/* Week picker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-gray-600">
            {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}
          </span>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const isActive = isSameDay(day, selected);
            const hasEvents = Boolean(eventDays[dateKey(day)]);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelected(day)}
                className={`flex flex-col items-center py-2 rounded-xl transition-colors ${
                  isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-xs font-medium">{format(day, 'EEE')}</span>
                <span className="text-sm font-bold mt-0.5">{format(day, 'd')}</span>
                {hasEvents && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isActive ? 'bg-white' : 'bg-blue-500'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events for selected day */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          {format(selected, 'EEEE, MMMM d')}
        </h2>

        {events.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No events for this day.</div>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setEditingEvent(ev)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-900">{ev.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(ev.startISO), 'h:mm a')}
                    {ev.recurring && (
                      <span className="ml-2 text-blue-500">↻ {ev.recurrenceType}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }}
                  className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddEventModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        defaultDate={selected}
        onSave={saveEvent}
      />

      <AddEventModal
        isOpen={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        defaultDate={selected}
        onSave={handleUpdate}
        initialData={editingEvent}
      />
    </div>
  );
}

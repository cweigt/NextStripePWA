'use client';

import AddEventModal from '@/components/AddEventModal';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
  format,
  getMonth,
  getYear,
  isSameDay,
  startOfWeek,
  addDays,
  addWeeks,
} from 'date-fns';
import { get, onValue, push, ref, remove, set, update } from 'firebase/database';
import { generateRecurring } from '@/lib/generateRecurring';
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

export default function SchedulePage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventDays, setEventDays] = useState<Record<string, number>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(getYear(new Date()));
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const jumpToMonth = (year: number, month: number) => {
    const target = new Date(year, month, 1);
    const base = startOfWeek(new Date());
    const targetWeekStart = startOfWeek(target);
    const diffWeeks = Math.round((targetWeekStart.getTime() - base.getTime()) / (7 * 24 * 60 * 60 * 1000));
    setWeekOffset(diffWeeks);
    setSelected(target);
    setPickerOpen(false);
  };

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

  const handleDeleteSingle = async (event: CalendarEvent) => {
    if (!user?.uid) return;
    await remove(ref(db, `users/${user.uid}/schedule/${dateKey(selected)}/${event.id}`));
    setDeleteTarget(null);
  };

  const handleDeleteFuture = async (event: CalendarEvent) => {
    if (!user?.uid) return;
    const parentId = event.parentEventId;
    if (!parentId) { await handleDeleteSingle(event); return; }

    const snap = await get(ref(db, `users/${user.uid}/schedule`));
    if (!snap.exists()) { setDeleteTarget(null); return; }

    const all = snap.val() as Record<string, Record<string, any>>;
    const selectedTime = new Date(event.startISO).getTime();

    const removes: Promise<void>[] = [];
    Object.entries(all).forEach(([dateStr, dayEvents]) => {
      Object.entries(dayEvents || {}).forEach(([evId, evData]: [string, any]) => {
        if (evData.parentEventId === parentId && new Date(evData.startISO).getTime() >= selectedTime) {
          removes.push(remove(ref(db, `users/${user.uid!}/schedule/${dateStr}/${evId}`)));
        }
      });
    });

    await Promise.all(removes);
    setDeleteTarget(null);
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

          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => { setPickerYear(getYear(selected)); setPickerOpen((o) => !o); }}
              className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {format(selected, 'MMMM yyyy')}
              <ChevronDown size={14} className={`transition-transform duration-200 ${pickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {pickerOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-20 w-56">
                {/* Year navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setPickerYear((y) => y - 1)}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-semibold text-gray-800">{pickerYear}</span>
                  <button
                    onClick={() => setPickerYear((y) => y + 1)}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                {/* Month grid */}
                <div className="grid grid-cols-3 gap-1">
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((label, i) => {
                    const isSelected = pickerYear === getYear(selected) && i === getMonth(selected);
                    const isToday = pickerYear === getYear(new Date()) && i === getMonth(new Date());
                    return (
                      <button
                        key={label}
                        onClick={() => jumpToMonth(pickerYear, i)}
                        className={`py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : isToday
                            ? 'bg-blue-50 text-blue-600'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

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
                className="bg-white rounded-xl shadow-sm border border-gray-100 transition-colors"
              >
                <div
                  onClick={() => { if (deleteTarget?.id !== ev.id) setEditingEvent(ev); }}
                  className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      if (ev.recurring) {
                        setDeleteTarget(deleteTarget?.id === ev.id ? null : ev);
                      } else {
                        handleDeleteSingle(ev);
                      }
                    }}
                    className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {deleteTarget?.id === ev.id && (
                  <div className="px-4 pb-4">
                    <div className="p-3 bg-red-50 rounded-xl text-xs text-red-700 flex items-center justify-between gap-2">
                      <span className="font-medium">Delete recurring event?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteTarget(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(ev)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Just this one
                        </button>
                        <button
                          onClick={() => handleDeleteFuture(ev)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600"
                        >
                          This & all future
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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

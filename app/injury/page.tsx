'use client';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { get, ref, remove, set } from 'firebase/database';
import { AlertCircle, ChevronLeft, Plus, X, Pencil, Trash2, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const BODY_PARTS = [
  'Knee', 'Shoulder', 'Ankle', 'Hip', 'Wrist', 'Elbow',
  'Neck', 'Back', 'Ribs', 'Finger / Toe', 'Head', 'Other',
];

const CAUSES = [
  'Sparring', 'Drilling', 'Competition', 'Strength & Conditioning',
  'Warm-Up / Cool-Down', 'Accident', 'Other',
];

const SEVERITIES = ['Mild', 'Moderate', 'Severe'];

const STATUSES = ['Active', 'Recovering', 'Recovered'];

interface Injury {
  id: string;
  name: string;
  bodyPart: string;
  cause: string;
  severity: string;
  status: string;
  dateOfInjury: string;
  recoveryEndDate: string;
  recoveryAmount: string;
  recoveryUnit: string;
  doctor: string;
  notes: string;
  createdAt: string;
}

const RECOVERY_UNITS = ['Days', 'Weeks', 'Months'];

const emptyForm = {
  name: '',
  bodyPart: '',
  cause: '',
  severity: '',
  status: 'Active',
  dateOfInjury: '',
  recoveryEndDate: '',
  recoveryAmount: '',
  recoveryUnit: 'Weeks',
  doctor: '',
  notes: '',
};

function calcRecoveryEndDate(dateOfInjury: string, amount: string, unit: string): string {
  if (!dateOfInjury || !amount || isNaN(Number(amount))) return '';
  const n = Number(amount);
  const d = new Date(dateOfInjury);
  if (unit === 'Days') d.setDate(d.getDate() + n);
  else if (unit === 'Weeks') d.setDate(d.getDate() + n * 7);
  else if (unit === 'Months') d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

const severityColor: Record<string, string> = {
  Mild: 'bg-yellow-100 text-yellow-700',
  Moderate: 'bg-orange-100 text-orange-700',
  Severe: 'bg-red-100 text-red-700',
};

const statusColor: Record<string, string> = {
  Active: 'bg-red-100 text-red-600',
  Recovering: 'bg-blue-100 text-blue-600',
  Recovered: 'bg-green-100 text-green-600',
};

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

export default function InjuryPage() {
  const { user } = useAuth();
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editing, setEditing] = useState<Injury | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    get(ref(db, `users/${user.uid}/injuries`)).then((snap) => {
      if (snap.exists()) {
        const arr: Injury[] = Object.entries(snap.val() as Record<string, any>).map(([id, v]) => ({ id, ...v }));
        arr.sort((a, b) => b.createdAt?.localeCompare(a.createdAt ?? '') ?? 0);
        setInjuries(arr);
      }
      setLoading(false);
    });
  }, [user?.uid]);

  const { dateOfInjury, recoveryAmount, recoveryUnit } = form;
  useEffect(() => {
    const end = calcRecoveryEndDate(dateOfInjury, recoveryAmount, recoveryUnit);
    setForm((prev) => ({ ...prev, recoveryEndDate: end }));
  }, [dateOfInjury, recoveryAmount, recoveryUnit]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, dateOfInjury: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
    setShouldRender(true);
    setIsClosing(false);
  };

  const openEdit = (injury: Injury) => {
    setEditing(injury);
    setForm({
      name: injury.name,
      bodyPart: injury.bodyPart,
      cause: injury.cause,
      severity: injury.severity,
      status: injury.status,
      dateOfInjury: injury.dateOfInjury,
      recoveryEndDate: injury.recoveryEndDate,
      recoveryAmount: injury.recoveryAmount ?? '',
      recoveryUnit: injury.recoveryUnit ?? 'Weeks',
      doctor: injury.doctor,
      notes: injury.notes,
    });
    setModalOpen(true);
    setShouldRender(true);
    setIsClosing(false);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShouldRender(false);
      setModalOpen(false);
      setIsClosing(false);
    }, 220);
  };

  const handleSave = async () => {
    if (!user?.uid || !form.name.trim()) return;
    setSaving(true);
    const id = editing?.id ?? `inj_${Date.now()}`;
    const data = {
      ...form,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    await set(ref(db, `users/${user.uid}/injuries/${id}`), data);
    const updated: Injury = { id, ...data };
    setInjuries((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      return [updated, ...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
    setSaving(false);
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;
    await remove(ref(db, `users/${user.uid}/injuries/${id}`));
    setInjuries((prev) => prev.filter((i) => i.id !== id));
    setDeleteConfirm(null);
  };

  const quickStatus = async (injury: Injury, status: string) => {
    if (!user?.uid) return;
    const updated = { ...injury, status };
    await set(ref(db, `users/${user.uid}/injuries/${injury.id}`), updated);
    setInjuries((prev) => prev.map((i) => (i.id === injury.id ? updated : i)));
  };

  const f = (key: keyof typeof emptyForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const activeCount = injuries.filter((i) => i.status === 'Active' || i.status === 'Recovering').length;
  const [tab, setTab] = useState<'active' | 'recovered'>('active');

  const visibleInjuries = injuries.filter((i) =>
    tab === 'recovered' ? i.status === 'Recovered' : i.status !== 'Recovered'
  );

  if (!user) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Please sign in to view your injury log.</div>;
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-0 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/" className="p-1.5 rounded-full hover:bg-gray-100">
            <ChevronLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Injury Tracker</h1>
          <button
            onClick={openAdd}
            className="ml-auto flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Log Injury
          </button>
        </div>
        {/* Tabs */}
        <div className="flex">
          <button
            onClick={() => setTab('active')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t-lg'
            }`}
          >
            Active
            {activeCount > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('recovered')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'recovered'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t-lg'
            }`}
          >
            Recovered
          </button>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-3 mx-auto" style={{ maxWidth: '950px' }}>
        {loading ? (
          <p className="text-center text-gray-400 text-sm pt-16">Loading...</p>
        ) : visibleInjuries.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 gap-3 text-center">
            <AlertCircle size={40} className="text-gray-300" />
            <p className="text-gray-400 text-sm">
              {tab === 'recovered' ? 'No recovered injuries yet.' : 'No active injuries logged.'}
            </p>
            {tab === 'active' && (
              <button onClick={openAdd} className="text-blue-500 text-sm font-medium">
                + Log your first injury
              </button>
            )}
          </div>
        ) : (
          visibleInjuries.map((injury) => (
            <div key={injury.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{injury.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {injury.bodyPart}{injury.cause ? ` · ${injury.cause}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(injury)} className="p-1.5 rounded-full hover:bg-gray-100">
                    <Pencil size={14} className="text-gray-400" />
                  </button>
                  <button onClick={() => setDeleteConfirm(injury.id)} className="p-1.5 rounded-full hover:bg-gray-100">
                    <Trash2 size={14} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {injury.severity && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severityColor[injury.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                    {injury.severity}
                  </span>
                )}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[injury.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {injury.status}
                </span>
              </div>

              {/* Dates */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                {injury.dateOfInjury && (
                  <div>
                    <span className="block text-gray-400 font-medium mb-0.5">Date of Injury</span>
                    {formatDate(injury.dateOfInjury)}
                  </div>
                )}
                {injury.recoveryEndDate && (
                  <div>
                    <span className="block text-gray-400 font-medium mb-0.5">Recovery Target</span>
                    {formatDate(injury.recoveryEndDate)}
                  </div>
                )}
                {injury.recoveryAmount && (
                  <div>
                    <span className="block text-gray-400 font-medium mb-0.5">Est. Recovery</span>
                    {injury.recoveryAmount} {injury.recoveryUnit}
                  </div>
                )}
                {injury.doctor && (
                  <div>
                    <span className="block text-gray-400 font-medium mb-0.5">Doctor / Provider</span>
                    {injury.doctor}
                  </div>
                )}
              </div>

              {injury.notes ? (
                <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                  {injury.notes}
                </p>
              ) : null}

              {/* Quick status buttons */}
              {injury.status !== 'Recovered' && (
                <div className="mt-3 flex gap-2">
                  {injury.status === 'Active' && (
                    <button
                      onClick={() => quickStatus(injury, 'Recovering')}
                      className="flex items-center gap-1 text-xs text-blue-500 font-medium px-2.5 py-1 rounded-full border border-blue-200 hover:bg-blue-50"
                    >
                      <Clock size={11} /> Mark Recovering
                    </button>
                  )}
                  <button
                    onClick={() => quickStatus(injury, 'Recovered')}
                    className="flex items-center gap-1 text-xs text-green-600 font-medium px-2.5 py-1 rounded-full border border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle size={11} /> Mark Recovered
                  </button>
                </div>
              )}

              {/* Delete confirm */}
              {deleteConfirm === injury.id && (
                <div className="mt-3 p-3 bg-red-50 rounded-xl text-xs text-red-700 flex items-center justify-between gap-2">
                  <span>Delete this injury?</span>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirm(null)} className="font-medium text-gray-500">Cancel</button>
                    <button onClick={() => handleDelete(injury.id)} className="font-medium text-red-600">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {shouldRender && (
        <div
          className={`modal-backdrop ${isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className={`bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl ${isClosing ? 'modal-inner-exit' : 'modal-inner-enter'}`}>
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Injury' : 'Log Injury'}</h2>
              <button onClick={closeModal} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Injury Name / Description *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={f('name')}
                  placeholder="e.g. Knee sprain, Shoulder strain"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Body part + Cause */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body Part</label>
                  <select value={form.bodyPart} onChange={f('bodyPart')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select</option>
                    {BODY_PARTS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cause</label>
                  <select value={form.cause} onChange={f('cause')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select</option>
                    {CAUSES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Severity + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select value={form.severity} onChange={f('severity')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select</option>
                    {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={f('status')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Date of injury */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Injury</label>
                <input
                  type="date"
                  value={form.dateOfInjury}
                  onChange={f('dateOfInjury')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Recovery time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Recovery Time</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={form.recoveryAmount}
                    onChange={f('recoveryAmount')}
                    placeholder="e.g. 6"
                    min="1"
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select value={form.recoveryUnit} onChange={f('recoveryUnit')} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {RECOVERY_UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Recovery end date — auto-calculated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recovery End Date
                </label>
                <input
                  type="date"
                  value={form.recoveryEndDate}
                  readOnly
                  className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-default"
                />
              </div>

              {/* Doctor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor / Medical Provider Seen</label>
                <input
                  type="text"
                  value={form.doctor}
                  onChange={f('doctor')}
                  placeholder="e.g. Dr. Smith, Sports PT clinic"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={form.notes}
                  onChange={f('notes')}
                  rows={4}
                  placeholder="Symptoms, treatment plan, rehab exercises, how it happened..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-5 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Log Injury'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

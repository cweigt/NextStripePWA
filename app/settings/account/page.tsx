'use client';

import { useAuth } from '@/contexts/AuthContext';
import { auth, db } from '@/lib/firebase';
import { deleteUser, signOut } from 'firebase/auth';
import { get, ref, set } from 'firebase/database';
import { ArrowLeft, ChevronRight, LogOut, Trash2, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const BELTS = ['White Belt', 'Blue Belt', 'Purple Belt', 'Brown Belt', 'Black Belt'];
const STRIPES = ['0 Stripe', '1st Stripe', '2nd Stripe', '3rd Stripe', '4th Stripe'];

export default function AccountSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [beltRank, setBeltRank] = useState('');
  const [stripeCount, setStripeCount] = useState('');
  const [academy, setAcademy] = useState('');
  const [trainingDate, setTrainingDate] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;
    Promise.all([
      get(ref(db, `users/${uid}/rank/beltRank`)),
      get(ref(db, `users/${uid}/rank/stripeCount`)),
      get(ref(db, `users/${uid}/academy`)),
      get(ref(db, `users/${uid}/timeTraining`)),
      get(ref(db, `users/${uid}/gender`)),
      get(ref(db, `users/${uid}/weight`)),
      get(ref(db, `users/${uid}/height`)),
    ]).then(([belt, stripe, ac, tt, gen, wt, ht]) => {
      if (belt.exists()) setBeltRank(belt.val());
      if (stripe.exists()) setStripeCount(stripe.val());
      if (ac.exists()) setAcademy(ac.val());
      if (tt.exists()) setTrainingDate(tt.val());
      if (gen.exists()) setGender(gen.val());
      if (wt.exists()) setWeight(wt.val());
      if (ht.exists()) setHeight(ht.val());
    });
  }, [user?.uid]);

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    const uid = user.uid;
    await Promise.all([
      set(ref(db, `users/${uid}/rank/beltRank`), beltRank),
      set(ref(db, `users/${uid}/rank/stripeCount`), stripeCount),
      set(ref(db, `users/${uid}/academy`), academy),
      set(ref(db, `users/${uid}/timeTraining`), trainingDate),
      set(ref(db, `users/${uid}/gender`), gender),
      set(ref(db, `users/${uid}/weight`), weight),
      set(ref(db, `users/${uid}/height`), height),
    ]);
    setSaving(false);
    setEditing(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/auth');
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteInput !== 'DELETE') return;
    try {
      await deleteUser(user);
      router.push('/auth');
    } catch {
      alert('Please re-sign-in before deleting your account.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>;
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Please sign in to view your settings.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 page-enter-right">
      {/* Back button */}
      <Link
        href="/settings"
        className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 mb-6"
      >
        <ArrowLeft size={16} /> Settings
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Account</h1>

      {/* Profile header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-5 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          {user.photoURL ? (
            <Image src={user.photoURL} alt="Avatar" width={80} height={80} className="rounded-full object-cover" />
          ) : (
            <User size={36} className="text-blue-400" />
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{user.displayName || 'Athlete'}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>

        {beltRank && stripeCount && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <img
              src={`/belts/${beltRank.split(' ')[0].toLowerCase()}-${STRIPES.indexOf(stripeCount)}.png`}
              alt={`${beltRank} belt ${stripeCount}`}
              className="h-8 w-auto"
            />
          </div>
        )}
      </div>

      {/* Info cards / edit form */}
      {!editing ? (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Academy', value: academy },
              { label: 'Training Since', value: trainingDate },
              { label: 'Gender', value: gender },
              { label: 'Weight (lbs)', value: weight },
              { label: 'Height', value: height },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{value || 'Not set'}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setEditing(true)}
            className="w-full bg-white border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 mb-3 flex items-center justify-center gap-2"
          >
            Edit Profile <ChevronRight size={16} />
          </button>
        </>
      ) : (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Edit Profile</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Belt Rank</label>
              <select value={beltRank} onChange={(e) => setBeltRank(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select belt</option>
                {BELTS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stripes</label>
              <select value={stripeCount} onChange={(e) => setStripeCount(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                {STRIPES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {[
            { label: 'Academy', value: academy, setter: setAcademy },
            { label: 'Training Since (e.g. Jan 2020)', value: trainingDate, setter: setTrainingDate },
            { label: 'Gender', value: gender, setter: setGender },
            { label: 'Weight (lbs)', value: weight, setter: setWeight },
            { label: `Height (5' 4")`, value: height, setter: setHeight },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-200 mb-3"
      >
        <LogOut size={16} /> Sign Out
      </button>

      {/* Delete account */}
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-red-100 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50"
        >
          <Trash2 size={16} /> Delete Account
        </button>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-1">Delete your account?</p>
          <p className="text-xs text-red-500 mb-3">This cannot be undone. Type <strong>DELETE</strong> to confirm.</p>
          <input
            type="text"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder="Type DELETE"
            className="w-full border border-red-200 bg-white rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none"
          />
          <div className="flex gap-2">
            <button onClick={() => { setConfirmDelete(false); setDeleteInput(''); }} className="flex-1 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium">Cancel</button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteInput !== 'DELETE'}
              className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

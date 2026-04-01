'use client'

import { useState, useEffect } from 'react';
import { ChevronLeft, Database, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import populateDataLogic from '@/lib/populate';
import removeDataLogic from '@/lib/remove';

export default function DataPage() {
  const [populating, setPopulating] = useState(false);
  const [removing, setRemoving] = useState(false);

  const { isDev, loading, user } = useAuth();
  const router = useRouter();

  //redirecting users if they are not dev
  useEffect(() => {
    if(!loading && !isDev){
        router.replace('/');
    }
  }, [loading, isDev, router]);

  async function handlePopulate() {
    setPopulating(true);
    try {
      // TODO: populate example data
      if (user?.uid) {
        await populateDataLogic(user.uid);
      }
      //include an affirmative alert
    } finally {
      setPopulating(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      // TODO: remove example data
      if (user?.uid) {
        removeDataLogic(user.uid);
      }

      //include an affirmative alert
    } finally {
      setRemoving(false);
    }
  }

  if (loading || !isDev) return null;

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-white border-b border-gray-100 px-4 pt-14 pb-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-full hover:bg-gray-100">
            <ChevronLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Data Management</h1>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</span>
        </div>

        <div className="px-5 py-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePopulate}
            disabled={populating}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database size={15} />
            {populating ? 'Populating…' : 'Populate Example Data'}
          </button>

          <button
            onClick={handleRemove}
            disabled={removing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-red-200 bg-white text-red-600 transition-colors hover:bg-red-50 hover:border-red-400 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={15} />
            {removing ? 'Removing…' : 'Remove Example Data'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

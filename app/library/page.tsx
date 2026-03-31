'use client';

import AddVideoModal from '@/components/AddVideoModal';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { onValue, ref, remove } from 'firebase/database';
import { deleteObject, ref as storageRef } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Plus, Play, Trash2, VideoIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Video {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
  videoUrl: string;
  createdAt?: string;
}

export default function LibraryPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Video | null>(null);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    const r = ref(db, `users/${user.uid}/library/videos`);
    const unsub = onValue(r, (snap) => {
      if (snap.exists()) {
        const arr = Object.entries(snap.val() as Record<string, any>).map(([id, v]) => ({ id, ...v }));
        setVideos(arr);
      } else {
        setVideos([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const handleDelete = async (video: Video) => {
    if (!user?.uid) return;
    try {
      if (video.videoUrl) {
        try {
          // Extract the storage path from the download URL
          const url = new URL(video.videoUrl);
          const pathMatch = url.pathname.match(/\/o\/(.+)$/);
          if (pathMatch) {
            const storagePath = decodeURIComponent(pathMatch[1]);
            await deleteObject(storageRef(storage, storagePath));
          }
        } catch (e) {
          console.error('Storage delete failed:', e);
        }
      }
      await remove(ref(db, `users/${user.uid}/library/videos/${video.id}`));
      setConfirmDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Please sign in to view your library.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Library</h1>
          <p className="text-sm text-gray-500 mt-1">Your martial arts knowledge hub</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600"
        >
          <Plus size={16} /> Add Video
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-700">Videos ({videos.length})</h2>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-12">Loading…</p>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <VideoIcon size={48} className="mb-3 text-gray-200" />
          <p className="text-sm text-center">No videos yet. Upload your first training video!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <button
                onClick={() => setPlaying(video)}
                className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-blue-600 transition-colors"
              >
                <Play size={20} className="text-white ml-0.5" />
              </button>
              <div className="flex-1 min-w-0" onClick={() => setPlaying(video)} role="button">
                <p className="font-semibold text-gray-900 truncate">{video.title}</p>
                {video.difficulty && (
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{video.difficulty}</p>
                )}
                {video.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{video.description}</p>
                )}
              </div>
              <button
                onClick={() => setConfirmDelete(video)}
                className="p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Video Player */}
      {playing && (
        <div className="modal-backdrop" onClick={() => setPlaying(null)}>
          <div className="bg-black rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
              <p className="text-white text-sm font-medium truncate">{playing.title}</p>
              <button onClick={() => setPlaying(null)} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
            </div>
            <video
              src={playing.videoUrl}
              controls
              autoPlay
              className="w-full max-h-[70vh]"
            />
            {playing.description && (
              <div className="p-4 bg-gray-900">
                <p className="text-gray-300 text-sm">{playing.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="modal-backdrop">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Video?</h3>
            <p className="text-sm text-gray-600 mb-5">
              "{confirmDelete.title}" will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      <AddVideoModal isOpen={addOpen} onClose={() => setAddOpen(false)} userId={user.uid} onSave={() => setAddOpen(false)} />
    </div>
  );
}

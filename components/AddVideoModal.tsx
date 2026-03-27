'use client';

import { db, storage } from '@/lib/firebase';
import { ref as dbRef, set } from 'firebase/database';
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage';
import { Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSave: (video: any) => void;
}

export default function AddVideoModal({ isOpen, onClose, userId, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isClosing || uploading) return;
    setIsClosing(true);
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 220);
  };

  if (!shouldRender) return null;

  const reset = () => {
    setTitle('');
    setDescription('');
    setDifficulty('beginner');
    setFile(null);
    setProgress(0);
    setError('');
    handleClose();
  };

  const handleUpload = () => {
    if (!title.trim() || !file) {
      setError('Please provide a title and select a video file.');
      return;
    }

    setUploading(true);
    setError('');

    const videoId = Date.now().toString();
    const path = `videos/${userId}/${videoId}_${file.name}`;
    const sRef = storageRef(storage, path);
    const uploadTask = uploadBytesResumable(sRef, file);

    uploadTask.on(
      'state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => {
        console.error('Firebase upload error:', err.code, err.message);
        const msg =
          err.code === 'storage/unauthorized'
            ? 'Upload failed: permission denied. Check Firebase Storage rules.'
            : err.code === 'storage/quota-exceeded'
            ? 'Upload failed: storage quota exceeded.'
            : err.code === 'storage/unauthenticated'
            ? 'Upload failed: you must be signed in.'
            : `Upload failed (${err.code ?? err.message}). Please try again.`;
        setError(msg);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        const video = { id: videoId, title, description, difficulty, videoUrl: url, createdAt: new Date().toISOString() };
        await set(dbRef(db, `users/${userId}/library/videos/${videoId}`), video);
        onSave(video);
        setUploading(false);
        reset();
      }
    );
  };

  return (
    <div
      className={`modal-backdrop ${isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`}
      onClick={(e) => e.target === e.currentTarget && !uploading && reset()}
    >
      <div className={`bg-white rounded-2xl w-full max-w-md shadow-xl ${isClosing ? 'modal-inner-exit' : 'modal-inner-enter'}`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Add Video</h2>
          {!uploading && (
            <button onClick={reset} className="p-1 rounded-full hover:bg-gray-100">
              <X size={20} className="text-gray-500" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Arm Bar Tutorial"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video File</label>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-lg py-6 flex flex-col items-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
            >
              <Upload size={24} />
              <span className="text-sm">{file ? file.name : 'Click to select video'}</span>
            </button>
          </div>

          {uploading && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button
            onClick={reset}
            disabled={uploading}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1 py-2.5 bg-blue-500 rounded-lg text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  resultType: 'win' | 'loss';
  onClose: () => void;
  onSave: (method: 'points' | 'submission') => void;
}

export default function EditCompModal({ isOpen, resultType, onClose, onSave }: Props) {
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

  return (
    <div
      className={`modal-backdrop ${isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className={`bg-white rounded-2xl w-full max-w-sm shadow-xl ${isClosing ? 'modal-inner-exit' : 'modal-inner-enter'}`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold">
            Add Competition {resultType === 'win' ? 'Win' : 'Loss'}
          </h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-600 mb-4">How was the result decided?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { onSave('submission'); handleClose(); }}
              className="py-3 rounded-xl border-2 border-gray-200 text-sm font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              Submission
            </button>
            <button
              onClick={() => { onSave('points'); handleClose(); }}
              className="py-3 rounded-xl border-2 border-gray-200 text-sm font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              Points
            </button>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleClose}
            className="w-full py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

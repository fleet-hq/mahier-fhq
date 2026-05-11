'use client';

import { useEffect } from 'react';
import { Button } from './button';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export function ValidationModal({ isOpen, onClose, title, message }: ValidationModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {/* Warning Icon */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button
            variant="primary"
            className="w-full text-xs"
            onClick={onClose}
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}

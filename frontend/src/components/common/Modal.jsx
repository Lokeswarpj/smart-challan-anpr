import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-primary/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} bg-white dark:bg-[#171E19] border-2 border-primary dark:border-[#2D3931] shadow-brutal z-10 overflow-hidden transform transition-all max-h-[90vh] flex flex-col text-primary dark:text-white`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary bg-accent">
          <h3 className="font-heading text-xl text-primary font-bold tracking-wider">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/10 transition-colors border border-primary text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}


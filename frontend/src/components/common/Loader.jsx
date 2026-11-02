import React from 'react';

export default function Loader({ message = 'PROCESSING REQUEST...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-sage/30"></div>
        <div className="absolute inset-0 border-4 border-accent border-t-primary animate-spin"></div>
      </div>
      <p className="font-heading text-xs tracking-widest text-secondary font-bold">
        {message}
      </p>
    </div>
  );
}

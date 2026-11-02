import React from 'react';
import clsx from 'clsx';

export default function Input({
  label,
  error,
  icon: Icon,
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name || Math.random().toString();

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold uppercase tracking-wider text-primary dark:text-gray-200"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-secondary pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={clsx(
            'w-full bg-white dark:bg-surface border border-primary dark:border-gray-600 text-primary dark:text-white px-3.5 py-2.5 text-sm font-sans transition-all duration-150 outline-none focus:ring-2 focus:ring-accent focus:border-primary shadow-brutal-sm',
            Icon && 'pl-10',
            error && 'border-danger focus:ring-danger',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs font-bold text-danger mt-0.5 tracking-wide">
          {error}
        </span>
      )}
    </div>
  );
}

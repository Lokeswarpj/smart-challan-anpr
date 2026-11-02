import React from 'react';
import clsx from 'clsx';

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) {
  const variantStyles = {
    valid: 'bg-green-100 text-green-900 border-green-600 dark:bg-green-950 dark:text-green-300',
    expired: 'bg-red-100 text-red-900 border-red-600 dark:bg-red-950 dark:text-red-300',
    warning: 'bg-amber-100 text-amber-900 border-amber-600 dark:bg-amber-950 dark:text-amber-300',
    expiring_soon: 'bg-amber-100 text-amber-900 border-amber-600 dark:bg-amber-950 dark:text-amber-300',
    paid: 'bg-green-100 text-green-900 border-green-600 dark:bg-green-950 dark:text-green-300',
    pending: 'bg-red-100 text-red-900 border-red-600 dark:bg-red-950 dark:text-red-300',
    accent: 'bg-accent text-primary border-primary font-black',
    neutral: 'bg-surface text-secondary border-sage dark:bg-surface-dark dark:text-gray-300',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider',
    md: 'text-xs px-2.5 py-1 tracking-wider',
    lg: 'text-sm px-3.5 py-1.5 tracking-wide',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-bold uppercase font-sans border rounded-none',
        variantStyles[variant] || variantStyles.neutral,
        sizeStyles[size],
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {children}
    </span>
  );
}


import React from 'react';
import clsx from 'clsx';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold font-sans tracking-wide uppercase transition-all duration-200 border cursor-pointer select-none active:translate-x-[1px] active:translate-y-[1px]';

  const variantStyles = {
    primary:
      'bg-primary text-white border-primary hover:bg-black shadow-brutal-sm hover:shadow-brutal',
    accent:
      'bg-accent text-[#171E19] dark:text-[#171E19] border-primary hover:bg-accent-hover shadow-brutal-sm hover:shadow-brutal font-extrabold',
    outline:
      'bg-transparent text-primary border-primary hover:bg-surface shadow-brutal-sm',
    danger:
      'bg-danger text-white border-primary hover:bg-red-600 shadow-brutal-sm',
    secondary:
      'bg-surface text-secondary border-sage hover:border-primary shadow-brutal-sm',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-7 py-3.5 gap-2.5',
  };

  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && 'opacity-60 cursor-not-allowed shadow-none',
        className
      )}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}


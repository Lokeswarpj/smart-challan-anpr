import React from 'react';
import clsx from 'clsx';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export default function StatusIndicator({ status, label, showIcon = true, size = 'md' }) {
  const normalized = status ? status.toLowerCase() : 'unknown';

  let config = {
    colorClass: 'text-gray-600 bg-gray-50 border-gray-300',
    icon: Clock,
    defaultLabel: 'Pending',
  };

  if (normalized === 'valid' || normalized === 'paid') {
    config = {
      colorClass: 'text-success bg-green-50 border-success dark:bg-green-950/40',
      icon: CheckCircle2,
      defaultLabel: normalized === 'paid' ? 'PAID' : 'VALID',
    };
  } else if (normalized === 'expired') {
    config = {
      colorClass: 'text-danger bg-red-50 border-danger dark:bg-red-950/40',
      icon: XCircle,
      defaultLabel: 'EXPIRED',
    };
  } else if (normalized === 'expiring_soon' || normalized === 'warning' || normalized === 'amber') {
    config = {
      colorClass: 'text-warning bg-amber-50 border-warning dark:bg-amber-950/40',
      icon: AlertTriangle,
      defaultLabel: 'EXPIRING SOON (<30d)',
    };
  } else if (normalized === 'pending' || normalized === 'unpaid') {
    config = {
      colorClass: 'text-danger bg-red-50 border-danger dark:bg-red-950/40',
      icon: AlertTriangle,
      defaultLabel: normalized === 'pending' ? 'PENDING' : 'UNPAID',
    };
  }

  const IconComponent = config.icon;

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 border px-3 py-1 font-sans font-bold uppercase',
        config.colorClass,
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'lg' && 'text-sm px-4 py-1.5'
      )}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      <span>{label || config.defaultLabel}</span>
    </div>
  );
}


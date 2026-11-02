import React from 'react';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-primary/20 mb-8">
      <div>
        <h1 className="font-heading text-3xl md:text-4xl text-primary dark:text-white tracking-wide">
          {title}
        </h1>
        {subtitle && (
          <p className="font-sans text-sm text-secondary dark:text-gray-300 font-medium mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}


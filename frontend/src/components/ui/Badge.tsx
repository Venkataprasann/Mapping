import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'demo';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'info',
  dot = false,
  size = 'md',
  className = '',
  ...props
}) => {
  const styles: Record<BadgeVariant, { bg: string; text: string; border: string; dotColor: string }> = {
    success: {
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-300',
      border: 'border-emerald-500/30',
      dotColor: 'bg-emerald-400'
    },
    warning: {
      bg: 'bg-amber-950/60',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
      dotColor: 'bg-amber-400'
    },
    danger: {
      bg: 'bg-rose-950/60',
      text: 'text-rose-300',
      border: 'border-rose-500/30',
      dotColor: 'bg-rose-400'
    },
    info: {
      bg: 'bg-blue-950/60',
      text: 'text-blue-300',
      border: 'border-blue-500/30',
      dotColor: 'bg-blue-400'
    },
    neutral: {
      bg: 'bg-slate-800/80',
      text: 'text-slate-300',
      border: 'border-slate-700',
      dotColor: 'bg-slate-400'
    },
    demo: {
      bg: 'bg-purple-950/70',
      text: 'text-purple-300',
      border: 'border-purple-500/40',
      dotColor: 'bg-purple-400'
    }
  };

  const v = styles[variant];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${v.bg} ${v.text} ${v.border} ${sizeClass} select-none ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${v.dotColor} animate-pulse`} />}
      {children}
    </span>
  );
};

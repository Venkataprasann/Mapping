import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive' | 'outline';
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  glow = false,
  className = '',
  ...props
}) => {
  const base = 'rounded-2xl transition-all duration-200';
  const variantStyles = {
    default: 'bg-slate-900/90 border border-slate-800 text-slate-100 shadow-xl shadow-black/40',
    glass: 'bg-slate-900/60 backdrop-blur-md border border-slate-700/50 text-slate-100 shadow-2xl',
    interactive: 'bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 cursor-pointer transition-all',
    outline: 'bg-transparent border border-slate-800 text-slate-100'
  }[variant];

  const glowStyle = glow ? 'ring-1 ring-blue-500/50 shadow-blue-500/20' : '';

  return (
    <div className={`${base} ${variantStyles} ${glowStyle} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 pb-3 border-b border-slate-800/80 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-base font-semibold text-white tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs text-slate-400 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-4 pt-3 border-t border-slate-800/80 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const baseStyles = 'inline-flex items-center rounded-full font-medium transition-colors';

  const variants = {
    default: `
      bg-slate-100 text-slate-700 border border-slate-200
      dark:bg-[#2a3245] dark:text-[#c4d0e0] dark:border-[#3a4457]
    `,
    primary: `
      bg-blue-100 text-blue-700 border border-blue-200
      dark:bg-[#2a3245] dark:text-[#FF6B00] dark:border-[#3a4457]
    `,
    success: `
      bg-emerald-100 text-emerald-700 border border-emerald-200
      dark:bg-[#2a3245] dark:text-emerald-400 dark:border-[#3a4457]
    `,
    warning: `
      bg-amber-100 text-amber-700 border border-amber-200
      dark:bg-[#2a3245] dark:text-amber-400 dark:border-[#3a4457]
    `,
    danger: `
      bg-rose-100 text-rose-700 border border-rose-200
      dark:bg-[#2a3245] dark:text-rose-400 dark:border-[#3a4457]
    `,
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

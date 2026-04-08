export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'font-medium rounded-lg transition-smooth focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: `
      bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800
      focus:ring-blue-500 shadow-subtle hover:shadow-sm
      dark:bg-[#FF6B00] dark:hover:bg-[#FF7D20] dark:active:bg-[#E55A00]
      dark:focus:ring-[#FF6B00] dark:focus:ring-offset-[#151929]
    `,
    secondary: `
      bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-400
      dark:bg-[#2a3245] dark:text-white dark:hover:bg-[#3a4457]
      dark:focus:ring-[#4a5567] dark:focus:ring-offset-[#151929]
    `,
    ghost: `
      text-slate-600 hover:bg-slate-100 focus:ring-slate-400
      dark:text-[#8892a4] dark:hover:bg-[#2a3245]
      dark:focus:ring-[#4a5567] dark:focus:ring-offset-[#151929]
    `,
    danger: `
      bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500
      dark:bg-rose-700 dark:hover:bg-rose-800 dark:active:bg-rose-900
      dark:focus:ring-rose-600 dark:focus:ring-offset-[#151929]
    `,
    success: `
      bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500
      dark:bg-emerald-700 dark:hover:bg-emerald-800 dark:active:bg-emerald-900
      dark:focus:ring-emerald-600 dark:focus:ring-offset-[#151929]
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

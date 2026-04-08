import { FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        w-12 h-12 rounded-lg
        transition-colors duration-300
        ${theme === 'dark'
          ? 'bg-[#1e2433] hover:bg-[#2a3245] text-[#FF6B00]'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${theme === 'dark'
          ? 'focus:ring-[#FF6B00] focus:ring-offset-[#151929]'
          : 'focus:ring-blue-600'
        }
      `}
      aria-label={`Mudar para tema ${theme === 'dark' ? 'clean' : 'dark'}`}
      title={`Mudar para tema ${theme === 'dark' ? 'clean' : 'dark'}`}
    >
      {theme === 'dark' ? (
        <FiSun className="text-xl" />
      ) : (
        <FiMoon className="text-xl" />
      )}
    </button>
  );
};

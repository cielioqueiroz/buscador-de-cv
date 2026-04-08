import { Link } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { ThemeToggle } from '../ui/ThemeToggle';

export const Header = ({ showBreadcrumb = false, breadcrumb = null }) => {
  return (
    <header className="
      sticky top-0 z-40 transition-smooth
      bg-white dark:bg-[#151929]
      border-b border-slate-200 dark:border-[#2a3245]
      shadow-subtle dark:shadow-xl
    ">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group flex-shrink-0"
          >
            <div className="
              w-9 h-9 rounded-md flex items-center justify-center
              transition-smooth shadow-sm
              bg-blue-600 dark:bg-[#FF6B00]
              group-hover:bg-blue-700 dark:group-hover:bg-[#FF7D20]
            ">
              <FiSearch className="text-white text-lg font-bold" />
            </div>
            <div>
              <h1 className="
                text-lg font-semibold
                text-slate-900 dark:text-white
                dark:font-display dark:uppercase dark:text-base
              ">
                JobFinder
              </h1>
              <p className="
                text-xs font-medium
                text-slate-500 dark:text-[#8892a4]
              ">
                Oportunidades que combinam
              </p>
            </div>
          </Link>

          {/* Navigation - Dashboard style */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="
                text-slate-600 dark:text-[#8892a4]
                hover:text-blue-600 dark:hover:text-[#FF6B00]
                transition-smooth font-medium text-sm
                relative after:absolute after:bottom-0 after:left-0
                after:w-0 after:h-0.5
                after:bg-blue-600 dark:after:bg-[#FF6B00]
                after:transition-smooth hover:after:w-full
              ">
              Dashboard
            </Link>
            <Link
              to="/results"
              className="
                text-slate-600 dark:text-[#8892a4]
                hover:text-blue-600 dark:hover:text-[#FF6B00]
                transition-smooth font-medium text-sm
                relative after:absolute after:bottom-0 after:left-0
                after:w-0 after:h-0.5
                after:bg-blue-600 dark:after:bg-[#FF6B00]
                after:transition-smooth hover:after:w-full
              ">
              Vagas
            </Link>
          </nav>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>

        {showBreadcrumb && breadcrumb && (
          <div className="
            text-xs font-medium
            text-slate-500 dark:text-[#8892a4]
            mt-2
          ">
            {breadcrumb}
          </div>
        )}
      </div>
    </header>
  );
};

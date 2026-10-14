'use client';
import { useSyncExternalStore } from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';

// O tema mora na classe `dark` do <html> (o script do layout a põe antes da
// pintura); o botão só observa essa classe.
function subscribeTheme(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => mo.disconnect();
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains('dark'),
    () => true,
  );

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('jf_theme', next ? 'dark' : 'light');
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      aria-pressed={dark}
      className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-accent"
    >
      {dark ? <FiSun className="h-[18px] w-[18px]" /> : <FiMoon className="h-[18px] w-[18px]" />}
    </button>
  );
}

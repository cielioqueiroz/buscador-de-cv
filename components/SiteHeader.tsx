import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { HeaderLinks } from './HeaderLinks';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-display text-lg font-extrabold text-accent-foreground transition-transform group-hover:-rotate-6">
            V
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            Vaga<span className="text-accent-ink">Certa</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <HeaderLinks />
          <ThemeToggle />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}

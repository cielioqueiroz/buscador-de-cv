import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

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
          <Link
            href="/perfil"
            className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground sm:px-4"
          >
            Meu perfil
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

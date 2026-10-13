import { cn } from '@/lib/utils';

/**
 * Cartão das telas de conta (entrar, cadastrar, esqueci/redefinir senha). No
 * hover ele sobe um pouco e a borda acende na cor da marca; quem pediu menos
 * movimento fica só com a troca de cor.
 */
export function AuthCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'group/auth relative overflow-hidden rounded-panel border border-border bg-surface p-6 shadow-float sm:p-8',
        'transition-[transform,border-color,box-shadow] duration-300 ease-out',
        'hover:border-accent/60 hover:shadow-ring-accent motion-safe:hover:-translate-y-1',
        'focus-within:border-accent/60',
        className,
      )}
    >
      {/* brilho suave no topo, mesmo idioma do card de upload */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-panel bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_65%)] opacity-0 transition-opacity duration-300 group-hover/auth:opacity-100"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

import { cn } from '@/lib/utils';

/** Peças visuais da coluna de filtros (rótulo de seção e chips de escolha única). */

export function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-muted">
        {titulo}
      </span>
      {children}
    </div>
  );
}

export function Chips<T extends string | number | null>({
  itens,
  ativo,
  onPick,
}: {
  itens: { value: T; label: string; title?: string }[];
  ativo: T;
  onPick: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {itens.map((i) => (
        <button
          type="button"
          key={String(i.value)}
          onClick={() => onPick(i.value)}
          title={i.title}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            ativo === i.value
              ? 'border-accent bg-accent text-accent-foreground'
              : 'border-border bg-surface-2 text-muted hover:border-accent-ink hover:text-foreground',
          )}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

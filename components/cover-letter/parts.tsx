import { cn } from '@/lib/utils';

/** Peças visuais do painel da carta: grupo de escolha, pílula de opção e o "escrevendo…". */

export function Escolha({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

export function Pilula({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        ativo
          ? 'border-accent-ink bg-accent/15 text-accent-ink'
          : 'border-border bg-surface-2 text-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

/** A espera tem que parecer escrita acontecendo, não uma barra parada. */
export function Escrevendo() {
  return (
    <div className="mt-6 space-y-3 rounded-card border border-border bg-surface-2/40 p-6">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent-ink">
        <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-accent-bright" />
        escrevendo sua carta
      </p>
      {[92, 100, 84, 96, 70].map((w, i) => (
        <div
          key={i}
          className="animate-type-line h-3 rounded-full bg-foreground/10"
          style={{ width: `${w}%`, animationDelay: `${i * 140}ms` }}
        />
      ))}
    </div>
  );
}

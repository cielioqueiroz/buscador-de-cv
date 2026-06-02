'use client';
import { cn } from '@/lib/utils';

export interface FilterState {
  remoteOnly: boolean;
  minScore: number;
  source: 'all' | 'jsearch' | 'adzuna' | 'remotive';
}

const SOURCES: { value: FilterState['source']; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'jsearch', label: 'Google for Jobs' },
  { value: 'adzuna', label: 'Adzuna' },
  { value: 'remotive', label: 'Remotive' },
];

export function Filters({
  value,
  onChange,
  count,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
  count: number;
}) {
  return (
    <aside className="space-y-6 rounded-2xl border border-border bg-surface p-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Resultados</p>
        <p className="font-display text-3xl font-extrabold">{count}</p>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="text-sm font-medium">Só vagas remotas</span>
        <span
          onClick={() => onChange({ ...value, remoteOnly: !value.remoteOnly })}
          className={cn(
            'relative h-6 w-11 rounded-full transition-colors',
            value.remoteOnly ? 'bg-accent' : 'bg-surface-2 border border-border',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform',
              value.remoteOnly ? 'translate-x-[22px] bg-accent-foreground' : 'translate-x-0.5',
            )}
          />
        </span>
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Score mínimo</span>
          <span className="font-mono text-sm text-accent">{value.minScore}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value.minScore}
          onChange={(e) => onChange({ ...value, minScore: Number(e.target.value) })}
          className="w-full accent-[var(--accent-bright)]"
        />
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium">Fonte</span>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((s) => (
            <button
              key={s.value}
              onClick={() => onChange({ ...value, source: s.value })}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                value.source === s.value
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border bg-surface-2 text-muted hover:text-foreground',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

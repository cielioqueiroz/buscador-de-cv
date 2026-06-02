import { cn } from '@/lib/utils';
import type { Job } from '@/lib/providers/types';

const SOURCE_LABEL: Record<Job['source'], string> = {
  jsearch: 'Google for Jobs',
  adzuna: 'Adzuna',
  remotive: 'Remotive',
};

/** Indica de onde veio a vaga (e o publisher, ex.: LinkedIn) — confiabilidade da fonte. */
export function SourceBadge({ source, publisher }: { source: Job['source']; publisher?: string }) {
  const label = publisher || SOURCE_LABEL[source];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2',
        'px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted',
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent-bright" />
      {label}
    </span>
  );
}

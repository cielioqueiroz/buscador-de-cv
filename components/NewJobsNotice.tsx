import { FiBell, FiRefreshCw } from 'react-icons/fi';
import { ALERT_MIN_SCORE, STALE_AFTER_DAYS } from '@/lib/jobs/new-jobs';

/**
 * O alerta de vagas, dentro do app: quantas vagas boas apareceram desde a
 * busca anterior e, se a lista já está velha, um convite para buscar de novo.
 * Some quando não tem nada a dizer.
 */
export function NewJobsNotice({
  count,
  ageDays,
  onRefresh,
  refreshing,
}: {
  count: number;
  ageDays: number | null;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const stale = ageDays !== null && ageDays >= STALE_AFTER_DAYS;
  if (count === 0 && !stale) return null;

  return (
    <section
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent-ink/40 bg-surface p-4"
    >
      <div className="flex min-w-0 items-start gap-3">
        <FiBell className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" aria-hidden />
        <div className="text-sm">
          {count > 0 && (
            <p className="font-semibold">
              {count === 1
                ? `1 vaga nova com nota ${ALERT_MIN_SCORE}+ desde a sua busca anterior.`
                : `${count} vagas novas com nota ${ALERT_MIN_SCORE}+ desde a sua busca anterior.`}
            </p>
          )}
          {stale && (
            <p className={count > 0 ? 'mt-0.5 text-muted' : 'font-semibold'}>
              Esta lista é de {ageDays} dias atrás. Vagas abrem e fecham todo dia.
            </p>
          )}
        </div>
      </div>
      {stale && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <FiRefreshCw className={refreshing ? 'h-4 w-4 animate-spin motion-reduce:animate-none' : 'h-4 w-4'} aria-hidden />
          Buscar vagas novas
        </button>
      )}
    </section>
  );
}

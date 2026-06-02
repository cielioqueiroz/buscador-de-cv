'use client';
import { useState } from 'react';
import { FiMapPin, FiExternalLink, FiHeart, FiCheck, FiAlertTriangle, FiHome } from 'react-icons/fi';
import type { RankedJob } from '@/lib/matching';
import { ScoreGauge } from './ScoreGauge';
import { SourceBadge } from './SourceBadge';
import { getFavorites, toggleFavorite } from '@/lib/store';
import { cn } from '@/lib/utils';

export function JobCard({ ranked, index = 0 }: { ranked: RankedJob; index?: number }) {
  const { job, match } = ranked;
  const [fav, setFav] = useState(() => getFavorites().includes(job.id));

  function onFav(e: React.MouseEvent) {
    e.preventDefault();
    setFav(toggleFavorite(job.id).includes(job.id));
  }

  return (
    <article
      className="animate-rise hover-lift group relative rounded-2xl border border-border bg-surface p-5 sm:p-6"
      style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SourceBadge source={job.source} publisher={job.publisher} />
            {job.remote && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                <FiHome className="h-3 w-3" /> Remoto
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-bold leading-tight sm:text-xl">{job.title}</h3>
          <p className="mt-0.5 text-sm text-muted">
            <span className="font-medium text-foreground">{job.company}</span>
            <span className="mx-1.5">·</span>
            <span className="inline-flex items-center gap-1">
              <FiMapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
          </p>
        </div>
        <ScoreGauge score={match.score} className="shrink-0" />
      </div>

      {(match.reasons.length > 0 || match.gaps.length > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {match.reasons.length > 0 && (
            <ul className="space-y-1.5">
              {match.reasons.slice(0, 3).map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" />
                  <span className="text-foreground/90">{r}</span>
                </li>
              ))}
            </ul>
          )}
          {match.gaps.length > 0 && (
            <ul className="space-y-1.5">
              {match.gaps.slice(0, 3).map((g, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                  <span className="text-muted">{g}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {job.salary && (job.salary.min || job.salary.max) && (
        <p className="mt-4 font-mono text-sm text-foreground">
          {job.salary.min ? `R$ ${job.salary.min.toLocaleString('pt-BR')}` : ''}
          {job.salary.min && job.salary.max ? ' – ' : ''}
          {job.salary.max ? `R$ ${job.salary.max.toLocaleString('pt-BR')}` : ''}
          <span className="ml-1 text-muted">/mês</span>
        </p>
      )}

      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover-glow inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-display text-sm font-bold text-accent-foreground sm:flex-none"
        >
          Candidatar-se <FiExternalLink className="h-4 w-4" />
        </a>
        <button
          onClick={onFav}
          aria-label={fav ? 'Remover dos favoritos' : 'Salvar vaga'}
          className={cn(
            'grid h-10 w-10 place-items-center rounded-xl border border-border transition-colors',
            fav ? 'bg-warn/10 text-warn border-warn/40' : 'bg-surface-2 text-muted hover:text-foreground',
          )}
        >
          <FiHeart className={cn('h-[18px] w-[18px]', fav && 'fill-current')} />
        </button>
      </div>
    </article>
  );
}

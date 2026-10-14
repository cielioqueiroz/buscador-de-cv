'use client';
import { FiHeart } from 'react-icons/fi';
import type { FilterState } from '@/lib/filters';
import type { SearchOpts } from '@/lib/journey';
import { cn } from '@/lib/utils';
import { Chips, Grupo } from './filters/controls';
import { RegionSearch } from './filters/RegionSearch';

export type { FilterState };

const ORDENS: { value: FilterState['order']; label: string }[] = [
  { value: 'score', label: 'Melhor match' },
  { value: 'recent', label: 'Mais recentes' },
  { value: 'salary', label: 'Maior salário' },
];

const MODALIDADES: { value: FilterState['modality']; label: string; title?: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'remote', label: 'Remota' },
  {
    value: 'hybrid',
    label: 'Híbrida',
    // As fontes não têm campo "híbrido" — detectamos pelo texto do anúncio.
    title: 'Detectada pelo texto do anúncio — as fontes não informam híbrido diretamente.',
  },
  { value: 'onsite', label: 'Presencial' },
];

const PERIODOS: { value: FilterState['maxDays']; label: string }[] = [
  { value: null, label: 'Qualquer data' },
  { value: 1, label: '24h' },
  { value: 7, label: 'Semana' },
  { value: 30, label: 'Mês' },
];

const SOURCES: { value: FilterState['source']; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'jsearch', label: 'JSearch' },
  { value: 'adzuna', label: 'Adzuna' },
  { value: 'remotive', label: 'Remotive' },
];

export function Filters({
  value,
  onChange,
  count,
  favCount = 0,
  onRegionSearch,
  searching = false,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
  count: number;
  /** Quantas vagas o usuário favoritou — rotula o toggle de favoritas. */
  favCount?: number;
  /** Dispara a re-busca nas fontes (custa uma chamada à IA — fica atrás de botão). */
  onRegionSearch?: (opts: SearchOpts) => void;
  searching?: boolean;
}) {
  return (
    <aside className="space-y-6 rounded-card border border-border bg-surface p-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Resultados</p>
        <p className="font-display text-3xl font-extrabold">{count}</p>
      </div>

      <Grupo titulo="Favoritas">
        <button
          type="button"
          onClick={() => onChange({ ...value, favorite: !value.favorite })}
          aria-pressed={value.favorite}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            value.favorite
              ? 'border-accent bg-accent text-accent-foreground'
              : 'border-border bg-surface-2 text-muted hover:border-accent-ink hover:text-foreground',
          )}
        >
          <FiHeart className={cn('h-3.5 w-3.5', value.favorite && 'fill-current')} />
          Só favoritas
          <span className="font-mono opacity-70">{favCount}</span>
        </button>
      </Grupo>

      <Grupo titulo="Salário">
        <button
          type="button"
          onClick={() => onChange({ ...value, salaryOnly: !value.salaryOnly })}
          aria-pressed={value.salaryOnly}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            value.salaryOnly
              ? 'border-accent bg-accent text-accent-foreground'
              : 'border-border bg-surface-2 text-muted hover:border-accent-ink hover:text-foreground',
          )}
        >
          Só com salário informado
        </button>
      </Grupo>

      <Grupo titulo="Ordenar">
        <Chips
          itens={ORDENS}
          ativo={value.order}
          onPick={(order) => onChange({ ...value, order })}
        />
      </Grupo>

      <Grupo titulo="Modalidade">
        <Chips
          itens={MODALIDADES}
          ativo={value.modality}
          onPick={(modality) => onChange({ ...value, modality })}
        />
      </Grupo>

      <Grupo titulo="Publicada">
        <Chips
          itens={PERIODOS}
          ativo={value.maxDays}
          onPick={(maxDays) => onChange({ ...value, maxDays })}
        />
        {value.maxDays !== null && (
          <p className="mt-2 text-[11px] leading-snug text-muted">
            Vagas sem data de publicação ficam de fora quando um período está ativo.
          </p>
        )}
      </Grupo>

      <Grupo titulo="Fonte">
        <Chips
          itens={SOURCES}
          ativo={value.source}
          onPick={(source) => onChange({ ...value, source })}
        />
      </Grupo>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
            Score mínimo
          </span>
          <span className="font-mono text-sm text-accent-ink">{value.minScore}</span>
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

      {onRegionSearch && <RegionSearch onSearch={onRegionSearch} searching={searching} />}
    </aside>
  );
}

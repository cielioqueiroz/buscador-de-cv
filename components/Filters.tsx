'use client';
import { useEffect, useState } from 'react';
import { FiSearch, FiHeart } from 'react-icons/fi';
import type { FilterState } from '@/lib/filters';
import type { SearchOpts } from '@/lib/journey';
import { loadRegion, saveRegion } from '@/lib/store';
import { cn } from '@/lib/utils';

export type { FilterState };

const ORDENS: { value: FilterState['order']; label: string }[] = [
  { value: 'score', label: 'Melhor match' },
  { value: 'recent', label: 'Mais recentes' },
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

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

/** Países que o JSearch atende bem, além do Brasil. */
const PAISES: { value: string; label: string }[] = [
  { value: 'us', label: 'Estados Unidos' },
  { value: 'pt', label: 'Portugal' },
  { value: 'es', label: 'Espanha' },
  { value: 'de', label: 'Alemanha' },
  { value: 'fr', label: 'França' },
  { value: 'gb', label: 'Reino Unido' },
  { value: 'ca', label: 'Canadá' },
  { value: 'au', label: 'Austrália' },
  { value: 'nl', label: 'Holanda' },
  { value: 'mx', label: 'México' },
  { value: 'ar', label: 'Argentina' },
];

type Escopo = 'br' | 'intl' | 'any';

/** Identidade da região escolhida — define quando a re-busca vale a pena. */
function chaveDe(escopo: Escopo, uf: string, cidade: string, pais: string): string {
  const meio = escopo === 'br' ? uf : escopo === 'intl' ? pais : '';
  return `${escopo}|${meio}|${cidade.trim().toLowerCase()}`;
}

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
  const [escopo, setEscopo] = useState<Escopo>('any');
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [pais, setPais] = useState('us');
  // A primeira busca (do upload) equivale a escopo "qualquer lugar".
  const [ultimaBusca, setUltimaBusca] = useState('any||');

  // Restaura a última região escolhida. Fica num efeito (não na inicialização
  // do useState) porque ler o localStorage na primeira renderização causaria
  // mismatch de hidratação — o servidor não tem acesso a ele.
  useEffect(() => {
    const r = loadRegion();
    if (!r) return;
    setEscopo(r.escopo);
    setUf(r.uf);
    setCidade(r.cidade);
    setPais(r.pais);
    // Aquele ranking já está em cache, então o botão nasce desabilitado até
    // o usuário mudar algo de novo.
    setUltimaBusca(chaveDe(r.escopo, r.uf, r.cidade, r.pais));
  }, []);

  const chave = chaveDe(escopo, uf, cidade, pais);
  const mudou = chave !== ultimaBusca;

  function buscarRegiao() {
    if (!onRegionSearch) return;
    const cidadeLimpa = cidade.trim();
    const opts: SearchOpts =
      escopo === 'br'
        ? {
            country: 'br',
            location: cidadeLimpa ? (uf ? `${cidadeLimpa}, ${uf}` : cidadeLimpa) : uf || undefined,
          }
        : escopo === 'intl'
          ? { country: pais, location: cidadeLimpa || undefined }
          : {};
    setUltimaBusca(chave);
    saveRegion({ escopo, uf, cidade, pais });
    onRegionSearch(opts);
  }

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

      {onRegionSearch && (
        <Grupo titulo="Onde">
          <Chips
            itens={[
              { value: 'br' as Escopo, label: 'Brasil' },
              { value: 'intl' as Escopo, label: 'Internacional' },
              { value: 'any' as Escopo, label: 'Qualquer lugar' },
            ]}
            ativo={escopo}
            onPick={setEscopo}
          />

          {escopo === 'br' && (
            <div className="mt-3 space-y-2">
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                aria-label="Estado"
                className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm"
              >
                <option value="">Todos os estados</option>
                {UFS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Cidade (opcional)"
                aria-label="Cidade"
                className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm placeholder:text-muted"
              />
            </div>
          )}

          {escopo === 'intl' && (
            <div className="mt-3 space-y-2">
              <select
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                aria-label="País"
                className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm"
              >
                {PAISES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Cidade (opcional)"
                aria-label="Cidade"
                className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm placeholder:text-muted"
              />
            </div>
          )}

          <button
            onClick={buscarRegiao}
            disabled={!mudou || searching}
            className={cn(
              'mt-3 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 font-display text-sm font-bold transition-all',
              mudou && !searching
                ? 'bg-accent text-accent-foreground hover:scale-[1.02] hover:shadow-accent'
                : 'cursor-not-allowed border border-border bg-surface-2 text-muted',
            )}
          >
            <FiSearch className="h-4 w-4" />
            {searching ? 'Buscando…' : 'Buscar nessa região'}
          </button>
          <p className="mt-2 text-[11px] leading-snug text-muted">
            Consulta as fontes de novo e re-pontua com a IA.
          </p>
        </Grupo>
      )}
    </aside>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-muted">
        {titulo}
      </span>
      {children}
    </div>
  );
}

function Chips<T extends string | number | null>({
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

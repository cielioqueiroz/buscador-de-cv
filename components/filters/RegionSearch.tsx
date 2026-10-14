'use client';
import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import type { SearchOpts } from '@/lib/journey';
import { loadRegion, saveRegion } from '@/lib/store';
import { useIsClient } from '@/lib/client/browser-state';
import { cn } from '@/lib/utils';
import { Chips, Grupo } from './controls';

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

/**
 * "Onde": muda o lugar da busca. Diferente dos outros filtros, que agem na hora
 * sobre o ranking carregado, este consulta as fontes de novo e re-pontua com a
 * IA — por isso fica atrás de um botão, que só acende quando a região mudou.
 */
export function RegionSearch({
  onSearch,
  searching = false,
}: {
  onSearch: (opts: SearchOpts) => void;
  searching?: boolean;
}) {
  const [escopo, setEscopo] = useState<Escopo>('any');
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [pais, setPais] = useState('us');
  // A primeira busca (do upload) equivale a escopo "qualquer lugar".
  const [ultimaBusca, setUltimaBusca] = useState('any||');

  // Restaura a última região escolhida na primeira renderização já no
  // navegador. Não pode ser na inicialização do useState: ler o localStorage
  // na hidratação causaria mismatch — o servidor não tem acesso a ele.
  const isClient = useIsClient();
  const [restaurado, setRestaurado] = useState(false);
  if (isClient && !restaurado) {
    setRestaurado(true);
    const r = loadRegion();
    if (r) {
      setEscopo(r.escopo);
      setUf(r.uf);
      setCidade(r.cidade);
      setPais(r.pais);
      // Aquele ranking já está em cache, então o botão nasce desabilitado até
      // o usuário mudar algo de novo.
      setUltimaBusca(chaveDe(r.escopo, r.uf, r.cidade, r.pais));
    }
  }

  const chave = chaveDe(escopo, uf, cidade, pais);
  const mudou = chave !== ultimaBusca;

  function buscarRegiao() {
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
    onSearch(opts);
  }

  return (
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
            className="field w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none"
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
            className="field w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted"
          />
        </div>
      )}

      {escopo === 'intl' && (
        <div className="mt-3 space-y-2">
          <select
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            aria-label="País"
            className="field w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none"
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
            className="field w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted"
          />
        </div>
      )}

      <button
        type="button"
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
  );
}

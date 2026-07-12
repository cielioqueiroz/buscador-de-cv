'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { FiArrowLeft } from 'react-icons/fi';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { JobCard } from '@/components/JobCard';
import { Filters } from '@/components/Filters';
import { LoadingJourney } from '@/components/LoadingJourney';
import { Confetti } from '@/components/Confetti';
import { applyFilters, DEFAULT_FILTERS, type FilterState } from '@/lib/filters';
import { searchAndRank, type SearchOpts } from '@/lib/journey';
import { loadProfile, loadRanked } from '@/lib/store';
import type { CVProfile } from '@/lib/providers/types';
import type { RankedJob } from '@/lib/matching';

export default function ResultadosPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CVProfile | null>(null);
  const [ranked, setRanked] = useState<RankedJob[]>([]);
  const [status, setStatus] = useState<'idle' | 'searching' | 'matching' | 'done' | 'error'>('idle');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  // Overlay da re-busca regional. Vive em estado próprio (e não no `status`)
  // para a página continuar montada por baixo: trocar a árvore inteira pelo
  // overlay desmontava o Filters e o formulário de região esquecia a escolha.
  const [regionStage, setRegionStage] = useState<'searching' | 'scoring' | null>(null);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace('/');
      return;
    }
    setProfile(p);

    const cached = loadRanked();
    if (cached && cached.length) {
      setRanked(cached);
      setStatus('done');
      return;
    }

    (async () => {
      try {
        const result = await searchAndRank(p, {}, (s) =>
          setStatus(s === 'searching' ? 'searching' : 'matching'),
        );
        setRanked(result);
        setStatus('done');
      } catch (e: unknown) {
        setStatus('error');
        toast.error(e instanceof Error ? e.message : 'Erro ao buscar vagas.');
      }
    })();
  }, [router]);

  /**
   * Re-busca regional: mudar de lugar exige nova consulta às fontes — só 15
   * vagas são pontuadas por busca, filtrar essas 15 por cidade daria zero.
   * O overlay da jornada volta durante a espera (via status); em erro, o
   * ranking anterior fica intacto na tela.
   */
  async function buscarRegiao(opts: SearchOpts) {
    if (!profile) return;
    try {
      const result = await searchAndRank(profile, opts, (s) =>
        setRegionStage(s === 'searching' ? 'searching' : 'scoring'),
      );
      setRanked(result);
      if (result.length === 0) toast.info('Nenhuma vaga nessa região. Tente ampliar o escopo.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao buscar vagas.');
    } finally {
      setRegionStage(null);
    }
  }

  const visible = useMemo(() => applyFilters(ranked, filters), [ranked, filters]);
  const filtrosAtivos = useMemo(
    () => JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS),
    [filters],
  );

  // Fallback: quem recarrega /resultados ou entra direto ainda faz a busca
  // aqui — e merece a mesma jornada de quem veio pela home, não um esqueleto.
  if (status === 'searching' || status === 'matching') {
    return <LoadingJourney stage={status === 'searching' ? 'searching' : 'scoring'} />;
  }

  // Um match forte merece uma comemoração — uma vez por sessão, e o Confetti
  // cuida de não repetir a cada filtro aplicado.
  const temMatchForte = status === 'done' && ranked.some((r) => r.match.score >= 90);

  return (
    <>
      {/* por cima da página, que segue montada — o Filters não perde estado */}
      {regionStage && <LoadingJourney stage={regionStage} />}
      <Confetti ativo={temMatchForte} />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link
              href="/"
              className="group mb-2 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted hover:text-foreground"
            >
              <FiArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> trocar currículo
            </Link>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
              Vagas para <span className="text-accent-ink">{profile?.title ?? 'você'}</span>
            </h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Filters
              value={filters}
              onChange={setFilters}
              count={visible.length}
              onRegionSearch={buscarRegiao}
              searching={regionStage !== null}
            />
          </div>

          <div className="space-y-4">
            {status === 'done' && visible.length === 0 && (
              <EmptyState
                hasAny={ranked.length > 0}
                onClear={filtrosAtivos ? () => setFilters(DEFAULT_FILTERS) : undefined}
              />
            )}

            {status === 'error' && (
              <div className="rounded-2xl border border-warn/40 bg-warn/10 p-8 text-center">
                <p className="font-display text-lg font-bold">Algo deu errado na busca.</p>
                <p className="mt-1 text-sm text-muted">
                  Confira se as chaves de API estão no <code className="font-mono">.env.local</code>.
                </p>
              </div>
            )}

            {visible.map((r, i) => (
              <JobCard key={r.job.id} ranked={r} index={i} profile={profile} />
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function EmptyState({ hasAny, onClear }: { hasAny: boolean; onClear?: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
      <p className="font-display text-xl font-bold">
        {hasAny ? 'Nenhuma vaga com esses filtros' : 'Não encontramos vagas agora'}
      </p>
      <p className="mt-2 text-sm text-muted">
        {hasAny
          ? 'Tente afrouxar a modalidade, o período ou o score mínimo.'
          : 'As fontes podem não ter retornado resultados para o seu perfil. Tente um CV com mais detalhes ou amplie o escopo da região.'}
      </p>
      {onClear && (
        <button
          onClick={onClear}
          className="mt-5 rounded-full bg-accent px-5 py-2 font-display text-sm font-bold text-accent-foreground transition-transform hover:scale-105"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

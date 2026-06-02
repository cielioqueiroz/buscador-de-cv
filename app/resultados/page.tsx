'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';
import { SiteHeader } from '@/components/SiteHeader';
import { JobCard } from '@/components/JobCard';
import { Filters, type FilterState } from '@/components/Filters';
import { loadProfile, saveRanked, loadRanked } from '@/lib/store';
import type { CVProfile } from '@/lib/providers/types';
import type { RankedJob } from '@/lib/matching';

export default function ResultadosPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CVProfile | null>(null);
  const [ranked, setRanked] = useState<RankedJob[]>([]);
  const [status, setStatus] = useState<'idle' | 'searching' | 'matching' | 'done' | 'error'>('idle');
  const [filters, setFilters] = useState<FilterState>({ remoteOnly: false, minScore: 0, source: 'all' });

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
        setStatus('searching');
        const searchRes = await fetch('/api/jobs/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queries: p.searchQueries, opts: {} }),
        });
        const searchData = await searchRes.json();
        if (!searchRes.ok) throw new Error(searchData.error || 'Falha na busca.');
        const jobs = searchData.jobs ?? [];
        if (jobs.length === 0) {
          setStatus('done');
          return;
        }

        setStatus('matching');
        const matchRes = await fetch('/api/jobs/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: p, jobs }),
        });
        const matchData = await matchRes.json();
        if (!matchRes.ok) throw new Error(matchData.error || 'Falha no matching.');

        const result: RankedJob[] = matchData.ranked ?? [];
        setRanked(result);
        saveRanked(result);
        setStatus('done');
      } catch (e: unknown) {
        setStatus('error');
        toast.error(e instanceof Error ? e.message : 'Erro ao buscar vagas.');
      }
    })();
  }, [router]);

  const visible = useMemo(() => {
    return ranked.filter((r) => {
      if (filters.remoteOnly && !r.job.remote) return false;
      if (filters.source !== 'all' && r.job.source !== filters.source) return false;
      if (r.match.score < filters.minScore) return false;
      return true;
    });
  }, [ranked, filters]);

  const loading = status === 'searching' || status === 'matching';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link
              href="/"
              className="mb-2 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted hover:text-foreground"
            >
              <FiArrowLeft className="h-3.5 w-3.5" /> trocar currículo
            </Link>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
              Vagas para <span className="text-accent">{profile?.title ?? 'você'}</span>
            </h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Filters value={filters} onChange={setFilters} count={visible.length} />
          </div>

          <div className="space-y-4">
            {loading && <LoadingState status={status} />}

            {status === 'done' && visible.length === 0 && (
              <EmptyState hasAny={ranked.length > 0} />
            )}

            {status === 'error' && (
              <div className="rounded-2xl border border-warn/40 bg-warn/10 p-8 text-center">
                <p className="font-display text-lg font-bold">Algo deu errado na busca.</p>
                <p className="mt-1 text-sm text-muted">
                  Confira se as chaves de API estão no <code className="font-mono">.env.local</code>.
                </p>
              </div>
            )}

            {!loading &&
              visible.map((r, i) => <JobCard key={r.job.id} ranked={r} index={i} />)}
          </div>
        </div>
      </main>
    </>
  );
}

function LoadingState({ status }: { status: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        <FiSearch className="h-5 w-5 animate-pulse text-accent" />
        <p className="text-sm text-muted">
          {status === 'searching' ? 'Buscando vagas nas fontes…' : 'A IA está pontuando cada vaga para o seu perfil…'}
        </p>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-border bg-surface p-6">
          <div className="flex justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-4 w-24 rounded bg-surface-2" />
              <div className="h-5 w-2/3 rounded bg-surface-2" />
              <div className="h-4 w-1/3 rounded bg-surface-2" />
            </div>
            <div className="h-16 w-16 rounded-full bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
      <p className="font-display text-xl font-bold">
        {hasAny ? 'Nenhuma vaga com esses filtros' : 'Não encontramos vagas agora'}
      </p>
      <p className="mt-2 text-sm text-muted">
        {hasAny
          ? 'Tente baixar o score mínimo ou liberar as fontes.'
          : 'As fontes podem não ter retornado resultados para o seu perfil. Tente um CV com mais detalhes.'}
      </p>
    </div>
  );
}

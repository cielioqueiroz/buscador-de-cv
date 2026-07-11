'use client';
import { clearProfile, saveProfile, saveRanked } from '@/lib/store';
import type { CVProfile, Job } from '@/lib/providers/types';
import type { RankedJob } from '@/lib/matching';

/**
 * As etapas que o usuário atravessa entre soltar o currículo e ver as vagas.
 * A UI (LoadingJourney) desenha uma delas por vez; aqui elas são só o roteiro.
 */
export type Stage = 'reading' | 'profiling' | 'searching' | 'scoring';

export const STAGES: Stage[] = ['reading', 'profiling', 'searching', 'scoring'];

async function post(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(url, { method: 'POST', ...init });
  const data = await res.json();
  if (!res.ok) throw new Error((data?.error as string) || 'Algo deu errado.');
  return data;
}

function json(body: unknown): RequestInit {
  return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

/** O que a re-busca regional pode pedir às fontes (validado no servidor). */
export interface SearchOpts {
  location?: string;
  country?: string;
  remoteOnly?: boolean;
}

/**
 * A metade buscar+pontuar da jornada, separada porque tem dois donos: o
 * runJourney (primeiro upload) e a re-busca regional dos filtros de /resultados
 * — mudar de cidade/país exige nova consulta às fontes, já que só 15 vagas são
 * pontuadas por busca e filtrar essas 15 por lugar quase sempre daria zero.
 */
export async function searchAndRank(
  profile: CVProfile,
  opts: SearchOpts,
  onStage: (stage: Stage) => void,
): Promise<RankedJob[]> {
  onStage('searching');
  const found = await post('/api/jobs/search', json({ queries: profile.searchQueries, opts }));
  const jobs = (found.jobs as Job[]) ?? [];

  // Sem vagas não é falha, é resultado: /resultados já tem estado vazio para
  // isso, e mandar lista vazia para a IA só queimaria uma chamada.
  if (jobs.length === 0) {
    saveRanked([]);
    return [];
  }

  onStage('scoring');
  const matched = await post('/api/jobs/match', json({ profile, jobs }));
  const ranked = (matched.ranked as RankedJob[]) ?? [];
  saveRanked(ranked);

  return ranked;
}

/**
 * A espera inteira, de uma vez só: lê o CV, busca as vagas e pontua cada uma.
 *
 * Antes isso vivia partido entre a home (análise) e /resultados (busca +
 * matching), e cada metade tinha seu próprio feedback fraco — o usuário achava
 * que a tela tinha travado. Rodando tudo aqui, sob um overlay só, a navegação
 * para /resultados acontece com o ranking já em cache: a página abre pronta.
 */
export async function runJourney(
  file: File,
  onStage: (stage: Stage) => void,
): Promise<{ profile: CVProfile; ranked: RankedJob[] }> {
  onStage('reading');
  const form = new FormData();
  form.append('file', file);
  const analyzed = await post('/api/cv/analyze', { body: form });
  const profile = analyzed.profile as CVProfile;

  onStage('profiling');
  clearProfile();
  saveProfile(profile);

  const ranked = await searchAndRank(profile, {}, onStage);
  return { profile, ranked };
}

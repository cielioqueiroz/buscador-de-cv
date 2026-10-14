import { Job, JobProvider, parseProviderJobs, SearchOpts } from './types';
import { adzuna } from './adzuna';
import { remotive } from './remotive';
import { jsearch } from './jsearch';

export const defaultProviders: JobProvider[] = [jsearch, adzuna, remotive];

export async function searchAllProviders(
  queries: string[],
  opts: SearchOpts,
  providers: JobProvider[] = defaultProviders,
): Promise<Job[]> {
  const uniqueQueries = [...new Map(queries.map((query) => [query.trim().toLowerCase(), query.trim()])).values()];
  const tasks: (() => Promise<Job[]>)[] = [];
  for (const provider of providers) {
    for (const query of uniqueQueries) {
      tasks.push(() => provider.search(query, opts));
    }
  }

  // Evita disparar dezenas de conexões ao mesmo tempo quando a IA gera várias
  // queries. Os adapters possuem timeout próprio; este limite reduz a pressão
  // nos providers e torna a latência mais previsível.
  const settled: PromiseSettledResult<Job[]>[] = [];
  for (let i = 0; i < tasks.length; i += 6) {
    settled.push(...await Promise.allSettled(tasks.slice(i, i + 6).map((task) => task())));
  }

  const all: Job[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled') all.push(...parseProviderJobs(r.value));
  }

  return dedupe(all);
}

const COMPANY_SUFFIX = /\b(ltda|ltd|sa|inc|llc|eireli|gmbh|corp)\b/g;

/** Minúsculas, sem acento, só letras e números separados por um espaço. */
function norm(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * Chave de "mesma vaga" entre provedores. O id (lib/providers/types.ts) já junta
 * título+empresa+local idênticos, mas cada fonte escreve diferente: "Nubank
 * Ltda" × "NUBANK", "São Paulo, SP" × "Sao Paulo - SP". O id em si não muda —
 * favoritos e candidaturas salvos apontam para ele.
 */
export function dedupeKey(job: Job): string {
  const company = norm(job.company).replace(COMPANY_SUFFIX, '').replace(/\s+/g, ' ').trim();
  const city = job.remote ? 'remoto' : norm(job.location.split(/[,\-–(|/]/)[0] ?? '');
  return `${norm(job.title)}|${company}|${city}`;
}

/** Entre duplicatas, fica a que informa salário e tem a descrição mais completa. */
function richness(job: Job): number {
  return (job.salary ? 10_000 : 0) + job.description.length;
}

function dedupe(jobs: Job[]): Job[] {
  const kept = new Map<string, Job>();
  const seenIds = new Set<string>();
  for (const job of jobs) {
    if (seenIds.has(job.id)) continue;
    seenIds.add(job.id);
    const key = dedupeKey(job);
    const current = kept.get(key);
    // Map preserva a ordem de inserção: a vaga fica na posição da primeira vista.
    if (!current || richness(job) > richness(current)) kept.set(key, job);
  }
  return [...kept.values()];
}

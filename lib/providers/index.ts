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

  const byId = new Map<string, Job>();
  for (const job of all) {
    if (byId.has(job.id)) continue;
    byId.set(job.id, job);
  }
  return [...byId.values()];
}

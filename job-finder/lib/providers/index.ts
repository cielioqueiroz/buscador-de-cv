import { Job, JobProvider, SearchOpts } from './types';
import { adzuna } from './adzuna';
import { remotive } from './remotive';
import { jsearch } from './jsearch';

export const defaultProviders: JobProvider[] = [jsearch, adzuna, remotive];

export async function searchAllProviders(
  queries: string[],
  opts: SearchOpts,
  providers: JobProvider[] = defaultProviders,
): Promise<Job[]> {
  const tasks: Promise<Job[]>[] = [];
  for (const provider of providers) {
    for (const query of queries) {
      tasks.push(provider.search(query, opts));
    }
  }
  const settled = await Promise.allSettled(tasks);
  const all: Job[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }
  const byId = new Map<string, Job>();
  for (const job of all) {
    if (!byId.has(job.id)) byId.set(job.id, job);
  }
  return [...byId.values()];
}

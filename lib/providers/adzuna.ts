import {
  asNumber,
  asRecord,
  asString,
  Job,
  JobProvider,
  jobId,
  parseProviderJobs,
  SearchOpts,
} from './types';
import { fetchJson } from './http';

const BASE = 'https://api.adzuna.com/v1/api/jobs/br/search/1';

export const adzuna: JobProvider = {
  name: 'adzuna',
  async search(query: string, opts: SearchOpts): Promise<Job[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) return [];

    // A URL é cravada em /jobs/br/: numa busca internacional este provider só
    // devolveria vagas brasileiras poluindo o resultado — melhor nem consultar.
    if (opts.country && opts.country !== 'br') return [];

    const params = new URLSearchParams({
      app_id: appId, app_key: appKey,
      what: query, results_per_page: '20',
      'content-type': 'application/json',
    });
    if (opts.location) params.set('where', opts.location);

    try {
      const data = asRecord(await fetchJson(`${BASE}?${params.toString()}`));
      const results = Array.isArray(data.results) ? data.results : [];
      const jobs = results.map((value): Job => {
        const r = asRecord(value);
        const company = asString(asRecord(r.company).display_name, 'Empresa não informada');
        const location = asString(asRecord(r.location).display_name, 'Brasil');
        const title = asString(r.title, 'Vaga');
        const description = asString(r.description, '');
        const salaryMin = asNumber(r.salary_min);
        const salaryMax = asNumber(r.salary_max);
        return {
          id: jobId(title, company, location),
          title, company, location,
          remote: /remoto|remote|home office/i.test(`${title} ${description} ${location}`),
          description,
          salary: (salaryMin !== undefined || salaryMax !== undefined)
            ? { min: salaryMin, max: salaryMax, currency: 'BRL' }
            : undefined,
          postedAt: typeof r.created === 'string' ? r.created : undefined,
          source: 'adzuna',
          applyUrl: asString(r.redirect_url, ''),
        };
      });
      return parseProviderJobs(jobs).filter((job) => !opts.remoteOnly || job.remote);
    } catch (err) {
      console.error('[provider/adzuna]', err);
      return [];
    }
  },
};

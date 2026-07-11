import { Job, JobProvider, SearchOpts, jobId } from './types';

const BASE = 'https://api.adzuna.com/v1/api/jobs/br/search/1';

export const adzuna: JobProvider = {
  name: 'adzuna',
  async search(query: string, opts: SearchOpts): Promise<Job[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) return [];

    const params = new URLSearchParams({
      app_id: appId, app_key: appKey,
      what: query, results_per_page: '20',
      'content-type': 'application/json',
    });
    if (opts.location) params.set('where', opts.location);

    try {
      const res = await fetch(`${BASE}?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results ?? []).map((r: any): Job => {
        const company = r.company?.display_name ?? 'Empresa não informada';
        const location = r.location?.display_name ?? 'Brasil';
        const title = r.title ?? 'Vaga';
        return {
          id: jobId(title, company, location),
          title, company, location,
          remote: /remoto|remote|home office/i.test(`${title} ${r.description ?? ''} ${location}`),
          description: r.description ?? '',
          salary: (r.salary_min || r.salary_max)
            ? { min: r.salary_min, max: r.salary_max, currency: 'BRL' }
            : undefined,
          postedAt: r.created,
          source: 'adzuna',
          applyUrl: r.redirect_url,
        };
      });
    } catch (err) {
      console.error('[provider/adzuna]', err);
      return [];
    }
  },
};

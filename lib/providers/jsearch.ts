import { Job, JobProvider, SearchOpts, jobId } from './types';

const HOST = 'jsearch.p.rapidapi.com';

/**
 * A v5 da API renomeou o endpoint (/search -> /search-v2) e mudou o formato:
 * as vagas agora vêm em `data.jobs`, não em `data`. O caminho antigo devolve 404.
 */
const ENDPOINT = 'search-v2';

export const jsearch: JobProvider = {
  name: 'jsearch',
  async search(query: string, opts: SearchOpts): Promise<Job[]> {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) return [];

    const params = new URLSearchParams({
      query,
      page: String(opts.page ?? 1),
      num_pages: '1',
      date_posted: 'all',
      // Sem isto o JSearch assume os EUA e devolve vagas americanas — o Adzuna
      // já é escopado no Brasil pela própria URL (/jobs/br/).
      country: opts.country ?? 'br',
    });
    if (opts.location) params.set('query', `${query} in ${opts.location}`);

    try {
      const res = await fetch(`https://${HOST}/${ENDPOINT}?${params.toString()}`, {
        headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': HOST },
      });
      if (!res.ok) {
        console.error(`[provider/jsearch] HTTP ${res.status}`);
        return [];
      }

      const data = await res.json();
      const jobs = data?.data?.jobs ?? [];

      return jobs.map((j: any): Job => {
        const company = j.employer_name ?? 'Empresa';
        // job_city/job_state costumam vir null na v5; job_location traz o texto
        // pronto ("Brasil", "São Paulo, SP").
        const location = j.job_location
          || [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ')
          || 'Não informado';
        const title = j.job_title ?? 'Vaga';

        return {
          id: jobId(title, company, location),
          title, company, location,
          remote: Boolean(j.job_is_remote),
          description: j.job_description ?? '',
          // A v5 devolve `null` aqui, e `null` não é `undefined`: o JobSchema
          // declara postedAt como string opcional, então um null reprovaria na
          // validação da rota /jobs/match e derrubaria a busca inteira.
          postedAt: j.job_posted_at_datetime_utc ?? undefined,
          source: 'jsearch',
          applyUrl: j.job_apply_link,
          publisher: j.job_publisher,
        };
      }).filter((job: Job) => Boolean(job.applyUrl)); // sem link, a vaga é inútil
    } catch (err) {
      console.error('[provider/jsearch]', err);
      return [];
    }
  },
};

import { Job, JobProvider, SearchOpts, jobId } from './types';

const HOST = 'jsearch.p.rapidapi.com';

export const jsearch: JobProvider = {
  name: 'jsearch',
  async search(query: string, opts: SearchOpts): Promise<Job[]> {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) return [];

    const q = opts.location ? `${query} in ${opts.location}` : query;
    const params = new URLSearchParams({ query: q, page: String(opts.page ?? 1), num_pages: '1' });
    if (opts.remoteOnly) params.set('remote_jobs_only', 'true');

    try {
      const res = await fetch(`https://${HOST}/search?${params.toString()}`, {
        headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': HOST },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data ?? []).map((j: any): Job => {
        const company = j.employer_name ?? 'Empresa';
        const location = [j.job_city, j.job_country].filter(Boolean).join(', ') || 'Não informado';
        const title = j.job_title ?? 'Vaga';
        return {
          id: jobId(title, company, location),
          title, company, location,
          remote: Boolean(j.job_is_remote),
          description: j.job_description ?? '',
          postedAt: j.job_posted_at_datetime_utc,
          source: 'jsearch',
          applyUrl: j.job_apply_link,
          publisher: j.job_publisher,
        };
      });
    } catch {
      return [];
    }
  },
};

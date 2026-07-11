import { Job, JobProvider, SearchOpts, jobId } from './types';

const BASE = 'https://remotive.com/api/remote-jobs';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const remotive: JobProvider = {
  name: 'remotive',
  async search(query: string, _opts: SearchOpts): Promise<Job[]> {
    try {
      const params = new URLSearchParams({ search: query, limit: '20' });
      const res = await fetch(`${BASE}?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.jobs ?? []).map((j: any): Job => {
        const company = j.company_name ?? 'Empresa';
        const location = j.candidate_required_location || 'Remoto';
        const title = j.title ?? 'Vaga';
        return {
          id: jobId(title, company, location),
          title, company, location,
          remote: true,
          description: stripHtml(j.description ?? ''),
          postedAt: j.publication_date,
          source: 'remotive',
          applyUrl: j.url,
        };
      });
    } catch (err) {
      console.error('[provider/remotive]', err);
      return [];
    }
  },
};

import { Job, JobProvider, SearchOpts, jobId } from './types';

const BASE = 'https://remotive.com/api/remote-jobs';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Tira acento e caixa, para "Front-End" casar com "front end". */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * A API do Remotive ignora o parâmetro `search`: buscar "cozinheiro" devolve as
 * mesmas vagas de engenharia de software que buscar "react", e o catálogo
 * inteiro tem só ~41 vagas. Como a API não filtra, filtramos aqui — senão o
 * ranking se enche de vagas que não têm nada a ver com o perfil, e elas ainda
 * consomem o orçamento de vagas que a IA pontua.
 */
function matchesQuery(job: Job, query: string): boolean {
  const terms = normalize(query)
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length > 2); // ignora "de", "e", "em"...

  if (terms.length === 0) return true;

  // Só o título. A descrição é longa e cita "React" de passagem em quase toda
  // vaga de software — usá-la deixava tudo passar.
  const words = normalize(job.title).split(/[^a-z0-9+#.]+/);

  // Prefixo de palavra, não substring: "front" casa com "frontend", mas "end"
  // não pode casar com "recommend" nem "backend".
  return terms.some((t) => words.some((w) => w.startsWith(t)));
}

export const remotive: JobProvider = {
  name: 'remotive',
  async search(query: string, _opts: SearchOpts): Promise<Job[]> {
    try {
      const params = new URLSearchParams({ search: query, limit: '20' });
      const res = await fetch(`${BASE}?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      const jobs: Job[] = (data.jobs ?? []).map((j: any): Job => {
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

      return jobs.filter((job) => matchesQuery(job, query));
    } catch (err) {
      console.error('[provider/remotive]', err);
      return [];
    }
  },
};

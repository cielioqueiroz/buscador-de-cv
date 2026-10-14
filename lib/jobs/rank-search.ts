import { createHash } from 'crypto';
import { getProfile } from '@/lib/auth/profile';
import { rankJobs } from '@/lib/matching';
import { MAX_JOBS_PER_MATCH, type CVProfile } from '@/lib/providers/types';
import type { RankedJob } from '@/lib/ranked';
import { loadCachedScores, loadSearch, saveRanking, saveScores } from '@/lib/jobs/store';
import { listDismissedIds } from '@/lib/jobs/dismissals';

export class MissingProfileError extends Error {
  constructor() {
    super('Envie seu currículo antes de buscar vagas.');
  }
}

export class MissingSearchError extends Error {
  constructor() {
    super('A busca expirou. Busque as vagas de novo.');
  }
}

/**
 * Sobe quando o formato da nota muda (ex.: v2 trouxe `missingSkills`): as
 * notas antigas em cache deixam de casar e são pontuadas de novo.
 */
const SCORE_FORMAT = 2;

/**
 * Identidade de uma versão do CV para o cache de notas. Entra tudo o que a IA
 * lê ao pontuar; `searchQueries` fica de fora porque não muda a nota.
 */
export function profileHash(profile: CVProfile): string {
  const { title, seniority, skills, areas, rawText } = profile;
  return createHash('sha256')
    .update(JSON.stringify({ v: SCORE_FORMAT, title, seniority, skills, areas, rawText }))
    .digest('hex');
}

/**
 * Pontua a última busca do usuário contra o perfil dele — os dois lidos do
 * banco, nunca do corpo da requisição. Notas já conhecidas para este CV vêm do
 * cache; só as novas vão à IA. O ranking final fica salvo para /resultados.
 */
export async function rankLatestSearch(userId: string): Promise<RankedJob[]> {
  const [profile, jobs, dismissed] = await Promise.all([
    getProfile(userId),
    loadSearch(userId),
    listDismissedIds(userId),
  ]);
  if (!profile) throw new MissingProfileError();
  if (!jobs) throw new MissingSearchError();

  // Vaga descartada não volta, e nem gasta uma das vagas do teto: quem entra
  // no lugar dela é uma que ainda pode interessar. O teto é custo pago — corta,
  // não recusa.
  const skip = new Set(dismissed);
  const batch = jobs.filter((job) => !skip.has(job.id)).slice(0, MAX_JOBS_PER_MATCH);
  if (batch.length === 0) {
    await saveRanking(userId, []);
    return [];
  }

  const hash = profileHash(profile);
  const cached = await loadCachedScores(userId, hash, batch.map((job) => job.id));
  const { ranked, fresh } = await rankJobs(profile, batch, cached);

  // Falhar ao guardar não pode custar o resultado que o usuário já pagou para ter.
  await Promise.all([
    saveScores(userId, hash, fresh).catch((err) => console.error('[rank-search] cache de notas:', err)),
    saveRanking(userId, ranked).catch((err) => console.error('[rank-search] ranking:', err)),
  ]);
  return ranked;
}

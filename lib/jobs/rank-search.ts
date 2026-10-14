import { createHash } from 'crypto';
import { getProfile } from '@/lib/auth/profile';
import { rankJobs } from '@/lib/matching';
import { MAX_JOBS_PER_MATCH, type CVProfile } from '@/lib/providers/types';
import type { RankedJob } from '@/lib/ranked';
import { loadCachedScores, loadSearch, saveRanking, saveScores } from '@/lib/jobs/store';

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
 * Identidade de uma versão do CV para o cache de notas. Entra tudo o que a IA
 * lê ao pontuar; `searchQueries` fica de fora porque não muda a nota.
 */
export function profileHash(profile: CVProfile): string {
  const { title, seniority, skills, areas, rawText } = profile;
  return createHash('sha256')
    .update(JSON.stringify({ title, seniority, skills, areas, rawText }))
    .digest('hex');
}

/**
 * Pontua a última busca do usuário contra o perfil dele — os dois lidos do
 * banco, nunca do corpo da requisição. Notas já conhecidas para este CV vêm do
 * cache; só as novas vão à IA. O ranking final fica salvo para /resultados.
 */
export async function rankLatestSearch(userId: string): Promise<RankedJob[]> {
  const [profile, jobs] = await Promise.all([getProfile(userId), loadSearch(userId)]);
  if (!profile) throw new MissingProfileError();
  if (!jobs) throw new MissingSearchError();

  // Cada vaga pontuada é custo pago: o teto corta, não recusa.
  const batch = jobs.slice(0, MAX_JOBS_PER_MATCH);
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

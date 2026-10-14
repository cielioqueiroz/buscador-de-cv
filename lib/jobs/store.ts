import { z } from 'zod';
import { userQuery, userTransaction } from '@/lib/db/user-scope';
import {
  JobSchema,
  MatchResultSchema,
  MAX_JOBS_IN_REQUEST,
  type Job,
  type MatchResult,
} from '@/lib/providers/types';
import { RankedListSchema, type RankedJob } from '@/lib/ranked';

/**
 * Busca, notas e ranking de cada usuário (db/migrations/0009). Tudo passa por
 * userQuery (RLS) e é validado na leitura: o jsonb guardado é tratado como não
 * confiável, igual a qualquer outro payload.
 */

/** Uma busca velha demais já não reflete as vagas abertas. */
const SEARCH_TTL = "interval '2 hours'";
/** Por quanto tempo uma nota vale para o mesmo CV e a mesma vaga. */
const SCORE_TTL = "interval '14 days'";

const JobListSchema = z.array(JobSchema).max(MAX_JOBS_IN_REQUEST);

export async function saveSearch(userId: string, jobs: Job[]): Promise<void> {
  await userQuery(
    userId,
    `insert into job_searches (user_id, jobs, created_at) values ($1, $2::jsonb, now())
     on conflict (user_id) do update set jobs = excluded.jobs, created_at = now()`,
    [userId, JSON.stringify(jobs)],
  );
}

export async function loadSearch(userId: string): Promise<Job[] | null> {
  const result = await userQuery<{ jobs: unknown }>(
    userId,
    `select jobs from job_searches where user_id = $1 and created_at > now() - ${SEARCH_TTL}`,
    [userId],
  );
  const parsed = JobListSchema.safeParse(result.rows[0]?.jobs);
  return parsed.success ? parsed.data : null;
}

export async function loadCachedScores(
  userId: string,
  cvHash: string,
  jobIds: string[],
): Promise<Map<string, MatchResult>> {
  if (jobIds.length === 0) return new Map();
  const result = await userQuery<{ job_id: string; result: unknown }>(
    userId,
    `select job_id, result from match_cache
      where user_id = $1 and cv_hash = $2 and job_id = any($3::text[])
        and created_at > now() - ${SCORE_TTL}`,
    [userId, cvHash, jobIds],
  );
  const scores = new Map<string, MatchResult>();
  for (const row of result.rows) {
    const parsed = MatchResultSchema.safeParse(row.result);
    if (parsed.success && parsed.data.jobId === row.job_id) scores.set(row.job_id, parsed.data);
  }
  return scores;
}

export async function saveScores(userId: string, cvHash: string, results: MatchResult[]): Promise<void> {
  if (results.length === 0) return;
  await userTransaction(userId, [
    // faxina do próprio usuário: notas vencidas não servem mais para nada
    { text: `delete from match_cache where user_id = $1 and created_at < now() - ${SCORE_TTL}`, params: [userId] },
    ...results.map((r) => ({
      text: `insert into match_cache (user_id, cv_hash, job_id, result) values ($1, $2, $3, $4::jsonb)
             on conflict (user_id, cv_hash, job_id) do update set result = excluded.result, created_at = now()`,
      params: [userId, cvHash, r.jobId, JSON.stringify(r)],
    })),
  ]);
}

export async function saveRanking(userId: string, ranked: RankedJob[]): Promise<void> {
  await userQuery(
    userId,
    `insert into rankings (user_id, ranked, updated_at) values ($1, $2::jsonb, now())
     on conflict (user_id) do update set ranked = excluded.ranked, updated_at = now()`,
    [userId, JSON.stringify(ranked)],
  );
}

export async function loadRanking(userId: string): Promise<RankedJob[] | null> {
  const result = await userQuery<{ ranked: unknown }>(
    userId,
    `select ranked from rankings where user_id = $1`,
    [userId],
  );
  if (!result.rows[0]) return null;
  const parsed = RankedListSchema.safeParse(result.rows[0].ranked);
  return parsed.success ? parsed.data : null;
}

/**
 * Uma vaga que o usuário de fato viu: no ranking, na última busca ou no
 * tracker (que guarda o snapshot da vaga). Carta e CV adaptado partem daqui —
 * a vaga não vem mais do corpo da requisição, onde qualquer texto caberia.
 */
export async function findUserJob(userId: string, jobId: string): Promise<Job | null> {
  const result = await userQuery<{ job: unknown }>(
    userId,
    `select elem->'job' as job
       from rankings, jsonb_array_elements(ranked) elem
      where user_id = $1 and elem->'job'->>'id' = $2
     union all
     select elem as job
       from job_searches, jsonb_array_elements(jobs) elem
      where user_id = $1 and elem->>'id' = $2
     union all
     select coalesce(job_payload->'job', job_payload) as job
       from applications
      where user_id = $1 and job_id = $2
     limit 1`,
    [userId, jobId],
  );
  const parsed = JobSchema.safeParse(result.rows[0]?.job);
  return parsed.success ? parsed.data : null;
}

/** Perfil trocado (novo CV, edição): o ranking antigo não vale mais. */
export async function clearRanking(userId: string): Promise<void> {
  await userQuery(userId, `delete from rankings where user_id = $1`, [userId]);
}

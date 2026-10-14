import { userQuery } from '@/lib/db/user-scope';
import type { DismissReason } from '@/lib/dismiss-reasons';

export async function listDismissals(userId: string): Promise<{ jobId: string; reason: string; createdAt: string }[]> {
  const result = await userQuery<{ job_id: string; reason: string; created_at: Date }>(
    userId,
    `select job_id, reason, created_at from job_dismissals where user_id = $1 order by created_at desc`,
    [userId],
  );
  return result.rows.map((r) => ({ jobId: r.job_id, reason: r.reason, createdAt: new Date(r.created_at).toISOString() }));
}

export async function listDismissedIds(userId: string): Promise<string[]> {
  const result = await userQuery<{ job_id: string }>(
    userId,
    `select job_id from job_dismissals where user_id = $1`,
    [userId],
  );
  return result.rows.map((row) => row.job_id);
}

export async function dismissJob(userId: string, jobId: string, reason: DismissReason): Promise<void> {
  await userQuery(
    userId,
    `insert into job_dismissals (user_id, job_id, reason) values ($1, $2, $3)
     on conflict (user_id, job_id) do update set reason = excluded.reason, created_at = now()`,
    [userId, jobId, reason],
  );
}

export async function undismissJob(userId: string, jobId: string): Promise<void> {
  await userQuery(userId, `delete from job_dismissals where user_id = $1 and job_id = $2`, [userId, jobId]);
}

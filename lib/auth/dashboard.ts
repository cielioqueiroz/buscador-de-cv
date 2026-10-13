import { userQuery } from "@/lib/db/user-scope";
import type { DashboardStats } from "@/lib/auth/checklist";

export type { DashboardStats };

/** Números do painel do /perfil numa ida só ao banco. */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const result = await userQuery<{
    applied: number;
    interviews: number;
    offers: number;
    favorites: number;
    profile_updated_at: Date | null;
  }>(
    userId,
    `select
       (select count(*) from applications where user_id = $1 and stage = 'aplicado')::int   as applied,
       (select count(*) from applications where user_id = $1 and stage = 'entrevista')::int as interviews,
       (select count(*) from applications where user_id = $1 and stage = 'oferta')::int     as offers,
       (select count(*) from favorites    where user_id = $1)::int                          as favorites,
       (select updated_at from cv_profiles where user_id = $1)                              as profile_updated_at`,
    [userId],
  );
  const row = result.rows[0];
  return {
    applied: row?.applied ?? 0,
    interviews: row?.interviews ?? 0,
    offers: row?.offers ?? 0,
    favorites: row?.favorites ?? 0,
    profileUpdatedAt: row?.profile_updated_at ? new Date(row.profile_updated_at).toISOString() : null,
  };
}

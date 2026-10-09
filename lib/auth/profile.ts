import { pool } from "@/lib/db/client";
import type { CVProfile, Seniority } from "@/lib/providers/types";
import { CVProfileSchema } from "@/lib/providers/types";

type ProfileRow = {
  title: string;
  seniority: string;
  skills: string[];
  areas: string[];
  search_queries: string[];
  raw_text: string;
};

function rowToProfile(row: ProfileRow): CVProfile {
  return CVProfileSchema.parse({
    title: row.title,
    seniority: row.seniority as Seniority,
    skills: row.skills ?? [],
    areas: row.areas ?? [],
    searchQueries: row.search_queries ?? [],
    rawText: row.raw_text,
  });
}

export async function getProfile(userId: string): Promise<CVProfile | null> {
  const result = await pool.query<ProfileRow>(
    `select title, seniority, skills, areas, search_queries, raw_text
       from cv_profiles
      where user_id = $1`,
    [userId],
  );
  const row = result.rows[0];
  return row ? rowToProfile(row) : null;
}

export async function upsertProfile(
  userId: string,
  profile: CVProfile,
): Promise<void> {
  await pool.query(
    `insert into cv_profiles
       (user_id, title, seniority, skills, areas, search_queries, raw_text, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, now())
     on conflict (user_id) do update set
       title = excluded.title,
       seniority = excluded.seniority,
       skills = excluded.skills,
       areas = excluded.areas,
       search_queries = excluded.search_queries,
       raw_text = excluded.raw_text,
       updated_at = now()`,
    [
      userId,
      profile.title,
      profile.seniority,
      profile.skills,
      profile.areas,
      profile.searchQueries,
      profile.rawText,
    ],
  );
}

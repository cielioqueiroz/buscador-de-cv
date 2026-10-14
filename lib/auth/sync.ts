import { userQuery, userTransaction } from "@/lib/db/user-scope";
import {
  ApplicationSchema,
  type Application,
  type ApplicationPatch,
} from "@/lib/application-schema";
import { SavedLetterSchema, type SavedLetter } from "@/lib/letter-schema";
import { AdaptedCVSchema, type AdaptedCV } from "@/lib/cv-features";

type ApplicationRow = {
  job_id: string;
  job_payload: unknown;
  score: number | null;
  stage: string;
  notes: string | null;
  interview_on: string | null;
  created_at: Date;
  updated_at: Date;
};

function rowToApplication(row: ApplicationRow): Application {
  const parsed = ApplicationSchema.safeParse({
    id: row.job_id,
    job: (row.job_payload as { job?: unknown })?.job ?? row.job_payload,
    match: (row.job_payload as { match?: unknown })?.match,
    stage: row.stage,
    notes: row.notes ?? undefined,
    interviewOn: row.interview_on ?? undefined,
    createdAt: row.created_at.getTime(),
    updatedAt: row.updated_at.getTime(),
  });
  if (!parsed.success) {
    throw new Error(
      `Linha de application inválida: ${parsed.error.issues
        .map((i) => i.message)
        .join(", ")}`,
    );
  }
  return parsed.data;
}

export async function listApplications(userId: string): Promise<Application[]> {
  const result = await userQuery<ApplicationRow>(
    userId,
    `select job_id, job_payload, score, stage, notes, interview_on::text as interview_on,
            created_at, updated_at
       from applications
      where user_id = $1
      order by updated_at desc
      limit 200`,
    [userId],
  );
  return result.rows.map(rowToApplication);
}

export async function upsertApplication(
  userId: string,
  application: Application,
): Promise<void> {
  // Guardamos o par {job, match} como payload — é o que o cliente precisa para
  // reconstruir um RankedJob quando listar o tracker, mesmo meses depois,
  // quando a fonte original já apagou a vaga.
  const payload = JSON.stringify({ job: application.job, match: application.match });
  await userQuery(
    userId,
    `insert into applications
       (user_id, job_id, job_payload, score, stage, notes, interview_on, created_at, updated_at)
     values ($1, $2, $3::jsonb, $4, $5, $6, $7::date, to_timestamp($8/1000.0), to_timestamp($9/1000.0))
     on conflict (user_id, job_id) do update set
       job_payload  = excluded.job_payload,
       score        = excluded.score,
       stage        = excluded.stage,
       notes        = excluded.notes,
       interview_on = excluded.interview_on,
       updated_at   = excluded.updated_at`,
    [
      userId,
      application.id,
      payload,
      Math.round(application.match.score),
      application.stage,
      application.notes ?? null,
      application.interviewOn ?? null,
      application.createdAt,
      application.updatedAt,
    ],
  );
}

/**
 * Atualiza só os campos que vieram (estágio, anotações, data da entrevista).
 * Os nomes de coluna são fixos aqui; do cliente só entram valores.
 */
export async function updateApplication(
  userId: string,
  jobId: string,
  patch: ApplicationPatch,
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [userId, jobId];
  const set = (column: string, value: unknown, cast = "") => {
    params.push(value);
    sets.push(`${column} = $${params.length}${cast}`);
  };
  if (patch.stage !== undefined) set("stage", patch.stage);
  if (patch.notes !== undefined) set("notes", patch.notes?.trim() || null);
  if (patch.interviewOn !== undefined) set("interview_on", patch.interviewOn, "::date");
  if (sets.length === 0) return;
  await userQuery(
    userId,
    `update applications set ${sets.join(", ")}, updated_at = now()
      where user_id = $1 and job_id = $2`,
    params,
  );
}

export async function removeApplication(
  userId: string,
  jobId: string,
): Promise<void> {
  await userQuery(
    userId,
    `delete from applications where user_id = $1 and job_id = $2`,
    [userId, jobId],
  );
}

export async function listFavorites(userId: string): Promise<string[]> {
  const result = await userQuery<{ job_id: string }>(
    userId,
    `select job_id from favorites where user_id = $1 order by created_at desc`,
    [userId],
  );
  return result.rows.map((row) => row.job_id);
}

export async function setFavorite(
  userId: string,
  jobId: string,
  on: boolean,
): Promise<void> {
  if (on) {
    await userQuery(
      userId,
      `insert into favorites (user_id, job_id)
         values ($1, $2)
       on conflict do nothing`,
      [userId, jobId],
    );
  } else {
    await userQuery(
      userId,
      `delete from favorites where user_id = $1 and job_id = $2`,
      [userId, jobId],
    );
  }
}

type LetterRow = {
  job_id: string;
  letter: unknown;
  text: string;
  tone: string;
  length: string;
  saved_at: string | number;
};

function rowToLetter(row: LetterRow): SavedLetter {
  return SavedLetterSchema.parse({
    letter: row.letter,
    text: row.text,
    tone: row.tone,
    length: row.length,
    savedAt: Number(row.saved_at),
  });
}

export async function getLetter(
  userId: string,
  jobId: string,
): Promise<SavedLetter | null> {
  const result = await userQuery<LetterRow>(
    userId,
    `select job_id, letter, text, tone, length, saved_at::text as saved_at
       from cover_letters
      where user_id = $1 and job_id = $2`,
    [userId, jobId],
  );
  const row = result.rows[0];
  return row ? rowToLetter(row) : null;
}

export async function listLetters(
  userId: string,
): Promise<Record<string, SavedLetter>> {
  const result = await userQuery<LetterRow>(
    userId,
    `select job_id, letter, text, tone, length, saved_at::text as saved_at
       from cover_letters
      where user_id = $1`,
    [userId],
  );
  const map: Record<string, SavedLetter> = {};
  for (const row of result.rows) map[row.job_id] = rowToLetter(row);
  return map;
}

export async function upsertLetter(
  userId: string,
  jobId: string,
  saved: SavedLetter,
): Promise<void> {
  await userQuery(
    userId,
    `insert into cover_letters
       (user_id, job_id, letter, text, tone, length, saved_at, updated_at)
     values ($1, $2, $3::jsonb, $4, $5, $6, $7, now())
     on conflict (user_id, job_id) do update set
       letter   = excluded.letter,
       text     = excluded.text,
       tone     = excluded.tone,
       length   = excluded.length,
       saved_at = excluded.saved_at,
       updated_at = now()`,
    [
      userId,
      jobId,
      JSON.stringify(saved.letter),
      saved.text,
      saved.tone,
      saved.length,
      saved.savedAt,
    ],
  );
}

export async function removeLetter(
  userId: string,
  jobId: string,
): Promise<void> {
  await userQuery(
    userId,
    `delete from cover_letters where user_id = $1 and job_id = $2`,
    [userId, jobId],
  );
}

type AdaptedRow = { job_id: string; payload: unknown };

export async function getAdaptedCV(
  userId: string,
  jobId: string,
): Promise<AdaptedCV | null> {
  const result = await userQuery<AdaptedRow>(
    userId,
    `select job_id, payload from adapted_cvs where user_id = $1 and job_id = $2`,
    [userId, jobId],
  );
  const row = result.rows[0];
  return row ? AdaptedCVSchema.parse(row.payload) : null;
}

export async function listAdaptedCVs(
  userId: string,
): Promise<Record<string, AdaptedCV>> {
  const result = await userQuery<AdaptedRow>(
    userId,
    `select job_id, payload from adapted_cvs where user_id = $1`,
    [userId],
  );
  const map: Record<string, AdaptedCV> = {};
  for (const row of result.rows) {
    map[row.job_id] = AdaptedCVSchema.parse(row.payload);
  }
  return map;
}

export async function upsertAdaptedCV(
  userId: string,
  jobId: string,
  payload: AdaptedCV,
): Promise<void> {
  await userQuery(
    userId,
    `insert into adapted_cvs (user_id, job_id, payload, updated_at)
       values ($1, $2, $3::jsonb, now())
     on conflict (user_id, job_id) do update set
       payload = excluded.payload,
       updated_at = now()`,
    [userId, jobId, JSON.stringify(payload)],
  );
}

/** O que cada card de vaga precisa saber, para a lista inteira, numa ida só ao banco. */
export type CardState = { favorites: string[]; tracked: string[]; withLetter: string[] };

export async function loadCardState(userId: string): Promise<CardState> {
  const [favorites, tracked, letters] = await userTransaction<{ job_id: string }>(userId, [
    { text: `select job_id from favorites where user_id = $1`, params: [userId] },
    { text: `select job_id from applications where user_id = $1`, params: [userId] },
    { text: `select job_id from cover_letters where user_id = $1`, params: [userId] },
  ]);
  const ids = (r: { rows: { job_id: string }[] }) => r.rows.map((row) => row.job_id);
  return { favorites: ids(favorites), tracked: ids(tracked), withLetter: ids(letters) };
}

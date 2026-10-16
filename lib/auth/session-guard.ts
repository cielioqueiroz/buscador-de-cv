import { pool } from "@/lib/db/client";

/**
 * A sessão é um JWT: o servidor não guarda nada, então trocar a senha ou
 * excluir a conta não derrubava os logins já abertos. Este módulo é a
 * revalidação que faltava, chamada pelo callback `jwt` do Auth.js:
 *
 * - no login, carimba `authAt` (quando a sessão nasceu);
 * - depois, no máximo a cada RECHECK_MS, consulta o usuário no banco e devolve
 *   `null` — o Auth.js apaga o cookie — se a conta sumiu ou se a senha foi
 *   trocada depois do login.
 *
 * Na mesma ida ao banco carimba `last_seen_at` (no máximo uma vez por dia):
 * é por ele que o backup diário acha as contas paradas há 24 meses.
 */

export const RECHECK_MS = 5 * 60_000;

export type GuardedToken = {
  sub?: string;
  iat?: number;
  authAt?: number;
  checkedAt?: number;
  [key: string]: unknown;
};

type SessionState = { passwordChangedAt: Date | null } | null;

export async function loadSessionState(userId: string): Promise<SessionState> {
  const result = await pool.query<{ password_changed_at: Date | null }>(
    `with visto as (
       update users set last_seen_at = now()
        where id = $1 and last_seen_at < now() - interval '1 day'
     )
     select password_changed_at from users where id = $1`,
    [userId],
  );
  const row = result.rows[0];
  return row ? { passwordChangedAt: row.password_changed_at } : null;
}

export async function guardToken<T extends GuardedToken>(
  token: T,
  signingIn: boolean,
  now = Date.now(),
  load: (userId: string) => Promise<SessionState> = loadSessionState,
): Promise<T | null> {
  if (signingIn) return { ...token, authAt: now, checkedAt: now };
  if (!token.sub) return token;
  if (token.checkedAt && now - token.checkedAt < RECHECK_MS) return token;

  const state = await load(token.sub);
  if (!state) return null;

  // Tokens de antes deste guarda não têm authAt; o `iat` (em segundos) serve.
  const authAt = token.authAt ?? (token.iat ? token.iat * 1000 : 0);
  if (state.passwordChangedAt && state.passwordChangedAt.getTime() > authAt) return null;

  return { ...token, authAt, checkedAt: now };
}

/** O login também conta como uso — a sessão nova só é rechecada daqui a RECHECK_MS. */
export async function touchLastSeen(userId: string): Promise<void> {
  await pool.query("update users set last_seen_at = now() where id = $1", [userId]);
}

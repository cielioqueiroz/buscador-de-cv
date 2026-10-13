import { neon } from "@neondatabase/serverless";
import { connectionString, isNeonUrl, pool } from "@/lib/db/client";

/**
 * Toda leitura e escrita de dado do usuário (perfil, tracker, favoritos,
 * cartas, CVs adaptados, foto) passa por aqui. Cada chamada vira uma transação
 * que primeiro troca para a role sem BYPASSRLS e informa quem é o usuário —
 * aí as políticas de db/migrations/0006_rls.sql passam a valer. Uma consulta
 * que esqueça o `where user_id` devolve só as linhas do próprio usuário.
 *
 * No Neon a transação inteira vai numa só requisição HTTP (sql.transaction),
 * então o escopo não custa idas e voltas extras ao banco.
 */

export type ScopedQuery = { text: string; params?: unknown[] };
export type ScopedResult<R> = { rows: R[]; rowCount: number };

const SET_ROLE = "set local role vaga_certa_rls";
const SET_USER = "select set_config('app.user_id', $1, true)";

export async function userQuery<R = Record<string, unknown>>(
  userId: string,
  text: string,
  params: unknown[] = [],
): Promise<ScopedResult<R>> {
  const [result] = await userTransaction<R>(userId, [{ text, params }]);
  return result;
}

export async function userTransaction<R = Record<string, unknown>>(
  userId: string,
  queries: ScopedQuery[],
): Promise<ScopedResult<R>[]> {
  if (!userId) throw new Error("userTransaction sem usuário.");

  if (isNeonUrl && connectionString) {
    const sql = neon(connectionString, { fullResults: true });
    const results = await sql.transaction([
      sql.query(SET_ROLE),
      sql.query(SET_USER, [userId]),
      ...queries.map((q) => sql.query(q.text, q.params ?? [])),
    ]);
    return results.slice(2).map((r) => ({
      rows: r.rows as R[],
      rowCount: r.rowCount ?? 0,
    }));
  }

  // Postgres comum (local/CI): mesma transação, conexão dedicada.
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(SET_ROLE);
    await client.query(SET_USER, [userId]);
    const out: ScopedResult<R>[] = [];
    for (const q of queries) {
      const r = await client.query(q.text, q.params ?? []);
      out.push({ rows: r.rows as R[], rowCount: r.rowCount ?? 0 });
    }
    await client.query("commit");
    return out;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

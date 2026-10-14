import { createHash, randomBytes } from 'crypto';
import { pool } from '@/lib/db/client';
import { hashPassword } from '@/lib/auth/password';

const TTL_MS = 30 * 60 * 1_000;

export interface IssuedToken {
  /** Token em claro — vai no link do e-mail e nunca é guardado. */
  token: string;
  /** Hora de expiração (useful para mensagens, não para validação). */
  expiresAt: Date;
}

function hash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueResetToken(userId: string): Promise<IssuedToken> {
  // 32 bytes aleatórios → 256 bits → inviável adivinhar; URL-safe para caber
  // na query string sem acidente de encoding.
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + TTL_MS);
  await pool.query(
    `insert into password_reset_tokens (token_hash, user_id, expires_at)
       values ($1, $2, $3)`,
    [hash(token), userId, expiresAt],
  );
  // Faxina: tokens vencidos há mais de um dia não servem nem para auditoria.
  await pool.query(`delete from password_reset_tokens where expires_at < now() - interval '1 day'`);
  return { token, expiresAt };
}

/**
 * Consome o token e troca a senha. Devolve o id do usuário em caso de sucesso;
 * `null` em qualquer falha (expirado, inexistente, já usado). Mensagens
 * genéricas evitam vazar o estado do token para quem está do outro lado.
 *
 * O token é reivindicado num UPDATE só (`used_at is null` + validade no WHERE):
 * dois cliques simultâneos no mesmo link não trocam a senha duas vezes. A troca
 * carimba `password_changed_at`, que derruba as sessões abertas antes dela
 * (lib/auth/session-guard.ts).
 */
export async function consumeResetToken(
  token: string,
  newPassword: string,
): Promise<string | null> {
  const claimed = await pool.query<{ user_id: string }>(
    `update password_reset_tokens set used_at = now()
      where token_hash = $1 and used_at is null and expires_at > now()
  returning user_id`,
    [hash(token)],
  );
  const userId = claimed.rows[0]?.user_id;
  if (!userId) return null;

  const passwordHash = await hashPassword(newPassword);
  await pool.query(
    `update users set password_hash = $2, password_changed_at = now(), updated_at = now() where id = $1`,
    [userId, passwordHash],
  );
  // Qualquer outro token em aberto desse usuário vira pó depois de uma troca
  // bem sucedida: ninguém usa duas vezes.
  await pool.query(
    `update password_reset_tokens set used_at = now() where user_id = $1 and used_at is null`,
    [userId],
  );
  return userId;
}

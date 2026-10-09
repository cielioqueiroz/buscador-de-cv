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
  return { token, expiresAt };
}

/**
 * Consome o token: valida e troca a senha numa transação lógica.
 * Devolve o id do usuário em caso de sucesso; `null` em qualquer falha
 * (expirado, inexistente, já usado). Mensagens genéricas evitam vazar o estado
 * do token para quem está do outro lado.
 */
export async function consumeResetToken(
  token: string,
  newPassword: string,
): Promise<string | null> {
  const tokenHash = hash(token);
  const found = await pool.query<{ user_id: string; expires_at: Date; used_at: Date | null }>(
    `select user_id, expires_at, used_at from password_reset_tokens where token_hash = $1`,
    [tokenHash],
  );
  const row = found.rows[0];
  if (!row || row.used_at || row.expires_at.getTime() < Date.now()) {
    return null;
  }
  const passwordHash = await hashPassword(newPassword);
  await pool.query(`update users set password_hash = $2, updated_at = now() where id = $1`, [
    row.user_id,
    passwordHash,
  ]);
  await pool.query(`update password_reset_tokens set used_at = now() where token_hash = $1`, [
    tokenHash,
  ]);
  // Qualquer outro token em aberto desse usuário vira pó depois de uma troca
  // bem sucedida: ninguém usa duas vezes.
  await pool.query(
    `update password_reset_tokens set used_at = now() where user_id = $1 and used_at is null`,
    [row.user_id],
  );
  return row.user_id;
}

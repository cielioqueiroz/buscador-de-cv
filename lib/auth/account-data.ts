import { z } from "zod";
import { pool } from "@/lib/db/client";
import { verifyPassword } from "@/lib/auth/password";
import { getAvatar } from "@/lib/auth/avatar";
import { getProfile } from "@/lib/auth/profile";
import { listAdaptedCVs, listApplications, listFavorites, listLetters } from "@/lib/auth/sync";

/**
 * Direitos do titular (LGPD): levar os dados embora e apagar a conta. Os dois
 * vivem aqui para que a lista do que é "dado do usuário" fique num lugar só.
 */

export async function exportAccountData(userId: string) {
  const [accountResult, profile, applications, favorites, letters, adaptedCVs, avatar] = await Promise.all([
    pool.query<{ name: string | null; email: string; provider: string | null; created_at: Date }>(
      `select name, email::text as email, provider, created_at from users where id = $1`,
      [userId],
    ),
    getProfile(userId),
    listApplications(userId),
    listFavorites(userId),
    listLetters(userId),
    listAdaptedCVs(userId),
    getAvatar(userId),
  ]);
  const account = accountResult.rows[0];
  if (!account) return null;

  return {
    exportedAt: new Date().toISOString(),
    account: {
      name: account.name,
      email: account.email,
      // "email" = cadastro com senha; vazio = conta criada pelo Google.
      signInMethod: account.provider === "email" ? "email" : "google",
      createdAt: new Date(account.created_at).toISOString(),
    },
    profile,
    applications,
    favorites,
    coverLetters: letters,
    adaptedCVs,
    avatar: avatar
      ? { mime: avatar.mime, base64: Buffer.from(avatar.data).toString("base64") }
      : null,
  };
}

export const DeleteAccountSchema = z.object({
  confirmEmail: z.string().trim().toLowerCase().max(254),
  password: z.string().max(200).optional(),
});

export type DeleteCheck = "ok" | "email-mismatch" | "password-required" | "wrong-password" | "not-found";

/**
 * Confirma que quem pediu a exclusão é o dono: digita o e-mail da conta e,
 * se a conta tem senha, a senha também. Quem só usa Google confirma pelo
 * e-mail digitado — a sessão já prova o acesso à conta Google.
 */
export async function checkAccountDeletion(
  userId: string,
  input: z.infer<typeof DeleteAccountSchema>,
): Promise<DeleteCheck> {
  const result = await pool.query<{ email: string; password_hash: string | null }>(
    `select email::text as email, password_hash from users where id = $1`,
    [userId],
  );
  const row = result.rows[0];
  if (!row) return "not-found";
  if (row.email.toLowerCase() !== input.confirmEmail) return "email-mismatch";
  if (row.password_hash) {
    if (!input.password) return "password-required";
    if (!(await verifyPassword(input.password, row.password_hash))) return "wrong-password";
  }
  return "ok";
}

/**
 * Apaga o usuário. Perfil, CV, tracker, favoritos, cartas, CVs adaptados,
 * foto, contas OAuth e tokens de reset caem junto por `on delete cascade`;
 * o token de verificação é ligado ao e-mail, não ao id, e sai à parte.
 */
export async function deleteAccount(userId: string): Promise<boolean> {
  const result = await pool.query(
    `with target as (
       select id, email::text as email from users where id = $1
     ), tokens as (
       delete from verification_token where identifier in (select email from target)
     )
     delete from users where id in (select id from target)
     returning id`,
    [userId],
  );
  return (result.rowCount ?? 0) > 0;
}

import { CredentialsSignin } from "next-auth";
import { findUserByEmail } from "@/lib/auth/users";
import { verifyPassword } from "@/lib/auth/password";
import { LoginSchema } from "@/lib/auth/signup-schema";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

/** Chega ao cliente como `result.code` — o formulário mostra a mensagem certa. */
export class TooManyAttemptsError extends CredentialsSignin {
  code = "rate_limited";
}

const WINDOW_MS = 15 * 60_000;
const MAX_PER_IP = 20;
const MAX_PER_EMAIL = 8;

export type AuthorizedUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

/**
 * Login por e-mail e senha. O limite vem antes do bcrypt: sem ele, a rota de
 * callback do Auth.js aceitava tentativas sem fim contra qualquer e-mail. Conta
 * por IP (um atacante, muitos e-mails) e por e-mail (muitos IPs, uma vítima).
 */
export async function authorizeCredentials(
  credentials: unknown,
  request: Request | undefined,
): Promise<AuthorizedUser | null> {
  const parsed = LoginSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const ip = request ? clientIp(request) : "unknown";
  const ipOk = await checkRateLimit(`login:ip:${ip}`, MAX_PER_IP, WINDOW_MS);
  const emailOk = await checkRateLimit(`login:email:${email}`, MAX_PER_EMAIL, WINDOW_MS);
  if (!ipOk || !emailOk) throw new TooManyAttemptsError();

  const user = await findUserByEmail(email);
  if (!user?.password_hash) return null;
  if (!(await verifyPassword(password, user.password_hash))) return null;
  return { id: user.id, email: user.email, name: user.name, image: user.image };
}

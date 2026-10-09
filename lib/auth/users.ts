import { pool } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  password_hash: string | null;
  provider: string | null;
};

export async function findUserByEmail(
  email: string,
): Promise<UserRow | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const result = await pool.query<UserRow>(
    `select id, name, email::text as email, image, password_hash, provider
       from users
      where email = $1
      limit 1`,
    [normalized],
  );
  return result.rows[0] ?? null;
}

export type CreateUserInput = {
  name?: string | null;
  email: string;
  password: string;
};

export class UserAlreadyExistsError extends Error {
  constructor() {
    super("Usuário já cadastrado.");
    this.name = "UserAlreadyExistsError";
  }
}

export async function createUserWithPassword(
  input: CreateUserInput,
): Promise<UserRow> {
  const normalized = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(normalized);
  if (existing) throw new UserAlreadyExistsError();

  const hash = await hashPassword(input.password);
  const result = await pool.query<UserRow>(
    `insert into users (name, email, password_hash, provider)
         values ($1, $2, $3, 'email')
      returning id, name, email::text as email, image, password_hash, provider`,
    [input.name?.trim() || null, normalized, hash],
  );
  return result.rows[0];
}

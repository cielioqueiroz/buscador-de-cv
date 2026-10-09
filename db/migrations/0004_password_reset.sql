-- 0004_password_reset.sql — Fase 4 do PRD "perfil com login".
-- Tokens one-shot para o fluxo de reset de senha. O que fica no banco é só o
-- hash SHA-256 do token; o valor em claro vive só no link enviado por e-mail.
-- Expira em 30 min; usado uma vez e é marcado como consumido.

create table if not exists password_reset_tokens (
  token_hash text primary key,
  user_id    uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_user_idx
  on password_reset_tokens(user_id);

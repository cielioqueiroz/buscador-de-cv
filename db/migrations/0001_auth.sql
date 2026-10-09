-- 0001_auth.sql — Fase 0 do PRD "perfil com login".
-- Cria o schema base de autenticação (NextAuth v5 + @auth/pg-adapter) com UUID.
-- Nenhuma tabela de domínio aqui; essas vêm nas próximas fases.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- Usuário. Combina colunas que o adapter escreve (name, email, "emailVerified",
-- image) com campos próprios do produto (password_hash, provider).
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email citext unique,
  "emailVerified" timestamptz,
  image text,
  password_hash text,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contas vinculadas (OAuth). Nome/colunas no formato exigido pelo adapter.
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references users(id) on delete cascade,
  type varchar(255) not null,
  provider varchar(255) not null,
  "providerAccountId" varchar(255) not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  id_token text,
  scope text,
  session_state text,
  token_type text,
  unique (provider, "providerAccountId")
);

create index if not exists accounts_user_id_idx on accounts("userId");

-- Sessões persistidas. Não usamos no Fase 1 (session strategy = jwt), mas o
-- adapter espera a tabela existente.
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references users(id) on delete cascade,
  expires timestamptz not null,
  "sessionToken" varchar(255) unique not null
);

create index if not exists sessions_user_id_idx on sessions("userId");

-- Tokens de verificação (reset de senha / verificação de e-mail).
create table if not exists verification_token (
  identifier text not null,
  expires timestamptz not null,
  token text not null,
  primary key (identifier, token)
);

-- 0002_cv_profiles.sql — Fase 2 do PRD "perfil com login".
-- Guarda o perfil extraído por usuário. Um registro por usuário (upsert).

create table if not exists cv_profiles (
  user_id        uuid primary key references users(id) on delete cascade,
  title          text not null,
  seniority      text not null,
  skills         text[] not null default '{}',
  areas          text[] not null default '{}',
  search_queries text[] not null default '{}',
  raw_text       text not null,
  updated_at     timestamptz not null default now()
);

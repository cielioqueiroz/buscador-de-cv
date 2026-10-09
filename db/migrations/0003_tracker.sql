-- 0003_tracker.sql — Fase 3 do PRD "perfil com login".
-- Persistência de tracker, favoritos, cartas e CVs adaptados.
-- `job_payload`, `letter` e o `payload` do CV adaptado vão como jsonb
-- porque a fonte original (os agregadores de vaga, ou a resposta da IA)
-- desaparece com o tempo e o snapshot é o que preserva a informação.

create table if not exists applications (
  user_id      uuid not null references users(id) on delete cascade,
  job_id       text not null,
  job_payload  jsonb not null,
  score        integer,
  stage        text not null default 'aplicado',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, job_id)
);

create index if not exists applications_updated_at_idx
  on applications(user_id, updated_at desc);

create table if not exists favorites (
  user_id    uuid not null references users(id) on delete cascade,
  job_id     text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table if not exists cover_letters (
  user_id    uuid not null references users(id) on delete cascade,
  job_id     text not null,
  letter     jsonb not null,
  text       text not null,
  tone       text not null,
  length     text not null,
  saved_at   bigint not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table if not exists adapted_cvs (
  user_id    uuid not null references users(id) on delete cascade,
  job_id     text not null,
  payload    jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

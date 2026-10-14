-- 0007_schema_migrations.sql — registro de quais migrations já rodaram.
--
-- Até aqui as migrations eram aplicadas à mão, e em 2026-10-14 o branch main
-- do Neon estava sem a 0006 enquanto o código que dependia dela ia para o ar.
-- O `npm run db:migrate` (scripts/migrate.mjs) lê esta tabela e aplica só o
-- que falta, cada arquivo numa transação.
--
-- As seis anteriores já estavam aplicadas nos dois branches quando esta foi
-- criada; elas entram aqui como histórico.

create table if not exists schema_migrations (
  name       text primary key,
  applied_at timestamptz not null default now()
);

insert into schema_migrations (name) values
  ('0001_auth.sql'),
  ('0002_cv_profiles.sql'),
  ('0003_tracker.sql'),
  ('0004_password_reset.sql'),
  ('0005_avatars.sql'),
  ('0006_rls.sql'),
  ('0007_schema_migrations.sql')
on conflict (name) do nothing;

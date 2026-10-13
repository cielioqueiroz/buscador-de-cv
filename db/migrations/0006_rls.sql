-- 0006_rls.sql — RLS nas tabelas de dados do usuário (PRD §8).
--
-- Segunda barreira contra IDOR: mesmo que uma consulta da aplicação esqueça o
-- `where user_id = ...`, o banco só enxerga e só aceita linhas do usuário
-- informado em `app.user_id`.
--
-- POR QUE UMA ROLE À PARTE: no Neon, a role dona do banco (vaga_certa_owner)
-- tem BYPASSRLS — ela ignora qualquer política, até com FORCE. Testado em
-- 2026-10-13: sem a troca de role, um usuário lia e alterava dados de outro.
-- Por isso as consultas de dados do usuário rodam numa transação que faz
--   set local role vaga_certa_rls;
--   select set_config('app.user_id', <id da sessão>, true);
-- (lib/db/user-scope.ts). vaga_certa_rls não faz login e não tem BYPASSRLS;
-- a troca vale só até o fim da transação.
--
-- Sem `app.user_id`, app_user_id() é null e nenhuma linha passa: o modo de
-- falha é "vazio", nunca "dados de outra pessoa".
--
-- Fora do escopo: users/accounts/sessions/verification_token (o adapter do
-- Auth.js consulta sem contexto de usuário) e password_reset_tokens (o reset
-- acontece sem sessão, guiado pelo token). Excluir conta roda como dono e
-- apaga em cascata.
--
-- Tabela nova com user_id? Inclua-a no array abaixo e no grant.

create or replace function app_user_id() returns uuid
  language sql stable
  as $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'vaga_certa_rls') then
    create role vaga_certa_rls nologin nobypassrls;
  end if;
end $$;

grant vaga_certa_rls to vaga_certa_owner with set true;
grant usage on schema public to vaga_certa_rls;
grant execute on function app_user_id() to vaga_certa_rls;
grant select, insert, update, delete
  on cv_profiles, applications, favorites, cover_letters, adapted_cvs, user_avatars
  to vaga_certa_rls;
-- saveAvatar/deleteAvatar atualizam users.image na mesma transação.
grant select (id, email, name, image, updated_at), update (image, updated_at) on users to vaga_certa_rls;

do $$
declare
  t text;
begin
  foreach t in array array['cv_profiles', 'applications', 'favorites', 'cover_letters', 'adapted_cvs', 'user_avatars']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('drop policy if exists owner_only on %I', t);
    execute format(
      'create policy owner_only on %I using (user_id = app_user_id()) with check (user_id = app_user_id())',
      t
    );
  end loop;
end $$;

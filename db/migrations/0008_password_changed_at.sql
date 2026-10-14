-- 0008_password_changed_at.sql — sessões antigas caem quando a senha muda.
--
-- A sessão é um JWT (sem tabela de sessões), então trocar a senha não
-- derrubava quem já estava logado — inclusive quem tivesse roubado a conta.
-- O callback jwt (lib/auth/session-guard.ts) compara este carimbo com a hora
-- do login guardada no token e encerra a sessão mais antiga que a troca.

alter table users add column if not exists password_changed_at timestamptz;

insert into schema_migrations (name) values ('0008_password_changed_at.sql')
on conflict (name) do nothing;

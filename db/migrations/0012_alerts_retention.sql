-- 0012_alerts_retention.sql — vagas novas e contas inativas.
--
-- rankings.new_ids   vagas com nota alta que apareceram na última busca e não
--                    estavam na anterior (lib/jobs/new-jobs.ts). É o "alerta"
--                    dentro do app: sem domínio próprio não há e-mail.
-- users.last_seen_at última vez que a sessão foi usada, carimbada no máximo uma
--                    vez por dia (lib/auth/session-guard.ts). O backup diário
--                    (.github/workflows/backup.yml) exclui contas paradas há
--                    24 meses, depois de gravar o dump do dia.
--
-- Contas que já existem começam a contar a partir de hoje: ninguém é excluído
-- por inatividade anterior a esta regra.

alter table rankings add column if not exists new_ids text[] not null default '{}';

alter table users add column if not exists last_seen_at timestamptz;
update users set last_seen_at = now() where last_seen_at is null;
alter table users alter column last_seen_at set default now();
alter table users alter column last_seen_at set not null;

insert into schema_migrations (name) values ('0012_alerts_retention.sql')
on conflict (name) do nothing;

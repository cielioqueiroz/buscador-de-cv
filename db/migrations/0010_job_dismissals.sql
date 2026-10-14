-- 0010_job_dismissals.sql — "não tenho interesse nesta vaga", com o motivo.
--
-- A vaga descartada some do ranking e deixa de ser pontuada nas próximas
-- buscas (lib/jobs/rank-search.ts): o teto de vagas pontuadas por busca passa
-- a ir para vagas que ainda podem interessar. O motivo fica guardado para
-- entender o que o usuário recusa (salário, modalidade, senioridade...).

create table if not exists job_dismissals (
  user_id    uuid not null references users(id) on delete cascade,
  job_id     text not null,
  reason     text not null check (reason in ('salario', 'modalidade', 'senioridade', 'area', 'empresa', 'outro')),
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

grant select, insert, update, delete on job_dismissals to vaga_certa_rls;

alter table job_dismissals enable row level security;
alter table job_dismissals force row level security;
drop policy if exists owner_only on job_dismissals;
create policy owner_only on job_dismissals
  using (user_id = app_user_id()) with check (user_id = app_user_id());

insert into schema_migrations (name) values ('0010_job_dismissals.sql')
on conflict (name) do nothing;

-- 0009_search_ranking.sql — busca, notas e ranking guardados no servidor.
--
-- Antes: o navegador recebia as vagas da busca e as mandava de volta para o
-- /api/jobs/match junto com o perfil. Qualquer um podia editar esse corpo e
-- pôr texto arbitrário no prompt da IA, e o ranking só existia no
-- localStorage (sumia em outro aparelho).
--
-- job_searches  a última busca de cada usuário; o match lê daqui.
-- match_cache   a nota de cada vaga para uma versão do CV (cv_hash): a mesma
--               vaga com o mesmo CV não vai de novo ao Gemini.
-- rankings      o último ranking, para /resultados abrir pronto em qualquer
--               aparelho.
--
-- Todas com user_id → RLS igual à 0006 e grant para vaga_certa_rls.

create table if not exists job_searches (
  user_id    uuid primary key references users(id) on delete cascade,
  jobs       jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists match_cache (
  user_id    uuid not null references users(id) on delete cascade,
  cv_hash    text not null,
  job_id     text not null,
  result     jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, cv_hash, job_id)
);
create index if not exists match_cache_created_at_idx on match_cache (created_at);

create table if not exists rankings (
  user_id    uuid primary key references users(id) on delete cascade,
  ranked     jsonb not null,
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on job_searches, match_cache, rankings to vaga_certa_rls;

do $$
declare
  t text;
begin
  foreach t in array array['job_searches', 'match_cache', 'rankings']
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

insert into schema_migrations (name) values ('0009_search_ranking.sql')
on conflict (name) do nothing;

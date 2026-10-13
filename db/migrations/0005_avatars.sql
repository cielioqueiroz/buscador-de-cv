-- 0005_avatars.sql — Fase 5 do PRD "perfil com login".
-- Foto de perfil enviada pelo usuário. Os bytes já chegam re-encodados pelo
-- servidor (WebP 256x256, sem metadados), então cabem com folga numa linha.
-- `users.image` passa a apontar para `/api/perfil/avatar?v=<versão>` quando há
-- foto própria; fotos do Google continuam como URL externa.

create table if not exists user_avatars (
  user_id    uuid primary key references users(id) on delete cascade,
  data       bytea not null,
  mime       text not null default 'image/webp',
  updated_at timestamptz not null default now(),
  constraint user_avatars_size check (octet_length(data) <= 262144)
);

#!/usr/bin/env node
// Aplica as migrations pendentes de db/migrations/ no banco de DATABASE_URL.
//
//   npm run db:migrate            aplica o que falta
//   npm run db:migrate -- --status  só lista aplicadas e pendentes
//
// Cada arquivo roda numa transação junto com o registro em schema_migrations:
// ou entra inteiro, ou não entra. Prefere DATABASE_URL_UNPOOLED (conexão
// direta) porque o pooler do Neon não segura bem DDL longa.
//
// Lembrete: o Neon tem dois branches (main e preview). Rode uma vez com a URL
// de cada um.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const statusOnly = process.argv.includes("--status");

if (!url) {
  console.error("Defina DATABASE_URL (ou DATABASE_URL_UNPOOLED) antes de rodar.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  await client.query(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const { rows } = await client.query("select name from schema_migrations");
  const applied = new Set(rows.map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
  const pending = files.filter((f) => !applied.has(f));

  if (statusOnly) {
    for (const f of files) console.log(`${applied.has(f) ? "aplicada" : "PENDENTE"}  ${f}`);
    process.exit(0);
  }

  if (pending.length === 0) {
    console.log("Nada a aplicar.");
  }
  for (const file of pending) {
    const sql = await readFile(path.join(dir, file), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into schema_migrations (name) values ($1) on conflict do nothing", [file]);
      await client.query("commit");
      console.log(`ok  ${file}`);
    } catch (error) {
      await client.query("rollback");
      console.error(`falhou  ${file}:`, error.message);
      process.exitCode = 1;
      break;
    }
  }
} finally {
  await client.end();
}

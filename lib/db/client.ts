import { Pool as NeonPool } from "@neondatabase/serverless";
import { Pool as NodePool } from "pg";

const connectionString = process.env.DATABASE_URL;

const isNeonUrl =
  typeof connectionString === "string" && /neon\.tech/i.test(connectionString);

// Em runtimes edge e no Neon, o driver serverless usa HTTP/WebSocket; no node
// local sem Neon (teste contra Postgres comum), caímos no `pg` tradicional.
export const pool = isNeonUrl
  ? (new NeonPool({ connectionString }) as unknown as NodePool)
  : new NodePool({ connectionString });

export function assertDatabaseUrl(): string {
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não configurada. Veja .env.example e docs do PRD de login.",
    );
  }
  return connectionString;
}

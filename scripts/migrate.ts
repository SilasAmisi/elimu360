import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { Pool } from "pg";

import { getDatabaseUrl } from "../lib/env";

const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");
type SqlClient = { query: (query: string, params?: unknown[]) => Promise<unknown> };

async function ensureMigrationsTable(sql: SqlClient) {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getExecutedMigrations(sql: SqlClient) {
  const rows = (await sql.query("SELECT name FROM _migrations")) as Array<{ name: string }>;
  return new Set(rows.map((row) => row.name));
}

async function run() {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });

  const sql: SqlClient = {
    query: async (queryText: string, params?: unknown[]) => {
      const result = await pool.query(queryText, params);
      return result.rows;
    },
  };

  try {
    await ensureMigrationsTable(sql);

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((file) => file.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));
    const executed = await getExecutedMigrations(sql);

    for (const fileName of files) {
      if (executed.has(fileName)) {
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, fileName);
      const migrationSql = await readFile(filePath, "utf8");

      await sql.query("BEGIN");
      try {
        await sql.query(migrationSql);
        await sql.query("INSERT INTO _migrations (name) VALUES ($1)", [fileName]);
        await sql.query("COMMIT");
        console.log(`Applied migration: ${fileName}`);
      } catch (error) {
        await sql.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});

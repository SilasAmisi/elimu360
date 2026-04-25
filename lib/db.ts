import { Pool } from "pg";

import { getDatabaseUrl } from "@/lib/env";

const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: getDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const sql = {
  query: async (queryText: string, params?: unknown[]) => {
    const result = await pool.query(queryText, params);
    return result.rows;
  },
};

import { Pool } from "pg";

import { CBC_SUBJECTS } from "../lib/domain";
import { getDatabaseUrl } from "../lib/env";
import { buildSeedQuestions } from "../lib/seed-data";
type SqlClient = { query: (query: string, params?: unknown[]) => Promise<unknown> };

async function ensureSubjects(sql: SqlClient) {
  const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  for (const grade of grades) {
    for (const name of CBC_SUBJECTS) {
      await sql.query(
        `INSERT INTO subjects (name, grade_level)
         VALUES ($1, $2)
         ON CONFLICT (name, grade_level) DO NOTHING`,
        [name, grade],
      );
    }
  }
}

async function seedQuestions(sql: SqlClient) {
  const allQuestions = buildSeedQuestions();

  for (const item of allQuestions) {
    const subjectRows = (await sql.query(
      `SELECT id FROM subjects WHERE name = $1 AND grade_level = $2 LIMIT 1`,
      [item.subject, item.grade],
    )) as Array<{ id: number }>;
    const subjectId = subjectRows[0]?.id;

    if (!subjectId) continue;

    await sql.query(
      `INSERT INTO questions (
         subject_id, grade, question, options, answer, explanation, source, difficulty, generated_at
       ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, 'hardcoded', $7, NOW())
       ON CONFLICT (subject_id, grade, question) DO NOTHING`,
      [
        subjectId,
        item.grade,
        item.question,
        JSON.stringify(item.options),
        item.answer,
        item.explanation,
        item.difficulty,
      ],
    );
  }
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
    await ensureSubjects(sql);
    await seedQuestions(sql);

    console.log("Seed completed for grades 7-12 and all CBC subjects.");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

import { Pool } from "pg";

import { getSubjectsForGrade } from "../lib/domain";
import { getDatabaseUrl } from "../lib/env";
import { buildSeedQuestions } from "../lib/seed-data";
type SqlClient = { query: (query: string, params?: unknown[]) => Promise<unknown> };

async function ensureSubjects(sql: SqlClient) {
  const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  for (const grade of grades) {
    for (const name of getSubjectsForGrade(grade)) {
      await sql.query(
        `INSERT INTO subjects (name, grade_level)
         VALUES ($1, $2)
         ON CONFLICT (name, grade_level) DO NOTHING`,
        [name, grade],
      );
    }
  }
}

async function ensureRoleSeedAccounts(sql: SqlClient) {
  const seedUsers = [
    {
      clerkId: "seed-admin-account",
      role: "admin",
      plan: "teachers_schools",
      grade: null,
      school: "Seed Admin Account",
    },
    {
      clerkId: "seed-parent-account",
      role: "parent",
      plan: "single_child",
      grade: null,
      school: "Seed Parent Account",
    },
    {
      clerkId: "seed-teacher-account",
      role: "teacher",
      plan: "teachers_schools",
      grade: null,
      school: "Seed Teacher Account",
    },
  ] as const;

  for (const user of seedUsers) {
    await sql.query(
      `INSERT INTO users (clerk_id, role, plan, grade, school)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (clerk_id) DO UPDATE
       SET role = EXCLUDED.role,
           plan = EXCLUDED.plan,
           grade = EXCLUDED.grade,
           school = EXCLUDED.school,
           updated_at = NOW()`,
      [user.clerkId, user.role, user.plan, user.grade, user.school],
    );
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
  console.log("Connecting to database…");
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  });

  const sql: SqlClient = {
    query: async (queryText: string, params?: unknown[]) => {
      const result = await pool.query(queryText, params);
      return result.rows;
    },
  };

  try {
    await ensureSubjects(sql);
    await ensureRoleSeedAccounts(sql);
    await seedQuestions(sql);

    console.log("Seed completed for grades 1-12, grade-appropriate subjects, and role seed accounts.");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

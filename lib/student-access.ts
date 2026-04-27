import { createHash, randomUUID } from "node:crypto";

import { sql } from "@/lib/db";

const ACCESS_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function pepper() {
  return process.env.STUDENT_ACCESS_PEPPER ?? "elimu360-student-access";
}

export function generateStudentAccessCode(length = 8): string {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * ACCESS_CODE_ALPHABET.length);
    value += ACCESS_CODE_ALPHABET[idx] ?? "X";
  }
  return value;
}

export function buildStudentPublicId(studentDbId: number): string {
  return `STU-${String(studentDbId).padStart(5, "0")}`;
}

export function hashStudentAccessCode(code: string): string {
  return createHash("sha256")
    .update(`${pepper()}:${code.trim().toUpperCase()}`)
    .digest("hex");
}

export async function createStudentAccessSession(studentId: number): Promise<string> {
  const token = randomUUID();
  await sql.query(
    `INSERT INTO student_access_sessions (token, student_id, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [token, studentId],
  );
  return token;
}

export async function getStudentFromSessionToken(token: string) {
  const rows = (await sql.query(
    `SELECT u.id, u.role, u.grade, u.display_name, u.student_public_id
     FROM student_access_sessions s
     JOIN users u ON u.id = s.student_id
     WHERE s.token = $1
       AND s.expires_at > NOW()
       AND u.role = 'student'
     LIMIT 1`,
    [token],
  )) as Array<{
    id: number;
    role: "student";
    grade: number | null;
    display_name: string | null;
    student_public_id: string | null;
  }>;

  return rows[0] ?? null;
}

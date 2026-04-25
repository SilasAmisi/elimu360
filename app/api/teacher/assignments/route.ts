import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";

const createAssignmentSchema = z.object({
  classCode: z.string().min(4).max(32),
  subjectId: z.number().int().positive(),
  grade: z.number().int().min(1).max(12),
  dueDate: z.string().datetime(),
});

const querySchema = z.object({
  classCode: z.string().min(4),
});

type AssignmentRow = {
  id: number;
  class_code: string;
  grade: number;
  due_date: string;
  subject: string;
};

type ClassResultRow = {
  student_id: number;
  student_name: string;
  assignment_id: number;
  subject: string;
  grade: number;
  average_score: number | null;
  attempts: number;
  weak_areas: unknown;
};

function toWeakAreas(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || user.role !== "teacher") {
      return Response.json({ error: "Teacher access required." }, { status: 403 });
    }

    const url = new URL(req.url);
    const { classCode } = querySchema.parse({
      classCode: url.searchParams.get("classCode"),
    });

    const classRows = (await sql.query(
      "SELECT id, class_name FROM teacher_classes WHERE class_code = $1 AND teacher_id = $2 LIMIT 1",
      [classCode, user.id],
    )) as Array<{ id: number; class_name: string }>;
    const classroom = classRows[0];
    if (!classroom) {
      return Response.json({ error: "Class not found." }, { status: 404 });
    }

    const assignments = (await sql.query(
      `SELECT ca.id, ca.class_code, ca.grade, ca.due_date, s.name AS subject
       FROM class_assignments ca
       JOIN subjects s ON s.id = ca.subject_id
       WHERE ca.teacher_id = $1 AND ca.class_code = $2
       ORDER BY ca.created_at DESC`,
      [user.id, classCode],
    )) as AssignmentRow[];

    const results = (await sql.query(
      `SELECT
         cm.student_id,
         COALESCE(u.school, 'Student ' || cm.student_id::text) AS student_name,
         ca.id AS assignment_id,
         s.name AS subject,
         ca.grade,
         ROUND(AVG(q.score)::numeric, 2) AS average_score,
         COUNT(q.id)::int AS attempts,
         p.weak_areas
       FROM class_members cm
       JOIN class_assignments ca ON ca.class_code = cm.class_code
       JOIN subjects s ON s.id = ca.subject_id
       JOIN users u ON u.id = cm.student_id
       LEFT JOIN quizzes q
         ON q.student_id = cm.student_id
        AND q.subject_id = ca.subject_id
        AND q.grade = ca.grade
        AND q.completed_at IS NOT NULL
       LEFT JOIN progress p
         ON p.student_id = cm.student_id
        AND p.subject_id = ca.subject_id
       WHERE ca.teacher_id = $1 AND ca.class_code = $2
       GROUP BY cm.student_id, u.school, ca.id, s.name, ca.grade, p.weak_areas
       ORDER BY ca.id DESC, average_score ASC NULLS LAST`,
      [user.id, classCode],
    )) as ClassResultRow[];

    return Response.json({
      className: classroom.class_name,
      classCode,
      assignments,
      results: results.map((row) => ({
        studentId: row.student_id,
        studentName: row.student_name,
        assignmentId: row.assignment_id,
        subject: row.subject,
        grade: row.grade,
        averageScore: row.average_score,
        attempts: row.attempts,
        weakAreas: toWeakAreas(row.weak_areas),
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid query parameters", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || user.role !== "teacher") {
      return Response.json({ error: "Teacher access required." }, { status: 403 });
    }

    const payload = createAssignmentSchema.parse(await req.json());
    const classRows = (await sql.query(
      "SELECT id, grade FROM teacher_classes WHERE class_code = $1 AND teacher_id = $2 LIMIT 1",
      [payload.classCode, user.id],
    )) as Array<{ id: number; grade: number }>;
    const classroom = classRows[0];

    if (!classroom) {
      return Response.json({ error: "Class not found." }, { status: 404 });
    }

    const subjectRows = (await sql.query(
      "SELECT id FROM subjects WHERE id = $1 AND grade_level = $2 LIMIT 1",
      [payload.subjectId, payload.grade],
    )) as Array<{ id: number }>;
    if (subjectRows.length === 0) {
      return Response.json({ error: "Subject does not match selected grade." }, { status: 400 });
    }

    const dueDate = new Date(payload.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      return Response.json({ error: "Invalid dueDate." }, { status: 400 });
    }

    const rows = (await sql.query(
      `INSERT INTO class_assignments (teacher_id, class_code, subject_id, grade, due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, class_code, grade, due_date`,
      [user.id, payload.classCode, payload.subjectId, payload.grade, dueDate.toISOString()],
    )) as Array<{ id: number; class_code: string; grade: number; due_date: string }>;

    return Response.json({ assignment: rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";
import { pgInt8 } from "@/lib/pg-int";

const querySchema = z.object({
  subjectId: z.coerce.number().int().positive(),
  grade: z.coerce.number().int().min(1).max(12),
});

const questionPayloadSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  subjectId: z.coerce.number().int().positive(),
  grade: z.coerce.number().int().min(1).max(12),
  question: z.string().min(10),
  options: z.array(z.string().min(1)).length(4),
  answer: z.string().min(1),
  explanation: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

type TeacherQuestionRow = {
  id: unknown;
  question: string;
  options: unknown;
  answer: string;
  explanation: string;
  difficulty: string;
  generated_at: string | null;
  source: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function assertTeacher() {
  const user = await getCurrentDbUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return null;
  }
  return user;
}

function normalizeOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET(req: Request) {
  try {
    const user = await assertTeacher();
    if (!user) {
      return Response.json({ error: "Teacher access required." }, { status: 403 });
    }

    const url = new URL(req.url);
    const { subjectId, grade } = querySchema.parse({
      subjectId: url.searchParams.get("subjectId"),
      grade: url.searchParams.get("grade"),
    });

    const rows = (await sql.query(
      `SELECT id, question, options, answer, explanation, difficulty, generated_at, source
       FROM questions
       WHERE subject_id = $1
         AND grade = $2
         AND source = 'teacher'
         AND author_user_id = $3
       ORDER BY generated_at DESC NULLS LAST, id DESC
       LIMIT 100`,
      [subjectId, grade, user.id],
    )) as TeacherQuestionRow[];

    const questions = rows.map((row) => ({
      id: pgInt8(row.id),
      question: row.question,
      options: normalizeOptions(row.options),
      answer: row.answer,
      explanation: row.explanation,
      difficulty: row.difficulty,
      generated_at: row.generated_at,
      source: row.source,
    }));

    return Response.json({ questions });
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
    const user = await assertTeacher();
    if (!user) {
      return Response.json({ error: "Teacher access required." }, { status: 403 });
    }

    const payload = questionPayloadSchema.parse(await req.json());
    if (!payload.options.includes(payload.answer)) {
      return Response.json({ error: "Answer must match one of the options." }, { status: 400 });
    }

    const rows = (await sql.query(
      `INSERT INTO questions (
         subject_id, grade, question, options, answer, explanation, source, difficulty, author_user_id, generated_at
       ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, 'teacher', $7, $8, NOW())
       RETURNING id, question, options, answer, explanation, difficulty, generated_at, source`,
      [
        payload.subjectId,
        payload.grade,
        payload.question,
        JSON.stringify(payload.options),
        payload.answer,
        payload.explanation,
        payload.difficulty,
        user.id,
      ],
    )) as TeacherQuestionRow[];

    const row = rows[0];
    if (!row) {
      return Response.json({ error: "Could not create question." }, { status: 500 });
    }

    return Response.json({
      question: {
        id: pgInt8(row.id),
        question: row.question,
        options: normalizeOptions(row.options),
        answer: row.answer,
        explanation: row.explanation,
        difficulty: row.difficulty,
        generated_at: row.generated_at,
        source: row.source,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await assertTeacher();
    if (!user) {
      return Response.json({ error: "Teacher access required." }, { status: 403 });
    }

    const payload = questionPayloadSchema.parse(await req.json());
    if (!payload.id) {
      return Response.json({ error: "Question id is required for updates." }, { status: 400 });
    }
    if (!payload.options.includes(payload.answer)) {
      return Response.json({ error: "Answer must match one of the options." }, { status: 400 });
    }

    const rows = (await sql.query(
      `UPDATE questions
       SET subject_id = $1,
           grade = $2,
           question = $3,
           options = $4::jsonb,
           answer = $5,
           explanation = $6,
           difficulty = $7,
           generated_at = NOW()
       WHERE id = $8 AND source = 'teacher' AND author_user_id = $9
       RETURNING id, question, options, answer, explanation, difficulty, generated_at, source`,
      [
        payload.subjectId,
        payload.grade,
        payload.question,
        JSON.stringify(payload.options),
        payload.answer,
        payload.explanation,
        payload.difficulty,
        payload.id,
        user.id,
      ],
    )) as TeacherQuestionRow[];

    if (!rows[0]) {
      return Response.json({ error: "Teacher question not found." }, { status: 404 });
    }

    const row = rows[0];
    return Response.json({
      question: {
        id: pgInt8(row.id),
        question: row.question,
        options: normalizeOptions(row.options),
        answer: row.answer,
        explanation: row.explanation,
        difficulty: row.difficulty,
        generated_at: row.generated_at,
        source: row.source,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await assertTeacher();
    if (!user) {
      return Response.json({ error: "Teacher access required." }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = z.coerce.number().int().positive().parse(url.searchParams.get("questionId"));

    const rows = (await sql.query(
      `DELETE FROM questions
       WHERE id = $1 AND source = 'teacher' AND author_user_id = $2
       RETURNING id`,
      [id, user.id],
    )) as Array<{ id: unknown }>;

    if (!rows[0]) {
      return Response.json({ error: "Question not found." }, { status: 404 });
    }

    return Response.json({ ok: true, id: pgInt8(rows[0].id) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid query parameters", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

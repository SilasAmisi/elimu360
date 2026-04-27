import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";

const querySchema = z.object({
  subjectId: z.coerce.number().int().positive(),
  grade: z.coerce.number().int().min(1).max(12),
  source: z.enum(["hardcoded", "ai", "all"]).optional().default("hardcoded"),
});

const questionPayloadSchema = z.object({
  id: z.number().int().positive().optional(),
  subjectId: z.number().int().positive(),
  grade: z.number().int().min(1).max(12),
  question: z.string().min(10),
  options: z.array(z.string().min(1)).length(4),
  answer: z.string().min(1),
  explanation: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

type HardcodedQuestion = {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: string;
  generated_at: string | null;
  source: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function assertAdmin() {
  const user = await getCurrentDbUser();
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}

export async function GET(req: Request) {
  try {
    const admin = await assertAdmin();
    if (!admin) {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    const url = new URL(req.url);
    const { subjectId, grade, source } = querySchema.parse({
      subjectId: url.searchParams.get("subjectId"),
      grade: url.searchParams.get("grade"),
      source: url.searchParams.get("source") ?? undefined,
    });

    const questions = (await sql.query(
      `SELECT id, question, options, answer, explanation, difficulty, generated_at, source
       FROM questions
       WHERE subject_id = $1
         AND grade = $2
         AND (
           $3::text = 'all'
           OR ($3::text = 'ai' AND source = 'ai')
           OR ($3::text = 'hardcoded' AND source = 'hardcoded')
         )
       ORDER BY generated_at DESC NULLS LAST, id DESC
       LIMIT 100`,
      [subjectId, grade, source],
    )) as HardcodedQuestion[];

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
    const admin = await assertAdmin();
    if (!admin) {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    const payload = questionPayloadSchema.parse(await req.json());
    if (!payload.options.includes(payload.answer)) {
      return Response.json({ error: "Answer must match one of the options." }, { status: 400 });
    }

    const rows = (await sql.query(
      `INSERT INTO questions (
         subject_id, grade, question, options, answer, explanation, source, difficulty, generated_at
       ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, 'hardcoded', $7, NOW())
       RETURNING id, question, options, answer, explanation, difficulty, generated_at`,
      [
        payload.subjectId,
        payload.grade,
        payload.question,
        JSON.stringify(payload.options),
        payload.answer,
        payload.explanation,
        payload.difficulty,
      ],
    )) as HardcodedQuestion[];

    return Response.json({ question: rows[0] });
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
    const admin = await assertAdmin();
    if (!admin) {
      return Response.json({ error: "Admin access required." }, { status: 403 });
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
       WHERE id = $8 AND source = 'hardcoded'
       RETURNING id, question, options, answer, explanation, difficulty, generated_at`,
      [
        payload.subjectId,
        payload.grade,
        payload.question,
        JSON.stringify(payload.options),
        payload.answer,
        payload.explanation,
        payload.difficulty,
        payload.id,
      ],
    )) as HardcodedQuestion[];

    if (!rows[0]) {
      return Response.json({ error: "Hardcoded question not found." }, { status: 404 });
    }

    return Response.json({ question: rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

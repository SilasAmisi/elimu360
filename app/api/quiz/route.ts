import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { getEffectiveQuizPlan } from "@/lib/auth/effective-plan";
import { sql } from "@/lib/db";
import { generateAiQuestions } from "@/lib/quiz";

const requestSchema = z.object({
  grade: z.number().int().min(1).max(12),
  subjectId: z.number().int().positive(),
});

type DbQuestion = {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  source: "hardcoded" | "ai";
  difficulty: string;
};

type PublicQuestion = Pick<DbQuestion, "id" | "question" | "options" | "difficulty">;

function toPublicQuestions(questions: DbQuestion[]): PublicQuestion[] {
  return questions.map(({ id, question, options, difficulty }) => ({
    id,
    question,
    options,
    difficulty,
  }));
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = requestSchema.parse(await req.json());

    const subjectRows = (await sql.query(
      "SELECT name FROM subjects WHERE id = $1 AND grade_level = $2 LIMIT 1",
      [body.subjectId, body.grade],
    )) as Array<{ name: string }>;
    const subjectName = subjectRows[0]?.name;
    if (!subjectName) {
      return Response.json(
        { error: "Invalid subjectId for the selected grade" },
        { status: 400 },
      );
    }

    const effectivePlan = await getEffectiveQuizPlan(user);
    if (effectivePlan === "free") {
      const freeQuestions = (await sql.query(
        `SELECT id, question, options, answer, explanation, source, difficulty
         FROM questions
         WHERE subject_id = $1 AND grade = $2 AND source = 'hardcoded'
         ORDER BY RANDOM()
         LIMIT 10`,
        [body.subjectId, body.grade],
      )) as DbQuestion[];

      return Response.json({
        source: "hardcoded",
        grade: body.grade,
        subjectId: body.subjectId,
        questions: toPublicQuestions(freeQuestions),
      });
    }

    const cachedAiQuestions = (await sql.query(
      `SELECT id, question, options, answer, explanation, source, difficulty
       FROM questions
       WHERE subject_id = $1
         AND grade = $2
         AND source = 'ai'
         AND generated_at >= NOW() - INTERVAL '30 days'
       ORDER BY generated_at DESC
       LIMIT 10`,
      [body.subjectId, body.grade],
    )) as DbQuestion[];

    if (cachedAiQuestions.length === 10) {
      return Response.json({
        source: "ai-cache",
        grade: body.grade,
        subjectId: body.subjectId,
        questions: toPublicQuestions(cachedAiQuestions),
      });
    }

    const generated = await generateAiQuestions({
      subjectName,
      grade: body.grade,
    });

    for (const item of generated) {
      await sql.query(
        `INSERT INTO questions (
           subject_id, grade, question, options, answer, explanation, source, difficulty, generated_at
         ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, 'ai', $7, NOW())
         ON CONFLICT (subject_id, grade, question) DO UPDATE
         SET options = EXCLUDED.options,
             answer = EXCLUDED.answer,
             explanation = EXCLUDED.explanation,
             difficulty = EXCLUDED.difficulty,
             generated_at = NOW()`,
        [
          body.subjectId,
          body.grade,
          item.question,
          JSON.stringify(item.options),
          item.answer,
          item.explanation,
          item.difficulty,
        ],
      );
    }

    const freshAiQuestions = (await sql.query(
      `SELECT id, question, options, answer, explanation, source, difficulty
       FROM questions
       WHERE subject_id = $1
         AND grade = $2
         AND source = 'ai'
       ORDER BY generated_at DESC
       LIMIT 10`,
      [body.subjectId, body.grade],
    )) as DbQuestion[];

    return Response.json({
      source: "ai-fresh",
      grade: body.grade,
      subjectId: body.subjectId,
      questions: toPublicQuestions(freshAiQuestions),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

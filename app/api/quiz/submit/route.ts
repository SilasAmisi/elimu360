import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";

const responseSchema = z.object({
  questionId: z.number().int().positive(),
  selectedOption: z.string().min(1),
});

const submitSchema = z.object({
  grade: z.number().int().min(1).max(12),
  subjectId: z.number().int().positive(),
  responses: z.array(responseSchema).min(1),
});

type DbQuestion = {
  id: number;
  question: string;
  answer: string;
  explanation: string;
};

type DbProgress = {
  total_quizzes: number;
  average_score: number;
  weak_areas: unknown;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toWeakAreaArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = submitSchema.parse(await req.json());

    const questionIds = body.responses.map((item) => item.questionId);
    const questions = (await sql.query(
      `SELECT id, question, answer, explanation
       FROM questions
       WHERE subject_id = $1 AND grade = $2 AND id = ANY($3::bigint[])`,
      [body.subjectId, body.grade, questionIds],
    )) as DbQuestion[];

    if (questions.length === 0) {
      return Response.json({ error: "No valid quiz questions found for submission." }, { status: 400 });
    }

    const questionById = new Map(questions.map((item) => [item.id, item]));
    const results = body.responses
      .map((response) => {
        const dbQuestion = questionById.get(response.questionId);
        if (!dbQuestion) return null;
        const isCorrect = dbQuestion.answer === response.selectedOption;

        return {
          questionId: dbQuestion.id,
          question: dbQuestion.question,
          selectedOption: response.selectedOption,
          correctAnswer: dbQuestion.answer,
          explanation: dbQuestion.explanation,
          isCorrect,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const total = results.length;
    const correctCount = results.filter((item) => item.isCorrect).length;
    const score = Number(((correctCount / total) * 100).toFixed(2));
    const weakAreasFromAttempt = results
      .filter((item) => !item.isCorrect)
      .map((item) => item.question)
      .slice(0, 8);

    await sql.query(
      `INSERT INTO quizzes (student_id, subject_id, grade, questions, score, completed_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, NOW())`,
      [user.id, body.subjectId, body.grade, JSON.stringify(results), score],
    );

    const progressRows = (await sql.query(
      `SELECT total_quizzes, average_score, weak_areas
       FROM progress
       WHERE student_id = $1 AND subject_id = $2
       LIMIT 1`,
      [user.id, body.subjectId],
    )) as DbProgress[];

    const existing = progressRows[0];
    if (!existing) {
      await sql.query(
        `INSERT INTO progress (
           student_id, subject_id, total_quizzes, average_score, weak_areas, updated_at
         ) VALUES ($1, $2, 1, $3, $4::jsonb, NOW())`,
        [user.id, body.subjectId, score, JSON.stringify(weakAreasFromAttempt)],
      );
    } else {
      const nextTotal = existing.total_quizzes + 1;
      const nextAverage = Number(
        ((existing.average_score * existing.total_quizzes + score) / nextTotal).toFixed(2),
      );
      const existingWeakAreas = toWeakAreaArray(existing.weak_areas);
      const mergedWeakAreas = Array.from(new Set([...weakAreasFromAttempt, ...existingWeakAreas])).slice(0, 10);

      await sql.query(
        `UPDATE progress
         SET total_quizzes = $1,
             average_score = $2,
             weak_areas = $3::jsonb,
             updated_at = NOW()
         WHERE student_id = $4 AND subject_id = $5`,
        [nextTotal, nextAverage, JSON.stringify(mergedWeakAreas), user.id, body.subjectId],
      );
    }

    return Response.json({
      score,
      correctCount,
      total,
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

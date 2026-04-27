import { z } from "zod";

import { sql } from "@/lib/db";
import { pgInt8 } from "@/lib/pg-int";
import { getStudentFromSessionToken } from "@/lib/student-access";

const responseSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  selectedOption: z.string().min(1),
});

const submitSchema = z.object({
  grade: z.coerce.number().int().min(1).max(12),
  subjectId: z.coerce.number().int().positive(),
  responses: z.array(responseSchema).min(1),
});

type DbQuestion = {
  id: unknown;
  question: string;
  answer: string;
  explanation: string;
};

type DbProgress = {
  total_quizzes: number;
  average_score: number;
  weak_areas: unknown;
};

function toWeakAreaArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const sessionToken = req.headers.get("x-student-session") ?? "";
    const sessionStudent = await getStudentFromSessionToken(sessionToken);
    if (!sessionStudent) {
      return Response.json({ error: "Invalid or expired student session." }, { status: 401 });
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

    const questionById = new Map(questions.map((item) => [pgInt8(item.id), item]));
    const results = body.responses
      .map((response) => {
        const dbQuestion = questionById.get(response.questionId);
        if (!dbQuestion) return null;
        const isCorrect = dbQuestion.answer === response.selectedOption;

        return {
          questionId: pgInt8(dbQuestion.id),
          question: dbQuestion.question,
          selectedOption: response.selectedOption,
          correctAnswer: dbQuestion.answer,
          explanation: dbQuestion.explanation,
          isCorrect,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (results.length !== body.responses.length) {
      return Response.json(
        { error: "Some answers could not be matched to valid questions for this quiz." },
        { status: 400 },
      );
    }

    const total = results.length;
    const correctCount = results.filter((item) => item.isCorrect).length;
    const score =
      total > 0 ? Number(((correctCount / total) * 100).toFixed(2)) : 0;
    const weakAreasFromAttempt = results
      .filter((item) => !item.isCorrect)
      .map((item) => item.question)
      .slice(0, 5);

    await sql.query(
      `INSERT INTO quizzes (student_id, subject_id, grade, questions, score, completed_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, NOW())`,
      [sessionStudent.id, body.subjectId, body.grade, JSON.stringify(results), score],
    );

    const progressRows = (await sql.query(
      `SELECT total_quizzes, average_score, weak_areas
       FROM progress
       WHERE student_id = $1 AND subject_id = $2
       LIMIT 1`,
      [sessionStudent.id, body.subjectId],
    )) as DbProgress[];

    const existing = progressRows[0];
    if (!existing) {
      await sql.query(
        `INSERT INTO progress (student_id, subject_id, total_quizzes, average_score, weak_areas, updated_at)
         VALUES ($1, $2, 1, $3, $4::jsonb, NOW())`,
        [sessionStudent.id, body.subjectId, score, JSON.stringify(weakAreasFromAttempt)],
      );
    } else {
      const newTotal = existing.total_quizzes + 1;
      const newAverage = Number(
        ((existing.average_score * existing.total_quizzes + score) / newTotal).toFixed(2),
      );
      const mergedWeakAreas = Array.from(
        new Set([...toWeakAreaArray(existing.weak_areas), ...weakAreasFromAttempt]),
      ).slice(0, 8);

      await sql.query(
        `UPDATE progress
         SET total_quizzes = $3,
             average_score = $4,
             weak_areas = $5::jsonb,
             updated_at = NOW()
         WHERE student_id = $1 AND subject_id = $2`,
        [sessionStudent.id, body.subjectId, newTotal, newAverage, JSON.stringify(mergedWeakAreas)],
      );
    }

    return Response.json({
      score,
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

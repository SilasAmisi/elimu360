import { sql } from "@/lib/db";
import { pgInt8 } from "@/lib/pg-int";

export type CheckAnswerResult =
  | { ok: true; isCorrect: boolean; correctAnswer: string; explanation: string; questionId: number }
  | { ok: false; error: string };

export async function lookupQuestionAnswer(params: {
  questionId: number;
  subjectId: number;
  grade: number;
  selectedOption: string;
}): Promise<CheckAnswerResult> {
  const rows = (await sql.query(
    `SELECT id, answer, explanation
     FROM questions
     WHERE id = $1 AND subject_id = $2 AND grade = $3
     LIMIT 1`,
    [params.questionId, params.subjectId, params.grade],
  )) as Array<{ id: unknown; answer: string; explanation: string }>;

  const row = rows[0];
  if (!row) {
    return { ok: false, error: "Question not found for this grade and subject." };
  }

  const isCorrect = row.answer === params.selectedOption;
  return {
    ok: true,
    isCorrect,
    correctAnswer: row.answer,
    explanation: row.explanation,
    questionId: pgInt8(row.id),
  };
}

import { sql } from "@/lib/db";
import type { QuizQuestion } from "@/lib/quiz";

/** Upserts AI-generated MCQs into `questions` (same path as quiz-time generation). */
export async function upsertAiQuestionsForSubjectGrade(params: {
  subjectId: number;
  grade: number;
  items: QuizQuestion[];
}): Promise<void> {
  for (const item of params.items) {
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
        params.subjectId,
        params.grade,
        item.question,
        JSON.stringify(item.options),
        item.answer,
        item.explanation,
        item.difficulty,
      ],
    );
  }
}

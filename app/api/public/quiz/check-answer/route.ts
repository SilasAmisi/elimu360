import { z } from "zod";

import { lookupQuestionAnswer } from "@/lib/quiz-answer-check";
import { getStudentFromSessionToken } from "@/lib/student-access";

const bodySchema = z.object({
  questionId: z.coerce.number().int().positive(),
  subjectId: z.coerce.number().int().positive(),
  grade: z.coerce.number().int().min(1).max(12),
  selectedOption: z.string().min(1),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const sessionToken = req.headers.get("x-student-session") ?? "";
    const sessionStudent = await getStudentFromSessionToken(sessionToken);
    if (!sessionStudent) {
      return Response.json({ error: "Invalid or expired student session." }, { status: 401 });
    }

    const body = bodySchema.parse(await req.json());
    const result = await lookupQuestionAnswer({
      questionId: body.questionId,
      subjectId: body.subjectId,
      grade: body.grade,
      selectedOption: body.selectedOption,
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 404 });
    }

    return Response.json({
      isCorrect: result.isCorrect,
      correctAnswer: result.correctAnswer,
      explanation: result.explanation,
      questionId: result.questionId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

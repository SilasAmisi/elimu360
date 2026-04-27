import { z } from "zod";

import { sql } from "@/lib/db";
import { getQuizQuestionsForSession } from "@/lib/quiz-delivery";
import { getStudentFromSessionToken } from "@/lib/student-access";

const requestSchema = z.object({
  grade: z.coerce.number().int().min(1).max(12),
  subjectId: z.coerce.number().int().positive(),
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

    const delivered = await getQuizQuestionsForSession({
      subjectId: body.subjectId,
      subjectName,
      grade: body.grade,
      requesterKey: `student-session:${sessionStudent.id}`,
      studentUserId: sessionStudent.id,
    });

    return Response.json({
      source: delivered.source,
      grade: body.grade,
      subjectId: body.subjectId,
      warning: delivered.warning,
      questions: delivered.questions,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

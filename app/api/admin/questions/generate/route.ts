import { z } from "zod";

import { allowAiQuestionGeneration } from "@/lib/ai-guardrails";
import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";
import { getOpenAiApiKey } from "@/lib/env";
import { upsertAiQuestionsForSubjectGrade } from "@/lib/persist-ai-questions";
import { generateAiQuestions } from "@/lib/quiz";

const bodySchema = z.object({
  subjectId: z.coerce.number().int().positive(),
  grade: z.coerce.number().int().min(1).max(12),
  count: z.coerce.number().int().min(1).max(10).optional().default(5),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    if (!getOpenAiApiKey()) {
      return Response.json(
        { error: "Question generation is currently unavailable." },
        { status: 503 },
      );
    }

    const body = bodySchema.parse(await req.json());

    const subjectRows = (await sql.query(
      `SELECT name FROM subjects WHERE id = $1 AND grade_level = $2 LIMIT 1`,
      [body.subjectId, body.grade],
    )) as Array<{ name: string }>;

    const subjectName = subjectRows[0]?.name;
    if (!subjectName) {
      return Response.json({ error: "Could not generate questions right now." }, { status: 400 });
    }

    const guardrail = await allowAiQuestionGeneration(
      {
        requesterKey: `admin:${user.id}`,
        subjectId: body.subjectId,
        grade: body.grade,
      },
      { mode: "admin-bulk", adminUserId: user.id },
    );

    if (!guardrail.allowed) {
      return Response.json({ error: "Could not generate questions right now." }, { status: 429 });
    }

    const generated = await generateAiQuestions({
      subjectName,
      grade: body.grade,
      count: body.count,
    });

    await upsertAiQuestionsForSubjectGrade({
      subjectId: body.subjectId,
      grade: body.grade,
      items: generated,
    });

    return Response.json({
      ok: true,
      count: generated.length,
      subjectId: body.subjectId,
      grade: body.grade,
      subjectName,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Could not generate questions right now." }, { status: 400 });
    }
    console.error("admin-generate-questions failed", error);
    return Response.json({ error: "Could not generate questions right now." }, { status: 500 });
  }
}

import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";

const joinSchema = z.object({
  classCode: z.string().min(4).max(32),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || user.role !== "student") {
      return Response.json({ error: "Student access required." }, { status: 403 });
    }

    const payload = joinSchema.parse(await req.json());
    const classRows = (await sql.query(
      "SELECT id FROM teacher_classes WHERE class_code = $1 LIMIT 1",
      [payload.classCode],
    )) as Array<{ id: number }>;

    if (classRows.length === 0) {
      return Response.json({ error: "Class code not found." }, { status: 404 });
    }

    await sql.query(
      `INSERT INTO class_members (class_code, student_id)
       VALUES ($1, $2)
       ON CONFLICT (class_code, student_id) DO NOTHING`,
      [payload.classCode, user.id],
    );

    return Response.json({ ok: true, classCode: payload.classCode });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

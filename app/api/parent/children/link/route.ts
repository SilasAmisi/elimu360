import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";

const linkSchema = z.object({
  studentId: z.number().int().positive(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || (user.role !== "parent" && user.role !== "admin")) {
      return Response.json({ error: "Parent access required." }, { status: 403 });
    }

    const payload = linkSchema.parse(await req.json());

    const studentRows = (await sql.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'student' LIMIT 1",
      [payload.studentId],
    )) as Array<{ id: number }>;
    if (studentRows.length === 0) {
      return Response.json({ error: "Student ID not found." }, { status: 404 });
    }

    await sql.query(
      `INSERT INTO parent_children (parent_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (parent_id, student_id) DO NOTHING`,
      [user.id, payload.studentId],
    );

    return Response.json({ ok: true, studentId: payload.studentId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

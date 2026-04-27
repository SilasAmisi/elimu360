import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";

const linkSchema = z.object({
  studentId: z.string().trim().min(1),
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

    const normalized = payload.studentId.trim().toUpperCase();
    const numericId = Number(normalized);
    const hasNumericId = Number.isInteger(numericId) && numericId > 0;

    const studentRows = (await sql.query(
      `SELECT id, student_public_id
       FROM users
       WHERE role = 'student'
         AND ($1::text = student_public_id OR ($2::boolean AND id = $3))
       LIMIT 1`,
      [normalized, hasNumericId, hasNumericId ? numericId : null],
    )) as Array<{ id: number; student_public_id: string | null }>;
    if (studentRows.length === 0) {
      return Response.json({ error: "Student ID not found." }, { status: 404 });
    }

    const student = studentRows[0];

    await sql.query(
      `INSERT INTO parent_children (parent_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (parent_id, student_id) DO NOTHING`,
      [user.id, student.id],
    );

    return Response.json({ ok: true, studentId: student.student_public_id ?? String(student.id) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

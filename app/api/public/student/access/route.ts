import { z } from "zod";

import { sql } from "@/lib/db";
import { createStudentAccessSession, hashStudentAccessCode } from "@/lib/student-access";

const bodySchema = z.object({
  studentId: z.string().min(4).max(40),
  accessCode: z.string().min(4).max(40),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const studentId = body.studentId.trim().toUpperCase();
    const normalizedCode = body.accessCode.trim().toUpperCase();
    const codeHash = hashStudentAccessCode(body.accessCode);

    const rows = (await sql.query(
      `SELECT DISTINCT u.id, u.grade, u.display_name, u.student_public_id
       FROM users u
       LEFT JOIN parent_children pc ON pc.student_id = u.id
       LEFT JOIN family_access_codes fac ON fac.parent_id = pc.parent_id
       WHERE u.role = 'student'
         AND u.student_public_id = $1
         AND (
           u.student_access_code_hash = $2
           OR fac.code = $3
         )
       LIMIT 1`,
      [studentId, codeHash, normalizedCode],
    )) as Array<{
      id: number;
      grade: number | null;
      display_name: string | null;
      student_public_id: string | null;
    }>;

    const student = rows[0];
    if (!student) {
      return Response.json({ error: "Invalid student ID or access code." }, { status: 401 });
    }

    const sessionToken = await createStudentAccessSession(student.id);

    return Response.json({
      sessionToken,
      student: {
        studentId: student.student_public_id,
        displayName: student.display_name ?? "Student",
        grade: student.grade,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

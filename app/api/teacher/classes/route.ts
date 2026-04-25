import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { generateClassCode } from "@/lib/class-code";
import { sql } from "@/lib/db";

const createClassSchema = z.object({
  className: z.string().min(2).max(80),
  grade: z.number().int().min(1).max(12),
});

type TeacherClass = {
  id: number;
  class_name: string;
  class_code: string;
  grade: number;
  created_at: string;
  student_count: number;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentDbUser();
    if (!user || user.role !== "teacher") {
      return Response.json({ error: "Teacher access required." }, { status: 403 });
    }

    const classes = (await sql.query(
      `SELECT tc.id, tc.class_name, tc.class_code, tc.grade, tc.created_at,
              COALESCE(COUNT(cm.student_id), 0)::int AS student_count
       FROM teacher_classes tc
       LEFT JOIN class_members cm ON cm.class_code = tc.class_code
       WHERE tc.teacher_id = $1
       GROUP BY tc.id
       ORDER BY tc.created_at DESC`,
      [user.id],
    )) as TeacherClass[];

    return Response.json({ classes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || user.role !== "teacher") {
      return Response.json({ error: "Teacher access required." }, { status: 403 });
    }

    const payload = createClassSchema.parse(await req.json());

    let classCode = generateClassCode();
    for (let tries = 0; tries < 5; tries += 1) {
      const existing = (await sql.query(
        "SELECT id FROM teacher_classes WHERE class_code = $1 LIMIT 1",
        [classCode],
      )) as Array<{ id: number }>;
      if (existing.length === 0) break;
      classCode = generateClassCode();
    }

    const rows = (await sql.query(
      `INSERT INTO teacher_classes (teacher_id, class_name, class_code, grade)
       VALUES ($1, $2, $3, $4)
       RETURNING id, class_name, class_code, grade, created_at`,
      [user.id, payload.className, classCode, payload.grade],
    )) as Array<Omit<TeacherClass, "student_count">>;

    return Response.json({
      class: {
        ...rows[0],
        student_count: 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

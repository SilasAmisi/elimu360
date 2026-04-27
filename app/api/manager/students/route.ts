import { randomUUID } from "node:crypto";
import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";
import {
  buildStudentPublicId,
  generateStudentAccessCode,
  hashStudentAccessCode,
} from "@/lib/student-access";

const createSchema = z.object({
  displayName: z.string().min(2).max(100),
  grade: z.number().int().min(1).max(12),
});

const resetSchema = z.object({
  studentDbId: z.number().int().positive(),
});

type ManagedStudentRow = {
  id: number;
  student_public_id: string | null;
  display_name: string | null;
  grade: number | null;
  student_access_code_updated_at: string | null;
};

async function ensureCanManageStudent(managerId: number, role: string, studentDbId: number) {
  if (role === "admin") return true;

  if (role === "parent") {
    const rows = (await sql.query(
      `SELECT 1 FROM parent_children WHERE parent_id = $1 AND student_id = $2 LIMIT 1`,
      [managerId, studentDbId],
    )) as unknown[];
    return rows.length > 0;
  }

  if (role === "teacher") {
    const rows = (await sql.query(
      `SELECT 1 FROM manager_students WHERE manager_id = $1 AND student_id = $2 LIMIT 1`,
      [managerId, studentDbId],
    )) as unknown[];
    return rows.length > 0;
  }

  return false;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentDbUser();
    if (!user || !["parent", "teacher", "admin"].includes(user.role)) {
      return Response.json({ error: "Parent, teacher, or admin access required." }, { status: 403 });
    }

    let students: ManagedStudentRow[] = [];
    if (user.role === "parent") {
      students = (await sql.query(
        `SELECT u.id, u.student_public_id, u.display_name, u.grade, u.student_access_code_updated_at
         FROM parent_children pc
         JOIN users u ON u.id = pc.student_id
         WHERE pc.parent_id = $1
         ORDER BY pc.created_at DESC`,
        [user.id],
      )) as ManagedStudentRow[];
    } else if (user.role === "teacher") {
      students = (await sql.query(
        `SELECT u.id, u.student_public_id, u.display_name, u.grade, u.student_access_code_updated_at
         FROM manager_students ms
         JOIN users u ON u.id = ms.student_id
         WHERE ms.manager_id = $1
         ORDER BY ms.created_at DESC`,
        [user.id],
      )) as ManagedStudentRow[];
    } else {
      students = (await sql.query(
        `SELECT id, student_public_id, display_name, grade, student_access_code_updated_at
         FROM users
         WHERE role = 'student'
         ORDER BY id DESC
         LIMIT 200`,
      )) as ManagedStudentRow[];
    }

    return Response.json({ students });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || !["parent", "teacher", "admin"].includes(user.role)) {
      return Response.json({ error: "Parent, teacher, or admin access required." }, { status: 403 });
    }

    const body = createSchema.parse(await req.json());
    const accessCode = generateStudentAccessCode();
    const accessCodeHash = hashStudentAccessCode(accessCode);
    const studentClerkId = `managed-student-${randomUUID()}`;

    const created = (await sql.query(
      `INSERT INTO users (clerk_id, role, plan, grade, display_name)
       VALUES ($1, 'student', 'free', $2, $3)
       RETURNING id, grade, display_name`,
      [studentClerkId, body.grade, body.displayName.trim()],
    )) as Array<{ id: number; grade: number; display_name: string }>;

    const student = created[0];
    if (!student) {
      return Response.json({ error: "Could not create student." }, { status: 500 });
    }

    const publicId = buildStudentPublicId(student.id);
    await sql.query(
      `UPDATE users
       SET student_public_id = $2,
           student_access_code_hash = $3,
           student_access_code_updated_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [student.id, publicId, accessCodeHash],
    );

    if (user.role === "parent") {
      await sql.query(
        `INSERT INTO parent_children (parent_id, student_id)
         VALUES ($1, $2)
         ON CONFLICT (parent_id, student_id) DO NOTHING`,
        [user.id, student.id],
      );
    } else if (user.role === "teacher") {
      await sql.query(
        `INSERT INTO manager_students (manager_id, student_id)
         VALUES ($1, $2)
         ON CONFLICT (manager_id, student_id) DO NOTHING`,
        [user.id, student.id],
      );
    }

    return Response.json({
      student: {
        id: student.id,
        studentId: publicId,
        displayName: student.display_name,
        grade: student.grade,
      },
      accessCode,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || !["parent", "teacher", "admin"].includes(user.role)) {
      return Response.json({ error: "Parent, teacher, or admin access required." }, { status: 403 });
    }

    const body = resetSchema.parse(await req.json());
    const allowed = await ensureCanManageStudent(user.id, user.role, body.studentDbId);
    if (!allowed) {
      return Response.json({ error: "Not allowed to manage this student." }, { status: 403 });
    }

    const accessCode = generateStudentAccessCode();
    await sql.query(
      `UPDATE users
       SET student_access_code_hash = $2,
           student_access_code_updated_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND role = 'student'`,
      [body.studentDbId, hashStudentAccessCode(accessCode)],
    );

    return Response.json({ ok: true, accessCode });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

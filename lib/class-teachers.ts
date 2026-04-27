import { sql } from "@/lib/db";
import { pgInt8 } from "@/lib/pg-int";

/** Teachers who share a class with this student (via `class_members` + `teacher_classes`). */
export async function getTeacherIdsLinkedToStudent(studentId: number): Promise<number[]> {
  const rows = (await sql.query(
    `SELECT DISTINCT tc.teacher_id
     FROM class_members cm
     JOIN teacher_classes tc ON tc.class_code = cm.class_code
     WHERE cm.student_id = $1`,
    [studentId],
  )) as Array<{ teacher_id: unknown }>;

  const ids = rows.map((row) => pgInt8(row.teacher_id));
  return Array.from(new Set(ids.filter((id) => id > 0)));
}

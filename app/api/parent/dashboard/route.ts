import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";

type LinkedChild = {
  student_id: number;
  student_label: string;
  grade: number | null;
};

type ChildHistory = {
  student_id: number;
  quiz_id: number;
  subject: string;
  grade: number;
  score: number;
  completed_at: string | null;
};

type ChildProgress = {
  student_id: number;
  subject: string;
  total_quizzes: number;
  average_score: number;
  weak_areas: unknown;
};

function toWeakAreas(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentDbUser();
    if (!user || (user.role !== "parent" && user.role !== "admin")) {
      return Response.json({ error: "Parent access required." }, { status: 403 });
    }

    const linkedChildren = (await sql.query(
      `SELECT pc.student_id,
              COALESCE(u.school, 'Student ' || u.id::text) AS student_label,
              u.grade
       FROM parent_children pc
       JOIN users u ON u.id = pc.student_id
       WHERE pc.parent_id = $1
       ORDER BY pc.created_at DESC`,
      [user.id],
    )) as LinkedChild[];

    if (linkedChildren.length === 0) {
      return Response.json({ children: [] });
    }

    const childIds = linkedChildren.map((child) => child.student_id);

    const historyRows = (await sql.query(
      `SELECT q.student_id, q.id AS quiz_id, s.name AS subject, q.grade, q.score, q.completed_at
       FROM quizzes q
       JOIN subjects s ON s.id = q.subject_id
       WHERE q.student_id = ANY($1::bigint[])
       ORDER BY q.completed_at DESC NULLS LAST, q.created_at DESC
       LIMIT 200`,
      [childIds],
    )) as ChildHistory[];

    const progressRows = (await sql.query(
      `SELECT p.student_id, s.name AS subject, p.total_quizzes, p.average_score, p.weak_areas
       FROM progress p
       JOIN subjects s ON s.id = p.subject_id
       WHERE p.student_id = ANY($1::bigint[])
       ORDER BY p.average_score ASC`,
      [childIds],
    )) as ChildProgress[];

    const children = linkedChildren.map((child) => {
      const history = historyRows
        .filter((row) => row.student_id === child.student_id)
        .slice(0, 10)
        .map((row) => ({
          quizId: row.quiz_id,
          subject: row.subject,
          grade: row.grade,
          score: row.score,
          completedAt: row.completed_at,
        }));

      const progress = progressRows
        .filter((row) => row.student_id === child.student_id)
        .map((row) => ({
          subject: row.subject,
          totalQuizzes: row.total_quizzes,
          averageScore: row.average_score,
          weakAreas: toWeakAreas(row.weak_areas),
        }));

      const weakSubjects = progress
        .filter((row) => row.averageScore < 60)
        .map((row) => ({
          subject: row.subject,
          averageScore: row.averageScore,
          weakAreas: row.weakAreas,
        }));

      return {
        studentId: child.student_id,
        studentLabel: child.student_label,
        grade: child.grade,
        history,
        progress,
        weakSubjects,
      };
    });

    return Response.json({ children });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

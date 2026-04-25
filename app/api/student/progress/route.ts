import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";

type QuizHistoryRow = {
  id: number;
  grade: number;
  score: number;
  completed_at: string | null;
  subject: string;
};

type ProgressRow = {
  id: number;
  total_quizzes: number;
  average_score: number;
  weak_areas: unknown;
  subject: string;
};

function toWeakAreaArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = (await sql.query(
      `SELECT q.id, q.grade, q.score, q.completed_at, s.name AS subject
       FROM quizzes q
       JOIN subjects s ON s.id = q.subject_id
       WHERE q.student_id = $1
       ORDER BY q.completed_at DESC NULLS LAST, q.created_at DESC
       LIMIT 20`,
      [user.id],
    )) as QuizHistoryRow[];

    const progressRows = (await sql.query(
      `SELECT p.id, p.total_quizzes, p.average_score, p.weak_areas, s.name AS subject
       FROM progress p
       JOIN subjects s ON s.id = p.subject_id
       WHERE p.student_id = $1
       ORDER BY p.average_score ASC`,
      [user.id],
    )) as ProgressRow[];

    const weakSubjects = progressRows
      .filter((item) => item.average_score < 60)
      .map((item) => ({
        subject: item.subject,
        averageScore: item.average_score,
        weakAreas: toWeakAreaArray(item.weak_areas),
      }));

    return Response.json({
      history,
      progress: progressRows.map((item) => ({
        subject: item.subject,
        totalQuizzes: item.total_quizzes,
        averageScore: item.average_score,
        weakAreas: toWeakAreaArray(item.weak_areas),
      })),
      weakSubjects,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

import { getCurrentDbUser } from "@/lib/auth/current-user";
import type { UserPlan, UserRole } from "@/lib/domain";
import { sql } from "@/lib/db";

type LinkedChild = {
  student_id: number;
  student_label: string;
  student_public_id: string | null;
  grade: number | null;
};

type ChildHistory = {
  student_id: number | string;
  quiz_id: number | string;
  subject: string;
  grade: number;
  score: number | string | null;
  completed_at: string | null;
};

type ChildProgress = {
  student_id: number | string;
  subject: string;
  total_quizzes: number;
  average_score: number | string;
  weak_areas: unknown;
};

type ChildLatestSubjectScore = {
  student_id: number | string;
  subject: string;
  grade: number;
  score: number | string | null;
};

function toWeakAreas(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
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
              COALESCE(u.display_name, u.school, 'Student ' || u.id::text) AS student_label,
              u.student_public_id,
              u.grade
       FROM parent_children pc
       JOIN users u ON u.id = pc.student_id
       WHERE pc.parent_id = $1
       ORDER BY pc.created_at DESC`,
      [user.id],
    )) as LinkedChild[];

    const parentPlan = user.plan as UserPlan;
    const viewerRole = user.role as UserRole;

    if (linkedChildren.length === 0) {
      return Response.json({ children: [], parentPlan, viewerRole });
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

    const latestScoresBySubject = (await sql.query(
      `SELECT c.student_id, s.name AS subject, s.grade_level AS grade, latest.score
       FROM (
         SELECT UNNEST($1::bigint[]) AS student_id
       ) c
       JOIN users u ON u.id = c.student_id
       JOIN subjects s ON u.grade IS NOT NULL AND s.grade_level = u.grade
       LEFT JOIN LATERAL (
         SELECT q.score
         FROM quizzes q
         WHERE q.student_id = c.student_id
           AND q.subject_id = s.id
         ORDER BY q.completed_at DESC NULLS LAST, q.created_at DESC
         LIMIT 1
       ) latest ON true
       ORDER BY c.student_id, s.name`,
      [childIds],
    )) as ChildLatestSubjectScore[];

    const children = linkedChildren.map((child) => {
      const history = historyRows
        .filter((row) => Number(row.student_id) === child.student_id)
        .slice(0, 10)
        .map((row) => ({
          quizId: Number(row.quiz_id),
          subject: row.subject,
          grade: row.grade,
          score: toNumberOrNull(row.score),
          completedAt: row.completed_at,
        }));

      const progress = progressRows
        .filter((row) => Number(row.student_id) === child.student_id)
        .map((row) => ({
          subject: row.subject,
          totalQuizzes: row.total_quizzes,
          averageScore: toNumber(row.average_score),
          weakAreas: toWeakAreas(row.weak_areas),
        }));

      const latestBySubject = latestScoresBySubject
        .filter((row) => Number(row.student_id) === child.student_id)
        .map((row) => ({
          subject: row.subject,
          grade: row.grade,
          recentScore: toNumberOrNull(row.score),
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
        studentAccessId: child.student_public_id,
        studentLabel: child.student_label,
        grade: child.grade,
        history,
        latestBySubject,
        progress,
        weakSubjects,
      };
    });

    return Response.json({ children, parentPlan, viewerRole });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

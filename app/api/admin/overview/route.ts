import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";

type UserRow = {
  id: number;
  clerk_id: string;
  role: string;
  plan: string;
  grade: number | null;
  school: string | null;
  created_at: string;
};

type CountRow = {
  total_users: number;
  total_quizzes: number;
  active_users_30d: number;
};

type PopularSubjectRow = {
  subject: string;
  quizzes_taken: number;
};

type BreakdownRow = {
  label: string;
  count: number;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentDbUser();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    const users = (await sql.query(
      `SELECT id, clerk_id, role, plan, grade, school, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 200`,
    )) as UserRow[];

    const counts = (await sql.query(
      `SELECT
         (SELECT COUNT(*)::int FROM users) AS total_users,
         (SELECT COUNT(*)::int FROM quizzes) AS total_quizzes,
         (
           SELECT COUNT(DISTINCT student_id)::int
           FROM quizzes
           WHERE completed_at >= NOW() - INTERVAL '30 days'
         ) AS active_users_30d`,
    )) as CountRow[];

    const popularSubjects = (await sql.query(
      `SELECT s.name AS subject, COUNT(q.id)::int AS quizzes_taken
       FROM quizzes q
       JOIN subjects s ON s.id = q.subject_id
       GROUP BY s.name
       ORDER BY quizzes_taken DESC
       LIMIT 8`,
    )) as PopularSubjectRow[];

    const roleBreakdown = (await sql.query(
      `SELECT role AS label, COUNT(*)::int AS count
       FROM users
       GROUP BY role
       ORDER BY count DESC`,
    )) as BreakdownRow[];

    const planBreakdown = (await sql.query(
      `SELECT plan AS label, COUNT(*)::int AS count
       FROM users
       GROUP BY plan
       ORDER BY count DESC`,
    )) as BreakdownRow[];

    return Response.json({
      stats: counts[0] ?? { total_users: 0, total_quizzes: 0, active_users_30d: 0 },
      popularSubjects,
      roleBreakdown,
      planBreakdown,
      users,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

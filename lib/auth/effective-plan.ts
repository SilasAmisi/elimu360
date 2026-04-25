import { sql } from "@/lib/db";
import type { DbUser } from "@/lib/auth/current-user";
import type { UserPlan } from "@/lib/domain";

function isPaidPlan(plan: UserPlan): boolean {
  return plan !== "free";
}

/**
 * Expanded quizzes: own paid plan, or student linked to a parent via family code.
 */
export async function getEffectiveQuizPlan(user: DbUser): Promise<UserPlan> {
  if (isPaidPlan(user.plan)) {
    return user.plan;
  }
  if (user.role !== "student") {
    return "free";
  }

  const linked = (await sql.query(
    `SELECT 1
     FROM student_family_redemptions r
     JOIN users p ON p.id = r.parent_id
     WHERE r.student_id = $1
       AND p.role = 'parent'
     LIMIT 1`,
    [user.id],
  )) as unknown[];

  return linked.length > 0 ? "single_child" : "free";
}

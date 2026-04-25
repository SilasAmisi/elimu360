import { sql } from "@/lib/db";
import type { DbUser } from "@/lib/auth/current-user";
import type { UserPlan } from "@/lib/domain";

/**
 * Premium quizzes: own plan, or student linked to an active premium parent subscription.
 */
export async function getEffectiveQuizPlan(user: DbUser): Promise<UserPlan> {
  if (user.plan === "premium") {
    return "premium";
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
       AND p.plan = 'premium'
     LIMIT 1`,
    [user.id],
  )) as unknown[];

  return linked.length > 0 ? "premium" : "free";
}

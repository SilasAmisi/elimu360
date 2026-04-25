import { auth } from "@clerk/nextjs/server";

import { sql } from "@/lib/db";
import type { UserPlan, UserRole } from "@/lib/domain";

export type DbUser = {
  id: number;
  clerk_id: string;
  role: UserRole;
  plan: UserPlan;
  grade: number | null;
};

export async function getCurrentDbUser(): Promise<DbUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const rows = (await sql.query(
    "SELECT id, clerk_id, role, plan, grade FROM users WHERE clerk_id = $1 LIMIT 1",
    [userId],
  )) as DbUser[];

  return rows[0] ?? null;
}

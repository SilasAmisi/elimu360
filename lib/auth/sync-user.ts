import type { UserJSON } from "@clerk/backend";

import { USER_PLANS, USER_ROLES, type UserPlan, type UserRole } from "@/lib/domain";
import { sql } from "@/lib/db";

type ClerkPublicMetadata = {
  role?: unknown;
  plan?: unknown;
  grade?: unknown;
  school?: unknown;
  parentId?: unknown;
};

function asRole(value: unknown): UserRole {
  if (typeof value === "string" && USER_ROLES.includes(value as UserRole)) {
    return value as UserRole;
  }
  return "student";
}

function asPlan(value: unknown): UserPlan {
  if (typeof value === "string" && USER_PLANS.includes(value as UserPlan)) {
    return value as UserPlan;
  }
  return "free";
}

function asGrade(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return value;
}

function asSchool(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

function asParentId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  return null;
}

export async function syncUser(clerkUser: UserJSON) {
  const metadata = (clerkUser.public_metadata ?? {}) as ClerkPublicMetadata;
  const role = asRole(metadata.role);
  const plan = asPlan(metadata.plan);
  const grade = asGrade(metadata.grade);
  const school = asSchool(metadata.school);
  const parentId = asParentId(metadata.parentId);

  await sql.query(
    `INSERT INTO users (clerk_id, role, plan, grade, school, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (clerk_id) DO UPDATE
     SET role = EXCLUDED.role,
         plan = EXCLUDED.plan,
         grade = EXCLUDED.grade,
         school = EXCLUDED.school,
         parent_id = EXCLUDED.parent_id,
         updated_at = NOW()`,
    [clerkUser.id, role, plan, grade, school, parentId],
  );
}

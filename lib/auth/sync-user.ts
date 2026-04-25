import type { User, UserJSON } from "@clerk/backend";

import { isBootstrapAdminEmail } from "@/lib/auth/admin-bootstrap";
import { ensureFamilyAccessCodeForParent } from "@/lib/family-access";
import { USER_PLANS, USER_ROLES, type UserPlan, type UserRole } from "@/lib/domain";
import { sql } from "@/lib/db";

type ClerkPublicMetadata = {
  role?: unknown;
  plan?: unknown;
  grade?: unknown;
  school?: unknown;
  parentId?: unknown;
  onboarding_completed?: unknown;
};

function asRole(value: unknown): UserRole {
  if (typeof value === "string" && USER_ROLES.includes(value as UserRole)) {
    return value as UserRole;
  }
  return "student";
}

function asPlan(value: unknown): UserPlan {
  if (value === "premium") {
    return "single_child";
  }
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

function primaryEmailFromUserJson(clerkUser: UserJSON): string | null {
  const primaryId = clerkUser.primary_email_address_id;
  const list = clerkUser.email_addresses ?? [];
  const match = list.find((entry) => entry.id === primaryId);
  const raw = match?.email_address ?? list[0]?.email_address;
  return typeof raw === "string" && raw.length > 0 ? raw.toLowerCase() : null;
}

type SyncUserPayload = {
  clerkId: string;
  publicMetadata: ClerkPublicMetadata;
  primaryEmail: string | null;
};

export async function syncUserPayload(payload: SyncUserPayload) {
  let role = asRole(payload.publicMetadata.role);
  let plan = asPlan(payload.publicMetadata.plan);
  if (isBootstrapAdminEmail(payload.primaryEmail)) {
    role = "admin";
    plan = "teachers_schools";
  }

  const grade = asGrade(payload.publicMetadata.grade);
  const school = asSchool(payload.publicMetadata.school);
  const parentId = asParentId(payload.publicMetadata.parentId);

  const rows = (await sql.query(
    `INSERT INTO users (clerk_id, role, plan, grade, school, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (clerk_id) DO UPDATE
     SET role = EXCLUDED.role,
         plan = EXCLUDED.plan,
         grade = EXCLUDED.grade,
         school = EXCLUDED.school,
         parent_id = EXCLUDED.parent_id,
         updated_at = NOW()
     RETURNING id, role, plan`,
    [payload.clerkId, role, plan, grade, school, parentId],
  )) as Array<{ id: number; role: UserRole; plan: UserPlan }>;

  const row = rows[0];
  if (row && row.role === "parent") {
    await ensureFamilyAccessCodeForParent(row.id);
  }
}

export async function syncUser(clerkUser: UserJSON) {
  const metadata = (clerkUser.public_metadata ?? {}) as ClerkPublicMetadata;
  await syncUserPayload({
    clerkId: clerkUser.id,
    publicMetadata: metadata,
    primaryEmail: primaryEmailFromUserJson(clerkUser),
  });
}

export async function syncUserFromSdkUser(user: User) {
  await syncUserPayload({
    clerkId: user.id,
    publicMetadata: (user.publicMetadata ?? {}) as ClerkPublicMetadata,
    primaryEmail: user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null,
  });
}

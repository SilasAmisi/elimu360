import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { ensureFamilyAccessCodeForParent } from "@/lib/family-access";
import { USER_PLANS, USER_ROLES, type UserPlan, type UserRole } from "@/lib/domain";
import { sql } from "@/lib/db";

const patchSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(USER_ROLES).optional(),
  plan: z.enum(USER_PLANS).optional(),
  grade: z.union([z.number().int().min(1).max(12), z.null()]).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const admin = await getCurrentDbUser();
    if (!admin || admin.role !== "admin") {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = patchSchema.parse(await req.json());

    const targetRows = (await sql.query(
      `SELECT id, role, plan, grade FROM users WHERE id = $1 LIMIT 1`,
      [body.userId],
    )) as Array<{ id: number; role: UserRole; plan: UserPlan; grade: number | null }>;
    if (!targetRows[0]) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const t = targetRows[0];
    const role = body.role ?? t.role;
    const plan = body.plan ?? t.plan;
    const grade = body.grade !== undefined ? body.grade : t.grade;

    await sql.query(
      `UPDATE users SET role = $2, plan = $3, grade = $4, updated_at = NOW() WHERE id = $1`,
      [body.userId, role, plan, grade],
    );

    if (role === "parent") {
      await ensureFamilyAccessCodeForParent(body.userId);
    }

    const updated = (await sql.query(
      `SELECT id, clerk_id, role, plan, grade, school, created_at FROM users WHERE id = $1`,
      [body.userId],
    )) as Array<{
      id: number;
      clerk_id: string;
      role: string;
      plan: string;
      grade: number | null;
      school: string | null;
      created_at: string;
    }>;

    const row = updated[0];
    if (row) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(row.clerk_id);
        const meta = { ...(clerkUser.publicMetadata as Record<string, unknown>) };
        meta.role = row.role;
        meta.plan = row.plan;
        if (row.grade != null) {
          meta.grade = row.grade;
        }
        await client.users.updateUser(row.clerk_id, { publicMetadata: meta });
      } catch {
        // Clerk update failed — DB remains source of truth until next successful sync.
      }
    }

    return Response.json({ user: row ?? null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

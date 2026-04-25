import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";

const bodySchema = z.object({
  code: z.string().min(4).max(32),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user || user.role !== "student") {
      return Response.json({ error: "Student access required." }, { status: 403 });
    }

    const body = bodySchema.parse(await req.json());
    const normalized = body.code.trim().toUpperCase();

    const rows = (await sql.query(
      `SELECT f.parent_id
       FROM family_access_codes f
       JOIN users p ON p.id = f.parent_id
       WHERE f.code = $1 AND p.role = 'parent' AND p.plan = 'premium'
       LIMIT 1`,
      [normalized],
    )) as Array<{ parent_id: number }>;

    const parentId = rows[0]?.parent_id;
    if (!parentId) {
      return Response.json({ error: "Invalid code or subscription is not active." }, { status: 400 });
    }

    await sql.query(
      `INSERT INTO student_family_redemptions (student_id, parent_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id) DO UPDATE SET parent_id = EXCLUDED.parent_id, created_at = NOW()`,
      [user.id, parentId],
    );

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

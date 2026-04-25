import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";

const postSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  gradeLevel: z.number().int().min(1).max(12),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const admin = await getCurrentDbUser();
    if (!admin || admin.role !== "admin") {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = postSchema.parse(await req.json());

    const rows = (await sql.query(
      `INSERT INTO subjects (name, grade_level)
       VALUES ($1, $2)
       ON CONFLICT (name, grade_level) DO NOTHING
       RETURNING id, name, grade_level`,
      [body.name, body.gradeLevel],
    )) as Array<{ id: number; name: string; grade_level: number }>;

    if (!rows[0]) {
      return Response.json(
        { message: "Subject already exists for this grade.", subject: null },
        { status: 200 },
      );
    }

    return Response.json({ subject: rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

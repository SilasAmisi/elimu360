import { z } from "zod";

import { getCurrentDbUser } from "@/lib/auth/current-user";
import { sql } from "@/lib/db";
import { getSubjectsForGrade } from "@/lib/domain";

const querySchema = z.object({
  grade: z.coerce.number().int().min(1).max(12),
});

type SubjectRow = {
  id: number;
  name: string;
  grade_level: number;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const { grade } = querySchema.parse({ grade: url.searchParams.get("grade") });
    const allowedSubjects = getSubjectsForGrade(grade);

    if (allowedSubjects.length === 0) {
      return Response.json({ subjects: [] });
    }

    const subjects = (await sql.query(
      `SELECT id, name, grade_level
       FROM subjects
       WHERE grade_level = $1
         AND name = ANY($2::text[])
       ORDER BY name ASC`,
      [grade, allowedSubjects],
    )) as SubjectRow[];

    return Response.json({ subjects });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid query parameters", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

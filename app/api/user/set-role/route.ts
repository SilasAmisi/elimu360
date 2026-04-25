import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

import { syncUserFromSdkUser } from "@/lib/auth/sync-user";

const bodySchema = z.object({
  role: z.enum(["student", "parent", "teacher"]),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = bodySchema.parse(await req.json());
    const role = body.role;

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const meta = { ...(user.publicMetadata as Record<string, unknown>) };

    if (meta.onboarding_completed === true) {
      return Response.json({ error: "Account type is already set." }, { status: 403 });
    }

    if (meta.role === "admin") {
      return Response.json({ error: "Cannot change role for this account." }, { status: 403 });
    }

    meta.role = role;
    meta.onboarding_completed = true;

    await client.users.updateUser(userId, { publicMetadata: meta });

    const refreshed = await client.users.getUser(userId);
    await syncUserFromSdkUser(refreshed);

    return Response.json({ ok: true, role });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid payload", details: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

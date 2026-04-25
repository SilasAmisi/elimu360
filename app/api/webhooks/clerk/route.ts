import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import { syncUser } from "@/lib/auth/sync-user";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      await syncUser(evt.data);
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export function GET() {
  return Response.json(
    { message: "Clerk webhook endpoint. Use POST from Clerk only." },
    { status: 200 },
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

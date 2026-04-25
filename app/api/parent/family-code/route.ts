import { getCurrentDbUser } from "@/lib/auth/current-user";
import { ensureFamilyAccessCodeForParent, getFamilyCodeForParent } from "@/lib/family-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentDbUser();
    if (!user || (user.role !== "parent" && user.role !== "admin")) {
      return Response.json({ error: "Parent access required." }, { status: 403 });
    }

    if (user.role === "admin") {
      return Response.json({ error: "Family codes are only available on parent accounts." }, { status: 403 });
    }

    let code = await getFamilyCodeForParent(user.id);
    if (!code) {
      code = await ensureFamilyAccessCodeForParent(user.id);
    }

    if (!code) {
      return Response.json({ error: "Could not issue a family code. Try again later." }, { status: 500 });
    }

    return Response.json({ code });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

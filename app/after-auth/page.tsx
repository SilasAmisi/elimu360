import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { reconcileBootstrapAdminForUserId } from "@/lib/auth/reconcile-bootstrap-admin";

function portalForRole(role: string | undefined) {
  switch (role) {
    case "admin":
      return "/admin";
    case "teacher":
      return "/teacher";
    case "parent":
      return "/parent";
    default:
      return "/student";
  }
}

export default async function AfterAuthPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  await reconcileBootstrapAdminForUserId(userId);

  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  const meta = clerkUser.publicMetadata as Record<string, unknown>;
  if (meta.onboarding_completed !== true) {
    redirect("/onboarding");
  }

  redirect(portalForRole(typeof meta.role === "string" ? meta.role : undefined));
}

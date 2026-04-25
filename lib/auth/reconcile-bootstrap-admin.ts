import { clerkClient } from "@clerk/nextjs/server";

import { isBootstrapAdminEmail } from "@/lib/auth/admin-bootstrap";
import { syncUserFromSdkUser } from "@/lib/auth/sync-user";

/**
 * Aligns Clerk publicMetadata and the database for bootstrap admin emails (see ELIMU360_ADMIN_EMAILS).
 */
export async function reconcileBootstrapAdminForUserId(userId: string) {
  const client = await clerkClient();
  let user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
  if (!isBootstrapAdminEmail(email)) {
    return;
  }

  const meta = { ...(user.publicMetadata as Record<string, unknown>) };
  if (meta.role !== "admin") {
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...meta,
        role: "admin",
        plan: "premium",
        onboarding_completed: true,
      },
    });
    user = await client.users.getUser(userId);
  }

  await syncUserFromSdkUser(user);
}

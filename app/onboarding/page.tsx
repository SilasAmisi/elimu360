import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { reconcileBootstrapAdminForUserId } from "@/lib/auth/reconcile-bootstrap-admin";
import { isBootstrapAdminEmail } from "@/lib/auth/admin-bootstrap";

import { OnboardingRolePicker } from "./role-picker";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  await reconcileBootstrapAdminForUserId(userId);

  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
  if (isBootstrapAdminEmail(email)) {
    redirect("/after-auth");
  }

  const meta = clerkUser.publicMetadata as Record<string, unknown>;
  if (meta.onboarding_completed === true) {
    redirect("/after-auth");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-white px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome to Elimu360</h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Choose how you will use the platform. You can sign in again later with the same account; this step only runs once.
        </p>
        <div className="mt-10">
          <OnboardingRolePicker />
        </div>
      </div>
    </main>
  );
}

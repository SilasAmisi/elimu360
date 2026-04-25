import { redirect } from "next/navigation";

import { ParentPortal } from "@/components/parent-portal";
import { getCurrentDbUser } from "@/lib/auth/current-user";

export default async function ParentPage() {
  const user = await getCurrentDbUser();
  if (!user) {
    redirect("/sign-in");
  }
  if (user.role !== "parent" && user.role !== "admin") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto w-full max-w-6xl px-6">
        <h1 className="text-3xl font-semibold text-slate-900">Parent Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Link your children by student ID and track their quiz performance trends.
        </p>
      </div>
      <ParentPortal />
    </main>
  );
}

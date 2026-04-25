import { redirect } from "next/navigation";

import { AdminPortal } from "@/components/admin-portal";
import { getCurrentDbUser } from "@/lib/auth/current-user";

export default async function AdminPage() {
  const user = await getCurrentDbUser();
  if (!user) {
    redirect("/sign-in");
  }
  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto w-full max-w-7xl px-6">
        <h1 className="text-3xl font-semibold text-slate-900">Admin Panel</h1>
        <p className="mt-2 text-slate-600">
          Manage users and plans, platform analytics, and hardcoded question content.
        </p>
      </div>
      <AdminPortal />
    </main>
  );
}

import { redirect } from "next/navigation";

import { AdminPortal } from "@/components/admin-portal";
import { AuthTopbar } from "@/components/auth-topbar";
import { SiteFooter } from "@/components/site-footer";
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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AuthTopbar current="admin" />
      <main className="pb-10">
        <div className="mx-auto w-full max-w-7xl px-6 pt-10 lg:px-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">Admin panel</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
            Platform analytics, user and plan management, subjects per grade (add or remove), and authoring of the
            hardcoded question bank. Students still receive AI-cached items when needed beyond that bank.
          </p>
        </div>
        <AdminPortal />
      </main>
      <SiteFooter />
    </div>
  );
}

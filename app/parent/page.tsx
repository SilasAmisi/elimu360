import { redirect } from "next/navigation";

import { AuthTopbar } from "@/components/auth-topbar";
import { ParentPortal } from "@/components/parent-portal";
import { SiteFooter } from "@/components/site-footer";
import { StudentAccessManager } from "@/components/student-access-manager";
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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AuthTopbar current="parent" />
      <main className="pb-10">
        <div className="mx-auto w-full max-w-7xl px-6 pt-10 lg:px-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">Parent dashboard</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
            Share family access, create student login credentials, and follow quiz performance.
          </p>
        </div>
        <StudentAccessManager managerRole={user.role} />
        <ParentPortal />
      </main>
      <SiteFooter />
    </div>
  );
}

import { redirect } from "next/navigation";

import { AuthTopbar } from "@/components/auth-topbar";
import { SiteFooter } from "@/components/site-footer";
import { StudentAccessManager } from "@/components/student-access-manager";
import { getCurrentDbUser } from "@/lib/auth/current-user";
import { TeacherPortal } from "@/components/teacher-portal";

export default async function TeacherPage() {
  const user = await getCurrentDbUser();
  if (!user) {
    redirect("/sign-in");
  }
  if (user.role !== "teacher" && user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AuthTopbar current="teacher" />
      <main className="pb-10">
        <div className="mx-auto w-full max-w-7xl px-6 pt-10 lg:px-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">Teacher panel</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
            Create classes, author your own MCQs for any grade and subject, assign quizzes, and monitor student outcomes.
          </p>
        </div>
        <StudentAccessManager managerRole={user.role} />
        <TeacherPortal />
      </main>
      <SiteFooter />
    </div>
  );
}

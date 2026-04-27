import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AuthTopbar } from "@/components/auth-topbar";
import { SiteFooter } from "@/components/site-footer";
import { StudentPortal } from "@/components/student-portal";

export default async function StudentPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AuthTopbar current="student" />
      <main className="pb-10">
        <div className="mx-auto w-full max-w-7xl px-6 pt-10 lg:px-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">Student portal</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
            Enter the code shared by your parent or teacher, then take quizzes and track your improvement.
          </p>
        </div>
        <StudentPortal />
      </main>
      <SiteFooter />
    </div>
  );
}

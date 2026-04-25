import { redirect } from "next/navigation";

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
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto w-full max-w-6xl px-6">
        <h1 className="text-3xl font-semibold text-slate-900">Teacher Panel</h1>
        <p className="mt-2 text-slate-600">
          Create classes, assign quizzes, and monitor student outcomes.
        </p>
      </div>
      <TeacherPortal />
    </main>
  );
}

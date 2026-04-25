import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { StudentPortal } from "@/components/student-portal";

export default async function StudentPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto w-full max-w-5xl px-6">
        <h1 className="text-3xl font-semibold text-slate-900">Student Portal</h1>
        <p className="mt-2 text-slate-600">
          Select a grade and subject, take quizzes, and track your improvement.
        </p>
      </div>
      <StudentPortal />
    </main>
  );
}

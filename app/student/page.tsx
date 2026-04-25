import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { StudentPortal } from "@/components/student-portal";

export default async function StudentPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">Student portal</h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
          Select a grade and subject, take quizzes, redeem a family code from a Premium parent if you have one, and
          track your improvement.
        </p>
      </div>
      <StudentPortal />
    </main>
  );
}

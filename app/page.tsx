import Link from "next/link";

import { FreeAssessment } from "@/components/free-assessment";
import { SubscriptionPlans } from "@/components/subscription-plans";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-base font-bold text-white">
              E
            </span>
            <div>
              <p className="text-base font-semibold tracking-tight">Elimu360</p>
              <p className="text-xs text-slate-600">CBC-aligned learning for Kenya</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Register
            </Link>
            <Link
              href="/student"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Student portal
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-16 px-6 py-12 lg:gap-20 lg:px-10 lg:py-16">
        <section className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-800">
              CBC • Grades 1–12 • Classroom and home study
            </p>
            <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-slate-900 lg:text-5xl">
              Smarter revision for Kenyan students — with teachers and parents in the loop.
            </h1>
            <p className="max-w-xl text-pretty text-lg leading-relaxed text-slate-600">
              Elimu360 helps learners practise with curriculum-aligned quizzes, tracks weak areas over time,
              and gives teachers simple class assignments — while parents see progress at a glance.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/student"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Start practising
              </Link>
              <Link
                href="/teacher"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
              >
                Teacher tools
              </Link>
              <Link
                href="/parent"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
              >
                Parent dashboard
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              Free plan uses a curated question bank. Premium adds AI-assisted quizzes and extended practice.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              What you get today
            </h2>
            <ul className="mt-5 space-y-4 text-sm leading-relaxed text-slate-700 lg:text-[15px]">
              <li className="flex gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span>
                  <span className="font-medium text-slate-900">Student portal</span> — pick grade & subject, take quizzes one question at a time, see explanations and progress.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span>
                  <span className="font-medium text-slate-900">Teacher panel</span> — class codes, assignments, and class-level performance snapshots.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span>
                  <span className="font-medium text-slate-900">Parent view</span> — link children by student ID and follow scores and weak subjects.
                </span>
              </li>
            </ul>
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 lg:text-sm">
              After sign-in, use{" "}
              <span className="font-mono text-slate-800">/student</span>,{" "}
              <span className="font-mono text-slate-800">/teacher</span>, or{" "}
              <span className="font-mono text-slate-800">/parent</span> from your browser bookmarks or toolbar.
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "CBC-first content",
              body: "Core subjects seeded across grades, structured the same way as AI-generated items so the quiz engine stays consistent.",
            },
            {
              title: "Weak-area tracking",
              body: "Every attempt updates progress signals so students (and parents) can see where to focus next.",
            },
            {
              title: "Teacher-friendly",
              body: "Share a class code, assign by subject and grade, and review results without juggling spreadsheets.",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7"
            >
              <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 lg:text-[15px]">{card.body}</p>
            </article>
          ))}
        </section>

        <FreeAssessment />

        <SubscriptionPlans />
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 py-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between lg:px-10">
          <p>© {new Date().getFullYear()} Elimu360</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/sign-in" className="hover:text-slate-800">
              Sign in
            </Link>
            <Link href="/student" className="hover:text-slate-800">
              Students
            </Link>
            <Link href="/teacher" className="hover:text-slate-800">
              Teachers
            </Link>
            <Link href="/parent" className="hover:text-slate-800">
              Parents
            </Link>
            <Link href="/admin" className="text-slate-400 hover:text-slate-700">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

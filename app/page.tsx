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

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-16 px-6 py-10 lg:gap-20 lg:px-10 lg:py-14">
        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-800">
              Grades 1-12 free assessment
            </p>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-slate-900 lg:text-5xl">
              Start with a free quiz before creating an account.
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-slate-600">
              Learners and parents can try CBC and Kenya@60 assessment questions immediately. After the preview score,
              sign in or register to continue with full progress tracking and role-based dashboards.
            </p>
            <FreeAssessment />
          </div>

          <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8 xl:sticky xl:top-24">
            <h2 className="text-base font-semibold uppercase tracking-wide text-slate-500">Platform overview</h2>
            <ul className="space-y-4 text-sm leading-relaxed text-slate-700">
              <li className="flex gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span>
                  <span className="font-medium text-slate-900">Student portal</span> - quiz by grade and subject, score
                  reports, and weak-area review.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span>
                  <span className="font-medium text-slate-900">Teacher panel</span> - class setup, assignments, and
                  performance snapshots.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span>
                  <span className="font-medium text-slate-900">Parent dashboard</span> - child linking, family access
                  code, and progress view.
                </span>
              </li>
            </ul>
            <p className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
              Begin with the free assessment, then continue through student, parent, or teacher workflows after
              sign-in.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Register
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Sign in
              </Link>
            </div>
          </aside>
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

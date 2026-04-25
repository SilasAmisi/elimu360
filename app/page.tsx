import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              E
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">Elimu360</p>
              <p className="hidden text-xs text-slate-600 sm:block">
                CBC-aligned learning for Kenya
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/sign-in"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Sign in
            </Link>
            <Link
              href="/student"
              className="hidden rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 sm:inline-flex"
            >
              Student portal
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-10 sm:px-6 sm:py-14">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              Built for CBC • Grades 7–12 first • Works on phones
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Smarter revision for Kenyan students — with teachers and parents in the loop.
            </h1>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
              Elimu360 helps learners practise with curriculum-aligned quizzes, tracks weak areas over time,
              and gives teachers simple class assignments — while parents see progress at a glance.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
            <p className="text-xs text-slate-500">
              Free plan uses a curated question bank. Premium unlocks AI-generated quizzes with a 30-day refresh cache.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              What you get today
            </h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-700">
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
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
              Tip: after sign-in, bookmark <span className="font-mono text-slate-800">/student</span>,{" "}
              <span className="font-mono text-slate-800">/teacher</span>, or{" "}
              <span className="font-mono text-slate-800">/parent</span> on your phone home screen.
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "CBC-first content",
              body: "Core subjects seeded for senior grades, structured the same way as AI-generated items so the quiz engine stays consistent.",
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
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.body}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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

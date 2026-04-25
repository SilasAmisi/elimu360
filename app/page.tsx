export default function Home() {
  return (
    <div className="flex flex-1 bg-slate-50 px-6 py-10">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-8">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-wider text-emerald-700">
              Elimu360
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-slate-900">
              AI-powered CBC learning for Kenyan students
            </h1>
            <p className="text-slate-600">
              Critical path implemented: auth sync, database schema, hardcoded CBC seed,
              and quiz API with premium AI cache (30-day TTL).
            </p>
          </div>
          <a
            href="/sign-in"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Sign in
          </a>
        </header>
        <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Next Steps</h2>
          <ul className="space-y-2 text-slate-700">
            <li>1. Add environment variables from `.env.example`.</li>
            <li>2. Run `npm run db:migrate` then `npm run db:seed`.</li>
            <li>3. Test `POST /api/quiz` with `subjectId` and `grade`.</li>
          </ul>
          <a
            href="/student"
            className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            Open Student Portal
          </a>
          <a
            href="/teacher"
            className="ml-3 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Open Teacher Panel
          </a>
          <a
            href="/parent"
            className="ml-3 inline-block rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
          >
            Open Parent Dashboard
          </a>
          <a
            href="/admin"
            className="ml-3 inline-block rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
          >
            Open Admin Panel
          </a>
        </section>
      </main>
    </div>
  );
}

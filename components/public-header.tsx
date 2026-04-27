import Link from "next/link";

export function PublicHeader() {
  return (
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
            href="/student-access"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Student access
          </Link>
        </div>
      </div>
    </header>
  );
}

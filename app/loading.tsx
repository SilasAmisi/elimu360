export default function GlobalLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm uppercase tracking-wide text-slate-500">Elimu360</p>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">Loading workspace...</h1>
        <div className="mx-auto mt-4 h-2 w-full max-w-xs overflow-hidden rounded bg-slate-200">
          <div className="h-full w-1/2 animate-pulse rounded bg-emerald-600" />
        </div>
      </div>
    </main>
  );
}

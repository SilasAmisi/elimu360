"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-slate-50">
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-red-700">
              Something went wrong
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">We hit an unexpected error.</h1>
            <p className="mt-2 text-sm text-slate-600">
              {error.message || "Please try again. If the issue persists, contact support."}
            </p>
            <button
              onClick={reset}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 py-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between lg:px-10">
        <p>© {new Date().getFullYear()} Elimu360</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/sign-in" className="hover:text-slate-800">
            Sign in
          </Link>
          <Link href="/student-access" className="hover:text-slate-800">
            Student access
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
  );
}

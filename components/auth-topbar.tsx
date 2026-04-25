"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

type AuthTopbarProps = {
  current: "student" | "teacher" | "parent" | "admin";
};

const navItems: Array<{ id: AuthTopbarProps["current"]; label: string; href: string }> = [
  { id: "student", label: "Student", href: "/student" },
  { id: "teacher", label: "Teacher", href: "/teacher" },
  { id: "parent", label: "Parent", href: "/parent" },
  { id: "admin", label: "Admin", href: "/admin" },
];

export function AuthTopbar({ current }: AuthTopbarProps) {
  return (
    <header className="border-b border-slate-200 bg-white/90">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-6 py-3 lg:px-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
            E
          </span>
          <span className="text-sm font-semibold text-slate-900">Elimu360</span>
        </div>
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                item.id === current
                  ? "bg-emerald-100 text-emerald-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <UserButton />
      </div>
    </header>
  );
}

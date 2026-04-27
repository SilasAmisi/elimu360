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
  const allowedForCurrent: Record<AuthTopbarProps["current"], Array<AuthTopbarProps["current"]>> = {
    student: [],
    teacher: ["teacher", "student"],
    parent: ["parent", "student"],
    admin: ["admin", "teacher", "parent", "student"],
  };

  const visibleItems = navItems.filter((item) => allowedForCurrent[current].includes(item.id));

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-6 py-4 lg:px-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
            E
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Elimu360</p>
            <p className="text-xs text-slate-600">CBC-aligned learning for Kenya</p>
          </div>
        </div>
        {visibleItems.length > 0 && (
          <nav className="hidden items-center gap-2 md:flex">
            {visibleItems.map((item) => (
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
        )}
        <UserButton />
      </div>
    </header>
  );
}

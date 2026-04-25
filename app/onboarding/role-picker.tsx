"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const choices = [
  {
    role: "student" as const,
    title: "Student",
    description: "Take quizzes, track progress, and revise by grade and subject.",
  },
  {
    role: "parent" as const,
    title: "Parent",
    description: "Link your children, follow scores, and use family access for premium learning.",
  },
  {
    role: "teacher" as const,
    title: "Teacher",
    description: "Create classes, share class codes, and assign quizzes to your learners.",
  },
];

export function OnboardingRolePicker() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function choose(role: (typeof choices)[number]["role"]) {
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/user/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not save your choice.");
        setStatus("idle");
        return;
      }
      router.replace("/after-auth");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {choices.map((item) => (
          <button
            key={item.role}
            type="button"
            disabled={status === "loading"}
            onClick={() => void choose(item.role)}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-lg font-semibold text-slate-900">{item.title}</span>
            <span className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</span>
            <span className="mt-4 text-sm font-medium text-emerald-700">Continue →</span>
          </button>
        ))}
      </div>
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    </div>
  );
}

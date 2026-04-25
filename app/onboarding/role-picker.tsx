"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { USER_PLANS, type UserPlan } from "@/lib/domain";

const choices = [
  {
    role: "parent" as const,
    title: "Parent / Guardian",
    description: "Link your children, share family code, and follow quiz progress over time.",
  },
  {
    role: "teacher" as const,
    title: "Teacher",
    description: "Create classes, share class codes, and assign quizzes to your learners.",
  },
];

const PLAN_OPTIONS: Array<{ id: UserPlan; label: string; helper: string }> = [
  { id: "free", label: "Free", helper: "Basic access while you get started." },
  { id: "single_child", label: "Single Child", helper: "One child monthly plan." },
  { id: "family_3_children", label: "Family (3 Children)", helper: "Up to three children on one account." },
  { id: "teachers_schools", label: "Teachers / Schools", helper: "Classroom and school usage." },
  { id: "one_time_use", label: "One-Time Use", helper: "Single exam-pass style access." },
];

export function OnboardingRolePicker() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [selectedRole, setSelectedRole] = useState<(typeof choices)[number]["role"]>("parent");
  const [selectedPlan, setSelectedPlan] = useState<UserPlan>("single_child");
  const [error, setError] = useState<string | null>(null);

  async function choose() {
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/user/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, plan: selectedPlan }),
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
      <div className="grid gap-4 md:grid-cols-2">
        {choices.map((item) => (
          <button
            key={item.role}
            type="button"
            disabled={status === "loading"}
            onClick={() => setSelectedRole(item.role)}
            className={`flex flex-col rounded-2xl border bg-white p-6 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
              selectedRole === item.role
                ? "border-emerald-400 ring-1 ring-emerald-200"
                : "border-slate-200 hover:border-emerald-300 hover:shadow-md"
            }`}
          >
            <span className="text-lg font-semibold text-slate-900">{item.title}</span>
            <span className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</span>
            <span className="mt-4 text-sm font-medium text-emerald-700">
              {selectedRole === item.role ? "Selected" : "Choose this role"}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <label className="text-sm font-semibold text-slate-900">Select your plan type</label>
        <select
          value={selectedPlan}
          disabled={status === "loading"}
          onChange={(event) => {
            const value = event.target.value as UserPlan;
            if (USER_PLANS.includes(value)) {
              setSelectedPlan(value);
            }
          }}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {PLAN_OPTIONS.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500">
          {PLAN_OPTIONS.find((item) => item.id === selectedPlan)?.helper}
        </p>
      </div>

      <button
        type="button"
        disabled={status === "loading"}
        onClick={() => void choose()}
        className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        Continue to your dashboard
      </button>

      <p className="text-sm text-slate-500">
        If you are a student, ask your parent/guardian or teacher to create your access path first.
      </p>
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    </div>
  );
}

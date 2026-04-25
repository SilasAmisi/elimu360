"use client";

import { useEffect, useState } from "react";

type ParentChild = {
  studentId: number;
  studentLabel: string;
  grade: number | null;
  history: Array<{
    quizId: number;
    subject: string;
    grade: number;
    score: number;
    completedAt: string | null;
  }>;
  progress: Array<{
    subject: string;
    totalQuizzes: number;
    averageScore: number;
    weakAreas: string[];
  }>;
  weakSubjects: Array<{
    subject: string;
    averageScore: number;
    weakAreas: string[];
  }>;
};

export function ParentPortal() {
  const [studentIdInput, setStudentIdInput] = useState("");
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadDashboard() {
    const response = await fetch("/api/parent/dashboard");
    const data = (await response.json()) as { children?: ParentChild[]; error?: string };
    if (!response.ok || !data.children) {
      setError(data.error ?? "Failed to load parent dashboard.");
      return;
    }
    setChildren(data.children);
  }

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        await loadDashboard();
        if (!cancelled) {
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load parent dashboard.");
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function linkChild() {
    const studentId = Number(studentIdInput);
    if (!Number.isInteger(studentId) || studentId <= 0) {
      setError("Enter a valid numeric student ID.");
      return;
    }

    setStatus("loading");
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/parent/children/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Could not link child.");
        setStatus("idle");
        return;
      }

      setStudentIdInput("");
      setSuccessMessage(`Child linked successfully (ID: ${studentId}).`);
      await loadDashboard();
    } catch {
      setError("Could not link child.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Link a Child</h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter the student ID to connect this account to your child&apos;s performance dashboard.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            type="number"
            value={studentIdInput}
            onChange={(event) => setStudentIdInput(event.target.value)}
            placeholder="Student ID"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <button
            onClick={linkChild}
            disabled={status === "loading"}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Link Child
          </button>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {successMessage && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Children Overview</h2>
        {children.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            No linked children yet. Add a student ID to begin monitoring performance.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {children.map((child) => (
              <article key={child.studentId} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    {child.studentLabel} (ID: {child.studentId})
                  </h3>
                  <p className="text-sm text-slate-600">
                    Grade {child.grade ?? "Not set"}
                  </p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">Recent Quiz History</h4>
                    <div className="mt-2 space-y-2">
                      {child.history.slice(0, 5).map((item) => (
                        <div key={item.quizId} className="rounded-lg border border-slate-100 p-2 text-sm">
                          <p className="font-medium text-slate-900">
                            {item.subject} (Grade {item.grade})
                          </p>
                          <p className="text-slate-600">Score: {item.score}%</p>
                        </div>
                      ))}
                      {child.history.length === 0 && (
                        <p className="text-sm text-slate-600">No quiz attempts yet.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">Weak Subjects</h4>
                    <div className="mt-2 space-y-2">
                      {child.weakSubjects.length === 0 ? (
                        <p className="text-sm text-slate-600">No weak subjects flagged yet.</p>
                      ) : (
                        child.weakSubjects.map((subject) => (
                          <div
                            key={subject.subject}
                            className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm"
                          >
                            <p className="font-medium text-red-800">
                              {subject.subject} - Avg {subject.averageScore}%
                            </p>
                            {subject.weakAreas[0] && (
                              <p className="text-red-700">Focus: {subject.weakAreas[0]}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

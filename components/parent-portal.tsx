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
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [familyCode, setFamilyCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadDashboard() {
    const response = await fetch("/api/parent/dashboard");
    const data = (await response.json()) as {
      children?: ParentChild[];
      viewerRole?: string;
      error?: string;
    };
    if (!response.ok || !data.children) {
      setError(data.error ?? "Failed to load parent dashboard.");
      return;
    }
    setChildren(data.children);
    setViewerRole(data.viewerRole ?? null);
  }

  async function loadFamilyCode() {
    setCodeLoading(true);
    try {
      const response = await fetch("/api/parent/family-code");
      const data = (await response.json()) as { code?: string; error?: string };
      if (response.ok && data.code) {
        setFamilyCode(data.code);
      } else {
        setFamilyCode(null);
      }
    } catch {
      setFamilyCode(null);
    } finally {
      setCodeLoading(false);
    }
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

  useEffect(() => {
    if (viewerRole === "parent") {
      void loadFamilyCode();
    } else {
      setFamilyCode(null);
    }
  }, [viewerRole]);

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
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10 lg:px-10">
      <div className="flex flex-col gap-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Family access code</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Share this code with your student so they can link their account and start assessments under your family
            profile.
          </p>
          {viewerRole !== "parent" ? (
            <p className="mt-4 text-sm text-slate-500">Switch to a parent account to use family codes.</p>
          ) : codeLoading ? (
            <p className="mt-4 text-sm text-slate-600">Loading code…</p>
          ) : familyCode ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Share with your student</p>
              <p className="mt-2 font-mono text-2xl font-semibold tracking-widest text-slate-900">{familyCode}</p>
              <p className="mt-2 text-xs text-slate-600">
                The student signs in, opens the Student portal, and enters this code once under &quot;Family
                code&quot;.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No code available yet. Refresh the page or contact support.</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Link a child</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Enter the student&apos;s numeric ID to connect this account to their performance dashboard.
          </p>
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="text-xs font-medium text-slate-500" htmlFor="student-id">
                Student ID
              </label>
              <input
                id="student-id"
                type="number"
                value={studentIdInput}
                onChange={(event) => setStudentIdInput(event.target.value)}
                placeholder="e.g. 12"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>
            <button
              onClick={linkChild}
              disabled={status === "loading"}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Link child
            </button>
          </div>
          {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
          {successMessage && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{successMessage}</p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Children overview</h2>
        {children.length === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            No linked children yet. Add a student ID to begin monitoring performance.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {children.map((child) => (
              <article key={child.studentId} className="rounded-xl border border-slate-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="text-base font-semibold text-slate-900">
                    {child.studentLabel}{" "}
                    <span className="font-normal text-slate-500">(ID: {child.studentId})</span>
                  </h3>
                  <p className="text-sm text-slate-600">Grade {child.grade ?? "Not set"}</p>
                </div>

                <div className="mt-5 grid gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">Recent quiz history</h4>
                    <div className="mt-3 space-y-2">
                      {child.history.slice(0, 5).map((item) => (
                        <div key={item.quizId} className="rounded-lg border border-slate-100 p-3 text-sm">
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
                    <h4 className="text-sm font-semibold text-slate-700">Weak subjects</h4>
                    <div className="mt-3 space-y-2">
                      {child.weakSubjects.length === 0 ? (
                        <p className="text-sm text-slate-600">No weak subjects flagged yet.</p>
                      ) : (
                        child.weakSubjects.map((subject) => (
                          <div
                            key={subject.subject}
                            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm"
                          >
                            <p className="font-medium text-red-800">
                              {subject.subject} — Avg {subject.averageScore}%
                            </p>
                            {subject.weakAreas[0] && <p className="text-red-700">Focus: {subject.weakAreas[0]}</p>}
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

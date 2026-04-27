"use client";

import { useEffect, useState } from "react";

type ManagedStudent = {
  id: number;
  student_public_id: string | null;
  display_name: string | null;
  grade: number | null;
  student_access_code_updated_at: string | null;
};

type Props = {
  managerRole: "parent" | "teacher" | "admin";
};

export function StudentAccessManager({ managerRole }: Props) {
  const [students, setStudents] = useState<ManagedStudent[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [grade, setGrade] = useState(7);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [lastStudentId, setLastStudentId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function loadStudents() {
    const response = await fetch("/api/manager/students");
    const data = (await response.json()) as {
      students?: ManagedStudent[];
      error?: string;
    };
    if (!response.ok || !data.students) {
      setError(data.error ?? "Could not load students.");
      return;
    }
    setStudents(data.students);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadStudents();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function createStudent() {
    if (!displayName.trim()) {
      setError("Enter a student name first.");
      return;
    }
    setStatus("loading");
    setError(null);
    setLastCode(null);
    setLastStudentId(null);
    try {
      const response = await fetch("/api/manager/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          grade,
        }),
      });
      const data = (await response.json()) as {
        student?: { studentId: string; displayName: string; grade: number };
        accessCode?: string;
        error?: string;
      };
      if (!response.ok || !data.student || !data.accessCode) {
        setError(data.error ?? "Could not create student profile.");
        setStatus("idle");
        return;
      }
      setDisplayName("");
      setLastCode(data.accessCode);
      setLastStudentId(data.student.studentId);
      await loadStudents();
      window.dispatchEvent(new Event("elimu:managed-students-updated"));
    } catch {
      setError("Could not create student profile.");
    } finally {
      setStatus("idle");
    }
  }

  async function resetCode(studentDbId: number, studentPublicId: string | null) {
    setStatus("loading");
    setError(null);
    setLastCode(null);
    setLastStudentId(null);
    try {
      const response = await fetch("/api/manager/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentDbId }),
      });
      const data = (await response.json()) as { ok?: boolean; accessCode?: string; error?: string };
      if (!response.ok || !data.ok || !data.accessCode) {
        setError(data.error ?? "Could not reset access code.");
        setStatus("idle");
        return;
      }
      setLastCode(data.accessCode);
      setLastStudentId(studentPublicId);
      await loadStudents();
      window.dispatchEvent(new Event("elimu:managed-students-updated"));
    } catch {
      setError("Could not reset access code.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <section className="mx-auto mt-8 w-full max-w-7xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Create student profiles and access codes</h2>
          <p className="mt-1 text-sm text-slate-600">
            {managerRole === "teacher"
              ? "Create student credentials to share in class."
              : "Create student credentials your learner can use immediately."}
          </p>
        </div>
        <a
          href="/student-access"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Open student access page
        </a>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[2fr_1fr_auto]">
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Student full name"
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
        <select
          value={grade}
          onChange={(event) => setGrade(Number(event.target.value))}
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        >
          {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
            <option key={item} value={item}>
              Grade {item}
            </option>
          ))}
        </select>
        <button
          onClick={createStudent}
          disabled={status === "loading"}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Create student
        </button>
      </div>

      {lastCode && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-800">Share these credentials now</p>
          <p className="mt-2 text-sm text-slate-700">Student ID: {lastStudentId}</p>
          <p className="font-mono text-2xl font-semibold tracking-widest text-slate-900">{lastCode}</p>
          <p className="mt-2 text-xs text-slate-600">
            Access code is only shown once. Student signs in on `/student-access`.
          </p>
        </div>
      )}
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2 pr-3 font-medium">Name</th>
              <th className="pb-2 pr-3 font-medium">Student ID</th>
              <th className="pb-2 pr-3 font-medium">Grade</th>
              <th className="pb-2 pr-3 font-medium">Code updated</th>
              <th className="pb-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-b border-slate-100">
                <td className="py-3 pr-3 text-slate-900">{student.display_name ?? "Student"}</td>
                <td className="py-3 pr-3 font-mono text-slate-700">{student.student_public_id ?? "Pending"}</td>
                <td className="py-3 pr-3 text-slate-700">{student.grade ?? "-"}</td>
                <td className="py-3 pr-3 text-slate-700">
                  {student.student_access_code_updated_at
                    ? new Date(student.student_access_code_updated_at).toLocaleString()
                    : "Never"}
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => void resetCode(student.id, student.student_public_id)}
                    disabled={status === "loading"}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Reset code
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <p className="pt-4 text-sm text-slate-600">No managed students yet.</p>}
      </div>
    </section>
  );
}
